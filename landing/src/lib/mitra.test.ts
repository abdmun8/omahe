/**
 * Tes helper kategori mitra (omahe#3 — chip & badge dinamis). Kategori
 * tambahan dari backend (MITRA-02, belum ada) HARUS tampil otomatis:
 * kategori tak dikenal dirender manis, tidak dibuang.
 */
import { describe, expect, test } from 'bun:test';
import type { KategoriMitraMaster, PublicMitra } from '$lib/api/types';
import {
	KATEGORI_MITRA_LABEL,
	kategoriChips,
	labelKategoriDari,
	labelKategoriMitra,
	urutkanMitraPerKategori
} from './mitra';

const mitra = (kategori: string, nama = 'Mitra Uji'): PublicMitra => ({
	id: nama,
	nama,
	kategori: kategori as PublicMitra['kategori'],
	wilayahLayanan: 'Jabodetabek',
	whatsapp: '6281100000000',
	telepon: null,
	logoUrl: null,
	urutan: 1,
	slug: 'uji-mitra',
	fotoUrl: null
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

describe('MITRA-03 label & urutan master', () => {
	const m = (kategori: string, kategoriLabel?: string, kategoriUrutan?: number): PublicMitra => ({
		...mitra(kategori),
		kategoriLabel,
		kategoriUrutan
	});

	test('chip urut kategoriUrutan master, label dari master', () => {
		const chips = kategoriChips([
			m('notaris', 'Notaris', 20),
			m('asuransi', 'Asuransi Properti', 5),
			m('kjpp', 'KJPP (Appraisal)', 10),
			m('notaris', 'Notaris', 20)
		]);
		expect(chips).toEqual([
			{ nilai: null, label: 'Semua' },
			{ nilai: 'asuransi', label: 'Asuransi Properti' },
			{ nilai: 'kjpp', label: 'KJPP (Appraisal)' },
			{ nilai: 'notaris', label: 'Notaris' }
		]);
	});

	test('tanpa label master → fallback humanize', () => {
		expect(labelKategoriDari({ kategori: 'konsultan-pajak' })).toBe('Konsultan Pajak');
		expect(labelKategoriDari({ kategori: 'kjpp', kategoriLabel: 'KJPP (Appraisal)' })).toBe(
			'KJPP (Appraisal)'
		);
	});
});

describe('MITRA-04 kategoriChips dari master', () => {
	const master = (slug: string, label: string, urutan: number): KategoriMitraMaster => ({
		slug,
		label,
		urutan
	});

	test('kategori master TANPA mitra tetap jadi chip, urut master dipertahankan', () => {
		const chips = kategoriChips(
			[mitra('kjpp', 'A'), mitra('notaris', 'B')],
			[
				master('kjpp', 'KJPP (Appraisal)', 10),
				master('notaris', 'Notaris', 20),
				master('konsultan-pajak', 'Konsultan Pajak', 50)
			]
		);
		expect(chips).toEqual([
			{ nilai: null, label: 'Semua' },
			{ nilai: 'kjpp', label: 'KJPP (Appraisal)' },
			{ nilai: 'notaris', label: 'Notaris' },
			{ nilai: 'konsultan-pajak', label: 'Konsultan Pajak' }
		]);
	});

	test('kategori milik mitra yang TIDAK ada di master (nonaktif) tidak jadi chip', () => {
		const chips = kategoriChips([mitra('arsitek', 'A')], [master('kjpp', 'KJPP', 10)]);
		expect(chips).toEqual([
			{ nilai: null, label: 'Semua' },
			{ nilai: 'kjpp', label: 'KJPP' }
		]);
	});

	test('master null/undefined → perilaku lama (turunan data)', () => {
		const dari = [mitra('kjpp', 'A'), mitra('notaris', 'B')];
		expect(kategoriChips(dari, null)).toEqual(kategoriChips(dari));
		expect(kategoriChips(dari, undefined)).toEqual(kategoriChips(dari));
	});

	test('master kosong → hanya "Semua"; label master kosong → humanize slug', () => {
		expect(kategoriChips([mitra('kjpp')], [])).toEqual([{ nilai: null, label: 'Semua' }]);
		expect(kategoriChips([], [master('konsultan-pajak', '  ', 1)])).toEqual([
			{ nilai: null, label: 'Semua' },
			{ nilai: 'konsultan-pajak', label: 'Konsultan Pajak' }
		]);
	});
});

describe('urutkanMitraPerKategori (tab Semua)', () => {
	const m = (id: string, kategori: string) =>
		({ id, nama: id, slug: id, kategori }) as unknown as PublicMitra;
	const chips = [
		{ nilai: null, label: 'Semua' },
		{ nilai: 'kjpp', label: 'KJPP' },
		{ nilai: 'notaris', label: 'Notaris' },
		{ nilai: 'asuransi', label: 'Asuransi' }
	];

	test('mengikuti urutan chip kategori, stabil di dalam kategori, tak dikenal di akhir', () => {
		const hasil = urutkanMitraPerKategori(
			[
				m('n1', 'notaris'),
				m('x1', 'lain'),
				m('a1', 'asuransi'),
				m('k1', 'kjpp'),
				m('n2', 'notaris'),
				m('k2', 'kjpp')
			],
			chips
		);
		expect(hasil.map((r) => r.id)).toEqual(['k1', 'k2', 'n1', 'n2', 'a1', 'x1']);
	});

	test('tidak mengubah array masukan', () => {
		const masuk = [m('n1', 'notaris'), m('k1', 'kjpp')];
		urutkanMitraPerKategori(masuk, chips);
		expect(masuk.map((r) => r.id)).toEqual(['n1', 'k1']);
	});
});
