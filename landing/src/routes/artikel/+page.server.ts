import { artikelTayang } from '$lib/artikel';
import { bacaArtikel, hariIniWib, metaArtikel } from '$lib/server/artikel';

/**
 * Daftar artikel — prerender (statis, cepat, SEO-friendly). Hanya artikel
 * yang sudah tayang (`artikelTayang`, helper tunggal) yang dirender;
 * filter `?tag=` dikerjakan client-side supaya halaman tetap bisa
 * di-prerender satu file.
 */
export const prerender = true;

export const load = () => {
	return { daftar: artikelTayang(bacaArtikel(), hariIniWib()).map(metaArtikel) };
};
