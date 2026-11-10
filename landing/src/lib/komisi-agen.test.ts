import { describe, expect, test } from 'bun:test';
import { teksEstimasiKomisi } from './komisi-agen';

describe('teksEstimasiKomisi (KOMISI-AGEN-01)', () => {
	test('estimasi → ± rupiah + persen Indonesia, catatan dasar harga', () => {
		const t = teksEstimasiKomisi({ status: 'estimasi', persen: 2.9, nominal: 8_700_000, dasar: 'perumahan' });
		expect(t?.utama).toMatch(/^± Rp\s?8\.700\.000 \(2,9%\)$/);
		expect(t?.catatan).toContain('harga mulai perumahan');
		expect(teksEstimasiKomisi({ status: 'estimasi', persen: 3, nominal: 1, dasar: 'tipe' })?.catatan).toContain('harga tipe');
	});

	test('flat, tanpa harga, menunggu perjanjian, null', () => {
		expect(teksEstimasiKomisi({ status: 'flat', nominal: 2_500_000 })?.utama).toMatch(/Rp\s?2\.500\.000/);
		expect(teksEstimasiKomisi({ status: 'tanpa_harga', persen: 3 })?.utama).toBe('3% dari harga jual');
		expect(teksEstimasiKomisi({ status: 'menunggu_perjanjian' })?.utama).toBe('Komisi menunggu perjanjian perumahan');
		expect(teksEstimasiKomisi(null)).toBeNull();
	});
});
