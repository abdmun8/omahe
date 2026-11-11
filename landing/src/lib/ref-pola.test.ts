import { describe, expect, it } from 'bun:test';
import {
	adalahRefAgenPilihan,
	bersihkanNamaMitra,
	normalisasiRefAgenPribadi,
	REF_AGEN_PILIHAN_PATTERN,
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

// AGEN-OMAHE-13 — kode `?ref=` PILIHAN agen atas satu perumahan (`AO-…`,
// backend `buatKodeRef`/`adalahKodeRefAgen`). Dipakai server load detail
// perumahan untuk memutuskan memanggil `getAgenPemasar` atau tidak.
describe('REF_AGEN_PILIHAN_PATTERN + adalahRefAgenPilihan', () => {
	it('kode pilihan sah lolos (fixture AO-K2269F4X/AO-M7RQ3HZA, rentang 4–17)', () => {
		expect(REF_AGEN_PILIHAN_PATTERN.test('AO-K2269F4X')).toBe(true);
		expect(REF_AGEN_PILIHAN_PATTERN.test('AO-M7RQ3HZA')).toBe(true);
		expect(REF_AGEN_PILIHAN_PATTERN.test('AO-7KQ2')).toBe(true); // batas bawah
		expect(REF_AGEN_PILIHAN_PATTERN.test('AO-' + 'A2'.repeat(8) + 'A')).toBe(true); // 17 char
	});

	it('bentuk salah ditolak (pendek/panjang, prefiks lain, pemisah)', () => {
		expect(REF_AGEN_PILIHAN_PATTERN.test('AO-K22')).toBe(false); // di bawah 4
		expect(REF_AGEN_PILIHAN_PATTERN.test('AO-' + 'A2'.repeat(9))).toBe(false); // 18 char
		expect(REF_AGEN_PILIHAN_PATTERN.test('OP-QA7MPN')).toBe(false); // kerjasama perusahaan
		expect(REF_AGEN_PILIHAN_PATTERN.test('OMHA-A0001')).toBe(false); // agen pribadi
		expect(REF_AGEN_PILIHAN_PATTERN.test('AO-K226 9F4X')).toBe(false); // spasi di tengah
		expect(REF_AGEN_PILIHAN_PATTERN.test('K2269F4X')).toBe(false); // tanpa prefiks
	});

	it('adalahRefAgenPilihan — trim + uppercase sebelum uji (backend sama)', () => {
		expect(adalahRefAgenPilihan('  ao-k2269f4x ')).toBe(true);
		expect(adalahRefAgenPilihan('AO-K2269F4X')).toBe(true);
	});

	it('adalahRefAgenPilihan — non-string/salah → false (ref lain tetap passthrough)', () => {
		expect(adalahRefAgenPilihan(null)).toBe(false);
		expect(adalahRefAgenPilihan(undefined)).toBe(false);
		expect(adalahRefAgenPilihan('')).toBe(false);
		expect(
			adalahRefAgenPilihan('a1b2c3d4e5f60718a9b0c1d2e3f40516a7b8c9d0e1f20314a5b6c7d8e9f0a1b2')
		).toBe(false);
		expect(adalahRefAgenPilihan('OMHA-A0001')).toBe(false);
	});
});
