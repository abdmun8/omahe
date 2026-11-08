/**
 * KERJASAMA-02 — `ref` kerjasama TERSIMPAN 90 hari per slug perumahan,
 * browser saja (localStorage).
 *
 * Motivasi: pembeli memindai QR kerjasama → mendarat di halaman perumahan
 * dengan `?ref=<hex64>` → menutup tab → kembali BEBERAPA HARI KEMUDIAN
 * lewat Google/bookmark tanpa query string. Tanpa penyimpanan ini `ref`
 * hilang, CTA "Ajukan" tidak membawa atribusi, dan komisi perusahaan
 * mitra hilang diam-diam (PRD §4 & §7 repo `perumahan` — jalur ref yang
 * putus tidak menimbulkan error apa pun).
 *
 * Aturan LAST-TOUCH: `ref` yang ada di URL SELALU menimpa nilai tersimpan
 * (dijalankan di `routes/+layout.ts`, universal load, hanya di browser,
 * hanya untuk route `/perumahan/[slug]…` — detail perumahan & halaman
 * tipe). Bila URL tanpa `ref`, nilai tersimpan dipakai mengisi
 * `page.data.ref` sehingga `ajukanUrl()` & form minat otomatis membawanya.
 * URL bar TIDAK diubah (tanpa history spam; Google tetap melihat URL
 * bersih).
 *
 * KEAMANAN bentuk: pola ref sama dengan passthrough `?ref=` (`REF_PATTERN`
 * di `src/lib/ref.ts`) — nilai yang bisa menyelundupkan sesuatu ke URL
 * tujuan tidak pernah disimpan/dipakai ulang. Semua akses localStorage di
 * dalam try/catch: mode privat/Safari terblokir → atribusi hilang, tapi
 * halaman TIDAK BOLEH jatuh.
 */
import { REF_PATTERN } from './ref';
import { bersihkanNamaMitra, REF_OMAHE_PATTERN } from './ref-pola';

/** Masa simpan 90 hari (bukan 30: siklus putus-cek pembeli sering lebih panjang). */
const MASA_MS = 90 * 24 * 60 * 60 * 1000;

const kunci = (slug: string) => `omahe:ref:${slug}`;

/** KERJASAMA-03 — kunci ref GLOBAL (QR kerjasama Omahe × perusahaan). */
const KUNCI_GLOBAL = 'omahe:ref:_global';

/** Bentuk tersimpan per slug — `t` aditif (KERJASAMA-03; bentuk lama tanpa
 *  `t` tetap dibaca, dianggap `t = 0`). */
interface MetaRef {
	ref: string;
	exp: number;
	t?: number;
	nama?: string;
}

/** Baca + validasi satu entri simpanan; rusak/kedaluwarsa → hapus + null. */
function bacaMeta(kunciNilai: string, now: number): MetaRef | null {
	let raw: string | null;
	try {
		raw = localStorage.getItem(kunciNilai);
	} catch {
		return null;
	}
	if (raw === null) return null;

	let meta: MetaRef | null = null;
	try {
		const data = JSON.parse(raw) as MetaRef;
		if (
			typeof data?.ref === 'string' &&
			REF_PATTERN.test(data.ref) &&
			typeof data?.exp === 'number' &&
			Number.isFinite(data.exp) &&
			data.exp > now
		) {
			meta = data;
		}
	} catch {
		// JSON rusak — jatuh ke penghapusan di bawah.
	}
	if (!meta) {
		try {
			localStorage.removeItem(kunciNilai);
		} catch {
			// abaikan — entri basi akan dihapus/ditimpa percobaan berikutnya.
		}
		return null;
	}
	return meta;
}

function tulisMeta(kunciNilai: string, meta: MetaRef): void {
	try {
		localStorage.setItem(kunciNilai, JSON.stringify(meta));
	} catch {
		// Storage penuh / diblokir mode privat — atribusi hilang diam-diam,
		// jangan pernah menjatuhkan halaman.
	}
}

