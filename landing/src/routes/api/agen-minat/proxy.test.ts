/**
 * Unit test proxy `/api/agen-minat` (AGEN-OMAHE-04, api-contract §23) —
 * pola persis `../lead/proxy.test.ts`: `bun test` + `bun:test`, handler
 * POST di-import LANGSUNG setelah mock `$lib/api` bersama terpasang dari
 * `$lib/test/proxy-api-mock.ts` (mengeksport SEMUA nama handler proxy —
 * `mock.module` bocor antar file test, pelajaran CI; jangan buat
 * mock.module '$lib/api' sendiri di file test baru).
 *
 * Fokus LEAD-02 (temuan 2026-10-08): `whatsapp` = nomor agen WAJIB
 * diteruskan ke dialog — dulu respons proxy tanpa `whatsapp` sehingga
 * chat peminat jatuh ke nomor umum (principal) Omahe, bukan nomor agen.
 *
 * Nama file tanpa prefix `+` — file routes berawalan `+` di-reserve Kit.
 */
import { beforeEach, describe, expect, test } from 'bun:test';
import { ApiErrorTiruan, kirimMinatAgenMock, pasangMockLibApi } from '$lib/test/proxy-api-mock';

// Mock bersama (BOTH createLead + kirimMinatAgen) — mock.module bocor
// antar file test, jangan buat mock.module '$lib/api' sendiri di sini
// (lihat $lib/test/proxy-api-mock.ts).
pasangMockLibApi();

const { POST } = await import('./+server');

/** RequestEvent palsu — hanya `request` + `fetch` yang dipakai handler. */
function event(request: Request): Parameters<typeof POST>[0] {
	return { request, fetch: async () => new Response() } as unknown as Parameters<typeof POST>[0];
}

const postJson = (body: string) =>
	POST(event(new Request('http://omahe.test/api/agen-minat', { method: 'POST', body })));

const bodyValid = JSON.stringify({
	kodeAgen: 'OMHA-A0042',
	nama: 'Budi Santoso',
	telepon: '081234567890'
});

beforeEach(() => {
	kirimMinatAgenMock.mockClear();
	kirimMinatAgenMock.mockImplementation(async () => ({ whatsapp: '628999000111' }));
});

describe('POST /api/agen-minat (proxy AGEN-OMAHE-04)', () => {
	test('body bukan JSON valid → 400, kirimMinatAgen tidak menyentuh', async () => {
		const res = await postJson('bukan-json{{{');

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ message: 'Permintaan tidak valid.' });
		expect(kirimMinatAgenMock).not.toHaveBeenCalled();
	});

	test('kodeAgen bukan string / tidak berpola OMHA? → 404 seragam tanpa fetch', async () => {
		for (const kode of ['', 'ABC-XYZ', 42]) {
			const res = await postJson(JSON.stringify({ kodeAgen: kode, nama: 'Budi', telepon: '0812' }));
			expect(res.status).toBe(404);
			expect(await res.json()).toEqual({ message: 'Agen tidak ditemukan.' });
		}
		expect(kirimMinatAgenMock).not.toHaveBeenCalled();
	});

	test('sukses → 200 { success: true, data: { ok: true, whatsapp } } — nomor agen DITERUSKAN (LEAD-02)', async () => {
		const res = await postJson(bodyValid);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			success: true,
			data: { ok: true, whatsapp: '628999000111' }
		});
		expect(kirimMinatAgenMock).toHaveBeenCalledTimes(1);
		expect(kirimMinatAgenMock.mock.calls[0]?.[1]).toMatchObject({
			kodeAgen: 'OMHA-A0042',
			nama: 'Budi Santoso'
		});
	});

	test('backend tanpa nomor (whatsapp null / respons lama) → data.whatsapp null, dialog fallback nomor umum', async () => {
		kirimMinatAgenMock.mockImplementation(async () => ({ whatsapp: null }));

		const res = await postJson(bodyValid);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ success: true, data: { ok: true, whatsapp: null } });
	});

	test('kirimMinatAgen lempar ApiError 429 → status + pesan diteruskan apa adanya', async () => {
		kirimMinatAgenMock.mockImplementation(async () => {
			throw new ApiErrorTiruan(429, 'Terlalu banyak permintaan dari nomor ini untuk agen ini. Coba lagi besok.');
		});

		const res = await postJson(bodyValid);

		expect(res.status).toBe(429);
		expect(await res.json()).toEqual({
			message: 'Terlalu banyak permintaan dari nomor ini untuk agen ini. Coba lagi besok.'
		});
	});

	test('error BUKAN ApiError → 502 generik, error internal tidak bocor', async () => {
		kirimMinatAgenMock.mockImplementation(async () => {
			throw new Error('stacktrace internal: kredensial-xxx');
		});

		const res = await postJson(bodyValid);

		expect(res.status).toBe(502);
		const body = (await res.json()) as { message: string };
		expect(body.message).toBe('Pengiriman gagal. Coba lagi sebentar lagi.');
		expect(body.message).not.toContain('kredensial');
	});
});
