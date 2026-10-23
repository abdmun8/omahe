/**
 * Tes `promo-saring.ts` — saringan anti-dobel seksi homepage (MONET-01):
 * perumahan yang tampil di "Promo Pilihan" tidak boleh muncul lagi di
 * "Rekomendasi Hari Ini" (`unit.perumahan.slug`) maupun "Baru di Omahe"
 * (`slug`). Fungsi yang diuji PURE — tanpa mock/env/network, pola
 * `urutan-unit.test.ts`.
 */
import { describe, expect, test } from 'bun:test';
import { kumpulkanSlugPromo, saringBukanPromo } from './promo-saring';

/** Unit minimal — hanya `perumahan.slug` yang relevan buat saringan. */
const unit = (slug: string) => ({ perumahan: { slug } });
const perumahan = (slug: string) => ({ slug });

describe('kumpulkanSlugPromo', () => {
	test('slug promo terkumpul jadi Set', () => {
		expect(kumpulkanSlugPromo([{ slug: 'a' }, { slug: 'b' }])).toEqual(new Set(['a', 'b']));
	});

	test('promo kosong → Set kosong (bukan undefined)', () => {
		expect(kumpulkanSlugPromo([]).size).toBe(0);
	});
});

describe('saringBukanPromo', () => {
	test('unit milik perumahan promo gugur; lainnya dipertahankan urut', () => {
		const slugPromo = new Set(['promo-1']);
		const kandidat = [unit('promo-1'), unit('organik-1'), unit('promo-1'), unit('organik-2')];

		expect(saringBukanPromo(kandidat, slugPromo, (u) => u.perumahan.slug, 6)).toEqual([
			unit('organik-1'),
			unit('organik-2')
		]);
	});

	test('dipotong ke `maks` SETELAH penyaringan (bukan sebelum)', () => {
		// 4 kandidat, 1 promo → sisa 3 organik; maks 2 → dua pertama urut.
		const slugPromo = new Set(['promo']);
		const kandidat = [unit('promo'), unit('a'), unit('b'), unit('c')];

		expect(saringBukanPromo(kandidat, slugPromo, (u) => u.perumahan.slug, 2)).toEqual([
			unit('a'),
			unit('b')
		]);
	});

	test('potong maks juga bekerja tanpa promo (jalur cepat)', () => {
		const kandidat = [perumahan('a'), perumahan('b'), perumahan('c')];

		expect(saringBukanPromo(kandidat, new Set(), (p) => p.slug, 2)).toEqual([
			perumahan('a'),
			perumahan('b')
		]);
	});

	test('semua kandidat promo → kosong (pemanggil menyembunyikan slot), bukan crash', () => {
		const slugPromo = new Set(['promo']);
		expect(saringBukanPromo([perumahan('promo')], slugPromo, (p) => p.slug, 4)).toEqual([]);
	});
});
