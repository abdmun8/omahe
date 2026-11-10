/**
 * Test `getEstimasiKomisiAgen` + `normalisasiEstimasiKomisi` (KOMISI-AGEN-01)
 * — pola `client-agen-sesi.test.ts` (env dimutasi lewat `$env/dynamic/private`).
 * Dikunci: tanpa cookie `session` → null TANPA backend; hanya `session`
 * diteruskan; gagal/401/body aneh → null (fail-soft); fixture non-prod.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { env } from '$env/dynamic/private';
import { getEstimasiKomisiAgen, normalisasiEstimasiKomisi } from './client';

const API = 'https://api.perumahan.test';
const envelope = (data: unknown, status = 200) =>
	new Response(JSON.stringify({ success: true, data }), { status, headers: { 'content-type': 'application/json' } });

beforeEach(() => {
	delete env.OMAHE_API_BASE_URL;
	delete env.OMAHE_FIXTURE_AGEN;
});
afterEach(() => {
	delete env.OMAHE_API_BASE_URL;
	delete env.OMAHE_FIXTURE_AGEN;
});

describe('normalisasiEstimasiKomisi', () => {
	test('varian sah dipertahankan; dasar asing → perumahan', () => {
		expect(normalisasiEstimasiKomisi({ status: 'estimasi', persen: 2.9, nominal: 8_700_000, dasar: 'tipe', persenSponsor: 0.1 })).toEqual({
			status: 'estimasi', persen: 2.9, nominal: 8_700_000, dasar: 'tipe'
		});
		expect(normalisasiEstimasiKomisi({ status: 'estimasi', persen: 3, nominal: 1, dasar: 'x' })).toMatchObject({ dasar: 'perumahan' });
		expect(normalisasiEstimasiKomisi({ status: 'menunggu_perjanjian' })).toEqual({ status: 'menunggu_perjanjian' });
		expect(normalisasiEstimasiKomisi({ status: 'flat', nominal: 2_500_000 })).toEqual({ status: 'flat', nominal: 2_500_000 });
		expect(normalisasiEstimasiKomisi({ status: 'tanpa_harga', persen: 3 })).toEqual({ status: 'tanpa_harga', persen: 3 });
	});

	test('bentuk aneh → null', () => {
		for (const raw of [null, 'x', {}, { status: 'estimasi', persen: '3', nominal: 1 }, { status: 'flat', nominal: 0 }, { status: 'akrual' }, { status: 'estimasi', persen: 3, nominal: -1 }]) {
			expect(normalisasiEstimasiKomisi(raw)).toBeNull();
		}
	});
});

describe('getEstimasiKomisiAgen', () => {
	test('tanpa cookie session → null tanpa memanggil backend', async () => {
		env.OMAHE_API_BASE_URL = API;
		let dipanggil = false;
		const f = (async () => {
			dipanggil = true;
			return envelope({});
		}) as unknown as typeof fetch;
		expect(await getEstimasiKomisiAgen(f, '_ga=1; lain=2', 'griya-asri')).toBeNull();
		expect(dipanggil).toBe(false);
	});

	test('meneruskan HANYA cookie session + slug/tipeSlug; respons dinormalisasi', async () => {
		env.OMAHE_API_BASE_URL = API;
		let url = '';
		let cookie = "" as string | null;
		const f = (async (u: string, init?: RequestInit) => {
			url = u;
			cookie = new Headers(init?.headers).get('cookie');
			return envelope({ perumahan: { slug: 'griya-asri', nama: 'Griya' }, estimasi: { status: 'estimasi', persen: 2.9, nominal: 8_700_000, dasar: 'tipe' } });
		}) as unknown as typeof fetch;
		const hasil = await getEstimasiKomisiAgen(f, '_ga=1; session=abc; x=2', 'griya-asri', 'tipe-36');
		expect(url).toBe(`${API}/public/agen-omahe/komisi?slug=griya-asri&tipeSlug=tipe-36`);
		expect(cookie).toBe('session=abc');
		expect(hasil).toEqual({ status: 'estimasi', persen: 2.9, nominal: 8_700_000, dasar: 'tipe' });
	});

	test('401 / jaringan gagal → null (fail-soft)', async () => {
		env.OMAHE_API_BASE_URL = API;
		const f401 = (async () => new Response('{"error":"x"}', { status: 401 })) as unknown as typeof fetch;
		expect(await getEstimasiKomisiAgen(f401, 'session=abc', 'griya-asri')).toBeNull();
		const fErr = (async () => {
			throw new Error('putus');
		}) as unknown as typeof fetch;
		expect(await getEstimasiKomisiAgen(fErr, 'session=abc', 'griya-asri')).toBeNull();
	});

	test('mode fixture: null default; OMAHE_FIXTURE_AGEN=1 → angka contoh', async () => {
		const f = (async () => envelope({})) as unknown as typeof fetch;
		expect(await getEstimasiKomisiAgen(f, 'session=abc', 'griya-asri')).toBeNull();
		env.OMAHE_FIXTURE_AGEN = '1';
		expect(await getEstimasiKomisiAgen(f, 'session=abc', 'griya-asri')).toEqual({
			status: 'estimasi', persen: 2.9, nominal: 8_700_000, dasar: 'perumahan'
		});
	});
});
