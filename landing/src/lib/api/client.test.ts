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
import { describe, expect, test } from 'bun:test';
import { getPerumahan, getUnits } from './client';
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
