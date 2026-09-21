import { getMitra } from '$lib/api';
import type { PageServerLoad } from './$types';

/**
 * Direktori Mitra Profesional (MITRA-01, api-contract.md §9). SSR murni —
 * data ikut status bayar (`aktif`), bukan jadwal, jadi TIDAK di-prerender.
 * Filter `?kategori=` server-side (link chip, pola `/cari` — bukan filter
 * client-side seperti `/artikel`). Nilai kategori tak dikenal diabaikan
 * (kembali ke daftar penuh), bukan 404.
 */
export const load: PageServerLoad = async ({ fetch, url }) => {
	const q = url.searchParams.get('kategori');
	const kategori = q === 'kjpp' || q === 'notaris' ? q : undefined;
	return { mitra: await getMitra(fetch, kategori), kategori };
};
