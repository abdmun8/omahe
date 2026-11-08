import { describe, expect, it } from 'bun:test';
import { bersihkanNamaMitra } from './ref-pola';

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
