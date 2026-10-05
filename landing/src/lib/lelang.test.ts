import { describe, expect, test } from 'bun:test';
import { formatJadwalLelang, formatTanggalRingkas, hargaOriginalTampil } from './lelang';

describe('format jadwal lelang (WIB)', () => {
	test('jadwal lengkap memakai zona WIB', () => {
		const teks = formatJadwalLelang('2026-11-10T03:00:00Z');
		expect(teks).toContain('10 November 2026');
		expect(teks).toContain('10.00 WIB');
	});
	test('tanggal ringkas & input tidak sah', () => {
		expect(formatTanggalRingkas('2026-11-10T03:00:00Z')).toContain('2026');
		expect(formatJadwalLelang('salah')).toBe('');
		// LELANG-02 — tanpa tanggal = "Segera".
		expect(formatJadwalLelang(null)).toBe('Segera');
		expect(formatTanggalRingkas(null)).toBe('Segera');
	});
});

describe('harga original dicoret', () => {
	test('tampil hanya bila diisi dan > nilai limit', () => {
		const dasar = { nilaiLimit: 450_000_000 };
		expect(hargaOriginalTampil({ ...dasar, hargaOriginal: 500_000_000 })).toBe(500_000_000);
		expect(hargaOriginalTampil({ ...dasar, hargaOriginal: 450_000_000 })).toBeNull();
		expect(hargaOriginalTampil({ ...dasar, hargaOriginal: 400_000_000 })).toBeNull();
		expect(hargaOriginalTampil({ ...dasar, hargaOriginal: null })).toBeNull();
		expect(hargaOriginalTampil({ ...dasar })).toBeNull();
	});
});
