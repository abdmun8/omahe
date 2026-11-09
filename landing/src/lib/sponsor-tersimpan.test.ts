/**
 * Tes `sponsor-tersimpan` (AGEN-OMAHE-10) + pembentuk URL CTA daftar agen
 * (`urlDaftarAgen`). Jalur senyap seperti ref: kalau rusak, sponsor hanya
 * hilang diam-diam (agen baru mendaftar tanpa atribusi sponsor) tanpa error
 * apa pun — jalur seperti ini wajib dikunci tes.
 *
 * Juga mengunci pemisahan `sponsor` vs `ref`: modul ini TIDAK boleh
 * menyentuh kunci `omahe:ref:*` (atribusi pembeli, dibaca root layout).
 *
 * `globalThis.localStorage` diganti stub Map sederhana supaya deterministik
 * (pola `ref-tersimpan.test.ts`).
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
	ambilSponsor,
	normalisasiSponsor,
	simpanSponsor,
	sponsorEfektif
} from './sponsor-tersimpan';
import { urlDaftarAgen } from './app-url';

const HARI = 24 * 60 * 60 * 1000;
const T0 = 1_700_000_000_000;
const KUNCI = 'omahe:sponsor';
const KODE = 'OMHA-A0001';

const simpanan = new Map<string, string>();
const storageStub = {
	getItem: (k: string) => (simpanan.has(k) ? simpanan.get(k)! : null),
	setItem: (k: string, v: string) => void simpanan.set(k, v),
	removeItem: (k: string) => void simpanan.delete(k),
	clear: () => void simpanan.clear()
} as unknown as Storage;

const asli = globalThis.localStorage;

beforeEach(() => {
	simpanan.clear();
	(globalThis as { localStorage: Storage }).localStorage = storageStub;
});

afterEach(() => {
	(globalThis as { localStorage: Storage }).localStorage = asli;
});

describe('normalisasiSponsor', () => {
	test('trim + uppercase diterima', () => {
		expect(normalisasiSponsor('  omha-a0001 ')).toBe(KODE);
	});

	test('bentuk sah apa adanya', () => {
		expect(normalisasiSponsor(KODE)).toBe(KODE);
		expect(normalisasiSponsor('X9')).toBe('X9');
	});

	test('kosong / null / undefined → null', () => {
		expect(normalisasiSponsor('')).toBeNull();
		expect(normalisasiSponsor('   ')).toBeNull();
		expect(normalisasiSponsor(null)).toBeNull();
		expect(normalisasiSponsor(undefined)).toBeNull();
	});

	test('karakter di luar [A-Z0-9-] diabaikan seluruhnya (bukan disaring)', () => {
		expect(normalisasiSponsor('OMHA A0001')).toBeNull(); // spasi di tengah
		expect(normalisasiSponsor('OMHA_A0001')).toBeNull();
		expect(normalisasiSponsor('OMHA-A0001\r\n')).toBe(KODE); // \r\n spesial: trim dulu
		expect(normalisasiSponsor('<script>')).toBeNull();
		expect(normalisasiSponsor('OMHA-A0001?x=1')).toBeNull();
	});

	test('lebih dari 20 karakter → null', () => {
		expect(normalisasiSponsor('A'.repeat(20))).toBe('A'.repeat(20));
		expect(normalisasiSponsor('A'.repeat(21))).toBeNull();
	});
});

describe('simpanSponsor + ambilSponsor', () => {
	test('simpan lalu ambil — nilai utuh, kunci `omahe:sponsor`', () => {
		simpanSponsor(KODE, T0);
		expect(simpanan.get(KUNCI)).toBe(JSON.stringify({ sponsor: KODE, exp: T0 + 90 * HARI }));
		expect(ambilSponsor(T0 + HARI)).toBe(KODE);
	});

	test('LAST-TOUCH: simpan ulang menimpa kode lama', () => {
		simpanSponsor(KODE, T0);
		simpanSponsor('OMHA-B0002', T0 + 10 * HARI);
		expect(ambilSponsor(T0 + 11 * HARI)).toBe('OMHA-B0002');
	});

	test('input tak sah TIDAK menimpa nilai tersimpan', () => {
		simpanSponsor(KODE, T0);
		simpanSponsor('bukan-kode<script>', T0 + 10 * HARI);
		expect(ambilSponsor(T0 + 11 * HARI)).toBe(KODE);
	});

	test('TIDAK menyentuh kunci ref pembeli (omahe:ref:*)', () => {
		simpanan.set('omahe:ref:_global', '{"ref":"OP-QA7MPN"}');
		simpanSponsor(KODE, T0);
		// ref tetap utuh (dibaca root layout untuk atribusi pembeli), sponsor
		// hanya menulis kunci miliknya sendiri.
		expect(simpanan.get('omahe:ref:_global')).toBe('{"ref":"OP-QA7MPN"}');
		expect([...simpanan.keys()].sort()).toEqual(['omahe:ref:_global', KUNCI]);
	});
});

describe('kedaluwarsa 90 hari', () => {
	test('hari ke-89 masih sah', () => {
		simpanSponsor(KODE, T0);
		expect(ambilSponsor(T0 + 89 * HARI)).toBe(KODE);
	});

	test('hari ke-91 → null DAN entri terhapus', () => {
		simpanSponsor(KODE, T0);
		expect(ambilSponsor(T0 + 91 * HARI)).toBeNull();
		expect(simpanan.has(KUNCI)).toBe(false);
	});

	test('tepat pada exp (90 hari) sudah kedaluwarsa', () => {
		simpanSponsor(KODE, T0);
		expect(ambilSponsor(T0 + 90 * HARI)).toBeNull();
	});
});

describe('simpanan rusak / localStorage bermasalah', () => {
	test('JSON rusak → null + entri dihapus', () => {
		simpanan.set(KUNCI, '{bukan json');
		expect(ambilSponsor(T0)).toBeNull();
		expect(simpanan.has(KUNCI)).toBe(false);
	});

	test('nilai sponsor tidak cocok pola (input jahat langsung ke storage) → null', () => {
		simpanan.set(KUNCI, JSON.stringify({ sponsor: '<script>alert(1)</script>', exp: T0 + HARI }));
		expect(ambilSponsor(T0)).toBeNull();
		simpanan.set(KUNCI, JSON.stringify({ sponsor: 'A'.repeat(25), exp: T0 + HARI }));
		expect(ambilSponsor(T0)).toBeNull();
	});

	test('exp bukan angka / sudah lewat → null', () => {
		simpanan.set(KUNCI, JSON.stringify({ sponsor: KODE, exp: 'nanti' }));
		expect(ambilSponsor(T0)).toBeNull();
	});

	test('localStorage melempar saat getItem → null tanpa jatuh', () => {
		(globalThis as { localStorage: Storage }).localStorage = {
			...storageStub,
			getItem: () => {
				throw new Error('blocked');
			}
		} as unknown as Storage;
		expect(ambilSponsor(T0)).toBeNull();
	});

	test('localStorage melempar saat setItem → tidak jatuh, tidak tersimpan', () => {
		(globalThis as { localStorage: Storage }).localStorage = {
			...storageStub,
			setItem: () => {
				throw new Error('blocked');
			}
		} as unknown as Storage;
		simpanSponsor(KODE, T0);
		expect(ambilSponsor(T0)).toBeNull();
	});
});

describe('sponsorEfektif (logika halaman /gabung/agen)', () => {
	test('sponsor di URL menang + tersimpan 90 hari (LAST-TOUCH)', () => {
		simpanSponsor('OMHA-LAMA1', T0 - 5 * HARI);
		expect(sponsorEfektif('omha-a0001', T0)).toBe(KODE);
		expect(ambilSponsor(T0 + 1 * HARI)).toBe(KODE);
	});

	test('URL tanpa sponsor / tak sah → pakai yang tersimpan', () => {
		simpanSponsor(KODE, T0 - 5 * HARI);
		expect(sponsorEfektif(null, T0)).toBe(KODE);
		expect(sponsorEfektif('<bukan sponsor>', T0)).toBe(KODE);
	});

	test('tanpa URL & tanpa simpanan → null', () => {
		expect(sponsorEfektif(null, T0)).toBeNull();
	});
});

describe('urlDaftarAgen (pembentuk URL CTA)', () => {
	test('tanpa sponsor → /daftar/agen tanpa param sponsor', () => {
		expect(urlDaftarAgen('https://app.omahe.co.id')).toBe(
			'https://app.omahe.co.id/daftar/agen?src=omahe-gabung'
		);
	});

	test('base dengan trailing slash tetap bersih', () => {
		expect(urlDaftarAgen('https://app.omahe.co.id///')).toBe(
			'https://app.omahe.co.id/daftar/agen?src=omahe-gabung'
		);
	});

	test('dengan sponsor → ?sponsor= setelah src, ter-encode', () => {
		expect(urlDaftarAgen('https://app.omahe.co.id', KODE)).toBe(
			'https://app.omahe.co.id/daftar/agen?src=omahe-gabung&sponsor=OMHA-A0001'
		);
		expect(urlDaftarAgen('https://app.omahe.co.id', 'X 1&y=2')).toBe(
			'https://app.omahe.co.id/daftar/agen?src=omahe-gabung&sponsor=X%201%26y%3D2'
		);
	});

	test('sponsor kosong/whitespace → sama seperti tanpa sponsor', () => {
		expect(urlDaftarAgen('https://app.omahe.co.id', '')).toBe(
			'https://app.omahe.co.id/daftar/agen?src=omahe-gabung'
		);
		expect(urlDaftarAgen('https://app.omahe.co.id', '   ')).toBe(
			'https://app.omahe.co.id/daftar/agen?src=omahe-gabung'
		);
		expect(urlDaftarAgen('https://app.omahe.co.id', null)).toBe(
			'https://app.omahe.co.id/daftar/agen?src=omahe-gabung'
		);
	});
});
