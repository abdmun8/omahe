import type { UnitListing } from '$lib/api/types';

/**
 * UNIT-07 (repo `perumahan`) — pilihan urutan pencarian `/cari`, sinkron
 * dengan `GET /public/units?sort=`. `rekomendasi` = default backend
 * (partner berbayar di atas, MONET-01) dan TIDAK dikirim di URL supaya
 * URL/cache pencarian lama tetap sama. Kartu tidak berubah (keputusan user
 * 2026-10-03) — hanya urutannya.
 */
export const PILIHAN_URUTAN = [
	{ nilai: 'rekomendasi', label: 'Rekomendasi' },
	{ nilai: 'harga_asc', label: 'Harga termurah' },
	{ nilai: 'harga_desc', label: 'Harga termahal' },
	{ nilai: 'terbaru', label: 'Terbaru' },
	{ nilai: 'unit_terbanyak', label: 'Unit terbanyak' }
] as const;

export type UrutanUnit = (typeof PILIHAN_URUTAN)[number]['nilai'];

/** Nilai `?sort=` → urutan sah; kosong/tidak dikenal = rekomendasi. */
export function parseUrutan(raw: string | null | undefined): UrutanUnit {
	const v = raw?.trim().toLowerCase() ?? '';
	return PILIHAN_URUTAN.some((p) => p.nilai === v) ? (v as UrutanUnit) : 'rekomendasi';
}

/** Harga null selalu di akhir, untuk arah naik maupun turun. */
function hargaNullTerakhir(a: number | null, b: number | null, arah: 1 | -1): number {
	if (a === null && b === null) return 0;
	if (a === null) return 1;
	if (b === null) return -1;
	return (a - b) * arah;
}

/**
 * Urutkan lokal untuk MODE FIXTURE (backend asli mengurutkan sendiri).
 * `rekomendasi` = perilaku fixture lama (harga termurah dulu); fixture tidak
 * punya tanggal dibuat, jadi `terbaru` mempertahankan urutan data.
 */
export function urutkanUnitFixture(items: UnitListing[], urutan: UrutanUnit): UnitListing[] {
	const salinan = [...items];
	switch (urutan) {
		case 'harga_desc':
			return salinan.sort((a, b) => hargaNullTerakhir(a.hargaMin, b.hargaMin, -1));
		case 'unit_terbanyak':
			return salinan.sort((a, b) => b.unitTersedia - a.unitTersedia);
		case 'terbaru':
			return salinan;
		case 'harga_asc':
		case 'rekomendasi':
		default:
			return salinan.sort((a, b) => hargaNullTerakhir(a.hargaMin, b.hargaMin, 1));
	}
}
