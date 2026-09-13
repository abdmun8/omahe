import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Harga properti selalu tampil ringkas — "Rp385 jt" / "Rp1,45 M", bukan
 * "Rp385.000.000". Angka penuh tetap disediakan lewat `formatRupiahPenuh()`
 * untuk `title`/detail, supaya pembulatan tidak pernah jadi satu-satunya
 * angka yang pengunjung lihat.
 */
export function formatRupiah(nilai: number | null | undefined): string {
	if (nilai === null || nilai === undefined) return 'Harga belum tersedia';
	if (nilai >= 1_000_000_000) {
		const miliar = nilai / 1_000_000_000;
		return `Rp${miliar
			.toFixed(miliar >= 10 ? 1 : 2)
			.replace('.', ',')
			.replace(/,?0+$/, '')} M`;
	}
	if (nilai >= 1_000_000) return `Rp${Math.round(nilai / 1_000_000)} jt`;
	return formatRupiahPenuh(nilai);
}

const rupiahPenuh = new Intl.NumberFormat('id-ID', {
	style: 'currency',
	currency: 'IDR',
	maximumFractionDigits: 0
});

export function formatRupiahPenuh(nilai: number | null | undefined): string {
	if (nilai === null || nilai === undefined) return 'Harga belum tersedia';
	return rupiahPenuh.format(nilai);
}

/** "Rp385 jt" kalau satu harga, "Rp385 – 520 jt" kalau rentang. */
export function formatRentangHarga(min: number | null, max: number | null): string {
	if (min === null && max === null) return 'Harga belum tersedia';
	if (min === null || max === null || min === max) return formatRupiah(min ?? max);
	return `${formatRupiah(min)} – ${formatRupiah(max)}`;
}

export function formatAngka(nilai: number): string {
	return new Intl.NumberFormat('id-ID').format(nilai);
}

/**
 * Nomor telepon → format wa.me (62xxx, tanpa tanda baca) — aturan
 * normalisasi sama dengan `whatsapp.service.ts#normalizePhone` di backend
 * `perumahan`, supaya nomor yang sama tidak jadi dua bentuk berbeda.
 */
export function normalisasiNomor(nomor: string): string {
	const digit = nomor.replace(/\D/g, '');
	if (digit.startsWith('62')) return digit;
	if (digit.startsWith('0')) return `62${digit.slice(1)}`;
	if (digit.startsWith('8')) return `62${digit}`;
	return digit;
}

export function waUrl(nomor: string, pesan?: string): string {
	const teks = pesan ? `?text=${encodeURIComponent(pesan)}` : '';
	return `https://wa.me/${normalisasiNomor(nomor)}${teks}`;
}

export function telUrl(nomor: string): string {
	return `tel:+${normalisasiNomor(nomor)}`;
}
