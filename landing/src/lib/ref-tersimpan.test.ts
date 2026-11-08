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
import {
	ambilRef,
	ambilRefGlobal,
	pilihRefEfektif,
	simpanRef,
	simpanRefGlobal
} from './ref-tersimpan';

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
			JSON.stringify({ ref: REF, exp: T0 + 90 * HARI, t: T0 })
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

// ---------------------------------------------------------------------------
// KERJASAMA-03 — ref GLOBAL (`OP-…`, QR kerjasama Omahe × perusahaan)
// ---------------------------------------------------------------------------

const REF_OP = 'OP-QA7MPN';

describe('simpanRefGlobal + ambilRefGlobal (KERJASAMA-03)', () => {
	test('simpan lalu ambil — kunci `omahe:ref:_global`, nilai {ref, exp, t, nama}', () => {
		simpanRefGlobal(REF_OP, 'PT Contoh Mitra', T0);
		expect(simpanan.get('omahe:ref:_global')).toBe(
			JSON.stringify({ ref: REF_OP, exp: T0 + 90 * HARI, t: T0, nama: 'PT Contoh Mitra' })
		);
		expect(ambilRefGlobal(T0 + HARI)).toEqual({ ref: REF_OP, nama: 'PT Contoh Mitra' });
	});

	test('ref bukan pola OP-XXXXXX diabaikan', () => {
		simpanRefGlobal('OP-QA7MP', null, T0);
		simpanRefGlobal(REF, null, T0); // hex64 — bukan OP-
		simpanRefGlobal('OP-0A7MPN', null, T0); // 0 di luar alfabet
		expect(ambilRefGlobal(T0)).toBeNull();
	});

	test('kedaluwarsa 90 hari → null + entri terhapus', () => {
		simpanRefGlobal(REF_OP, 'PT Contoh Mitra', T0);
		expect(ambilRefGlobal(T0 + 91 * HARI)).toBeNull();
		expect(simpanan.has('omahe:ref:_global')).toBe(false);
	});

	test('tanpa nama → nama lama dipertahankan hanya bila ref sama; ref ganti → nama hilang', () => {
		simpanRefGlobal(REF_OP, 'PT Contoh Mitra', T0);
		simpanRefGlobal(REF_OP, undefined, T0 + HARI); // masuk ulang tanpa ?mitra=
		expect(ambilRefGlobal(T0 + 2 * HARI)?.nama).toBe('PT Contoh Mitra');

		simpanRefGlobal('OP-7Q2MNP', undefined, T0 + 3 * HARI); // mitra lain
		expect(ambilRefGlobal(T0 + 3 * HARI)).toEqual({ ref: 'OP-7Q2MNP', nama: null });
	});

	test('nama dipotong 120 karakter', () => {
		simpanRefGlobal(REF_OP, 'X'.repeat(200), T0);
		expect(ambilRefGlobal(T0)?.nama).toHaveLength(120);
	});
});

describe('pilihRefEfektif (KERJASAMA-03 — LAST-TOUCH lintas per-slug vs global)', () => {
	test('URL ref OP-… di halaman mana pun → simpan GLOBAL + jadi ref efektif', () => {
		expect(pilihRefEfektif({ refUrl: REF_OP, slug: null, diRutePerumahan: false, now: T0 })).toBe(
			REF_OP
		);
		expect(ambilRefGlobal(T0 + HARI)?.ref).toBe(REF_OP);
		// TIDAK tersimpan per slug.
		expect(ambilRef('griya-asri', T0 + HARI)).toBeNull();
	});

	test('URL ref OP-… di halaman perumahan → tetap GLOBAL, bukan per slug', () => {
		expect(
			pilihRefEfektif({ refUrl: REF_OP, slug: 'griya-asri', diRutePerumahan: true, now: T0 })
		).toBe(REF_OP);
		expect(ambilRef('griya-asri', T0 + HARI)).toBeNull();
	});

	test('URL ref lain di rute perumahan → simpan per slug (perilaku KERJASAMA-02)', () => {
		expect(
			pilihRefEfektif({ refUrl: REF, slug: 'griya-asri', diRutePerumahan: true, now: T0 })
		).toBe(REF);
		expect(ambilRef('griya-asri', T0 + HARI)).toBe(REF);
		expect(ambilRefGlobal(T0 + HARI)).toBeNull();
	});

	test('URL ref lain di homepage (bukan rute perumahan) → passthrough saja, tidak disimpan', () => {
		expect(pilihRefEfektif({ refUrl: REF, slug: null, diRutePerumahan: false, now: T0 })).toBe(REF);
		expect(ambilRef('griya-asri', T0 + HARI)).toBeNull();
		expect(ambilRefGlobal(T0 + HARI)).toBeNull();
	});

	test('tanpa ref URL di rute perumahan — global lebih baru (t) menang', () => {
		simpanRef('griya-asri', REF, T0);
		simpanRefGlobal(REF_OP, 'PT Contoh', T0 + HARI);
		expect(
			pilihRefEfektif({ refUrl: null, slug: 'griya-asri', diRutePerumahan: true, now: T0 + 2 * HARI })
		).toBe(REF_OP);
	});

	test('tanpa ref URL di rute perumahan — per-slug lebih baru menang (tie → per-slug)', () => {
		simpanRefGlobal(REF_OP, 'PT Contoh', T0);
		simpanRef('griya-asri', REF, T0 + HARI); // t lebih baru
		expect(
			pilihRefEfektif({ refUrl: null, slug: 'griya-asri', diRutePerumahan: true, now: T0 + 2 * HARI })
		).toBe(REF);

		// tepat sama (tie) → per-slug.
		simpanRef('griya-asri', 'X'.repeat(64), T0 + 3 * HARI);
		simpanRefGlobal(REF_OP, 'PT Contoh', T0 + 3 * HARI);
		expect(
			pilihRefEfektif({ refUrl: null, slug: 'griya-asri', diRutePerumahan: true, now: T0 + 4 * HARI })
		).toBe('X'.repeat(64));
	});

	test('bentuk lama tanpa `t` dianggap t=0 — kalah dari global yang punya t', () => {
		simpanan.set(
			'omahe:ref:griya-asri',
			JSON.stringify({ ref: REF, exp: T0 + 90 * HARI }) // KERJASAMA-02: tanpa t
		);
		simpanRefGlobal(REF_OP, 'PT Contoh', T0 + HARI);
		expect(
			pilihRefEfektif({ refUrl: null, slug: 'griya-asri', diRutePerumahan: true, now: T0 + 2 * HARI })
		).toBe(REF_OP);
	});

	test('tanpa ref URL di halaman lain (homepage/dll) → ref global', () => {
		simpanRefGlobal(REF_OP, 'PT Contoh', T0);
		simpanRef('griya-asri', REF, T0 + HARI); // per-slug diabaikan di luar rute perumahan
		expect(pilihRefEfektif({ refUrl: null, slug: null, diRutePerumahan: false, now: T0 + 2 * HARI })).toBe(
			REF_OP
		);
	});

	test('tanpa apa pun → null', () => {
		expect(pilihRefEfektif({ refUrl: null, slug: 'griya-asri', diRutePerumahan: true, now: T0 })).toBeNull();
	});
});
