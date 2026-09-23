/**
 * Regression test mode fixture `client.ts` (env kosong — default `bun test`,
 * `$env/dynamic/private` di-mock kosong oleh `src/lib/test/setup.ts`):
 * slug yang tidak ada TIDAK boleh jadi crash generik. `getPerumahan` wajib
 * melempar `error(404, ...)` dari `@sveltejs/kit` (diterjemahkan Kit jadi
 * halaman 404 custom), sedangkan `getUnits` wajib resolve kosong supaya
 * `/cari` tetap hidup walau filter tidak match apa pun. Kalau nanti ada
 * yang mengubah `apiGet`/`getPerumahan` dan jalur 404-nya hilang, tes ini
 * yang pertama merah — bukan baru ketahuan pas production 500.
 */
import { afterEach, describe, expect, test, setSystemTime } from 'bun:test';
import { env } from '$env/dynamic/private';
import { SITE } from '$lib/config';
import { getKontak, getPerumahan, getUnits } from './client';
import { UNIT_LISTINGS } from './fixtures';

/**
 * Penjaga anti-network: dilempar masuk sebagai `fetchFn`. Di mode fixture
 * TIDAK ada satu pun jalur kode yang boleh memanggilnya — tes terakhir
 * memastikan penjaga ini benar-benar terpasang (bukan tes lulus karena
 * fungsinya diam-diam no-op).
 */
const tolakNetwork = (): never => {
	throw new Error('Tidak boleh ada panggilan network di mode fixture.');
};

/** Bentuknya dipaksa `typeof fetch` (lewat `unknown` — `typeof fetch`
 * punya static `preconnect`, jadi cast langsung ditolak svelte-check). */
const fetchDummy = tolakNetwork as unknown as typeof fetch;

describe('client (mode fixture, env kosong)', () => {
	test('getPerumahan: slug tidak ada → melempar HttpError 404, bukan crash', async () => {
		await expect(getPerumahan(fetchDummy, 'slug-tidak-ada')).rejects.toMatchObject({
			status: 404
		});
	});

	test('getPerumahan: slug valid di fixture → resolve normal tanpa throw', async () => {
		const detail = await getPerumahan(fetchDummy, 'griya-asri-bogor');
		expect(detail.slug).toBe('griya-asri-bogor');
		expect(detail.nama).toBe('Griya Asri Bogor');
	});

	test('getUnits: perumahanSlug tidak match apa pun → resolve kosong, bukan throw', async () => {
		const hasil = await getUnits(fetchDummy, { perumahanSlug: 'slug-tidak-ada' });
		expect(hasil.items).toEqual([]);
		expect(hasil.meta.total).toBe(0);
	});

	// `developerSlug` TIDAK ada di backend asli (api-contract.md §1) — di
	// mode ini filter harusnya jalan LOKAL (`filterFixtureUnits` pakai field
	// `developer.slug` di tiap item mock). Penjaga jalur API asli (strip
	// `developerSlug` sebelum fetch + filter client-side) ada di
	// `client.api.test.ts`.
	test('getUnits: developerSlug → hanya listing milik developer itu, meta.total ikut presisi', async () => {
		const hasil = await getUnits(fetchDummy, { developerSlug: 'nusa-land-development' });
		const diharapkan = UNIT_LISTINGS.filter((u) => u.developer?.slug === 'nusa-land-development');
		expect(diharapkan.length).toBeGreaterThan(0);
		expect(hasil.items.length).toBe(diharapkan.length);
		expect(hasil.items.every((u) => u.developer?.slug === 'nusa-land-development')).toBe(true);
		expect(hasil.meta.total).toBe(diharapkan.length);
	});

	test('getUnits: developerSlug tidak match apa pun → resolve kosong, bukan throw', async () => {
		const hasil = await getUnits(fetchDummy, { developerSlug: 'developer-tidak-ada' });
		expect(hasil.items).toEqual([]);
		expect(hasil.meta.total).toBe(0);
	});

	test('fetchDummy benar-benar melempar — tiga tes di atas lolos tanpa network sedikit pun', () => {
		expect(tolakNetwork).toThrow('Tidak boleh ada panggilan network');
	});
});

/**
 * Test `getKontak` (ADMIN-05). Env di-mutasi langsung seperti di
 * `client.api.test.ts` (baca `env.*` SAAT PANGGILAN, bukan saat import), dan
 * `setSystemTime` mengendalikan cache 60 detik yang module-level — tiap tes
 * jaringan memakai jendela waktu sendiri supaya cache tes sebelumnya pasti
 * kedaluwarsa, lalu waktu nyata dikembalikan di `afterEach`.
 */
const T0 = 1_750_000_000_000;

const apiJson = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const kontakSite = () => ({
	whatsapp: SITE.whatsapp,
	telepon: SITE.telepon,
	email: SITE.email
});

describe('getKontak (ADMIN-05)', () => {
	afterEach(() => {
		delete (env as Record<string, string | undefined>).OMAHE_API_BASE_URL;
		setSystemTime();
	});

	test('tanpa base URL → fallback SITE, TANPA network sama sekali', async () => {
		const kontak = await getKontak(fetchDummy);
		expect(kontak).toEqual(kontakSite());
	});

	test('error fetch → fallback SITE tanpa throw, dan fallback-nya ter-cache 60 detik', async () => {
		env.OMAHE_API_BASE_URL = 'https://api.perumahan.test';
		setSystemTime(T0);

		const gagal = (() => Promise.reject(new Error('timeout'))) as unknown as typeof fetch;
		// JANGAN pernah throw — kegagalan kontak tidak boleh menjatuhkan halaman.
		expect(await getKontak(gagal)).toEqual(kontakSite());

		// Fallback-karena-error cukup 60 detik juga: 30 detik kemudian endpoint
		// sudah "sehat" pun TIDAK dipanggil ulang — masih dilayani cache.
		setSystemTime(T0 + 30_000);
		const sehat = (async () =>
			apiJson({
				success: true,
				data: { kontak: { whatsapp: '628111111111', telepon: '6221111111', email: 'x@y.z' } }
			})) as unknown as typeof fetch;
		expect(await getKontak(sehat)).toEqual(kontakSite());
	});

	test('field null di-merge dengan fallback SITE; cache 60 detik lalu kedaluwarsa', async () => {
		env.OMAHE_API_BASE_URL = 'https://api.perumahan.test';
		setSystemTime(T0 + 120_000); // jendela baru — cache tes sebelumnya basi

		let dipanggil = 0;
		const fetchMock = (async () => {
			dipanggil += 1;
			return apiJson({
				success: true,
				data: {
					appTitle: 'Omahe',
					kontak: { whatsapp: '6281112345678', telepon: null, email: null }
				}
			});
		}) as unknown as typeof fetch;

		const diharapkan = {
			whatsapp: '6281112345678',
			telepon: SITE.telepon,
			email: SITE.email
		};
		expect(await getKontak(fetchMock)).toEqual(diharapkan);

		// Masih segar → tidak fetch ulang (dipanggil 1x saja).
		expect(await getKontak(fetchMock)).toEqual(diharapkan);
		expect(dipanggil).toBe(1);

		// Lewat 60 detik → cache kedaluwarsa, fetch ulang.
		setSystemTime(T0 + 120_000 + 61_000);
		expect(await getKontak(fetchMock)).toEqual(diharapkan);
		expect(dipanggil).toBe(2);
	});
});
