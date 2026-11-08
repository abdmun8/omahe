/**
 * Unit test route `/q/[kode]` (KERJASAMA-02) — pola persis
 * `../../api/agen-minat/proxy.test.ts`: `bun test` + handler GET di-import
 * LANGSUNG setelah mock `$lib/api` BERSAMA terpasang dari
 * `$lib/test/proxy-api-mock.ts`. Mock bersama itu WAJIB — `mock.module`
 * bocor antar file test (pelajaran CI, CLAUDE.md): file proxy me-mock
 * `$lib/api` untuk satu proses `bun test`, jadi route ini memakai
 * `getKerjasamaQrMock` (perilaku client asli sudah dikunci penuh di
 * `client.test.ts` + `client.api.test.ts`, mode fixture & API).
 *
 * Yang dikunci di sini: bentuk redirect (302 + `location` benar + encoding)
 * DAN header keketatan `cache-control: no-store` — tiap pindai QR dihitung
 * backend, kalau 302 ter-cache di edge/browser hitungan pindai bolong
 * diam-diam.
 */
import { beforeEach, describe, expect, test } from 'bun:test';
import { getKerjasamaQrMock, pasangMockLibApi } from '$lib/test/proxy-api-mock';

pasangMockLibApi();

const { GET } = await import('./+server');

const REF = 'a1b2c3d4e5f60718a9b0c1d2e3f40516a7b8c9d0e1f20314a5b6c7d8e9f0a1b2';

/** RequestEvent palsu — handler hanya memakai `fetch` + `params.kode`. */
function event(kode: string): Parameters<typeof GET>[0] {
	return {
		fetch: (() => {
			throw new Error('client di-mock — route tidak boleh fetch langsung');
		}) as unknown as typeof fetch,
		params: { kode }
	} as unknown as Parameters<typeof GET>[0];
}

beforeEach(() => {
	getKerjasamaQrMock.mockClear();
	getKerjasamaQrMock.mockImplementation(async () => null);
});

describe('GET /q/[kode] (KERJASAMA-02/03)', () => {
	test('kode ketemu → 302 /perumahan/:slug?ref= + no-store + noindex', async () => {
		getKerjasamaQrMock.mockImplementation(async () => ({
			jenis: 'perumahan',
			perumahanSlug: 'griya-asri-bogor',
			ref: REF
		}));
		const res = await GET(event('K7M2QX'));
		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe(`/perumahan/griya-asri-bogor?ref=${REF}`);
		// SETIAP pindai dihitung backend — 302 TIDAK boleh ter-cache edge.
		expect(res.headers.get('cache-control')).toBe('no-store');
		expect(res.headers.get('x-robots-tag')).toBe('noindex');
		// Kode diteruskan apa adanya — normalisasi trim+uppercase ada di
		// `getKerjasamaQr` (dikunci di client.test.ts), bukan di route.
		expect(getKerjasamaQrMock).toHaveBeenCalledWith(expect.anything(), 'K7M2QX');
	});

	test('KERJASAMA-03 — jenis omahe → 302 `/?ref=OP-…&mitra=<nama>` + no-store', async () => {
		getKerjasamaQrMock.mockImplementation(async () => ({
			jenis: 'omahe',
			perumahanSlug: null,
			ref: 'OP-QA7MPN',
			namaPerusahaan: 'PT Contoh Mitra'
		}));
		const res = await GET(event('QA7MPN'));
		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe(
			`/?ref=OP-QA7MPN&mitra=${encodeURIComponent('PT Contoh Mitra')}`
		);
		// Hitung pindai berlaku juga untuk QR Omahe×perusahaan.
		expect(res.headers.get('cache-control')).toBe('no-store');
		expect(res.headers.get('x-robots-tag')).toBe('noindex');
	});

	test('resolve gagal (404/error jaringan → null) → 302 `/`, pemindai tidak lihat error', async () => {
		const res = await GET(event('ZZZZZZ'));
		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('/');
		expect(res.headers.get('cache-control')).toBe('no-store');
		expect(res.headers.get('x-robots-tag')).toBe('noindex');
	});

	test('slug & ref di-encode sebelum masuk header `location`', async () => {
		getKerjasamaQrMock.mockImplementation(async () => ({
			jenis: 'perumahan',
			perumahanSlug: 'perumahan dengan spasi',
			ref: 'abc_def-123'
		}));
		const res = await GET(event('K7M2QX'));
		expect(res.headers.get('location')).toBe(
			`/perumahan/${encodeURIComponent('perumahan dengan spasi')}?ref=abc_def-123`
		);
	});
});
