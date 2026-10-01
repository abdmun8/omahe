import { getDirektoriAgen, getKategoriMitra, getMitra } from '$lib/api';
import { kategoriChips, urutkanMitraPerKategori } from '$lib/mitra';
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
	const q = url.searchParams.get('kategori');
	// Tab "Semua" (tanpa kategori & bukan tab agen) juga memuat agen:
	// keputusan user 2026-10-01 — Agen Omahe tampil PERTAMA, lalu mitra
	// mengikuti urutan kategori master.
	const butuhAgen = tabAgen || q === null;
	const [semua, master, agenSemua] = await Promise.all([
		getMitra(fetch),
		getKategoriMitra(fetch),
		butuhAgen ? getDirektoriAgen(fetch) : Promise.resolve([])
	]);
	const chips = kategoriChips(semua, master);
	// Null/undefined = "Semua"; hanya nilai yang BENAR-BENAR ada di chip yang
	// dipakai (nilai tak dikenal diabaikan → daftar penuh, bukan 404).
	const kategori = q !== null && chips.some((c) => c.nilai === q) ? q : undefined;
	// `?kategori=` tak dikenal = tampilan "Semua" juga (sertakan agen bila
	// sudah dimuat).
	const agen = tabAgen || !kategori ? agenSemua : [];
	return {
		mitra: kategori
			? semua.filter((m) => m.kategori === kategori)
			: urutkanMitraPerKategori(semua, chips),
		kategori: tabAgen ? undefined : kategori,
		chips,
		tabAgen,
		agen
	};
};
