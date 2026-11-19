/**
 * Tes SHARE-02 — `susunPratinjauPerumahan` (pratinjau tautan: og:title,
 * og:description, badge promo, keunggulan) + `ogImageUrl`.
 *
 * Jalur yang dikunci: semua fallback (keunggulan → Fasilitas → []),
 * penyembunyian cashback untuk ref agen (KOMISI-OMAHE-02/04), pemotongan
 * judul/deskripsi/judul promo di batas kata dengan "…", sanitasi markdown/
 * HTML, dan bentuk URL gambar OG (ref agen saja yang ikut).
 */
import { describe, expect, test } from 'bun:test';
import { ogImageUrl, susunPratinjauPerumahan } from './pratinjau-perumahan';
import type { PratinjauPerumahanInput, PratinjauTipe, PratinjauUnit } from './pratinjau-perumahan';
import type { LandingSection, PerumahanDetail } from '$lib/api/types';

const PERUMAHAN_DASAR = {
	nama: 'Griya Asri Bogor',
	slug: 'griya-asri-bogor',
	regionNama: 'Kab. Bogor, Jawa Barat',
	kecamatanNama: 'Ciawi'
} satisfies Pick<PerumahanDetail, 'nama' | 'slug' | 'regionNama' | 'kecamatanNama'>;

const UNITS = [
	{ hargaMin: 385_000_000, unitTersedia: 12 },
	{ hargaMin: 520_000_000, unitTersedia: 7 },
	{ hargaMin: 785_000_000, unitTersedia: 3 }
];

const SECTION_FASILITAS: LandingSection = {
	id: 'f1',
	type: 'facilities',
	enabled: true,
	props: {
		heading: 'Fasilitas',
		items: [
			{ label: 'One gate system 24 jam' },
			{ label: 'Taman bermain anak' },
			{ label: 'Masjid kawasan' },
			{ label: 'Jalur pedestrian' }
		]
	}
};

/** Bagian perumahan yang boleh dioverride di test (null = eksplisit kosong). */
type PerumahanTest = Partial<
	Record<'nama' | 'slug' | 'regionNama' | 'kecamatanNama', string | null>
> &
	Record<string, unknown>;

const panggil = (
	perumahan: PerumahanTest = {},
	tipeUnit: PratinjauUnit[] = UNITS,
	ref: string | null = null,
	tipe?: PratinjauTipe
) =>
	susunPratinjauPerumahan({
		perumahan: { ...PERUMAHAN_DASAR, ...perumahan } as PratinjauPerumahanInput,
		tipeUnit,
		ref,
		tipe
	});

describe('susunPratinjauPerumahan — keunggulan', () => {
	test('field asli dipakai (maks 3), dibersihkan dari tag HTML', () => {
		const hasil = panggil({
			keunggulan: ['SHM', ' <b>5 menit ke tol</b> ', 'Free biaya KPR', 'Keempat diabaikan'],
			sections: [SECTION_FASILITAS]
		});
		expect(hasil.poinKeunggulan).toEqual(['SHM', '5 menit ke tol', 'Free biaya KPR']);
	});

	test('kosong → fallback 3 label pertama section Fasilitas', () => {
		const hasil = panggil({ sections: [SECTION_FASILITAS] });
		expect(hasil.poinKeunggulan).toEqual([
			'One gate system 24 jam',
			'Taman bermain anak',
			'Masjid kawasan'
		]);
	});

	test('fallback melewati section non-facilities & yang disabled', () => {
		const hero: LandingSection = {
			id: 'h1',
			type: 'hero',
			enabled: true,
			props: { headline: 'X', ctaLabel: 'Y' }
		};
		const fasilitasMati: LandingSection = { ...SECTION_FASILITAS, id: 'f2', enabled: false };
		const hasil = panggil({ sections: [hero, fasilitasMati] });
		expect(hasil.poinKeunggulan).toEqual([]);
	});

	test('dua-duanya kosong → [] (tanpa crash)', () => {
		expect(panggil({}).poinKeunggulan).toEqual([]);
		expect(panggil({ keunggulan: [], sections: null }).poinKeunggulan).toEqual([]);
	});
});

