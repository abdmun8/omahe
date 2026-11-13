/**
 * Test `getAgenSaya` + `inputLeadAgen` (SESI-OMAHE-01 / AGEN-OMAHE-11) —
 * pola `client.api.test.ts` (env di-mutasi lewat objek `$env/dynamic/private`
 * yang di-mock global `src/lib/test/setup.ts`, dibaca client SAAT PANGGILAN)
 * dan `client.test.ts` (mode fixture, env kosong).
 *
 * Yang paling dikunci:
 *   - HANYA cookie `session` yang diteruskan ke backend — cookie lain di
 *     header request browser TIDAK ikut menyeberang;
 *   - tanpa cookie `session` → getAgenSaya null & inputLeadAgen 401 TANPA
 *     memanggil backend (proxy /api/saya dipanggil tiap kunjungan halaman);
 *   - body error backend `{error, code, issues}` → pesan ramah via
 *     `pesanErrorBackend` (bukan `{message}` — pelajaran 2026-09-27);
 *   - mode fixture: null default; `OMAHE_FIXTURE_AGEN=1` → agen contoh;
 *     nomor 081200000409 → 409 proteksi (simulasi lokal epic keputusan 3).
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { env } from '$env/dynamic/private';
import type { AgenSaya } from './types';
import {
	ApiError,
	PESAN_WAJIB_AGEN,
	getAgenSaya,
	inputLeadAgen,
	normalisasiUnitTersediaAgen
} from './client';

const API = 'https://api.perumahan.test';

const envelope = (data: unknown) =>
	new Response(JSON.stringify({ success: true, data }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});

const AGEN: AgenSaya = {
	kodeAgen: 'OMHA-A0001',
	nama: 'Widya Pratama',
	fotoUrl: 'https://img.test/foto.jpg',
	panelUrl: 'https://app.perumahan.test/agen-omahe',
	perumahanSlugs: null
};

const bodyValid = {
	slug: 'griya-asri',
	namaPembeli: 'Budi Santoso',
	whatsappPembeli: '081234567890'
};

beforeEach(() => {
	delete env.OMAHE_API_BASE_URL;
	delete env.OMAHE_API_SEARCH;
	delete env.OMAHE_FIXTURE_AGEN;
});

afterEach(() => {
	delete env.OMAHE_API_BASE_URL;
	delete env.OMAHE_API_SEARCH;
	delete env.OMAHE_FIXTURE_AGEN;
});

describe('mode fixture (env kosong) — getAgenSaya', () => {
	test('tanpa OMAHE_FIXTURE_AGEN → null TANPA network (anonim jujur)', async () => {
		const fetchPenjaga = (() => {
			throw new Error('Tidak boleh ada network di mode fixture.');
		}) as unknown as typeof fetch;
		expect(await getAgenSaya(fetchPenjaga, 'session=abc')).toBeNull();
	});

	test('OMAHE_FIXTURE_AGEN=1 → agen contoh OMHA-A0001', async () => {
		env.OMAHE_FIXTURE_AGEN = '1';
		const fetchPenjaga = (() => {
			throw new Error('Tidak boleh ada network di mode fixture.');
		}) as unknown as typeof fetch;
		const agen = await getAgenSaya(fetchPenjaga, 'session=abc');
		expect(agen?.kodeAgen).toBe('OMHA-A0001');
		expect(agen?.nama).toBe('Agen Contoh');
		expect(agen?.panelUrl).toContain('/agen-omahe');
	});
});

describe('mode fixture — inputLeadAgen', () => {
	const fetchPenjaga = (() => {
		throw new Error('Tidak boleh ada network di mode fixture.');
	}) as unknown as typeof fetch;

	test('tanpa cookie session → 401 tanpa network', async () => {
		await expect(inputLeadAgen(fetchPenjaga, null, { ...bodyValid })).rejects.toMatchObject({
			status: 401,
			message: PESAN_WAJIB_AGEN
		});
	});

	test('sukses → id + kunciSampai ~60 hari ke depan', async () => {
		const hasil = await inputLeadAgen(fetchPenjaga, 'session=abc', {
			...bodyValid,
			tipeSlug: 'tipe-36-72'
		});
		expect(hasil.perumahan.slug).toBe('griya-asri');
		const sampai = new Date(hasil.kunciSampai).getTime();
		const hari = (sampai - Date.now()) / 86_400_000;
		expect(hari).toBeGreaterThan(59);
		expect(hari).toBeLessThan(61);
	});

	test('nomor contoh 081200000409 → 409 proteksi agen lain', async () => {
		await expect(
			inputLeadAgen(fetchPenjaga, 'session=abc', { ...bodyValid, whatsappPembeli: '081200000409' })
		).rejects.toMatchObject({
			status: 409,
			message: 'Pembeli ini sudah didaftarkan agen lain.'
		});
	});
});

describe('API asli — getAgenSaya', () => {
	beforeEach(() => {
		env.OMAHE_API_BASE_URL = API;
	});

	test('HANYA cookie session yang diteruskan (cookie lain di-strip)', async () => {
		// Tangkap lewat objek — narrowing TS atas `let x: string | null = null`
		// menutup assignment dari closure (svelte-check mengira selalu null).
		const tangkap: { url: string; cookie: string | null } = { url: '', cookie: null };
		const fetchFn = (async (url: string, init?: RequestInit) => {
			tangkap.url = String(url);
			tangkap.cookie = (init?.headers as Record<string, string>)['cookie'] ?? null;
			return envelope({ agen: AGEN });
		}) as unknown as typeof fetch;

		const agen = await getAgenSaya(fetchFn, 'tema=gelap; session=abc123; analytics=zz; _ga=GA1.1');

		expect(agen?.kodeAgen).toBe('OMHA-A0001');
		expect(tangkap.url).toBe(`${API}/public/agen-omahe/saya`);
		expect(tangkap.cookie).toBe('session=abc123');
	});

	test('backend balas agen:null → null; body aneh → null (fail-soft)', async () => {
		expect(await getAgenSaya(fetchDengan(envelope({ agen: null })), 'session=a')).toBeNull();
		expect(await getAgenSaya(fetchDengan(envelope({})), 'session=a')).toBeNull();
	});

	test('agen setengah jadi (panelUrl kosong) → null, bukan objek pincang', async () => {
		const pincang = await getAgenSaya(
			fetchDengan(envelope({ agen: { kodeAgen: 'OMHA-A0001', nama: 'X', panelUrl: '' } })),
			'session=a'
		);
		expect(pincang).toBeNull();
	});

	test('AGEN-OMAHE-15 perumahanSlugs: array disaring string; absen (backend lama) → null', async () => {
		const dasar = { kodeAgen: 'OMHA-A0001', nama: 'X', panelUrl: 'https://x/agen-omahe' };
		const baru = await getAgenSaya(
			fetchDengan(envelope({ agen: { ...dasar, perumahanSlugs: ['griya-asri', 7] } })),
			'session=a'
		);
		expect(baru?.perumahanSlugs).toEqual(['griya-asri']);
		const lama = await getAgenSaya(fetchDengan(envelope({ agen: dasar })), 'session=a');
		expect(lama?.perumahanSlugs).toBeNull();
	});

	test('backend 500 / jaringan lempar → null (fail-soft, tidak pernah throw)', async () => {
		const gagal = (async () => new Response('err', { status: 500 })) as unknown as typeof fetch;
		expect(await getAgenSaya(gagal, 'session=a')).toBeNull();
		const lempar = (async () => {
			throw new Error('network down');
		}) as unknown as typeof fetch;
		expect(await getAgenSaya(lempar, 'session=a')).toBeNull();
	});

	test('TANPA cookie session → null TANPA memanggil backend', async () => {
		const fetchPenjaga = (() => {
			throw new Error('tidak boleh dipanggil');
		}) as unknown as typeof fetch;
		expect(await getAgenSaya(fetchPenjaga, null)).toBeNull();
		expect(await getAgenSaya(fetchPenjaga, 'tema=gelap; lain=x')).toBeNull();
	});
});

describe('API asli — inputLeadAgen', () => {
	beforeEach(() => {
		env.OMAHE_API_BASE_URL = API;
	});

	test('201 → data hasil; body sesuai kontrak (slug/namaPembeli/whatsappPembeli)', async () => {
		let bodyTerkirim: Record<string, unknown> = {};
		const fetchFn = (async (_url: string, init?: RequestInit) => {
			bodyTerkirim = JSON.parse(String(init?.body));
			return new Response(
				JSON.stringify({
					success: true,
					data: {
						id: 'lead-9',
						perumahan: { slug: 'griya-asri', nama: 'Griya Asri' },
						kunciSampai: '2027-01-08T00:00:00.000Z'
					}
				}),
				{ status: 201, headers: { 'content-type': 'application/json' } }
			);
		}) as unknown as typeof fetch;

		const hasil = await inputLeadAgen(fetchFn, 'session=abc; x=1', {
			...bodyValid,
			catatan: 'refferral tetangga'
		});

		expect(hasil.id).toBe('lead-9');
		expect(bodyTerkirim).toEqual({
			slug: 'griya-asri',
			namaPembeli: 'Budi Santoso',
			whatsappPembeli: '081234567890',
			catatan: 'refferral tetangga'
		});
	});

	test('401 → pesan backend diteruskan (bukan generik)', async () => {
		const res = new Response(JSON.stringify({ error: PESAN_WAJIB_AGEN, code: 401 }), {
			status: 401,
			headers: { 'content-type': 'application/json' }
		});
		await expect(
			inputLeadAgen(fetchDengan(res), 'session=mati', { ...bodyValid })
		).rejects.toMatchObject({ status: 401, message: PESAN_WAJIB_AGEN });
	});

	test('400 issues → pesan issue pertama (bentuk {error, code, issues})', async () => {
		const res = new Response(
			JSON.stringify({
				error: 'Validation failed',
				code: 400,
				issues: [{ message: 'Nama pembeli wajib 2–100 karakter.', path: ['namaPembeli'] }]
			}),
			{ status: 400, headers: { 'content-type': 'application/json' } }
		);
		await expect(
			inputLeadAgen(fetchDengan(res), 'session=a', { ...bodyValid })
		).rejects.toMatchObject({ status: 400, message: 'Nama pembeli wajib 2–100 karakter.' });
	});

	test('TANPA cookie session → 401 TANPA memanggil backend', async () => {
		const fetchPenjaga = (() => {
			throw new Error('tidak boleh dipanggil');
		}) as unknown as typeof fetch;
		await expect(inputLeadAgen(fetchPenjaga, 'lain=x', { ...bodyValid })).rejects.toMatchObject({
			status: 401
		});
	});

	test('jaringan lempar → ApiError 502 generik', async () => {
		const lempar = (async () => {
			throw new Error('network down');
		}) as unknown as typeof fetch;
		await expect(inputLeadAgen(lempar, 'session=a', { ...bodyValid })).rejects.toMatchObject({
			status: 502
		});
	});

	test('201 tapi body bukan JSON → ApiError 502, bukan crash', async () => {
		const aneh = (async () =>
			new Response('bukan json', { status: 201 })) as unknown as typeof fetch;
		await expect(inputLeadAgen(aneh, 'session=a', { ...bodyValid })).rejects.toMatchObject({
			status: 502
		});
	});
});

describe('normalisasiUnitTersediaAgen (AGEN-OMAHE-11 iterasi 3)', () => {
	test('bukan array → [] (fail-soft, tidak lempar)', () => {
		expect(normalisasiUnitTersediaAgen(null)).toEqual([]);
		expect(normalisasiUnitTersediaAgen(undefined)).toEqual([]);
		expect(normalisasiUnitTersediaAgen({})).toEqual([]);
		expect(normalisasiUnitTersediaAgen('unit')).toEqual([]);
	});

	test('baris rusak dibuang — daftar tetap hidup, bukan gagal total', () => {
		const hasil = normalisasiUnitTersediaAgen([
			null,
			'rusak',
			42,
			{},
			{ id: 'u1', blok: 'A', nomor: '1', tipe: 'Tipe 36/72', harga: 100 },
			{ blok: 'B', nomor: '2' }, // tanpa id
			{ id: 'u3', nomor: '3' }, // tanpa blok
			{ id: 'u4', blok: 'C' } // tanpa nomor
		]);
		expect(hasil).toEqual([{ id: 'u1', blok: 'A', nomor: '1', tipe: 'Tipe 36/72', harga: 100 }]);
	});

	test('harga 0 / negatif / non-angka → null (tanpa harga = boleh)', () => {
		const hasil = normalisasiUnitTersediaAgen([
			{ id: 'a', blok: 'A', nomor: '1', harga: 0 },
			{ id: 'b', blok: 'A', nomor: '2', harga: -5 },
			{ id: 'c', blok: 'B', nomor: '1', harga: '100' },
			{ id: 'd', blok: 'B', nomor: '2', harga: Number.NaN },
			{ id: 'e', blok: 'B', nomor: '3', harga: Number.POSITIVE_INFINITY },
			{ id: 'f', blok: 'C', nomor: '4' }
		]);
		expect(hasil.map((u) => u.harga)).toEqual([null, null, null, null, null, null]);
	});

	test('bentuk normal: id angka → string, tipe absen → string kosong', () => {
		expect(normalisasiUnitTersediaAgen([{ id: 7, blok: 'C', nomor: 9, tipe: null }])).toEqual([
			{ id: '7', blok: 'C', nomor: '9', tipe: '', harga: null }
		]);
	});
});

/** fetchFn yang selalu membalas `res` — untuk respons statis. */
function fetchDengan(res: Response): typeof fetch {
	return (async () => res) as unknown as typeof fetch;
}

// ApiError dipakai test — pastikan export ada (dijaga juga di test lain).
test('PESAN_WAJIB_AGEN sinkron kontrak backend', () => {
	expect(PESAN_WAJIB_AGEN).toBe('Masuk sebagai agen terlebih dahulu.');
	expect(new ApiError(409, 'x').status).toBe(409);
});