/**
 * Simpan `ref` untuk perumahan `slug`, kedaluwarsa `now` + 90 hari.
 * LAST-TOUCH: menimpa nilai lama apa pun. `ref` tak lolos pola diabaikan
 * (pemanggil biasanya sudah menyaring lewat `readRef`, tapi guard di sini
 * menjaga modul ini tetap aman dipakai sendirian).
 */
export function simpanRef(slug: string, ref: string, now: number = Date.now()): void {
	if (!slug || !REF_PATTERN.test(ref)) return;
	tulisMeta(kunci(slug), { ref, exp: now + MASA_MS, t: now });
}

/**
 * Ambil `ref` tersimpan untuk `slug` — `null` bila tidak ada, kedaluwarsa,
 * atau bentuknya rusak (selalu dihapus supaya tidak menggantung). Nilai
 * dengan pola aneh dianggap rusak juga.
 */
export function ambilRef(slug: string, now: number = Date.now()): string | null {
	if (!slug) return null;
	return bacaMeta(kunci(slug), now)?.ref ?? null;
}

// ---------------------------------------------------------------------------
// KERJASAMA-03 — ref GLOBAL (QR kerjasama Omahe × perusahaan, `OP-…`)
// ---------------------------------------------------------------------------

/**
 * Simpan ref GLOBAL (kunci `omahe:ref:_global`, 90 hari) + `t` (LAST-TOUCH
 * lintas per-slug vs global). `nama` = nama perusahaan dari `?mitra=` hasil
 * resolve `/q/:kode` — LABEL TAMPILAN SAJA (banner "Rekomendasi dari …");
 * atribusi tetap dari `ref`. Bila `nama` kosong/undefined: nama lama DIPERTAHANKAN
 * hanya bila ref yang tersimpan sudah sama (hindari nama mitra lama menempel
 * ke kode mitra lain).
 */
export function simpanRefGlobal(
	ref: string,
	nama?: string | null,
	now: number = Date.now()
): void {
	if (!REF_OMAHE_PATTERN.test(ref)) return;
	let namaFinal: string | null = null;
	if (nama && nama.trim()) {
		namaFinal = nama.trim().slice(0, 120);
	} else {
		const lama = bacaMeta(KUNCI_GLOBAL, now);
		if (lama && lama.ref === ref && typeof lama.nama === 'string' && lama.nama) {
			namaFinal = lama.nama;
		}
	}
	tulisMeta(KUNCI_GLOBAL, {
		ref,
		exp: now + MASA_MS,
		t: now,
		...(namaFinal ? { nama: namaFinal } : {})
	});
}

/**
 * Ambil ref GLOBAL — `{ref, nama}` (nama `null` bila tidak pernah diketahui);
 * `null` bila tidak ada/kedaluwarsa/rusak (entri basi dihapus).
 */
export function ambilRefGlobal(now: number = Date.now()): { ref: string; nama: string | null } | null {
	const meta = bacaMeta(KUNCI_GLOBAL, now);
	if (!meta || !REF_OMAHE_PATTERN.test(meta.ref)) return null;
	return { ref: meta.ref, nama: typeof meta.nama === 'string' ? meta.nama : null };
}

