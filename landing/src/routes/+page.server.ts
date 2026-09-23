import { getDevelopers, getFeaturedUnits, getRegions, getSliders } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/**
 * Homepage TIDAK boleh 500 hanya karena satu bagian gagal dimuat (mis.
 * backend sedang restart saat deploy → fetch timeout). Unit unggulan &
 * developer dibungkus fail-soft ke `[]` (bagian disembunyikan/kosong),
 * sama seperti `getRegions`/`getSliders` yang sudah fail-soft di client.
 * Halaman detail/pencarian tetap memakai perilaku error biasa.
 */
async function failSoft<T>(label: string, task: Promise<T[]>): Promise<T[]> {
	try {
		return await task;
	} catch (err) {
		console.error(`[omahe:home] ${label} gagal dimuat — bagian disembunyikan`, err);
		return [];
	}
}

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const [unitUnggulan, developers, regions, sliders] = await Promise.all([
		failSoft('unit unggulan', getFeaturedUnits(fetch, 6)),
		failSoft('developer', getDevelopers(fetch)),
		getRegions(fetch),
		getSliders(fetch)
	]);

	// Kalau data inti gagal, cache edge dipersingkat supaya halaman kosong
	// tidak tersaji 5 menit penuh setelah backend pulih.
	cacheKonten(setHeaders, unitUnggulan.length === 0 && developers.length === 0 ? 30 : 300);
	return { unitUnggulan, developers: developers.slice(0, 3), regions, sliders };
};
