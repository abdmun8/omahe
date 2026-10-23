import {
	getDevelopers,
	getLelang,
	getFeaturedUnits,
	getPerumahanPromo,
	getPerumahanTerbaru,
	getRegions,
	getSliders,
	getUnitTerjangkau
} from '$lib/api';
import { cacheKonten } from '$lib/cache';
import { AMBANG_PERUMAHAN_BARU } from '$lib/config';
import { kumpulkanSlugPromo, saringBukanPromo } from '$lib/promo-saring';
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
	const [
		unitUnggulanKandidat,
		unitTerjangkau,
		terbaru,
		perumahanPromo,
		developers,
		rumahLelang,
		regions,
		sliders
	] = await Promise.all([
		// Kandidat diambil LEBIH BANYAK dari kebutuhan slot (12 untuk 6, 8
		// untuk 4) — sebagian gugur saringan anti-dobel promo di bawah.
		failSoft('unit unggulan', getFeaturedUnits(fetch, 12)),
		// LANDING-07 — seksi "Harga Terjangkau" & "Baru di Omahe" (fail-soft).
		failSoft('unit terjangkau', getUnitTerjangkau(fetch, 6)),
		getPerumahanTerbaru(fetch, 8).catch((err) => {
			console.error('[omahe:home] perumahan terbaru gagal dimuat — bagian disembunyikan', err);
			return { items: [], total: 0 };
		}),
		// Promo Pilihan (MONET-01) — perumahan partner berbayar (prioritas > 0);
		// fail-soft ke [] pola seksi lain (homepage tidak boleh 500).
		failSoft('promo pilihan', getPerumahanPromo(fetch, 6)),
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
	// MONET-01 anti-dobel: perumahan yang sudah tampil di "Promo Pilihan"
	// (partner berbayar) tidak boleh muncul lagi di seksi organik — slot
	// homepage jangan diboroskan dua kali untuk perumahan yang sama.
	const slugPromo = kumpulkanSlugPromo(perumahanPromo);
	const unitUnggulan = saringBukanPromo(
		unitUnggulanKandidat,
		slugPromo,
		(u) => u.perumahan.slug,
		6
	);

	// "Baru di Omahe" baru tampil kalau perumahan aktif sudah cukup banyak
	// (keputusan user: ≥ 25) — sebelum itu isinya hampir sama dengan
	// rekomendasi. Ambang memakai TOTAL perumahan aktif (`terbaru.total`
	// dari meta backend), bukan jumlah item halaman ini.
	const perumahanBaru =
		terbaru.total >= AMBANG_PERUMAHAN_BARU
			? saringBukanPromo(terbaru.items, slugPromo, (p) => p.slug, 4)
			: [];

	// Kalau data inti gagal, cache edge dipersingkat supaya halaman kosong
	// tidak tersaji 5 menit penuh setelah backend pulih.
	cacheKonten(setHeaders, unitUnggulan.length === 0 && developers.length === 0 ? 30 : 300);
	return {
		unitUnggulan,
		unitTerjangkau,
		perumahanPromo,
		perumahanBaru,
		rumahLelang,
		developers: developers.slice(0, 3),
		regions,
		sliders
	};
};