/**
 * Logika lengkap layout root untuk ref (KERJASAMA-02/03) — DIEKSTRAK dari
 * `routes/+layout.ts` supaya bisa diuji langsung (bun test tidak bisa
 * me-mock `$app/environment`: shim natifnya hard-coded `browser:false` di
 * file proyek, dan mock.module tidak menjangkau import di file lain).
 * `+layout.ts` tinggal pembungkus tipis yang mengambil `browser` asli.
 *
 * Aturan (semua penyimpanan HANYA bila `browser`):
 *   - `refUrl` berbentuk `OP-…` → simpan sebagai ref GLOBAL di halaman mana
 *     pun; `nama` diambil dari `?mitra=` URL (dibersihkan) — label tampilan
 *     saja, atribusi tetap dari ref yang divalidasi backend.
 *   - `refUrl` lain di rute `/perumahan/[slug]…` → simpan per slug.
 *   - Tanpa `refUrl`: rute perumahan → yang `t`-nya terbaru antara per-slug
 *     vs global; halaman lain → global (link kartu `withRef` ikut membawa).
 *   - `refGlobalNama` = nama perusahaan pada ref global (untuk banner
 *     homepage), null bila tidak ada/tanpa nama.
 * Tanpa browser (SSR/prerender) → murni passthrough `refUrl`.
 */
export function hitungRefLayout(opts: {
	browser: boolean;
	refUrl: string | null;
	slug: string | null;
	diRutePerumahan: boolean;
	url: URL;
	now?: number;
}): { ref: string | null; refGlobalNama: string | null } {
	let ref = opts.refUrl;
	let refGlobalNama: string | null = null;

	if (opts.browser) {
		const now = opts.now ?? Date.now();
		ref = pilihRefEfektif({
			refUrl: opts.refUrl,
			slug: opts.slug,
			diRutePerumahan: opts.diRutePerumahan,
			namaMitra:
				opts.refUrl && REF_OMAHE_PATTERN.test(opts.refUrl)
					? bersihkanNamaMitra(opts.url.searchParams.get('mitra'))
					: null,
			now
		});
		refGlobalNama = ambilRefGlobal(now)?.nama ?? null;
	}
	return { ref, refGlobalNama };
}

/**
 * LAST-TOUCH lintas per-slug & global (KEPUTUSAN KERJASAMA-03, dipanggil
 * `hitungRefLayout` — yang dijalankan `routes/+layout.ts`, browser saja):
 *   - `refUrl` berbentuk `OP-…` → simpan sebagai ref GLOBAL (di halaman
 *     mana pun, termasuk homepage); `namaMitra` dari `?mitra=` ikut disimpan
 *     bila ada (sudah dibersihkan pemanggil).
 *   - `refUrl` lain di rute `/perumahan/[slug]…` → simpan per slug (perilaku
 *     KERJASAMA-02).
 *   - Tanpa `refUrl`: di rute perumahan → ref dengan `t` PALING BARU antara
 *     per-slug dan global (tie → per-slug, lebih spesifik); halaman lain →
 *     ref global (link kartu `withRef` otomatis membawanya).
 * `page.data.ref` tetap satu-satunya sumber untuk `ajukanUrl()` & form minat.
 */
export function pilihRefEfektif(opts: {
	refUrl: string | null;
	slug: string | null;
	diRutePerumahan: boolean;
	namaMitra?: string | null;
	now?: number;
}): string | null {
	const now = opts.now ?? Date.now();
	if (opts.refUrl) {
		if (REF_OMAHE_PATTERN.test(opts.refUrl)) {
			simpanRefGlobal(opts.refUrl, opts.namaMitra ?? null, now);
			return opts.refUrl;
		}
		if (opts.diRutePerumahan && opts.slug) simpanRef(opts.slug, opts.refUrl, now);
		return opts.refUrl;
	}

	const metaGlobal = bacaMeta(KUNCI_GLOBAL, now);
	const metaSlug =
		opts.diRutePerumahan && opts.slug ? bacaMeta(kunci(opts.slug), now) : null;
	if (metaSlug && metaGlobal) {
		// Bentuk lama tanpa `t` dianggap `t = 0` — selalu kalah dari yang punya `t`.
		return (metaSlug.t ?? 0) >= (metaGlobal.t ?? 0) ? metaSlug.ref : metaGlobal.ref;
	}
	if (metaSlug) return metaSlug.ref;
	if (metaGlobal && REF_OMAHE_PATTERN.test(metaGlobal.ref)) return metaGlobal.ref;
	return null;
}
