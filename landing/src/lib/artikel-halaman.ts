/**
 * Paginasi daftar artikel (omahe 2026-10-03): 12 per halaman, halaman 1 =
 * `/artikel`, berikutnya `/artikel/halaman/:n` — semua di-prerender (statis,
 * SEO tetap bisa merayapi setiap halaman lewat tautan berikutnya).
 */
export const ARTIKEL_PER_HALAMAN = 12;

export function jumlahHalaman(total: number, perHalaman = ARTIKEL_PER_HALAMAN): number {
	return Math.max(1, Math.ceil(total / perHalaman));
}

/** Potongan daftar untuk halaman `n` (1-based); di luar rentang → kosong. */
export function potongHalaman<T>(
	daftar: readonly T[],
	n: number,
	perHalaman = ARTIKEL_PER_HALAMAN
): T[] {
	if (!Number.isInteger(n) || n < 1) return [];
	return daftar.slice((n - 1) * perHalaman, n * perHalaman);
}

/** URL halaman ke-n daftar artikel. */
export function urlHalamanArtikel(n: number): string {
	return n <= 1 ? '/artikel' : `/artikel/halaman/${n}`;
}
