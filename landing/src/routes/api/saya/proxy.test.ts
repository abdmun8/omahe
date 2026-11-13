/**
 * Unit test proxy `/api/saya` (SESI-OMAHE-01) — pola `api/lead/proxy.test.ts`:
 * `bun test` + `bun:test`, handler di-import dinamis SETELAH mock `$lib/api`
 * bersama terpasang ($lib/test/proxy-api-mock.ts — jangan buat mock.module
 * sendiri, bocor antar file test).
 *
 * Yang dikunci (epic §Desain teknis + §Kriteria selesai):
 *   - TANPA cookie `session` → `{agen:null}` dan `getAgenSaya` TIDAK
 *     dipanggil (proxy ini dieksekusi tiap kunjungan halaman — mayoritas
 *     anonim, backend tidak boleh dibanjiri);
 *   - ADA header cookie → header cookie DITERUSKAN apa adanya ke
 *     `getAgenSaya` (ekstraksi hanya-cookie-`session` ada di client.ts,
 *     diuji di `client-agen-sesi.test.ts`);
 *   - error/throw dari client → fail-soft `{agen:null}`, bukan 500;
 *   - header `cache-control: private, no-store` + `vary: cookie` di SEMUA
 *     jalur respons (halaman publik tetap ter-cache, status sesi tidak).
 */
import { beforeEach, describe, expect, test } from 'bun:test';
import { getAgenSayaMock, pasangMockLibApi } from '$lib/test/proxy-api-mock';

pasangMockLibApi();

const { GET } = await import('./+server');

/** RequestEvent palsu — hanya `request` + `fetch` yang dipakai handler. */
function event(cookie: string | null): Parameters<typeof GET>[0] {
	const headers = new Headers();
	if (cookie !== null) headers.set('cookie', cookie);
	const request = new Request('http://omahe.test/api/saya', { headers });
	return { request, fetch: async () => new Response() } as unknown as Parameters<typeof GET>[0];
}

const AGEN = {
	kodeAgen: 'OMHA-A0001',
	nama: 'Agen Contoh',
	fotoUrl: null,
	panelUrl: 'https://app.perumahan.test/agen-omahe',
	perumahanSlugs: null
};

beforeEach(() => {
	getAgenSayaMock.mockClear();
	getAgenSayaMock.mockImplementation(async () => null);
});

describe('GET /api/saya (proxy SESI-OMAHE-01)', () => {
	test('tanpa header cookie → {agen:null} TANPA memanggil backend', async () => {
		const res = await GET(event(null));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ agen: null });
		expect(getAgenSayaMock).not.toHaveBeenCalled();
	});

	test('header cookie tanpa cookie `session` → header tetap diteruskan, client yang memfilter', async () => {
		// Ekstraksi hanya-cookie-`session` ada di client.ts (dijaga test
		// `client-agen-sesi.test.ts`) — proxy hanya berhenti awal bila TIDAK
		// ada header cookie sama sekali. Yang dikunci di sini: header cookie
		// diteruskan apa adanya dan jalur ini tidak pernah melempar.
		const res = await GET(event('analytics=1; tema=gelap'));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ agen: null });
		expect(getAgenSayaMock).toHaveBeenCalledWith(expect.anything(), 'analytics=1; tema=gelap');
	});

	test('dengan cookie → header cookie diteruskan utuh ke getAgenSaya', async () => {
		getAgenSayaMock.mockImplementation(async () => AGEN);
		const res = await GET(event('session=abc123; lain=x'));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ agen: AGEN });
		expect(getAgenSayaMock).toHaveBeenCalledTimes(1);
		expect(getAgenSayaMock.mock.calls[0]?.[1]).toBe('session=abc123; lain=x');
	});

	test('agen null dari backend → {agen:null}, tetap 200', async () => {
		const res = await GET(event('session=abc123'));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ agen: null });
	});

	test('client melempar (backend bermasalah) → fail-soft {agen:null}, BUKAN 500', async () => {
		getAgenSayaMock.mockImplementation(async () => {
			throw new Error('backend down');
		});
		const res = await GET(event('session=abc123'));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ agen: null });
	});

	test('SEMUA jalur respons membawa cache-control private/no-store + vary cookie', async () => {
		for (const res of [
			await GET(event(null)),
			await GET(event('session=abc123')),
			await GET(event('x=1'))
		]) {
			expect(res.headers.get('cache-control')).toBe('private, no-store');
			expect(res.headers.get('vary')).toBe('cookie');
		}
	});
});
