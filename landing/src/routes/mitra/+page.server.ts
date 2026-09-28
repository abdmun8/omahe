import { getDirektoriAgen, getKategoriMitra, getMitra } from '$lib/api';
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
 *
 * MITRA-04 — chip kini dari MASTER (`GET /public/mitra/kategori`, diambil
 * paralel): kategori aktif tanpa mitra tetap jadi tab (empty-state + CTA
 * gabung). Endpoint gagal → `null` → fallback chip turunan data (lama).
 * `?kategori=` valid bila ada di chip — kategori master tanpa mitra pun
 * sah dipilih.
 */
export const load: PageServerLoad = async ({ fetch, url }) => {
	// AGEN-OMAHE-04 — tab "Agen Omahe" (`?tab=agen`): direktori agen, chip
	// kategori tetap tampil (satu fetch mitra tetap dibutuhkan untuk chip).
	const tabAgen = url.searchParams.get('tab') === 'agen';
	const [semua, master, agen] = await Promise.all([
		getMitra(fetch),
		getKategoriMitra(fetch),
		tabAgen ? getDirektoriAgen(fetch) : Promise.resolve([])
	]);
	const chips = kategoriChips(semua, master);
	const q = url.searchParams.get('kategori');
	// Null/undefined = "Semua"; hanya nilai yang BENAR-BENAR ada di chip yang
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
