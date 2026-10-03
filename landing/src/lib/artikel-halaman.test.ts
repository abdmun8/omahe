import { describe, expect, test } from 'bun:test';
import {
	ARTIKEL_PER_HALAMAN,
	jumlahHalaman,
	potongHalaman,
	urlHalamanArtikel
} from './artikel-halaman';

describe('paginasi artikel', () => {
	const daftar = Array.from({ length: 32 }, (_, i) => i + 1);

	test('12 per halaman → 32 artikel = 3 halaman, sisa di halaman terakhir', () => {
		expect(ARTIKEL_PER_HALAMAN).toBe(12);
		expect(jumlahHalaman(32)).toBe(3);
		expect(jumlahHalaman(0)).toBe(1);
		expect(potongHalaman(daftar, 1)).toEqual(daftar.slice(0, 12));
		expect(potongHalaman(daftar, 3)).toEqual([25, 26, 27, 28, 29, 30, 31, 32]);
	});

	test('halaman di luar rentang / tidak sah → kosong', () => {
		expect(potongHalaman(daftar, 4)).toEqual([]);
		expect(potongHalaman(daftar, 0)).toEqual([]);
		expect(potongHalaman(daftar, 1.5)).toEqual([]);
	});

	test('URL: halaman 1 = /artikel, berikutnya /artikel/halaman/n', () => {
		expect(urlHalamanArtikel(1)).toBe('/artikel');
		expect(urlHalamanArtikel(2)).toBe('/artikel/halaman/2');
	});
});
