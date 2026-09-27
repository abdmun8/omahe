/**
 * Kategori Mitra Profesional (MITRA-01) — helper murni supaya kategori
 * TAMBAHAN di backend (asuransi, pemborong, arsitek, …) tampil otomatis
 * di Omahe TANPA redeploy: chip filter & badge kartu diderive dari data,
 * bukan hardcode (kebutuhan omahe#3 — "tab harus bisa dinamis").
 *
 * Backend v1 masih enum `kjpp` | `notaris` (MITRA-01); pelebarannya
 * dibahas di epic MITRA-02 repo `perumahan`. Klien ini sengaja tidak
 * berasumsi kategori tertentu — nilai tak dikenal dirender "manis"
 * (kapitalisasi kata), bukan dibuang.
 */
import type { PublicMitra } from '$lib/api/types';

/** Label tampil untuk kategori yang diketahui. */
export const KATEGORI_MITRA_LABEL: Record<string, string> = {
	kjpp: 'KJPP',
	notaris: 'Notaris',
	asuransi: 'Asuransi',
	pemborong: 'Pemborong',
	arsitek: 'Arsitek'
};

/**
 * Label kategori: kategori dikenal → label peta di atas; kategori baru →
 * kapitalisasi tiap kata (`asuransi-syariah` → `Asuransi Syariah`).
 */
export function labelKategoriMitra(kategori: string): string {
	const dikenal = KATEGORI_MITRA_LABEL[kategori];
	if (dikenal) return dikenal;
	return kategori
		.split(/[-_]+/)
		.filter(Boolean)
		.map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
		.join(' ');
}

/** Satu chip filter kategori — `nilai` null = "Semua". */
export interface KategoriChip {
	nilai: string | null;
	label: string;
}

/**
 * Daftar chip kategori dari data mitra: "Semua" dulu, lalu kategori unik
 * dalam URUTAN KEMUNCULAN PERTAMA — list dari server sudah urut
 * `urutan ASC → nama ASC` (api-contract.md §9), jadi kategori milik mitra
 * paling atas muncul duluan; jangan diurutkan abjad di sini.
 */
export function kategoriChips(dari: PublicMitra[]): KategoriChip[] {
	const urutan: string[] = [];
	for (const m of dari) {
		if (!urutan.includes(m.kategori)) urutan.push(m.kategori);
	}
	return [
		{ nilai: null, label: 'Semua' },
		...urutan.map((k) => ({ nilai: k, label: labelKategoriMitra(k) }))
	];
}
