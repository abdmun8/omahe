import { describe, expect, test } from 'bun:test';
import { amortisasi, hargaDariQuery, hitungKpr } from './kpr';

describe('hitungKpr', () => {
	test('anuitas cocok dengan rumus PMT standar', () => {
		// P=400jt, i=8,4%/th, n=180 bulan → PMT ≈ 3.918.000/bulan.
		const hasil = hitungKpr({
			harga: 500_000_000,
			dpPersen: 20,
			tenorTahun: 15,
			bungaPersen: 8.4,
			metode: 'anuitas'
		});
		expect(hasil.uangMuka).toBe(100_000_000);
		expect(hasil.pokokPinjaman).toBe(400_000_000);
		expect(hasil.tenorBulan).toBe(180);
		expect(hasil.cicilanBulanan).toBeGreaterThan(3_900_000);
		expect(hasil.cicilanBulanan).toBeLessThan(3_940_000);
	});

	test('flat lebih mahal dari anuitas pada persen yang sama', () => {
		const dasar = { harga: 500_000_000, dpPersen: 20, tenorTahun: 15, bungaPersen: 8.4 } as const;
		const flat = hitungKpr({ ...dasar, metode: 'flat' });
		const anuitas = hitungKpr({ ...dasar, metode: 'anuitas' });
		expect(flat.totalBunga).toBeGreaterThan(anuitas.totalBunga);
	});

	test('bunga 0% membagi pokok rata tanpa Infinity', () => {
		const hasil = hitungKpr({
			harga: 120_000_000,
			dpPersen: 0,
			tenorTahun: 10,
			bungaPersen: 0,
			metode: 'anuitas'
		});
		expect(hasil.cicilanBulanan).toBe(1_000_000);
		expect(hasil.totalBunga).toBe(0);
	});

	test('DP 100% tidak menyisakan pinjaman', () => {
		const hasil = hitungKpr({
			harga: 500_000_000,
			dpPersen: 100,
			tenorTahun: 15,
			bungaPersen: 8.4,
			metode: 'anuitas'
		});
		expect(hasil.pokokPinjaman).toBe(0);
		expect(hasil.cicilanBulanan).toBe(0);
		expect(hasil.totalBunga).toBe(0);
	});

	test('input di luar batas dijepit, bukan bikin NaN', () => {
		const hasil = hitungKpr({
			harga: -5,
			dpPersen: 500,
			tenorTahun: 0,
			bungaPersen: -3,
			metode: 'anuitas'
		});
		expect(Number.isFinite(hasil.cicilanBulanan)).toBe(true);
		expect(hasil.tenorBulan).toBe(1);
		expect(hasil.uangMuka).toBe(0);
	});
});

describe('hargaDariQuery (AGEN-OMAHE-08 — prefill ?harga= dari link share agen)', () => {
	test('angka bulat positif wajar diterima apa adanya', () => {
		expect(hargaDariQuery('500000000')).toBe(500_000_000);
		expect(hargaDariQuery(' 350000000 ')).toBe(350_000_000);
		expect(hargaDariQuery('1')).toBe(1);
		expect(hargaDariQuery(String(100_000_000_000))).toBe(100_000_000_000);
	});

	test('null / kosong / teks → null (kalkulator tetap default)', () => {
		expect(hargaDariQuery(null)).toBeNull();
		expect(hargaDariQuery('')).toBeNull();
		expect(hargaDariQuery('   ')).toBeNull();
		expect(hargaDariQuery('lima ratus juta')).toBeNull();
		expect(hargaDariQuery('500jt')).toBeNull();
	});

	test('angka tidak wajar ditolak, bukan dijepit', () => {
		expect(hargaDariQuery('0')).toBeNull();
		expect(hargaDariQuery('-500000000')).toBeNull();
		expect(hargaDariQuery('500000000.5')).toBeNull();
		expect(hargaDariQuery('1.5e11')).toBeNull(); // notasi ilmiah valid Number tapi > batas
		expect(hargaDariQuery('100000000001')).toBeNull(); // > 100 miliar
		expect(hargaDariQuery('Infinity')).toBeNull();
		expect(hargaDariQuery('NaN')).toBeNull();
	});
});

describe('amortisasi', () => {
	test('anuitas melunasi pokok tepat di akhir tenor', () => {
		const input = {
			harga: 300_000_000,
			dpPersen: 10,
			tenorTahun: 5,
			bungaPersen: 9,
			metode: 'anuitas'
		} as const;
		const baris = amortisasi(input);
		expect(baris).toHaveLength(60);
		// Toleransi pembulatan ke rupiah terdekat di 60 baris.
		expect(baris.at(-1)!.sisaPokok).toBeLessThan(100);
	});

	test('porsi bunga anuitas menurun tiap bulan', () => {
		const baris = amortisasi({
			harga: 300_000_000,
			dpPersen: 10,
			tenorTahun: 5,
			bungaPersen: 9,
			metode: 'anuitas'
		});
		expect(baris[0].bunga).toBeGreaterThan(baris[11].bunga);
	});

	test('flat menjaga bunga tetap sama tiap bulan', () => {
		const baris = amortisasi({
			harga: 300_000_000,
			dpPersen: 10,
			tenorTahun: 5,
			bungaPersen: 9,
			metode: 'flat'
		});
		expect(baris[0].bunga).toBe(baris[11].bunga);
	});
});
