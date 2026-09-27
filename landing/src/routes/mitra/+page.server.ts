import { getDirektoriAgen, getMitra } from '$lib/api';
import { kategoriChips } from '$lib/mitra';
import type { PageServerLoad } from './$types';

/**
 * Direktori Mitra Profesional (MITRA-01, api-contract.md §9). SSR murni —
 * data ikut status bayar (`aktif`), bukan jadwal, jadi TIDAK di-prerender.
 *
 * omahe#3 — chip kategori DIDERIVE dari data (satu fetch tanpa filter,
 * lalu disaring di load — tetap server-side, bukan filter browser), jadi
 * kategori baru dari backend (MITRA-02: asuransi, pemborong, arsitek, …)
 * tampil otomatis tanpa redeploy Omahe. Nilai `?kategori=` yang tidak ada
 * di data diabaikan (kembali ke daftar penuh), bukan 404 — pola lama.
 */
export const load: PageServerLoad = async ({ fetch, url }) => {
	// AGEN-OMAHE-04 — tab "Agen Omahe" (`?tab=agen`): direktori agen, chip
	// kategori tetap tampil (satu fetch mitra tetap dibutuhkan untuk chip).
	const tabAgen = url.searchParams.get('tab') === 'agen';
	const [semua, agen] = await Promise.all([
		getMitra(fetch),
		tabAgen ? getDirektoriAgen(fetch) : Promise.resolve([])
	]);
	const chips = kategoriChips(semua);
	const q = url.searchParams.get('kategori');
	// Null/undefined = "Semua"; hanya nilai yang BENAR-BENAR ada di data yang
	// dipakai (nilai tak dikenal diabaikan → daftar penuh, bukan 404).
	const kategori = q !== null && chips.some((c) => c.nilai === q) ? q : undefined;
	return {
		mitra: kategori ? semua.filter((m) => m.kategori === kategori) : semua,
		kategori: tabAgen ? undefined : kategori,
		chips,
		tabAgen,
		agen
	};
};
