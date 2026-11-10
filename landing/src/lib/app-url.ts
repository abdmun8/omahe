/**
 * URL lintas-app ke form pendaftaran mandiri (AUTH-05, `done` 2026-09-14) di
 * app `perumahan` — Omahe TIDAK membangun ulang form pendaftaran, sama
 * seperti booking lewat `ajukanUrl()` (CLAUDE.md §Arsitektur):
 *   - `/daftar/perumahan`  — developer / agen properti (satu role owner,
 *     label saja — keputusan AUTH-05 #2).
 *   - `/daftar/perusahaan` — mitra profesional (KJPP, notaris, asuransi,
 *     pemborong, arsitek, dll; toggle "mewakili perusahaan").
 *
 * Variabel `PUBLIC_BOOKING_BASE_URL` memang bernama "booking", tapi itu
 * satu-satunya base URL app `perumahan` yang diketahui Omahe — dipakai
 * bersama `ajukanUrl()` di `ref.ts`.
 *
 * TIDAK ada passthrough `?ref=`: pendaftaran di luar rantai komisi
 * perumahan (pola yang sama dengan kontak mitra, api-contract.md §9).
 *
 * AUTH-14 (2026-11-03) — `?src=` sumber pendaftaran (whitelist `[a-z0-9-]`
 * di backend), tampil di halaman review superadmin; bawaan `omahe-gabung`
 * karena semua pemanggil ada di `/gabung/*`.
 */
import { env } from '$env/dynamic/public';

const base = () => env.PUBLIC_BOOKING_BASE_URL?.replace(/\/+$/, '') ?? '';

/** Form pendaftaran mandiri developer/agen perumahan (AUTH-05 `done`). */
export function daftarPerumahanUrl(sumber = 'omahe-gabung'): string {
	return `${base()}/daftar/perumahan?src=${sumber}`;
}

/** Form pendaftaran mandiri mitra perusahaan/profesional (AUTH-05 `done`). */
export function daftarPerusahaanUrl(sumber = 'omahe-gabung'): string {
	return `${base()}/daftar/perusahaan?src=${sumber}`;
}

/** Form daftar mandiri agen Omahe (AGEN-OMAHE-10) + sponsor opsional. */
export function daftarAgenUrl(sponsor?: string | null): string {
	return urlDaftarAgen(base(), sponsor);
}

/**
 * AGEN-OMAHE-10 — form daftar mandiri agen Omahe di app panel
 * (`/daftar/agen`): cukup nomor WhatsApp (alur WA AUTH-08), gratis Rp0,
 * langsung aktif. `sponsor` opsional = kode agen `OMHA-A…` dari link
 * referral `https://www.omahe.co.id/gabung/agen?sponsor=…` — param
 * `sponsor`, BUKAN `ref` (lihat `src/lib/sponsor-tersimpan.ts`).
 *
 * Fungsi MURNI (base dari argumen) supaya bisa diuji tanpa env; pemanggil
 * di komponen memakai `daftarAgenUrl()` di atas.
 */
export function urlDaftarAgen(base: string, sponsor?: string | null): string {
	const b = base.replace(/\/+$/, '');
	const s = sponsor?.trim();
	return s
		? `${b}/daftar/agen?src=omahe-gabung&sponsor=${encodeURIComponent(s)}`
		: `${b}/daftar/agen?src=omahe-gabung`;
}

/** Halaman masuk panel (`/login` app `perumahan`) — sekaligus pintu
 * pendaftaran (AUTH-08 "Masuk atau Daftar"). `null` bila
 * `PUBLIC_BOOKING_BASE_URL` belum di-set: tombol disembunyikan, jangan
 * menaut ke `/login` milik Omahe sendiri (tidak ada).
 */
export function loginUrl(): string | null {
	const b = base();
	return b ? `${b}/login` : null;
}

/**
 * SESI-OMAHE-01 — halaman logout publik AUTH-11 (`/logout?redirect=`):
 * JWT stateless + cookie `session` httpOnly hanya bisa dihapus lewat
 * respons backend `perumahan`, jadi Omahe cukup mengarahkan browser ke
 * sini. `redirect` = URL halaman Omahe saat ini — allowlist AUTH-10 di app
 * menerima domain `*.omahe.co.id`, user kembali ke halaman yang sama.
 * `null` bila base URL belum di-set (menu disembunyikan).
 */
export function logoutUrl(redirect: string): string | null {
	const b = base();
	return b ? `${b}/logout?redirect=${encodeURIComponent(redirect)}` : null;
}
