/**
 * Test jalur API ASLI `client.ts` (`OMAHE_API_BASE_URL` + `OMAHE_API_SEARCH=1`).
 *
 * Tanpa spawn server: `fetchFn` di-mock per-URL, env di-set lewat MUTASI
 * objek `env` yang di-mock global `src/lib/test/setup.ts`. Itu aman karena
 * `client.ts` membaca `env.*` SAAT PANGGILAN (bukan saat import — live
 * binding ke namespace objek yang sama), jadi tidak perlu `mock.module`
 * ulang yang berpotensi konflik dengan preload. Env dikembalikan bersih di
 * `afterEach` supaya file test mode fixture (`client.test.ts`) tidak
 * terpengaruh walau modulnya ter-cache bareng.
 *
 * Yang dijaga di sini (koreksi asumsi kontrak 2026-09-14, fix 2026-09-15):
 *   1. `getUnits` TIDAK boleh mengirim `developerSlug` ke backend
 *      (backend mengabaikannya diam-diam) — filter jalan client-side.
 *   2. `getDeveloper` TIDAK boleh memaksa response mentah ke tipe publik:
 *      `proyek[]` mentah hanya `{id, nama, slug, fotoUrl}`, stats per-proyek
 *      (`regionNama`/`hargaMulai`/`unitTersedia`) HARUS terisi dari
 *      enrichment `GET /public/units?perumahanSlug=...` per proyek —
 *      kalau tidak, field itu `undefined` di runtime.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { env } from '$env/dynamic/private';
import type { UnitListing } from './types';
import { getDeveloper, getUnits } from './client';

const API = 'https://api.perumahan.test';

/** Envelope standar backend `perumahan` (api-contract.md, atas). */
const envelope = (data: unknown, meta?: Record<string, unknown>) =>
	new Response(JSON.stringify({ success: true as const, data, ...{ meta } }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});

const unit = (
	perumahanSlug: string,
	developerSlug: string | null,
	hargaMin: number | null,
	unitTersedia: number
): UnitListing => ({
	id: `${perumahanSlug}--${hargaMin ?? 'tanpa-harga'}`,
	tipe: 'Tipe 36/72',
	luasTanah: 72,
	luasBangunan: 36,
	hargaMin,
	hargaMax: hargaMin,
	unitTersedia,
	perumahan: {
		nama: perumahanSlug,
		slug: perumahanSlug,
		regionKode: '32.01',
		regionNama: 'Kab. Bogor, Jawa Barat'
	},
	developer: developerSlug === null ? null : { nama: `PT ${developerSlug}`, slug: developerSlug },
	fotoUrl: null
});

beforeEach(() => {
	env.OMAHE_API_BASE_URL = API;
	env.OMAHE_API_SEARCH = '1';
});

afterEach(() => {
	// Tipe generate SvelteKit mendeklarasikan env var `string` non-optional,
	// padahal runtime-nya bisa absen (begitu pula mock setup.ts) — delete
	// lewat cast agar `hasApi()` kembali false untuk file test berikutnya.
	delete (env as Record<string, string | undefined>).OMAHE_API_BASE_URL;
	delete (env as Record<string, string | undefined>).OMAHE_API_SEARCH;
});

describe('getUnits (jalur API asli)', () => {
	test('developerSlug TIDAK dikirim ke backend — filter jalan client-side, meta diteruskan apa adanya', async () => {
		const dipanggil: string[] = [];
		const fetchMock = (async (input: RequestInfo | URL) => {
			const url = String(input);
			dipanggil.push(url);
			return envelope(
				[
					unit('griya-asri-bogor', 'nusa-land-development', 385000000, 12),
					unit('puri-mentari-tangerang', null, 465000000, 5)
				],
				{ total: 27, page: 1, pageSize: 12 }
			);
		}) as unknown as typeof fetch;

		const hasil = await getUnits(fetchMock, { developerSlug: 'nusa-land-development', page: 1 });

		expect(dipanggil).toHaveLength(1);
		// Param yang diterima backend TIDAK boleh menyebut developerSlug
		// (backend mengabaikannya diam-diam = filter tidak bekerja).
		expect(dipanggil[0]).not.toContain('developerSlug');
		expect(dipanggil[0]).not.toContain('nusa-land-development');
		expect(dipanggil[0]).toContain('page=1');

		// Item developer lain/null tersaring di sisi Omahe.
		expect(hasil.items.map((u) => u.perumahan.slug)).toEqual(['griya-asri-bogor']);
		expect(hasil.items[0]?.developer?.slug).toBe('nusa-land-development');
		// Trade-off yang disadari: meta TIDAK disesuaikan setelah filter.
		expect(hasil.meta).toEqual({ total: 27, page: 1, pageSize: 12 });
	});

	test('tanpa developerSlug → semua item diteruskan tanpa penyaringan', async () => {
		const fetchMock = (async () =>
			envelope(
				[
					unit('griya-asri-bogor', 'nusa-land-development', 385000000, 12),
					unit('puri-mentari-tangerang', null, 465000000, 5)
				],
				{ total: 2, page: 1, pageSize: 12 }
			)) as unknown as typeof fetch;

		const hasil = await getUnits(fetchMock, { regionKode: '32' });
		expect(hasil.items).toHaveLength(2);
		expect(hasil.meta.total).toBe(2);
	});
});

