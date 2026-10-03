import { error, redirect } from '@sveltejs/kit';
import { artikelTayang } from '$lib/artikel';
import { jumlahHalaman } from '$lib/artikel-halaman';
import { bacaArtikel, hariIniWib, metaArtikel } from '$lib/server/artikel';
import type { EntryGenerator, PageServerLoad } from './$types';

/**
 * Daftar artikel halaman ke-n (n ≥ 2) — prerender seperti `/artikel`
 * (statis, SEO). `entries` = halaman 2..N dari artikel yang sudah tayang
 * saat build; rebuild harian (rilis artikel) menambah halaman baru.
 */
export const prerender = true;

function semuaTayang() {
	return artikelTayang(bacaArtikel(), hariIniWib()).map(metaArtikel);
}

export const entries: EntryGenerator = () => {
	const total = jumlahHalaman(semuaTayang().length);
	return Array.from({ length: Math.max(0, total - 1) }, (_, i) => ({ n: String(i + 2) }));
};

export const load: PageServerLoad = ({ params }) => {
	const n = Number(params.n);
	if (n === 1) redirect(308, '/artikel');
	const daftar = semuaTayang();
	if (!Number.isInteger(n) || n < 2 || n > jumlahHalaman(daftar.length)) {
		error(404, 'Halaman tidak ditemukan');
	}
	return { daftar, halaman: n };
};
