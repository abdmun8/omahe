/**
 * Tes `acak-harian.ts` — cuplikan acak harian per pengunjung untuk tab
 * "Semua" `/mitra` (2026-11-14): stabil sepanjang hari, berganti esok
 * hari, beda antar pengunjung, promo tetap didahulukan.
 */
import { describe, expect, test } from 'bun:test';
import { benihBagian, benihHarian, cuplikanAcak, kocok, tanggalWib } from './acak-harian';

const ANGKA = Array.from({ length: 20 }, (_, i) => i);

describe('acak-harian', () => {
	test('tanggal mengikuti WIB (UTC+7)', () => {
		expect(tanggalWib(new Date('2026-11-13T16:59:00Z'))).toBe('2026-11-13');
		expect(tanggalWib(new Date('2026-11-13T17:00:00Z'))).toBe('2026-11-14');
	});

	test('pengunjung sama, hari sama → urutan sama (reload tidak mengocok ulang)', () => {
		const pagi = benihHarian('abc12345', new Date('2026-11-14T01:00:00Z'));
		const malam = benihHarian('abc12345', new Date('2026-11-14T15:00:00Z'));
		expect(kocok(ANGKA, pagi)).toEqual(kocok(ANGKA, malam));
	});

	test('esok hari / pengunjung lain → urutan berbeda', () => {
		const hari1 = benihHarian('abc12345', new Date('2026-11-14T01:00:00Z'));
		const hari2 = benihHarian('abc12345', new Date('2026-11-15T01:00:00Z'));
		const lain = benihHarian('zzz98765', new Date('2026-11-14T01:00:00Z'));
		expect(kocok(ANGKA, hari1)).not.toEqual(kocok(ANGKA, hari2));
		expect(kocok(ANGKA, hari1)).not.toEqual(kocok(ANGKA, lain));
	});

	test('kocok = permutasi, input tidak diubah', () => {
		const salin = [...ANGKA];
		const hasil = kocok(ANGKA, 42);
		expect(ANGKA).toEqual(salin);
		expect([...hasil].sort((a, b) => a - b)).toEqual(ANGKA);
	});

	test('cuplikan maks n; item utama (promo) didahulukan', () => {
		const promo = (x: number) => x === 7 || x === 13;
		const hasil = cuplikanAcak(ANGKA, 4, 99, promo);
		expect(hasil).toHaveLength(4);
		expect(new Set(hasil.slice(0, 2))).toEqual(new Set([7, 13]));
		expect(cuplikanAcak([1, 2], 4, 99)).toHaveLength(2);
	});

	test('benih per bagian berbeda antar kategori', () => {
		expect(benihBagian(123, 'kjpp')).not.toBe(benihBagian(123, 'notaris'));
	});
});
