/**
 * Passthrough `?ref=` — KEWAJIBAN WAJIB Omahe (CLAUDE.md §Redirect
 * `/p/:slug`). Rantai hop-nya:
 *
 *   QR perusahaan mitra → `/p/:slug?ref=<qrCode>` (app `perumahan`)
 *     → redirect ke halaman Omahe (LANDING-05, `ref` ikut terbawa)
 *       → Omahe render halaman detail
 *         → CTA "Ajukan" balik ke `/ajukan/:slug?ref=<qrCode>`
 *
 * Kalau `ref` putus di SATU hop saja, komisi perusahaan mitra tidak tercatat
 * (PRD §4 & §7 repo `perumahan`) — dan tidak ada error yang kelihatan, cuma
 * uang yang hilang diam-diam. Karena itu: setiap link internal Omahe yang
 * dirender saat `ref` aktif WAJIB lewat `withRef()`, dan setiap CTA booking
 * WAJIB lewat `ajukanUrl()`. Jangan pernah menulis href `/ajukan/...` manual.
 */
import { env } from '$env/dynamic/public';

export const REF_PARAM = 'ref';

/**
 * `kerjasama.qrCode` di backend `perumahan` = token acak hex 64 karakter.
 * Pola di bawah sengaja SUPERSET dari itu (alfanumerik + `-`/`_`, maks 64)
 * supaya perubahan generator token di sisi sana tidak diam-diam bikin Omahe
 * membuang ref yang sah — tapi tetap menolak karakter yang bisa dipakai
 * menyelundupkan sesuatu ke URL tujuan.
 */
const REF_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Ambil `ref` dari URL. Nilai yang bentuknya tidak masuk akal dibuang. */
export function readRef(url: URL): string | null {
	const raw = url.searchParams.get(REF_PARAM);
	if (raw === null) return null;
	return REF_PATTERN.test(raw) ? raw : null;
}

/**
 * Tempelkan `ref` ke link INTERNAL Omahe supaya atribusi tidak hilang saat
 * pengunjung menjelajah (mis. dari detail perumahan → profil developer →
 * detail perumahan lain, lalu baru klik Ajukan).
 */
export function withRef(path: string, ref: string | null): string {
	if (!ref) return path;
	const [pathname, hash] = path.split('#');
	const sep = pathname.includes('?') ? '&' : '?';
	return `${pathname}${sep}${REF_PARAM}=${encodeURIComponent(ref)}${hash ? `#${hash}` : ''}`;
}

/**
 * URL CTA booking — kembali ke app `perumahan`, BUKAN route Omahe. Booking
 * tidak pernah dibangun ulang di sini (CLAUDE.md §Arsitektur).
 */
export function ajukanUrl(perumahanSlug: string, ref: string | null): string {
	const base = env.PUBLIC_BOOKING_BASE_URL?.replace(/\/+$/, '') ?? '';
	return withRef(`${base}/ajukan/${encodeURIComponent(perumahanSlug)}`, ref);
}