describe('getDeveloper (jalur API asli) — enrichment stats per-proyek', () => {
	/** Fixture URL routing untuk 1 detail developer + 3 proyek. */
	const buatFetchMock = (dipanggil: string[]) =>
		(async (input: RequestInfo | URL) => {
			const url = new URL(String(input));
			dipanggil.push(url.pathname + url.search);
			if (url.pathname === '/public/developers/nusa-land-development') {
				// Shape MENTAH §3: proyek[] HANYA {id, nama, slug, fotoUrl}.
				return envelope({
					id: 'dev-nusa-land',
					nama: 'PT Nusa Land Development',
					slug: 'nusa-land-development',
					deskripsi: 'Pengembang cluster di Jabodetabek.',
					logoUrl: null,
					jumlahProyek: 3,
					proyek: [
						{ id: 'p1', nama: 'Griya Asri Bogor', slug: 'griya-asri-bogor', fotoUrl: null },
						{
							id: 'p2',
							nama: 'Villa Kenanga Residence',
							slug: 'villa-kenanga-residence',
							fotoUrl: 'https://foto.test/p2.jpg'
						},
						{ id: 'p3', nama: 'Proyek Baru Tanpa Unit', slug: 'proyek-baru', fotoUrl: null }
					]
				});
			}
			if (url.pathname === '/public/units') {
				// getDeveloper memanggil per-proyek: page=1 & pageSize=48.
				if (url.searchParams.get('perumahanSlug') === null)
					throw new Error('perumahanSlug wajib dikirim');
				if (url.searchParams.get('page') !== '1' || url.searchParams.get('pageSize') !== '48') {
					throw new Error(`page/pageSize enrichment salah: ${url.search}`);
				}
				switch (url.searchParams.get('perumahanSlug')) {
					case 'griya-asri-bogor':
						return envelope(
							[
								unit('griya-asri-bogor', 'nusa-land-development', 520000000, 7),
								unit('griya-asri-bogor', 'nusa-land-development', 385000000, 12)
							],
							{ total: 2, page: 1, pageSize: 48 }
						);
					case 'villa-kenanga-residence':
						// Semua hargaMin null → hargaMulai harus null.
						return envelope([unit('villa-kenanga-residence', 'nusa-land-development', null, 9)], {
							total: 1,
							page: 1,
							pageSize: 48
						});
					default:
						// Proyek tanpa unit tersedia sama sekali.
						return envelope([], { total: 0, page: 1, pageSize: 48 });
				}
			}
			throw new Error(`URL tak terduga di mock: ${url.pathname}${url.search}`);
		}) as unknown as typeof fetch;

	test('stats proyek TERISI dari GET /public/units per proyek — bukan undefined dari response mentah', async () => {
		const dipanggil: string[] = [];
		const detail = await getDeveloper(buatFetchMock(dipanggil), 'nusa-land-development');

		// Field summary diteruskan utuh dari endpoint developer.
		expect(detail.nama).toBe('PT Nusa Land Development');
		expect(detail.jumlahProyek).toBe(3);

		// 1 panggilan detail + 1 panggilan units per proyek (3 proyek).
		expect(dipanggil).toHaveLength(4);
		expect(dipanggil.filter((u) => u.startsWith('/public/units'))).toEqual([
			'/public/units?perumahanSlug=griya-asri-bogor&page=1&pageSize=48',
			'/public/units?perumahanSlug=villa-kenanga-residence&page=1&pageSize=48',
			'/public/units?perumahanSlug=proyek-baru&page=1&pageSize=48'
		]);

		const [griya, kenanga, baru] = detail.proyek;
		// Harga termurah non-null di antara items, region & jumlah dijumlah.
		expect(griya).toMatchObject({
			nama: 'Griya Asri Bogor',
			slug: 'griya-asri-bogor',
			fotoUrl: null,
			regionNama: 'Kab. Bogor, Jawa Barat',
			hargaMulai: 385000000,
			unitTersedia: 19
		});
		// Semua hargaMin null → hargaMulai null, unitTersedia tetap terisi.
		expect(kenanga).toMatchObject({
			slug: 'villa-kenanga-residence',
			fotoUrl: 'https://foto.test/p2.jpg',
			regionNama: 'Kab. Bogor, Jawa Barat',
			hargaMulai: null,
			unitTersedia: 9
		});
		// items kosong → semua stats bernilai kosong (0/null), BUKAN undefined.
		expect(baru).toMatchObject({
			slug: 'proyek-baru',
			regionNama: null,
			hargaMulai: null,
			unitTersedia: 0
		});
	});

	test('enrichment paralel (Promise.all) — semua request units terkirim sebelum response pertama selesai', async () => {
		let sedangBerjalan = 0;
		let maksParalel = 0;
		const fetchMock = (async (input: RequestInfo | URL) => {
			const url = new URL(String(input));
			if (url.pathname === '/public/units') {
				sedangBerjalan++;
				maksParalel = Math.max(maksParalel, sedangBerjalan);
				await new Promise((r) => setTimeout(r, 10));
				sedangBerjalan--;
				return envelope([], { total: 0, page: 1, pageSize: 48 });
			}
			return envelope({
				id: 'dev-nusa-land',
				nama: 'PT Nusa Land Development',
				slug: 'nusa-land-development',
				deskripsi: null,
				logoUrl: null,
				jumlahProyek: 3,
				proyek: [
					{ id: 'p1', nama: 'A', slug: 'proyek-a', fotoUrl: null },
					{ id: 'p2', nama: 'B', slug: 'proyek-b', fotoUrl: null },
					{ id: 'p3', nama: 'C', slug: 'proyek-c', fotoUrl: null }
				]
			});
		}) as unknown as typeof fetch;

		await getDeveloper(fetchMock, 'nusa-land-development');
		// Kalau sekuensial, maksParalel tidak akan pernah > 1.
		expect(maksParalel).toBe(3);
	});
});