describe('susunPratinjauPerumahan — badgePromo', () => {
	const program = { dp0: true, cashback: 1_000_000, teksSyarat: 'S&K berlaku' };

	test('DP 0%* + cashback + promo aktif, urut sesuai keputusan', () => {
		const hasil = panggil({
			programOmahe: program,
			promoAktif: [
				{ judul: 'Diskon Rp10 jt', sumber: 'omahe', slug: 'promo-1' },
				{ judul: 'Gratis AKD', sumber: 'perumahan', slug: null }
			]
		});
		expect(hasil.badgePromo).toEqual(['DP 0%*', 'Cashback Rp1 jt', 'Diskon Rp10 jt']);
	});

	test('maks 3 badge — promo keempat tidak lolos', () => {
		const hasil = panggil({
			programOmahe: program,
			promoAktif: [
				{ judul: 'P1', sumber: 'omahe', slug: null },
				{ judul: 'P2', sumber: 'omahe', slug: null }
			]
		});
		expect(hasil.badgePromo).toEqual(['DP 0%*', 'Cashback Rp1 jt', 'P1']);
	});

	test('cashback DISEMBUNYIKAN untuk ref agen (AO-/OMHA-/OMH-), DP 0% tetap', () => {
		for (const ref of ['AO-K2269F4X', 'OMHA-A0001', 'OMH-ABC123']) {
			const hasil = panggil(
				{
					programOmahe: program,
					promoAktif: [{ judul: 'Diskon Rp10 jt', sumber: 'omahe', slug: 'promo-1' }]
				},
				UNITS,
				ref
			);
			expect(hasil.badgePromo).toEqual(['DP 0%*', 'Diskon Rp10 jt']);
			expect(hasil.badgePromo.some((b) => b.startsWith('Cashback'))).toBe(false);
		}
	});

	test('cashback TETAP untuk ref OP- mitra, hex, dan tanpa ref (KOMISI-OMAHE-04)', () => {
		for (const ref of ['OP-QA7MPN', 'a'.repeat(64), null]) {
			const hasil = panggil({ programOmahe: program }, UNITS, ref);
			expect(hasil.badgePromo).toContain('Cashback Rp1 jt');
		}
	});

	test('tanpa program & promo → badge []', () => {
		expect(panggil({}).badgePromo).toEqual([]);
	});

	test('judul promo dipotong 40 karakter di batas kata dengan "…"', () => {
		const judulPanjang =
			'Promo bebas biaya RMK & hadiah langsung untuk 10 pembeli pertama bulan ini';
		const hasil = panggil({ promoAktif: [{ judul: judulPanjang, sumber: 'omahe', slug: null }] });
		expect(hasil.badgePromo).toHaveLength(1);
		const badge = hasil.badgePromo[0];
		expect(badge.length).toBeLessThanOrEqual(40);
		expect(badge.endsWith('…')).toBe(true);
		expect(badge).not.toContain(judulPanjang.slice(30, 40));
	});

	test('judul promo dengan tag HTML dibersihkan, judul kosong diabaikan', () => {
		const hasil = panggil({
			promoAktif: [
				{ judul: '<b>Gratis</b> CCTV', sumber: 'omahe', slug: null },
				{ judul: '   ', sumber: 'omahe', slug: null }
			]
		});
		expect(hasil.badgePromo).toEqual(['Gratis CCTV']);
	});
});

describe('susunPratinjauPerumahan — judul', () => {
	test('lengkap: "<nama> — <kab/kota> · mulai Rp…"', () => {
		expect(panggil({}).judul).toBe('Griya Asri Bogor — Kab. Bogor · mulai Rp385 jt');
	});

	test('bagian kosong dilewati', () => {
		expect(panggil({ regionNama: null, kecamatanNama: null }).judul).toBe(
			'Griya Asri Bogor · mulai Rp385 jt'
		);
		expect(panggil({}, [], null).judul).toBe('Griya Asri Bogor — Kab. Bogor');
		expect(panggil({ regionNama: null, kecamatanNama: null }, [], null).judul).toBe(
			'Griya Asri Bogor'
		);
	});

	test('maks ~90 karakter, dipotong di batas kata dengan "…"', () => {
		const hasil = panggil({ nama: 'A'.repeat(120) });
		expect(hasil.judul.length).toBeLessThanOrEqual(90);
		expect(hasil.judul.endsWith('…')).toBe(true);
	});

	test('varian tipe: "<tipe> di <nama> · mulai Rp…" dengan harga tipe', () => {
		const hasil = panggil({}, [], null, { nama: 'Tipe 36/72', hargaMin: 385_000_000 });
		expect(hasil.judul).toBe('Tipe 36/72 di Griya Asri Bogor · mulai Rp385 jt');
		expect(hasil.hargaMulai).toBe(385_000_000);
	});

	test('varian tipe tanpa harga → tanpa bagian harga', () => {
		const hasil = panggil({}, [], null, { nama: 'Tipe 36/72', hargaMin: null });
		expect(hasil.judul).toBe('Tipe 36/72 di Griya Asri Bogor');
	});
});

