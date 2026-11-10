/**
 * KOMISI-AGEN-01 — teks estimasi komisi agen untuk dialog "Daftarkan
 * Pembeli" (murni, teruji). Selalu berlabel estimasi: komisi baru cair
 * setelah akad, dan bagian penjual sudah dikurangi bagian sponsor.
 */
import type { EstimasiKomisiAgen } from '$lib/api/types';
import { formatRupiahPenuh } from '$lib/utils';

const persenId = (p: number) => `${p.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;

export interface TeksEstimasiKomisi {
	/** Baris utama (angka / status). */
	utama: string;
	/** Keterangan kecil di bawahnya. */
	catatan: string;
}

export function teksEstimasiKomisi(e: EstimasiKomisiAgen | null | undefined): TeksEstimasiKomisi | null {
	if (!e) return null;
	switch (e.status) {
		case 'estimasi':
			return {
				utama: `± ${formatRupiahPenuh(e.nominal)} (${persenId(e.persen)})`,
				catatan:
					e.dasar === 'perumahan'
						? 'Estimasi dari harga mulai perumahan — dihitung dari harga jual final dan cair setelah akad.'
						: 'Estimasi dari harga tipe — dihitung dari harga jual final dan cair setelah akad.'
			};
		case 'flat':
			return {
				utama: formatRupiahPenuh(e.nominal),
				catatan: 'Komisi tetap dari perumahan — cair setelah akad.'
			};
		case 'tanpa_harga':
			return {
				utama: `${persenId(e.persen)} dari harga jual`,
				catatan: 'Harga belum tersedia — komisi dihitung dari harga jual final setelah akad.'
			};
		case 'menunggu_perjanjian':
			return {
				utama: 'Komisi menunggu perjanjian perumahan',
				catatan: 'Lead tetap tercatat atas nama Anda.'
			};
	}
}
