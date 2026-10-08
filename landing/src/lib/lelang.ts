/**
 * LELANG-01 — format & teks tetap rumah lelang (dipakai kartu & detail).
 */

/** "Selasa, 10 November 2026 · 10.00 WIB". */
/** LELANG-02 — label untuk aset tanpa tanggal lelang. */
export const LABEL_SEGERA = 'Segera';

export function formatJadwalLelang(iso: string | null): string {
	if (!iso) return LABEL_SEGERA;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const tgl = d.toLocaleDateString('id-ID', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'Asia/Jakarta'
	});
	const jam = d.toLocaleTimeString('id-ID', {
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Asia/Jakarta'
	});
	return `${tgl} · ${jam} WIB`;
}

/** "10 Nov 2026" ringkas untuk kartu. */
export function formatTanggalRingkas(iso: string | null): string {
	if (!iso) return LABEL_SEGERA;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'Asia/Jakarta'
	});
}

export const LABEL_HUNIAN: Record<'kosong' | 'dihuni' | 'tidak_diketahui', string> = {
	kosong: 'Kosong',
	dihuni: 'Masih dihuni',
	tidak_diketahui: 'Tidak diketahui'
};

/** Pilihan filter nilai limit (rupiah) di /lelang. */
export const FILTER_LIMIT = [
	{ nilai: 300_000_000, label: '≤ Rp300 jt' },
	{ nilai: 500_000_000, label: '≤ Rp500 jt' },
	{ nilai: 1_000_000_000, label: '≤ Rp1 M' }
] as const;

/**
 * Harga original yang layak tampil dicoret — hanya bila diisi DAN lebih
 * besar dari nilai limit (harga coret yang ≤ limit menyesatkan; backend
 * juga memaksakan aturan yang sama).
 */
export function hargaOriginalTampil(rumah: {
	hargaOriginal?: number | null;
	nilaiLimit: number;
}): number | null {
	return rumah.hargaOriginal && rumah.hargaOriginal > rumah.nilaiLimit ? rumah.hargaOriginal : null;
}

/** Angka positif dari query string; kosong/aneh → undefined. */
/** Angka rupiah/pagination dari query — TIDAK valid diabaikan, bukan
 *  error (URL sering diedit manual). 2026-10-08: non-digit di-strip dulu
 *  ("500.000.000" → 500000000 — tanda titik pemisah ribuan yang lumrah
 *  diketik/ditempel pengunjung, sebelumnya Number() malah membaca 500). */
export function angkaPositif(raw: string | null): number | undefined {
	if (raw === null) return undefined;
	if (raw.trim().startsWith('-')) return undefined;
	const digit = raw.replace(/\D/g, '');
	if (digit === '') return undefined;
	const n = Number(digit);
	return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** LELANG-03 — query string /lelang tanpa param lokasi (bank, limit, ref
 *  ikut; halaman direset) untuk redirect ke `/lelang/lokasi/:slug`. */
export function sisaQueryLelang(url: URL): string {
	const sp = new URLSearchParams(url.searchParams);
	for (const k of ['lokasi', 'regionKode', 'page']) sp.delete(k);
	for (const [k, v] of [...sp]) if (v === '') sp.delete(k);
	const qs = sp.toString();
	return qs ? `?${qs}` : '';
}
