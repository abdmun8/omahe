/**
 * ADMIN-05 — `/kontak` TIDAK lagi di-prerender: nomor WhatsApp/telepon/email
 * kini diatur principal di admin (`/public/app-settings`, dimuat
 * `+layout.server.ts`). Prerender akan membekukan nomor saat build, jadi
 * halaman ini SSR dengan cache edge (`+page.server.ts`).
 */
export const prerender = false;
