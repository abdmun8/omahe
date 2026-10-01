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
 */
import { env } from '$env/dynamic/public';

const base = () => env.PUBLIC_BOOKING_BASE_URL?.replace(/\/+$/, '') ?? '';

/** Form pendaftaran mandiri developer/agen perumahan (AUTH-05 `done`). */
export function daftarPerumahanUrl(): string {
	return `${base()}/daftar/perumahan`;
}

/** Form pendaftaran mandiri mitra perusahaan/profesional (AUTH-05 `done`). */
export function daftarPerusahaanUrl(): string {
	return `${base()}/daftar/perusahaan`;
}

/**
 * Halaman masuk panel (`/login` app `perumahan`) — sekaligus pintu
 * pendaftaran (AUTH-08 "Masuk atau Daftar"). `null` bila
 * `PUBLIC_BOOKING_BASE_URL` belum di-set: tombol disembunyikan, jangan
 * menaut ke `/login` milik Omahe sendiri (tidak ada).
 */
export function loginUrl(): string | null {
	const b = base();
	return b ? `${b}/login` : null;
}
