/**
 * Tes logika ref layout root (KERJASAMA-02/03) — pola `ref-tersimpan.test.ts`:
 * stub `localStorage` Map + `setSystemTime` (waktu deterministik).
 *
 * Logika lengkapnya DIEKSTRAK ke `hitungRefLayout()` di `$lib/ref-tersimpan`
 * supaya bisa diuji langsung: shim natif `$app/environment` di bun test
 * hard-coded `browser:false` untuk file proyek dan TIDAK bisa di-mock
 * (mock.module '$app/environment' hanya menjangkau import di file test itu
 * sendiri — diverifikasi saat mengerjakan KERJASAMA-03). File ini menguji
 * `hitungRefLayout` dengan `browser: true` (jalur browser nyata: simpan +
 * pilih) dan `load` asli `routes/+layout.ts` untuk jalur passthrough
 * SSR/prerender (browser: false) + wiring `?ref=` biasa.
 */
import { afterEach, beforeEach, describe, expect, mock, setSystemTime, test } from 'bun:test';
import { hitungRefLayout } from '$lib/ref-tersimpan';

// Bun TIDAK bisa me-resolve `$app/environment` dari file proyek tanpa mock
// terdaftar ("Cannot find module") — dan nilai mock TIDAK sampai ke
// `+layout.ts` (dia dapat shim natif bun: browser=false, terverifikasi
// saat KERJASAMA-03). Jadi mock ini hanya pemicu resolusi; jalur
// `browser:true` diuji lewat `hitungRefLayout` di bawah. PULIHKAN ke
// `browser:false` di akhir file — mock.module bocor antar file test
// (pelajaran CI, CLAUDE.md).
mock.module('$app/environment', () => ({ browser: false }));

// Import dinamis — setelah mock pemicu resolusi terpasang.
const { load } = await import('./+layout');

const simpanan = new Map<string, string>();
const storageStub = {
	getItem: (k: string) => (simpanan.has(k) ? simpanan.get(k)! : null),
	setItem: (k: string, v: string) => void simpanan.set(k, v),
	removeItem: (k: string) => void simpanan.delete(k),
	clear: () => void simpanan.clear()
} as unknown as Storage;
const asli = globalThis.localStorage;

const REF = 'a1b2c3d4e5f60718a9b0c1d2e3f40516a7b8c9d0e1f20314a5b6c7d8e9f0a1b2';
const REF_OP = 'OP-QA7MPN';
const HARI = 24 * 60 * 60 * 1000;
const T0 = 1_700_000_000_000;

beforeEach(() => {
	simpanan.clear();
	(globalThis as { localStorage: Storage }).localStorage = storageStub;
	setSystemTime(T0);
});

afterEach(() => {
	(globalThis as { localStorage: Storage }).localStorage = asli;
	setSystemTime();
});

