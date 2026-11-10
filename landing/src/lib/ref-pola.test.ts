import { describe, expect, it } from 'bun:test';
import {
	bersihkanNamaMitra,
	normalisasiRefAgenPribadi,
	REF_AGEN_PRIBADI_PATTERN
} from './ref-pola';

// Review KERJASAMA-03 tahap 5 — `?mitra=` bisa dibuat siapa pun; teks yang
// tampil di homepage dibatasi ke bentuk nama perusahaan.
describe('bersihkanNamaMitra', () => {
	it('nama perusahaan wajar lolos (tanda baca nama, &)', () => {
		expect(bersihkanNamaMitra('PT Maju Jaya (Persero)')).toBe('PT Maju Jaya (Persero)');
		expect(bersihkanNamaMitra('CV. Sinar & Putra')).toBe('CV. Sinar & Putra');
		expect(bersihkanNamaMitra('  PT   Hadir  ')).toBe('PT Hadir');
	});

	it('tag & karakter aneh dibuang, maks 60 karakter', () => {
		expect(bersihkanNamaMitra('<b>PT X</b>')).toBe('PT X');
		expect(bersihkanNamaMitra('A'.repeat(100))?.length).toBe(60);
	});

	it('pola penipuan → null (nomor, link, ajakan transfer)', () => {
		expect(bersihkanNamaMitra('Transfer DP ke BCA 1234567890')).toBeNull();
		expect(bersihkanNamaMitra('Hubungi 08123456789')).toBeNull();
		expect(bersihkanNamaMitra('PT X www.contoh.com')).toBeNull();
		expect(bersihkanNamaMitra('Klik link bit.ly/abc')).toBeNull();
		expect(bersihkanNamaMitra('')).toBeNull();
		expect(bersihkanNamaMitra(null)).toBeNull();
	});
});

// REF-AGEN-01 — kode agen pribadi (`OMHA-…` baru berurutan / `OMH-…` lama)
// pada link `https://www.omahe.co.id/?ref=<kode>`; input URL bisa huruf
// kecil → normalisasi trim+uppercase WAJIB sebelum disimpan/terkirim.
describe('REF_AGEN_PRIBADI_PATTERN + normalisasiRefAgenPribadi', () => {
	it('kode baru OMHA-{huruf}{4 digit} lolos', () => {
		expect(REF_AGEN_PRIBADI_PATTERN.test('OMHA-A0001')).toBe(true);
		expect(REF_AGEN_PRIBADI_PATTERN.test('OMHA-Z9999')).toBe(true);
	});

	it('kode lama OMH-XXXXXX (6 alnum) lolos', () => {
		expect(REF_AGEN_PRIBADI_PATTERN.test('OMH-K7M2QX')).toBe(true);
	});

	it('bentuk salah ditolak (digit kurang/lebih, prefiks lain, AO- ber-token)', () => {
		expect(REF_AGEN_PRIBADI_PATTERN.test('OMHA-A000')).toBe(false); // 3 digit
		expect(REF_AGEN_PRIBADI_PATTERN.test('OMHA-A00001')).toBe(false); // 5 digit
		expect(REF_AGEN_PRIBADI_PATTERN.test('OMH-A2')).toBe(false); // terlalu pendek
		expect(REF_AGEN_PRIBADI_PATTERN.test('OMH-K7M2QXZ')).toBe(false); // 7 char
		expect(REF_AGEN_PRIBADI_PATTERN.test('AO-K7M2QX')).toBe(false); // pilihan ber-token
		expect(REF_AGEN_PRIBADI_PATTERN.test('OP-QA7MPN')).toBe(false); // mitra
		expect(REF_AGEN_PRIBADI_PATTERN.test('OMHA-A00 1')).toBe(false); // spasi
	});

	it('normalisasi trim + uppercase; kembalikan UPPERCASE', () => {
		expect(normalisasiRefAgenPribadi('  omha-a0001 ')).toBe('OMHA-A0001');
		expect(normalisasiRefAgenPribadi('omh-k7m2qx')).toBe('OMH-K7M2QX');
		expect(normalisasiRefAgenPribadi('OMHA-A0001')).toBe('OMHA-A0001');
	});

	it('nilai aneh → null (tidak pernah dipercaya)', () => {
		expect(normalisasiRefAgenPribadi('')).toBeNull();
		expect(normalisasiRefAgenPribadi(null)).toBeNull();
		expect(normalisasiRefAgenPribadi(undefined)).toBeNull();
		expect(normalisasiRefAgenPribadi('OMHA-A0001?x=1')).toBeNull();
		expect(normalisasiRefAgenPribadi('<script>')).toBeNull();
	});
});
