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
import type { KategoriMitraMaster, PublicMitra } from '$lib/api/types';

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

/** Label kategori satu mitra: label master dari API (MITRA-03), fallback
 *  humanize untuk respons lama/fixture. */
export function labelKategoriDari(m: Pick<PublicMitra, 'kategori' | 'kategoriLabel'>): string {
	return m.kategoriLabel?.trim() || labelKategoriMitra(m.kategori);
}

/**
 * Daftar chip kategori: "Semua" dulu, lalu kategori unik urut
 * `kategoriUrutan` master (MITRA-03, diatur superadmin). Tanpa urutan
 * (respons lama) → urutan kemunculan pertama (list server sudah urut
 * `urutan ASC → nama ASC`, api-contract.md §9); sort stabil menjaga itu.
 *
 * MITRA-04 — bila `master` tersedia (endpoint `GET /public/mitra/kategori`),
 * chip SELURUHNYA dari master (urut master): kategori tanpa mitra tetap
 * tampil sebagai tab; kategori milik mitra yang TIDAK ada di master
 * (mis. nonaktif) TIDAK dijadikan chip. `master` null/undefined →
 * perilaku lama (turunan data) — fallback saat endpoint gagal.
 */
export function kategoriChips(
	dari: PublicMitra[],
	master?: KategoriMitraMaster[] | null
): KategoriChip[] {
	if (master) {
		return [
			{ nilai: null, label: 'Semua' },
			...master.map((k) => ({
				nilai: k.slug,
				// Label master diutamakan; kosong (aneh) → humanize slug.
				label: k.label.trim() || labelKategoriMitra(k.slug)
			}))
		];
	}
	const unik: PublicMitra[] = [];
	for (const m of dari) {
		if (!unik.some((u) => u.kategori === m.kategori)) unik.push(m);
	}
	const urut = [...unik].sort(
		(a, b) => (a.kategoriUrutan ?? Infinity) - (b.kategoriUrutan ?? Infinity)
	);
	return [
		{ nilai: null, label: 'Semua' },
		...urut.map((m) => ({ nilai: m.kategori, label: labelKategoriDari(m) }))
	];
}
