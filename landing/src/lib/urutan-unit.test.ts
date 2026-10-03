import { describe, expect, test } from 'bun:test';
import type { UnitListing } from '$lib/api/types';
import { PILIHAN_URUTAN, parseUrutan, urutkanUnitFixture } from './urutan-unit';

/** UNIT-07 — urutan pencarian /cari (mode fixture + parsing URL). */

const unit = (id: string, hargaMin: number | null, unitTersedia: number) =>
	({ id, hargaMin, unitTersedia }) as unknown as UnitListing;

const DATA = [unit('a', 300, 1), unit('b', null, 5), unit('c', 100, 3), unit('d', 500, 2)];
const ids = (xs: UnitListing[]) => xs.map((x) => x.id);

describe('parseUrutan', () => {
	test('nilai sah dikenali (tak peka huruf besar/spasi)', () => {
		for (const p of PILIHAN_URUTAN) expect(parseUrutan(p.nilai)).toBe(p.nilai);
		expect(parseUrutan(' HARGA_DESC ')).toBe('harga_desc');
	});

	test('kosong / aneh → rekomendasi', () => {
		expect(parseUrutan(null)).toBe('rekomendasi');
		expect(parseUrutan('')).toBe('rekomendasi');
		expect(parseUrutan('acak')).toBe('rekomendasi');
	});
});

describe('urutkanUnitFixture', () => {
	test('harga termurah/termahal — harga null selalu di akhir', () => {
		expect(ids(urutkanUnitFixture(DATA, 'harga_asc'))).toEqual(['c', 'a', 'd', 'b']);
		expect(ids(urutkanUnitFixture(DATA, 'harga_desc'))).toEqual(['d', 'a', 'c', 'b']);
	});

	test('unit terbanyak; terbaru mempertahankan urutan data; input tidak dimutasi', () => {
		expect(ids(urutkanUnitFixture(DATA, 'unit_terbanyak'))).toEqual(['b', 'c', 'd', 'a']);
		expect(ids(urutkanUnitFixture(DATA, 'terbaru'))).toEqual(['a', 'b', 'c', 'd']);
		expect(ids(DATA)).toEqual(['a', 'b', 'c', 'd']);
	});
});
