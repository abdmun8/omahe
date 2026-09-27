/**
 * Tes helper kategori mitra (omahe#3 — chip & badge dinamis). Kategori
 * tambahan dari backend (MITRA-02, belum ada) HARUS tampil otomatis:
 * kategori tak dikenal dirender manis, tidak dibuang.
 */
import { describe, expect, test } from 'bun:test';
import type { PublicMitra } from '$lib/api/types';
import { KATEGORI_MITRA_LABEL, kategoriChips, labelKategoriMitra } from './mitra';

const mitra = (kategori: string, nama = 'Mitra Uji'): PublicMitra => ({
	id: nama,
	nama,
	kategori: kategori as PublicMitra['kategori'],
	wilayahLayanan: 'Jabodetabek',
	whatsapp: '6281100000000',
	telepon: null,
	logoUrl: null,
	urutan: 1
});

describe('labelKategoriMitra', () => {
	test('kategori dikenal memakai label peta (huruf besar tanpa kapitalisasi otomatis)', () => {
		expect(labelKategoriMitra('kjpp')).toBe('KJPP');
		expect(labelKategoriMitra('notaris')).toBe('Notaris');
		expect(labelKategoriMitra('asuransi')).toBe('Asuransi');
	});

	test('kategori baru dibelokkan jadi label manis, bukan dibuang', () => {
		expect(labelKategoriMitra('konsultan-pajak')).toBe('Konsultan Pajak');
		expect(labelKategoriMitra('desain_interior')).toBe('Desain Interior');
		expect(labelKategoriMitra('broker')).toBe('Broker');
	});
});

describe('kategoriChips', () => {
	test('"Semua" selalu pertama, lalu kategori unik urut kemunculan pertama', () => {
		const chips = kategoriChips([
			mitra('kjpp', 'A'),
			mitra('notaris', 'B'),
			mitra('kjpp', 'C'),
			mitra('asuransi', 'D')
		]);
		expect(chips).toEqual([
			{ nilai: null, label: 'Semua' },
			{ nilai: 'kjpp', label: 'KJPP' },
			{ nilai: 'notaris', label: 'Notaris' },
			{ nilai: 'asuransi', label: 'Asuransi' }
		]);
	});

	test('list kosong → tetap ada chip "Semua" (empty-state tanpa chip liar)', () => {
		expect(kategoriChips([])).toEqual([{ nilai: null, label: 'Semua' }]);
	});

	test('kategori tak dikenal ikut jadi chip dengan label humanize', () => {
		const chips = kategoriChips([mitra('pemborong')]);
		expect(chips[1]).toEqual({ nilai: 'pemborong', label: 'Pemborong' });
	});
});

describe('KATEGORI_MITRA_LABEL', () => {
	test('kunci label valid sebagai slug kategori (tanpa spasi/kapital)', () => {
		for (const kunci of Object.keys(KATEGORI_MITRA_LABEL)) {
			expect(kunci).toMatch(/^[a-z0-9-]+$/);
		}
	});
});
