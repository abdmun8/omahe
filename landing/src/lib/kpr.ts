/**
 * Kalkulator simulasi cicilan KPR — MURNI CLIENT-SIDE, tanpa backend dan
 * tanpa integrasi API bank (keputusan 2026-09-13: integrasi real-time butuh
 * kemitraan resmi yang belum ada; lihat `docs/user-story.md` §Simulasi KPR).
 *
 * Angka yang keluar dari sini adalah ESTIMASI, bukan penawaran. Setiap
 * tampilan hasil wajib menyertakan disclaimer itu.
 */

export type MetodeBunga = 'anuitas' | 'flat';

export interface InputKpr {
	/** Harga properti, rupiah. */
	harga: number;
	/** Uang muka dalam PERSEN harga (bukan rupiah) — pola input rumah123. */
	dpPersen: number;
	/** Tenor dalam tahun. */
	tenorTahun: number;
	/** Suku bunga per tahun, persen. */
	bungaPersen: number;
	metode: MetodeBunga;
}

export interface HasilKpr {
	uangMuka: number;
	pokokPinjaman: number;
	tenorBulan: number;
	/** Anuitas: tetap tiap bulan. Flat: juga tetap (pokok + bunga konstan). */
	cicilanBulanan: number;
	totalBunga: number;
	totalPembayaran: number;
	/**
	 * Penghasilan minimal yang biasa disyaratkan bank: cicilan maksimal
	 * sepertiga penghasilan bulanan. Aturan praktis industri, bukan janji
	 * approval — bank tetap punya kriteria sendiri.
	 */
	penghasilanMinimal: number;
}

export interface BarisAmortisasi {
	bulan: number;
	pokok: number;
	bunga: number;
	sisaPokok: number;
}

export const DEFAULT_INPUT: InputKpr = {
	harga: 500_000_000,
	dpPersen: 20,
	tenorTahun: 15,
	bungaPersen: 8.5,
	metode: 'anuitas'
};

export function hitungKpr(input: InputKpr): HasilKpr {
	const harga = Math.max(0, input.harga);
	const dpPersen = clamp(input.dpPersen, 0, 100);
	const tenorBulan = Math.max(1, Math.round(input.tenorTahun * 12));
	const bungaBulanan = Math.max(0, input.bungaPersen) / 100 / 12;

	const uangMuka = Math.round((harga * dpPersen) / 100);
	const pokokPinjaman = harga - uangMuka;

	let cicilanBulanan: number;
	if (pokokPinjaman <= 0) {
		cicilanBulanan = 0;
	} else if (input.metode === 'flat') {
		// Bunga flat dihitung dari pokok AWAL sepanjang tenor — itu sebabnya
		// bunga flat selalu lebih mahal dari anuitas pada persen yang sama.
		cicilanBulanan = pokokPinjaman / tenorBulan + pokokPinjaman * bungaBulanan;
	} else if (bungaBulanan === 0) {
		cicilanBulanan = pokokPinjaman / tenorBulan;
	} else {
		const faktor = Math.pow(1 + bungaBulanan, tenorBulan);
		cicilanBulanan = (pokokPinjaman * bungaBulanan * faktor) / (faktor - 1);
	}

	const totalPembayaran = cicilanBulanan * tenorBulan;

	return {
		uangMuka,
		pokokPinjaman,
		tenorBulan,
		cicilanBulanan: Math.round(cicilanBulanan),
		totalBunga: Math.round(totalPembayaran - pokokPinjaman),
		totalPembayaran: Math.round(totalPembayaran),
		penghasilanMinimal: Math.round(cicilanBulanan * 3)
	};
}

/** Rincian pokok vs bunga per bulan — dipakai tabel "lihat rincian". */
export function amortisasi(input: InputKpr, maksBaris = 360): BarisAmortisasi[] {
	const hasil = hitungKpr(input);
	const bungaBulanan = Math.max(0, input.bungaPersen) / 100 / 12;
	const baris: BarisAmortisasi[] = [];

	let sisa = hasil.pokokPinjaman;
	const pokokFlat = hasil.pokokPinjaman / hasil.tenorBulan;
	const bungaFlat = hasil.pokokPinjaman * bungaBulanan;

	for (let bulan = 1; bulan <= Math.min(hasil.tenorBulan, maksBaris); bulan++) {
		const bunga = input.metode === 'flat' ? bungaFlat : sisa * bungaBulanan;
		const pokok = input.metode === 'flat' ? pokokFlat : hasil.cicilanBulanan - bunga;
		sisa = Math.max(0, sisa - pokok);
		baris.push({
			bulan,
			pokok: Math.round(pokok),
			bunga: Math.round(bunga),
			sisaPokok: Math.round(sisa)
		});
	}
	return baris;
}

function clamp(nilai: number, min: number, maks: number) {
	return Math.min(maks, Math.max(min, nilai));
}

// AGEN-OMAHE-08 — prefill harga dari link share agen --------------------------

/** Batas wajar harga rumah untuk prefill (100 miliar) — nilai lebih besar
 * dianggap rusak/salah ketik dan dibuang, bukan dijepit. */
export const HARGA_PREFILL_MAKS = 100_000_000_000;

/**
 * Parse nilai `?harga=` mentah dari query string (AGEN-OMAHE-08: link
 * simulasi agen `${situs}/kpr?harga=…&ref=…`). Hanya angka bulat > 0 dan
 * ≤ 100 miliar yang diterima; selain itu (kosong, desimal, negatif, nol,
 * teks, di luar batas) → null → kalkulator tetap pakai default. Halaman
 * `/kpr` di-prerender tanpa query string — fungsi ini hanya dipanggil di
 * klien (onMount), bukan saat build.
 */
export function hargaDariQuery(raw: string | null): number | null {
	if (raw === null || raw.trim() === '') return null;
	const n = Number(raw);
	if (!Number.isInteger(n) || n <= 0 || n > HARGA_PREFILL_MAKS) return null;
	return n;
}
