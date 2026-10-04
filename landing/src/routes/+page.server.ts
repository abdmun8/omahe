import {
	getDevelopers,
	getLelang,
	getFeaturedUnits,
	getPerumahanTerbaru,
	getRegions,
	getSliders,
	getUnitTerjangkau
} from '$lib/api';
import { cacheKonten } from '$lib/cache';
import { AMBANG_PERUMAHAN_BARU } from '$lib/config';
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
	const [unitUnggulan, unitTerjangkau, terbaru, developers, rumahLelang, regions, sliders] =
		await Promise.all([
			failSoft('unit unggulan', getFeaturedUnits(fetch, 6)),
			// LANDING-07 — seksi "Harga Terjangkau" & "Baru di Omahe" (fail-soft).
			failSoft('unit terjangkau', getUnitTerjangkau(fetch, 6)),
			getPerumahanTerbaru(fetch, 4).catch((err) => {
				console.error('[omahe:home] perumahan terbaru gagal dimuat — bagian disembunyikan', err);
				return { items: [], total: 0 };
			}),
			failSoft('developer', getDevelopers(fetch)),
			// LELANG-01 — seksi "Rumah Lelang" (3 terdekat; kosong → disembunyikan).
			getLelang(fetch, { pageSize: 3 })
				.then((h) => h.items)
				.catch((err) => {
					console.error('[omahe:home] rumah lelang gagal dimuat — bagian disembunyikan', err);
					return [];
				}),
			getRegions(fetch),
			getSliders(fetch)
		]);
	// "Baru di Omahe" baru tampil kalau perumahan aktif sudah cukup banyak
	// (keputusan user: ≥ 25) — sebelum itu isinya hampir sama dengan
	// rekomendasi.
	const perumahanBaru = terbaru.total >= AMBANG_PERUMAHAN_BARU ? terbaru.items : [];

	// Kalau data inti gagal, cache edge dipersingkat supaya halaman kosong
	// tidak tersaji 5 menit penuh setelah backend pulih.
	cacheKonten(setHeaders, unitUnggulan.length === 0 && developers.length === 0 ? 30 : 300);
	return {
		unitUnggulan,
		unitTerjangkau,
		perumahanBaru,
		rumahLelang,
		developers: developers.slice(0, 3),
		regions,
		sliders
	};
};
