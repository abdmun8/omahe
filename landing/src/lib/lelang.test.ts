import { describe, expect, test } from 'bun:test';
import {
	angkaPositif,
	formatJadwalLelang,
	formatTanggalRingkas,
	hargaOriginalTampil,
	pesanWaMinatLelang,
	sisaQueryLelang
} from './lelang';

describe('pesanWaMinatLelang', () => {
	const dasar = { nama: ' Budi ', telepon: '6281200000000', judul: 'Rumah Cikampek' };

	test('memuat judul, kode lot, alamat, nilai limit, dan pesan', () => {
		const t = pesanWaMinatLelang({
			...dasar,
			kodeLot: 'LOT-7',
			lokasi: 'Jl. Melati 3, Cikampek, Kab. Karawang, Jawa Barat',
			nilaiLimit: 350_000_000,
			pesan: ' Bisa KPR? '
		});
		const baris = t.split('\n');
		expect(baris[0]).toBe('Halo, saya Budi (6281200000000).');
		expect(baris[1]).toBe(
			'Saya tertarik dengan rumah lelang "Rumah Cikampek" (kode lot LOT-7) yang saya lihat di Omahe.'
		);
		expect(baris[2]).toBe('Alamat: Jl. Melati 3, Cikampek, Kab. Karawang, Jawa Barat');
		expect(baris[3]).toMatch(/^Nilai limit: Rp\s?350\.000\.000$/);
		expect(baris.slice(4)).toEqual(['', 'Bisa KPR?']);
	});

	test('alamat/nilai limit/pesan kosong → baris dilewati', () => {
		const t = pesanWaMinatLelang({ ...dasar, lokasi: '  ', nilaiLimit: null, pesan: '' });
		expect(t.split('\n')).toHaveLength(2);
		expect(t).not.toContain('Alamat');
		expect(t).not.toContain('Nilai limit');
	});

	test('nilai limit 0 tetap ditampilkan', () => {
		expect(pesanWaMinatLelang({ ...dasar, nilaiLimit: 0 })).toContain('Nilai limit:');
	});
});

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

describe('LELANG-03 — URL lokasi', () => {
	test('sisaQueryLelang: buang lokasi/regionKode/page & nilai kosong, bank/limit/ref ikut', () => {
		expect(
			sisaQueryLelang(
				new URL('https://x/lelang?lokasi=kabupaten-bandung&bankId=b1&limitMax=&page=3&ref=AO-1')
			)
		).toBe('?bankId=b1&ref=AO-1');
		expect(sisaQueryLelang(new URL('https://x/lelang?regionKode=32.04'))).toBe('');
	});
	test('angkaPositif', () => {
		expect(angkaPositif('500000000')).toBe(500000000);
		expect(angkaPositif('')).toBeUndefined();
		expect(angkaPositif('-1')).toBeUndefined();
		expect(angkaPositif('abc')).toBeUndefined();
		// 2026-10-08 — pemisah ribuan di-strip (harga ketik sendiri).
		expect(angkaPositif('500.000.000')).toBe(500000000);
		expect(angkaPositif('Rp 650.000.000')).toBe(650000000);
		expect(angkaPositif(' 350 ')).toBe(350);
		expect(angkaPositif(null)).toBeUndefined();
	});
});
