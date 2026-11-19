/**
 * Tes `artikel-fitur.ts` — pemilih "Fitur Omahe terkait" di halaman artikel
 * (aturan 2026-11-19). Fungsi yang diuji PURE — tanpa mock/env/network.
 * Kasus: keyword tiap grup, maks 3 kartu, deduplikasi tautan badan, default.
 */
import { describe, expect, test } from 'bun:test';
import { fiturTerkaitArtikel } from './artikel-fitur';

const artikel = (judul: string, markdown = '', deskripsi = 'Deskripsi artikel.') => ({
	judul,
	deskripsi,
	markdown
});

describe('fiturTerkaitArtikel', () => {
	test('default (tidak ada keyword yang cocok) → cari + promo + kpr', () => {
		const hasil = fiturTerkaitArtikel(artikel('Artikel Tanpa Keyword Khusus'));
		expect(hasil.map((f) => f.href)).toEqual(['/cari', '/kpr', '/promo']);
	});

	test('keyword lelang → lelang dulu', () => {
		const hasil = fiturTerkaitArtikel(artikel('Rumah Lelang Bank: Peluang atau Jebakan?'));
		expect(hasil[0]?.href).toBe('/lelang');
	});

	test('keyword sertifikat/notaris → mitra notaris dulu', () => {
		const hasil = fiturTerkaitArtikel(artikel('SHM vs SHGB: Bedanya Sebelum Tanda Tangan'));
		expect(hasil[0]?.href).toBe('/mitra?kategori=notaris');
	});

	test('keyword appraisal/kjpp → penilai publik dulu', () => {
		const hasil = fiturTerkaitArtikel(artikel('Appraisal Bank: Cara Harga Rumah Anda Dinilai'));
		expect(hasil[0]?.href).toBe('/mitra?kategori=kjpp');
	});

	test('keyword KPR/bunga/cicilan → kalkulator KPR + promo', () => {
		const hasil = fiturTerkaitArtikel(artikel('BI-Rate Naik: Apa Artinya bagi Cicilan Anda'));
		expect(hasil.map((f) => f.href)).toContain('/kpr');
		expect(hasil.map((f) => f.href)).toContain('/promo');
	});

	test('keyword investasi/sewa → gabung jadi agen', () => {
		const hasil = fiturTerkaitArtikel(artikel('Cash Flow Positif dari Rumah Kontrakan'));
		expect(hasil[0]?.href).toBe('/gabung/agen');
	});

	test('keyword renovasi/konstruksi → mitra kontraktor', () => {
		const hasil = fiturTerkaitArtikel(artikel('Renovasi yang Benar-Benar Naikkan Nilai Rumah'));
		expect(hasil[0]?.href).toBe('/mitra?kategori=kontraktor');
	});

	test('keyword developer/site plan → direktori developer', () => {
		const hasil = fiturTerkaitArtikel(artikel('Membaca Site Plan: 7 Hal di Master Plan'));
		expect(hasil[0]?.href).toBe('/developer');
	});

	test('maksimal 3 kartu walau banyak grup cocok', () => {
		// menyentuh lelang + sertifikat + appraisal + kpr + investasi sekaligus.
		const teks = artikel(
			'Lelang, Sertifikat, dan Appraisal',
			'KPR bunga cicilan DP investasi sewa kontrakan renovasi developer site plan.'
		);
		const hasil = fiturTerkaitArtikel(teks);
		expect(hasil.length).toBe(3);
	});

	test('hasil deterministik untuk artikel yang sama', () => {
		const a = artikel('Wariskan Rumah Tanpa Ribut', 'AJB BPHTB ahli waris.');
		expect(fiturTerkaitArtikel(a)).toEqual(fiturTerkaitArtikel(a));
	});

	test('tautan fitur yang sudah ada di badan artikel dilewati', () => {
		const a = artikel('Rumah Lelang Bank', 'Bandingkan dengan [hasil pencarian](/cari) dulu.');
		const hasil = fiturTerkaitArtikel(a);
		expect(hasil.map((f) => f.href)).not.toContain('/cari');
	});

	test('grup berbeda menyumbang kandidat berbeda (broker + sertifikat)', () => {
		const hasil = fiturTerkaitArtikel(artikel('Broker Properti Wajib Sertifikat'));
		const href = hasil.map((f) => f.href);
		expect(href).toContain('/mitra?kategori=notaris');
		expect(href).toContain('/mitra?tab=agen');
	});
});
