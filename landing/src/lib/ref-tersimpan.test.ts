/**
 * Tes `ref-tersimpan` (KERJASAMA-02) — jalur yang kalau rusak TIDAK
 * melempar error apa pun, cuma komisi perusahaan mitra yang hilang diam-diam
 * (pembeli kembali ke halaman perumahan lewat Google tanpa `?ref=` setelah
 * memindai QR). Jalur senyap seperti ini yang paling wajib dikunci tes.
 *
 * `globalThis.localStorage` diganti stub Map sederhana supaya deterministik
 * (runtime Bun punya localStorage sendiri, tapi stub membuat semantik
 * tersedia/bocor/lempar bisa dikontrol per tes).
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { ambilRef, simpanRef } from './ref-tersimpan';

const HARI = 24 * 60 * 60 * 1000;
const T0 = 1_700_000_000_000;
const KUNCI = (slug: string) => `omahe:ref:${slug}`;
const REF = 'a1b2c3d4e5f60718a9b0c1d2e3f40516a7b8c9d0e1f20314a5b6c7d8e9f0a1b2';

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

describe('simpanRef + ambilRef', () => {
	test('simpan lalu ambil — nilai utuh, kunci `omahe:ref:<slug>`', () => {
		simpanRef('griya-asri', REF, T0);
		expect(simpanan.get(KUNCI('griya-asri'))).toBe(
			JSON.stringify({ ref: REF, exp: T0 + 90 * HARI })
		);
		expect(ambilRef('griya-asri', T0 + HARI)).toBe(REF);
	});

	test('ref tersimpan per slug — slug lain tidak bocor', () => {
		simpanRef('griya-asri', REF, T0);
		expect(ambilRef('perumahan-lain', T0 + HARI)).toBeNull();
	});

	test('LAST-TOUCH: simpan ulang menimpa ref lama (exp ikut bergeser)', () => {
		simpanRef('griya-asri', REF, T0);
		const refBaru = 'X'.repeat(64);
		simpanRef('griya-asri', refBaru, T0 + 85 * HARI);
		// exp baru = T0+85d+90d — 89 hari SETELAH simpan ulang masih sah,
		// padahal exp lama (T0+90d) sudah lewat.
		expect(ambilRef('griya-asri', T0 + 85 * HARI + 89 * HARI)).toBe(refBaru);
	});
});

describe('kedaluwarsa 90 hari', () => {
	test('hari ke-89 masih sah', () => {
		simpanRef('griya-asri', REF, T0);
		expect(ambilRef('griya-asri', T0 + 89 * HARI)).toBe(REF);
	});

	test('hari ke-91 → null DAN entri terhapus', () => {
		simpanRef('griya-asri', REF, T0);
		expect(ambilRef('griya-asri', T0 + 91 * HARI)).toBeNull();
		expect(simpanan.has(KUNCI('griya-asri'))).toBe(false);
	});

	test('tepat pada exp (90 hari) sudah kedaluwarsa', () => {
		simpanRef('griya-asri', REF, T0);
		expect(ambilRef('griya-asri', T0 + 90 * HARI)).toBeNull();
	});
});

describe('bentuk rusak dihapus, bukan crash', () => {
	test('JSON rusak → null + terhapus', () => {
		simpanan.set(KUNCI('griya-asri'), 'bukan-json{{{');
		expect(ambilRef('griya-asri', T0)).toBeNull();
		expect(simpanan.has(KUNCI('griya-asri'))).toBe(false);
	});

	test('ref dengan pola aneh di nilai tersimpan → null + terhapus', () => {
		simpanan.set(KUNCI('griya-asri'), JSON.stringify({ ref: '../../etc/passwd', exp: T0 + HARI }));
		expect(ambilRef('griya-asri', T0)).toBeNull();
		expect(simpanan.has(KUNCI('griya-asri'))).toBe(false);
	});

	test('exp bukan angka / NaN → null + terhapus', () => {
		simpanan.set(KUNCI('a'), JSON.stringify({ ref: REF, exp: 'besok' }));
		simpanan.set(KUNCI('b'), JSON.stringify({ ref: REF, exp: Number.NaN }));
		expect(ambilRef('a', T0)).toBeNull();
		expect(ambilRef('b', T0)).toBeNull();
		expect(simpanan.has(KUNCI('a'))).toBe(false);
		expect(simpanan.has(KUNCI('b'))).toBe(false);
	});
});

describe('simpanRef menolak ref tak lolos pola', () => {
	test('ref pola aneh tidak pernah disimpan', () => {
		for (const salah of ['', '../x', 'a b', `${'a'.repeat(65)}`, 'abc&utm=x']) {
			simpanRef('griya-asri', salah, T0);
			expect(simpanan.has(KUNCI('griya-asri'))).toBe(false);
		}
	});
});

describe('localStorage melempar → tidak crash', () => {
	test('setItem gagal (mode privat / penuh) — senyap', () => {
		(globalThis as { localStorage: Storage }).localStorage = {
			setItem: () => {
				throw new Error('QuotaExceededError');
			}
		} as unknown as Storage;
		expect(() => simpanRef('griya-asri', REF, T0)).not.toThrow();
	});

	test('getItem gagal → null', () => {
		(globalThis as { localStorage: Storage }).localStorage = {
			getItem: () => {
				throw new Error('SecurityError');
			}
		} as unknown as Storage;
		expect(ambilRef('griya-asri', T0)).toBeNull();
	});

	test('removeItem gagal saat entri basi — tetap null, tidak crash', () => {
		(globalThis as { localStorage: Storage }).localStorage = {
			getItem: () => 'rusak{{',
			removeItem: () => {
				throw new Error('SecurityError');
			}
		} as unknown as Storage;
		expect(ambilRef('griya-asri', T0)).toBeNull();
	});
});
