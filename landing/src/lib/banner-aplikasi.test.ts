/**
 * Tes logika banner "Pasang aplikasi Omahe" (Android). Storage di-stub Map
 * supaya kasus tersedia/terblokir bisa dikontrol per tes.
 */
import { describe, expect, test } from 'bun:test';
import {
	JEDA_TUTUP_MS,
	PAKET_APLIKASI,
	apakahAndroid,
	cekTerpasang,
	diDalamAplikasi,
	halamanTanpaBanner,
	hrefVarian,
	masihDitutup,
	pilihVarian,
	simpanDitutup,
	urlPasang,
	VARIAN_BANNER
} from './banner-aplikasi';

function stubStorage() {
	const m = new Map<string, string>();
	return {
		getItem: (k: string) => m.get(k) ?? null,
		setItem: (k: string, v: string) => void m.set(k, v),
		m
	};
}
const terblokir = {
	getItem: () => {
		throw new Error('SecurityError');
	},
	setItem: () => {
		throw new Error('SecurityError');
	}
};

describe('apakahAndroid', () => {
	test('Android Chrome → true; iPhone & desktop → false', () => {
		expect(apakahAndroid('Mozilla/5.0 (Linux; Android 14; SM-A546E) Chrome/130 Mobile')).toBe(true);
		expect(apakahAndroid('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari')).toBe(
			false
		);
		expect(apakahAndroid('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130')).toBe(false);
	});
});

describe('diDalamAplikasi', () => {
	test('referrer TWA Omahe → true & diingat untuk muat ulang berikutnya', () => {
		const s = stubStorage();
		expect(
			diDalamAplikasi({
				referrer: `android-app://${PAKET_APLIKASI}/`,
				standalone: false,
				storage: s
			})
		).toBe(true);
		// Muat ulang: referrer sudah hilang, tetap dikenali dari sessionStorage.
		expect(diDalamAplikasi({ referrer: '', standalone: false, storage: s })).toBe(true);
	});

	test('display-mode standalone → true (TWA / PWA terpasang)', () => {
		expect(diDalamAplikasi({ referrer: '', standalone: true, storage: stubStorage() })).toBe(true);
	});

	test('browser biasa / referrer aplikasi lain → false', () => {
		expect(
			diDalamAplikasi({
				referrer: 'https://www.google.com/',
				standalone: false,
				storage: stubStorage()
			})
		).toBe(false);
		expect(
			diDalamAplikasi({
				referrer: 'android-app://com.whatsapp/',
				standalone: false,
				storage: stubStorage()
			})
		).toBe(false);
	});

	test('storage terblokir tidak melempar', () => {
		expect(
			diDalamAplikasi({
				referrer: `android-app://${PAKET_APLIKASI}`,
				standalone: false,
				storage: terblokir
			})
		).toBe(true);
		expect(diDalamAplikasi({ referrer: '', standalone: false, storage: terblokir })).toBe(false);
	});
});

describe('masihDitutup / simpanDitutup', () => {
	const NOW = 1_800_000_000_000;

	test('ditutup → tersembunyi 30 hari, lalu tampil lagi', () => {
		const s = stubStorage();
		expect(masihDitutup(s, NOW)).toBe(false);
		simpanDitutup(s, NOW);
		expect(masihDitutup(s, NOW + JEDA_TUTUP_MS - 1)).toBe(true);
		expect(masihDitutup(s, NOW + JEDA_TUTUP_MS)).toBe(false);
	});

	test('nilai rusak / storage terblokir → dianggap belum ditutup, tanpa error', () => {
		const s = stubStorage();
		s.m.set('omahe:banner-aplikasi:tutup', 'bukan-angka');
		expect(masihDitutup(s, NOW)).toBe(false);
		expect(masihDitutup(terblokir, NOW)).toBe(false);
		expect(() => simpanDitutup(terblokir, NOW)).not.toThrow();
	});
});

