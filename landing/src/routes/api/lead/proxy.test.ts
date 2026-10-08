/**
 * Unit test proxy `/api/lead` (MONET-03, api-contract.md §8) — pola test
 * unit murni repo ini: `bun test` + `bun:test` (seperti `client.test.ts`),
 * BUKAN vitest (vitest.config.ts hanya menjemput `src/lib/components/**`).
 * Tidak butuh DOM, jadi tanpa guard `skipIf` — tes ini memang JALAN di
 * `bun test`, bukan ter-skip seperti file komponen.
 *
 * Handler POST di-import LANGSUNG dan `RequestEvent`-nya dipalsukan cukup
 * untuk yang dipakai handler (`request` + `fetch`) — sisanya tidak relevan,
 * SvelteKit types dilewati lewat `Parameters<typeof POST>[0]`.
 *
 * `createLead` TIDAK dipanggil beneran: `$lib/api` di-mock sebelum
 * `./+server` dimuat (dynamic import setelah mock terpasang — import statis
 * ESM ter-hoisted, jadi harus dinamis supaya mock terpasang lebih dulu, pola
 * yang sama dengan alasan `vi.mock` di komponen). Mock-nya BERSAMA di
 * `$lib/test/proxy-api-mock.ts` — WAJIB mengeksport semua nama handler
 * proxy karena `mock.module` bocor antar file test (pelajaran CI) — dan
 * menggantikan `src/lib/api/index.ts` SELURUHNYA: `client.ts` (server-only,
 * narik `$env/dynamic/private`) tidak pernah dimuat dari graf file ini.
 *
 * Diverifikasi: `mock.module('$lib/api')` memang meng-intercept import
 * specifier `$lib/api` di bun (tes 429 akan merah kalau tidak).
 *
 * Nama file SENGAJA bukan `+server.test.ts` — SvelteKit mem-variasikan
 * SEMUA file berawalan `+` di routes (`Files prefixed with + are reserved`),
 * jadi `svelte-kit sync`/`build` akan gagal. `proxy.test.ts` tanpa prefix
 * adalah modul biasa yang diabaikan Kit.
 */
import { beforeEach, describe, expect, test } from 'bun:test';
import { ApiErrorTiruan, createLeadMock, pasangMockLibApi } from '$lib/test/proxy-api-mock';

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
	POST(event(new Request('http://omahe.test/api/lead', { method: 'POST', body })));

const bodyValid = JSON.stringify({
	perumahanSlug: 'griya-asri',
	nama: 'Budi Santoso',
	telepon: '081234567890',
	tipeMinat: 'Tipe 36/72',
	sumber: 'card'
});

beforeEach(() => {
	createLeadMock.mockClear();
	createLeadMock.mockImplementation(async () => ({ whatsapp: '628111000222' }));
});

describe('POST /api/lead (proxy MONET-03)', () => {
	test('body bukan JSON valid → 400, createLead tidak menyentuh', async () => {
		const res = await postJson('bukan-json{{{');

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ message: 'Permintaan tidak valid.' });
		// Input sampah harus berhenti di pintu — tidak diteruskan ke backend.
		expect(createLeadMock).not.toHaveBeenCalled();
	});

	test('createLead lempar ApiError 429 → status 429 + pesan diteruskan apa adanya', async () => {
		// Rate limit — pesannya sudah ramah dari backend, proxy WAJIB
		// meneruskan status + message tanpa menelan jadi 502 generik (§8).
		createLeadMock.mockImplementation(async () => {
			throw new ApiErrorTiruan(429, 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.');
		});

		const res = await postJson(bodyValid);

		expect(res.status).toBe(429);
		expect(await res.json()).toEqual({
			message: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.'
		});
	});

	test('createLead sukses → 200 { success: true, data: { ok: true, whatsapp } } (LEAD-02)', async () => {
		const res = await postJson(bodyValid);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			success: true,
			data: { ok: true, whatsapp: '628111000222' }
		});
		// Input diteruskan utuh ke createLead (bentuk honeypot & ref tanpa filter).
		expect(createLeadMock).toHaveBeenCalledTimes(1);
		expect(createLeadMock.mock.calls[0]?.[1]).toMatchObject({
			perumahanSlug: 'griya-asri',
			nama: 'Budi Santoso',
			sumber: 'card'
		});
	});

	test('createLead lempar error BUKAN ApiError → 502 generik, error internal tidak bocor', async () => {
		createLeadMock.mockImplementation(async () => {
			throw new Error('stacktrace internal backend: kredensial-xxx');
		});

		const res = await postJson(bodyValid);

		expect(res.status).toBe(502);
		const body = (await res.json()) as { message: string };
		expect(body.message).toBe('Pengiriman gagal. Coba lagi sebentar lagi.');
		expect(body.message).not.toContain('kredensial');
	});
});