describe('susunPratinjauPerumahan — hargaMulai & lokasiPendek', () => {
	test('harga mulai = termurah hargaMin tipe; null/aneh diabaikan; kosong → null', () => {
		expect(panggil({}).hargaMulai).toBe(385_000_000);
		expect(
			panggil({}, [
				{ hargaMin: null, unitTersedia: 1 },
				{ hargaMin: Number.NaN, unitTersedia: 1 }
			]).hargaMulai
		).toBeNull();
	});

	test('lokasiPendek = segmen kab/kota dari regionNama', () => {
		expect(panggil({}).lokasiPendek).toBe('Kab. Bogor');
	});

	test('lokasiPendek fallback kecamatanNama, lalu null', () => {
		expect(panggil({ regionNama: null }).lokasiPendek).toBe('Ciawi');
		expect(panggil({ regionNama: null, kecamatanNama: null }).lokasiPendek).toBeNull();
	});
});

describe('susunPratinjauPerumahan — deskripsi', () => {
	test('promo dulu, lalu keunggulan ✓, lalu unit, lalu cuplikan', () => {
		const hasil = panggil({
			programOmahe: { dp0: true, cashback: 1_000_000, teksSyarat: 'S&K' },
			keunggulan: ['SHM', '5 menit ke tol'],
			deskripsi: 'Hunian keluarga di kaki Gunung Salak.'
		});
		expect(hasil.deskripsi).toBe(
			'Promo: DP 0%* · Cashback Rp1 jt · ✓ SHM · ✓ 5 menit ke tol · 22 unit tersedia · Hunian keluarga di kaki Gunung Salak.'
		);
	});

	test('tanpa promo/keunggulan/unit → cuplikan saja; markdown dilucuti', () => {
		const hasil = panggil(
			{
				deskripsi: '## Tentang\nRumah **dua lantai** dekat [stasiun](https://contoh.id).'
			},
			[],
			null
		);
		expect(hasil.deskripsi).toBe('Tentang Rumah dua lantai dekat stasiun.');
		expect(hasil.deskripsi).not.toMatch(/[#*\[\]]|<|>/);
	});

	test('maks 200 karakter, dipotong di batas kata dengan "…"', () => {
		const hasil = panggil(
			{ keunggulan: ['SHM'], deskripsi: 'Sangat '.repeat(60).trim() + '.' },
			UNITS,
			null
		);
		expect(hasil.deskripsi.length).toBeLessThanOrEqual(200);
		expect(hasil.deskripsi.endsWith('…')).toBe(true);
		expect(hasil.deskripsi.trimEnd().endsWith('Sanga…') || hasil.deskripsi.includes('…')).toBe(
			true
		);
	});

	test('unit 0 (tipe habis) tidak jadi "0 unit tersedia"', () => {
		const hasil = panggil({}, [], null, {
			nama: 'Tipe 36',
			hargaMin: 385_000_000,
			unitTersedia: 0
		});
		expect(hasil.deskripsi).not.toContain('unit tersedia');
	});

	test('tanpa apa pun → deskripsi kosong (halaman punya fallback sendiri)', () => {
		expect(panggil({}, [], null).deskripsi).toBe('');
	});
});

describe('ogImageUrl', () => {
	test('kanonikal tanpa ref untuk pengunjung umum', () => {
		expect(ogImageUrl({ slug: 'griya-asri-bogor' })).toBe(
			'https://www.omahe.co.id/perumahan/griya-asri-bogor/og.jpg'
		);
	});

	test('ref agen saja yang diteruskan (gambar tanpa cashback), ref lain tidak', () => {
		expect(ogImageUrl({ slug: 's', ref: 'OMHA-A0001' })).toBe(
			'https://www.omahe.co.id/perumahan/s/og.jpg?ref=OMHA-A0001'
		);
		expect(ogImageUrl({ slug: 's', ref: 'AO-K2269F4X' })).toBe(
			'https://www.omahe.co.id/perumahan/s/og.jpg?ref=AO-K2269F4X'
		);
		expect(ogImageUrl({ slug: 's', ref: 'OP-QA7MPN' })).toBe(
			'https://www.omahe.co.id/perumahan/s/og.jpg'
		);
		expect(ogImageUrl({ slug: 's', ref: 'a'.repeat(64) })).toBe(
			'https://www.omahe.co.id/perumahan/s/og.jpg'
		);
		expect(ogImageUrl({ slug: 's', ref: 'teks aneh../../' })).toBe(
			'https://www.omahe.co.id/perumahan/s/og.jpg'
		);
	});

	test('varian tipe: ?tipe= (+&ref= bila ref agen)', () => {
		expect(ogImageUrl({ slug: 's', tipeSlug: 'tipe-36-72' })).toBe(
			'https://www.omahe.co.id/perumahan/s/og.jpg?tipe=tipe-36-72'
		);
		expect(ogImageUrl({ slug: 's', tipeSlug: 'tipe-36-72', ref: 'OMHA-A0001' })).toBe(
			'https://www.omahe.co.id/perumahan/s/og.jpg?tipe=tipe-36-72&ref=OMHA-A0001'
		);
	});
});