describe('cekTerpasang', () => {
	test('daftar memuat paket Omahe → true; aplikasi lain saja → false', async () => {
		expect(
			await cekTerpasang({
				getInstalledRelatedApps: async () => [{ platform: 'play', id: PAKET_APLIKASI }]
			})
		).toBe(true);
		expect(
			await cekTerpasang({
				getInstalledRelatedApps: async () => [{ platform: 'play', id: 'com.lain' }]
			})
		).toBe(false);
		expect(await cekTerpasang({ getInstalledRelatedApps: async () => [] })).toBe(false);
	});

	test('tidak didukung / error → null (banner tetap tampil)', async () => {
		expect(await cekTerpasang({})).toBeNull();
		expect(
			await cekTerpasang({
				getInstalledRelatedApps: async () => {
					throw new Error('NotSupported');
				}
			})
		).toBeNull();
	});
});

describe('halamanTanpaBanner & urlPasang', () => {
	test('halaman bayar & redirect QR tanpa banner; halaman lain boleh', () => {
		expect(halamanTanpaBanner('/bayar/abc')).toBe(true);
		expect(halamanTanpaBanner('/q/QA7MPN')).toBe(true);
		expect(halamanTanpaBanner('/')).toBe(false);
		expect(halamanTanpaBanner('/perumahan/klari-regency')).toBe(false);
	});

	test('URL Play Store membawa id paket & install referrer utm', () => {
		const u = new URL(urlPasang(`https://play.google.com/store/apps/details?id=${PAKET_APLIKASI}`));
		expect(u.searchParams.get('id')).toBe(PAKET_APLIKASI);
		expect(u.searchParams.get('referrer')).toBe(
			'utm_source=omahe.co.id&utm_medium=banner&utm_campaign=pasang_aplikasi'
		);
	});
});

describe('pilihVarian / hrefVarian', () => {
	test('acak memilih varian sesuai indeks & disimpan untuk sesi', () => {
		const s = stubStorage();
		expect(pilihVarian('/', () => 0, s).id).toBe('pembeli');
		// Sudah tersimpan → acak berikutnya tidak mengubah varian sesi ini.
		expect(pilihVarian('/cari', () => 0.99, s).id).toBe('pembeli');
		expect(pilihVarian('/', () => 0.5, stubStorage()).id).toBe('agen_uang');
		expect(pilihVarian('/', () => 0.99, stubStorage()).id).toBe('agen_komisi');
		expect(pilihVarian('/', () => 1, stubStorage()).id).toBe('agen_komisi');
	});

	test('halaman /gabung… selalu varian pembeli', () => {
		expect(pilihVarian('/gabung', () => 0.99, stubStorage()).id).toBe('pembeli');
		expect(pilihVarian('/gabung/agen', () => 0.99, stubStorage()).id).toBe('pembeli');
		expect(pilihVarian('/gabungan', () => 0.99, stubStorage()).id).toBe('agen_komisi');
	});

	test('nilai tersimpan rusak / storage terblokir → acak tanpa error', () => {
		const s = stubStorage();
		s.m.set('omahe:banner-aplikasi:varian', 'tidak-dikenal');
		expect(pilihVarian('/', () => 0.5, s).id).toBe('agen_uang');
		expect(pilihVarian('/', () => 0.5, terblokir).id).toBe('agen_uang');
	});

	test('varian agen → /gabung/agen; pembeli → Play Store; klaim komisi memakai "hingga"', () => {
		const play = `https://play.google.com/store/apps/details?id=${PAKET_APLIKASI}`;
		const [pembeli, uang, komisi] = VARIAN_BANNER;
		expect(hrefVarian(pembeli!, play)).toContain('play.google.com');
		expect(hrefVarian(uang!, play)).toBe('/gabung/agen');
		expect(hrefVarian(komisi!, play)).toBe('/gabung/agen');
		expect(komisi!.judul).toContain('hingga');
	});
});
