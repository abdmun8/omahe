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

/** Masa simpan 90 hari (bukan 30: siklus putus-cek pembeli sering lebih panjang). */
const MASA_MS = 90 * 24 * 60 * 60 * 1000;

const kunci = (slug: string) => `omahe:ref:${slug}`;

/**
 * Simpan `ref` untuk perumahan `slug`, kedaluwarsa `now` + 90 hari.
 * LAST-TOUCH: menimpa nilai lama apa pun. `ref` tak lolos pola diabaikan
 * (pemanggil biasanya sudah menyaring lewat `readRef`, tapi guard di sini
 * menjaga modul ini tetap aman dipakai sendirian).
 */
export function simpanRef(slug: string, ref: string, now: number = Date.now()): void {
	if (!slug || !REF_PATTERN.test(ref)) return;
	try {
		localStorage.setItem(kunci(slug), JSON.stringify({ ref, exp: now + MASA_MS }));
	} catch {
		// Storage penuh / diblokir mode privat — atribusi hilang diam-diam,
		// jangan pernah menjatuhkan halaman.
	}
}

/**
 * Ambil `ref` tersimpan untuk `slug` — `null` bila tidak ada, kedaluwarsa,
 * atau bentuknya rusak (selalu dihapus supaya tidak menggantung). Nilai
 * dengan pola aneh dianggap rusak juga.
 */
export function ambilRef(slug: string, now: number = Date.now()): string | null {
	if (!slug) return null;
	let raw: string | null;
	try {
		raw = localStorage.getItem(kunci(slug));
	} catch {
		return null;
	}
	if (raw === null) return null;

	let valid = false;
	let ref: string | null = null;
	try {
		const data = JSON.parse(raw) as { ref?: unknown; exp?: unknown };
		if (
			typeof data?.ref === 'string' &&
			REF_PATTERN.test(data.ref) &&
			typeof data?.exp === 'number' &&
			Number.isFinite(data.exp) &&
			data.exp > now
		) {
			valid = true;
			ref = data.ref;
		}
	} catch {
		// JSON rusak — jatuh ke penghapusan di bawah.
	}
	if (!valid) {
		try {
			localStorage.removeItem(kunci(slug));
		} catch {
			// abaikan — entri basi akan dihapus/ditimpa percobaan berikutnya.
		}
		return null;
	}
	return ref;
}
