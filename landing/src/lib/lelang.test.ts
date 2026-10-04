import { describe, expect, test } from 'bun:test';
import { formatJadwalLelang, formatTanggalRingkas } from './lelang';

describe('format jadwal lelang (WIB)', () => {
	test('jadwal lengkap memakai zona WIB', () => {
		const teks = formatJadwalLelang('2026-11-10T03:00:00Z');
		expect(teks).toContain('10 November 2026');
		expect(teks).toContain('10.00 WIB');
	});
	test('tanggal ringkas & input tidak sah', () => {
		expect(formatTanggalRingkas('2026-11-10T03:00:00Z')).toContain('2026');
		expect(formatJadwalLelang('salah')).toBe('');
	});
});