describe('hitungRefLayout — browser:true (jalur browser nyata)', () => {
	test('homepage dengan ?ref=OP-…&mitra= → ref + nama tersimpan sebagai GLOBAL', () => {
		const res = hitungRefLayout({
			browser: true,
			refUrl: REF_OP,
			slug: null,
			diRutePerumahan: false,
			url: new URL(`https://www.omahe.co.id/?ref=${REF_OP}&mitra=PT%20Contoh%20Mitra`),
			now: T0
		});
		expect(res).toEqual({ ref: REF_OP, refGlobalNama: 'PT Contoh Mitra', refGlobalAgen: null });
		expect(simpanan.get('omahe:ref:_global')).toBe(
			JSON.stringify({ ref: REF_OP, exp: T0 + 90 * HARI, t: T0, nama: 'PT Contoh Mitra' })
		);
	});

	test('homepage tanpa ref → ref global tersimpan jadi ref (link withRef ikut membawa)', () => {
		simpanan.set(
			'omahe:ref:_global',
			JSON.stringify({ ref: REF_OP, exp: T0 + HARI, t: T0, nama: 'PT Contoh Mitra' })
		);
		const res = hitungRefLayout({
			browser: true,
			refUrl: null,
			slug: null,
			diRutePerumahan: false,
			url: new URL('https://www.omahe.co.id/'),
			now: T0
		});
		expect(res).toEqual({ ref: REF_OP, refGlobalNama: 'PT Contoh Mitra', refGlobalAgen: null });
	});

	test('REF-AGEN-01 — homepage ?ref=OMHA-… → ref GLOBAL kode agen UPPERCASE, tanpa nama', () => {
		const res = hitungRefLayout({
			browser: true,
			refUrl: 'omha-a0001',
			slug: null,
			diRutePerumahan: false,
			url: new URL('https://www.omahe.co.id/?ref=omha-a0001&mitra=Bot'),
			now: T0
		});
		expect(res).toEqual({ ref: 'OMHA-A0001', refGlobalNama: null, refGlobalAgen: 'OMHA-A0001' });
		// `?mitra=` diabaikan untuk kode agen (anti-spoof — nama dari endpoint nama agen).
		expect(simpanan.get('omahe:ref:_global')).toBe(
			JSON.stringify({ ref: 'OMHA-A0001', exp: T0 + 90 * HARI, t: T0 })
		);
	});

	test('REF-AGEN-01 — LAST-TOUCH: kode agen lebih baru mengganti OP-… (banner ganti varian)', () => {
		simpanan.set(
			'omahe:ref:_global',
			JSON.stringify({ ref: REF_OP, exp: T0 + 90 * HARI, t: T0 - HARI, nama: 'PT Contoh Mitra' })
		);
		const res = hitungRefLayout({
			browser: true,
			refUrl: 'OMHA-B0002',
			slug: null,
			diRutePerumahan: false,
			url: new URL('https://www.omahe.co.id/?ref=OMHA-B0002'),
			now: T0
		});
		expect(res).toEqual({ ref: 'OMHA-B0002', refGlobalNama: null, refGlobalAgen: 'OMHA-B0002' });
	});

	test('halaman perumahan memilih ref dengan `t` terbaru antara per-slug vs global', () => {
		simpanan.set('omahe:ref:griya-asri', JSON.stringify({ ref: REF, exp: T0 + 90 * HARI, t: T0 }));
		simpanan.set(
			'omahe:ref:_global',
			JSON.stringify({ ref: REF_OP, exp: T0 + 90 * HARI, t: T0 - HARI, nama: 'PT Contoh' })
		);
		const url = new URL('https://www.omahe.co.id/perumahan/griya-asri');
		// per-slug lebih baru → per-slug menang; global masih aktif → nama tampil.
		expect(
			hitungRefLayout({
				browser: true,
				refUrl: null,
				slug: 'griya-asri',
				diRutePerumahan: true,
				url,
				now: T0 + HARI
			})
		).toEqual({ ref: REF, refGlobalNama: 'PT Contoh', refGlobalAgen: null });

		// global disimpan LEBIH BARU → global (OP-…) menang di halaman perumahan.
		simpanan.set(
			'omahe:ref:_global',
			JSON.stringify({ ref: REF_OP, exp: T0 + 90 * HARI, t: T0 + 2 * HARI, nama: 'PT Contoh' })
		);
		expect(
			hitungRefLayout({
				browser: true,
				refUrl: null,
				slug: 'griya-asri',
				diRutePerumahan: true,
				url,
				now: T0 + 3 * HARI
			}).ref
		).toBe(REF_OP);
	});

	test('nama `?mitra=` dibersihkan (tag dibuang, ≤60) dan HANYA saat ref di URL OP-…', () => {
		const res = hitungRefLayout({
			browser: true,
			refUrl: REF_OP,
			slug: null,
			diRutePerumahan: false,
			url: new URL(
				`https://www.omahe.co.id/?ref=${REF_OP}&mitra=${encodeURIComponent('<b>PT</b> Jaya ' + 'x'.repeat(130))}`
			),
			now: T0
		});
		expect(res.refGlobalNama).toBe('PT Jaya ' + 'x'.repeat(60 - 'PT Jaya '.length));

		// ref hex biasa + mitra= → nama TIDAK disimpan (anti-spoof).
		simpanan.clear();
		hitungRefLayout({
			browser: true,
			refUrl: REF,
			slug: 'griya-asri',
			diRutePerumahan: true,
			url: new URL(`https://www.omahe.co.id/perumahan/griya-asri?ref=${REF}&mitra=Bot`),
			now: T0
		});
		expect(simpanan.has('omahe:ref:_global')).toBe(false);
		expect(simpanan.has('omahe:ref:griya-asri')).toBe(true);
	});
});

describe('hitungRefLayout — browser:false (SSR/prerender) → passthrough murni', () => {
	test('ref URL diteruskan apa adanya, TIDAK ada penyimpanan', () => {
		const res = hitungRefLayout({
			browser: false,
			refUrl: REF_OP,
			slug: 'griya-asri',
			diRutePerumahan: true,
			url: new URL(`https://www.omahe.co.id/perumahan/griya-asri?ref=${REF_OP}&mitra=Bot`),
			now: T0
		});
		expect(res).toEqual({ ref: REF_OP, refGlobalNama: null, refGlobalAgen: null });
		expect(simpanan.size).toBe(0);
	});
});

describe('load routes/+layout.ts — wiring asli (bun test: browser false)', () => {
	/** Argumen load palsu — cukup `data` + `url` + `params` + `route.id`. */
	function argumen(url: string, routeId: string, slug?: string) {
		return {
			data: {},
			url: new URL(url),
			params: slug ? { slug } : {},
			route: { id: routeId }
		} as unknown as Parameters<typeof load>[0];
	}

	test('homepage dengan ?ref=OP-… (prerender, re-run pasca-hidrasi) → data.ref terisi', () => {
		const res = load(
			argumen(`https://www.omahe.co.id/?ref=${REF_OP}&mitra=PT%20Contoh%20Mitra`, '/')
		) as { ref: string | null; refGlobalNama: string | null };
		expect(res.ref).toBe(REF_OP);
		// SSR/prerender tidak menyentuh localStorage — nama terisi pasca-hidrasi
		// (jalur browser dikunci di describe `hitungRefLayout` di atas).
		expect(res.refGlobalNama).toBeNull();
	});

	test('halaman perumahan dengan ref hex → passthrough, tidak disimpan tanpa browser', () => {
		const res = load(
			argumen(
				`https://www.omahe.co.id/perumahan/griya-asri?ref=${REF}`,
				'/perumahan/[slug]',
				'griya-asri'
			)
		) as { ref: string | null };
		expect(res.ref).toBe(REF);
		expect(simpanan.size).toBe(0);
	});

	test('`data` layout server diteruskan utuh (kontak ADMIN-05 tidak hilang)', () => {
		const res = load({
			data: { kontak: { whatsapp: '628123' } },
			url: new URL('https://www.omahe.co.id/'),
			params: {},
			route: { id: '/' }
		} as unknown as Parameters<typeof load>[0]) as Record<string, unknown>;
		expect(res.kontak).toEqual({ whatsapp: '628123' });
	});
});

// Pulihkan mock pemicu resolusi supaya file test lain (satu proses `bun test`)
// kembali ke kondisi nyata: tanpa DOM → `browser: false`.
mock.module('$app/environment', () => ({ browser: false }));
