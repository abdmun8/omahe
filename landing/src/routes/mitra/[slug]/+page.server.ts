import { redirect } from '@sveltejs/kit';
import { getMitraDetail } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/**
 * PROFIL-01 — halaman profil satu Mitra Profesional (`/mitra/:slug`,
 * api-contract.md §29). Mitra tidak tampil publik (nonaktif / masa aktif
 * habis / kategori nonaktif / tidak ada) → 404 SERAGAM dari backend, halaman
 * tidak dibedakan dari "tidak ada" (privacy). SSR + cache edge pendek —
 * keaktifan & deskripsi bisa berubah sewaktu-waktu.
 *
 * Slug non-kanonik (huruf besar dsb. — `getMitraDetail` menormalkan ke
 * lowercase) → 301 ke slug kanonik supaya canonical selalu bersih (pola
 * `/agen-omahe/:kode`).
 */
export const load: PageServerLoad = async ({ fetch, params, setHeaders }) => {
	const detail = await getMitraDetail(fetch, params.slug ?? '');
	if (detail.slug !== params.slug) redirect(301, `/mitra/${encodeURIComponent(detail.slug)}`);
	cacheKonten(setHeaders, 300);
	return { detail };
};
