/**
 * LELANG-01 — format & teks tetap rumah lelang (dipakai kartu & detail).
 */

/** "Selasa, 10 November 2026 · 10.00 WIB". */
export function formatJadwalLelang(iso: string): string {
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
export function formatTanggalRingkas(iso: string): string {
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
