/**
 * Unit test proxy `/api/agen-nama/[kode]` (REF-AGEN-01) — pola persis
 * `../../q/[kode]/redirect.test.ts`: `bun test` + handler GET di-import
 * LANGSUNG setelah mock `$lib/api` BERSAMA terpasang dari
 * `$lib/test/proxy-api-mock.ts`. Mock bersama itu WAJIB — `mock.module`
 * bocor antar file test (pelajaran CI, CLAUDE.md): file proxy lain juga
 * me-mock `$lib/api`, jadi route ini memakai `getNamaAgenPribadiMock`
 * (perilaku client asli dikunci di `client.api.test.ts`).
 *
 * Yang dikunci di sini: validasi kode LOKAL (salah bentuk → 404 tanpa
 * backend), normalisasi uppercase, 404 saat kode asing (client null), dan
 * header `cache-control: public, max-age=300` (nama agen jarang berubah;
 * endpoint ini TIDAK menghitung apa pun — bebas cache, beda dari `/q/[kode]`).
 */
import { beforeEach, describe, expect, test } from 'bun:test';
import { ApiErrorTiruan, getNamaAgenPribadiMock, pasangMockLibApi } from '$lib/test/proxy-api-mock';

pasangMockLibApi();

const { GET } = await import('./+server');

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
	getNamaAgenPribadiMock.mockClear();
	getNamaAgenPribadiMock.mockImplementation(async () => null);
});

describe('GET /api/agen-nama/[kode] (REF-AGEN-01)', () => {
	test('kode agen sah → 200 {success, data:{nama}} + cache-control public max-age=300', async () => {
		getNamaAgenPribadiMock.mockImplementation(async () => 'Widya Pratama');
		const res = await GET(event('OMHA-A0001'));
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ success: true, data: { nama: 'Widya Pratama' } });
		expect(res.headers.get('cache-control')).toBe('public, max-age=300');
		expect(getNamaAgenPribadiMock).toHaveBeenCalledWith(expect.anything(), 'OMHA-A0001');
	});

	test('kode huruf kecil dinormalisasi uppercase sebelum ke client', async () => {
		getNamaAgenPribadiMock.mockImplementation(async () => 'Widya Pratama');
		await GET(event('omha-a0001'));
		expect(getNamaAgenPribadiMock).toHaveBeenCalledWith(expect.anything(), 'OMHA-A0001');
	});

	test('kode salah bentuk → 404 LOKAL, backend tidak pernah dipanggil', async () => {
		for (const salah of ['xx', 'OP-QA7MPN', 'OMHA-A000', 'OMH-A2', 'AO-K7M2QX', '../etc', '']) {
			const res = await GET(event(salah));
			expect(res.status).toBe(404);
		}
		expect(getNamaAgenPribadiMock).not.toHaveBeenCalled();
	});

	test('kode sah tapi asing (backend 404 → client null) → 404', async () => {
		const res = await GET(event('OMHA-Z9999'));
		expect(res.status).toBe(404);
		expect(getNamaAgenPribadiMock).toHaveBeenCalledWith(expect.anything(), 'OMHA-Z9999');
	});

	test('ApiError dari client (mis. 503 backend) → status + pesan diteruskan', async () => {
		getNamaAgenPribadiMock.mockImplementation(async () => {
			throw new ApiErrorTiruan(503, 'Layanan sedang gangguan.');
		});
		const res = await GET(event('OMHA-A0001'));
		expect(res.status).toBe(503);
		expect(await res.json()).toEqual({ message: 'Layanan sedang gangguan.' });
	});

	test('gagal tak terduga → 502 ramah (bukan crash 500 mentah)', async () => {
		getNamaAgenPribadiMock.mockImplementation(async () => {
			throw new Error('boom');
		});
		const res = await GET(event('OMHA-A0001'));
		expect(res.status).toBe(502);
	});
});
