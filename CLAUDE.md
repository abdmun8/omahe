# Omahe

Corporate website & property marketplace portal (referensi: mybeyond.co.id, brighton.co.id, rumah123.com).
Tagline: "Where your story begins".

## Status

Tahap planning — belum ada kode. Lihat `docs/user-story.md` untuk brainstorm produk lengkap.

## Arsitektur

Landing/marketplace ini **terpisah** dari aplikasi admin yang sudah ada dan berjalan di repo `~/Code/Project/perumahan`:

- **Admin/backend (existing, repo `perumahan`)**: Hono + Bun + Postgres, frontend React. Ini aplikasi booking & referral **multi-tenant** — satu tenant = satu `perumahan` (developer). Sudah punya alur booking konsumen penuh, referral QR (perusahaan mitra), komisi 2 tingkat, dan **landing page publik per perumahan sendiri** (`/p/:slug`, section builder Hero/Gallery/Pricing/dll) + alur `/ajukan/:slug`. Sumber kebenaran domain: `docs/PRD.md` di repo tsb.
- API publik yang sudah ada: `GET /public/perumahan/:slug` (satu perumahan, tanpa auth). **Belum ada** endpoint list/search lintas-perumahan, dan tabel `perumahan` belum punya field lokasi/rentang harga — ini akan ditambahkan di backend `perumahan` sesuai kebutuhan Omahe (lihat `docs/user-story.md` §Keputusan).
- **Landing/Marketplace (repo ini, `landing/`)**: SvelteKit, dijalankan di Bun runtime (konsisten dengan admin). Consume + extend API dari `perumahan` — tidak akses DB-nya langsung. Omahe berperan sebagai (1) direktori/pencarian lintas-perumahan (gap yang belum ada di `perumahan`) dan (2) render sendiri halaman detail per developer/perumahan (keputusan: bukan link-out ke `/p/:slug` yang sudah ada, meski itu artinya ada duplikasi UI landing page dengan React di `perumahan` — trade-off yang disadari, lihat `docs/user-story.md`).
- Booking, verifikasi KPR, dan komisi/referral **tidak dibangun ulang** di Omahe — itu tetap alur `perumahan` yang sudah jadi.

Alasan pisah: landing itu public-facing/SEO-heavy/read-mostly, admin itu internal/write-heavy — kebutuhan render dan scaling berbeda.

### Redirect `/p/:slug` per-tenant (epic `LANDING-05` di repo `perumahan`)

QR referral kerjasama perumahan×perusahaan mengarah ke `/p/:slug` (stabil, tidak boleh berubah). Per-tenant, perumahan owner bisa isi field `omaheLandingUrl` sendiri (self-service) — kalau terisi, `/p/:slug` redirect ke halaman tenant tsb di Omahe; kalau kosong, tetap fallback ke section builder lama. Detail: `docs/epics/LANDING-05-redirect-omahe.md` di repo `perumahan`.

**Kewajiban wajib di sisi Omahe**: setiap halaman detail developer/perumahan harus baca query param `ref` dari URL saat dibuka, dan meneruskannya lagi ke SETIAP link CTA booking (`/ajukan/:slug?ref=...`) yang balik ke app `perumahan`. Kalau `ref` hilang di satu saja titik hop (QR → `/p/:slug` → Omahe → `/ajukan/:slug`), komisi referral perusahaan mitra tidak tercatat (PRD §4 & §7 repo `perumahan`) — cek ini di setiap PR yang menyentuh routing/CTA booking.

## Stack (landing)

- Framework: SvelteKit (SSR untuk SEO di halaman publik, prerender untuk halaman statis)
- Runtime: Bun
- Node version: lihat `.nvmrc`
- Data: fetch dari API admin via SvelteKit `load` functions (server-side)
- Pertimbangkan cache layer di depan API admin untuk menahan traffic publik yang lebih tinggi dari traffic admin

## Theme

Warna diturunkan dari `docs/omahe-logo.jpeg`: hijau tua (primary) dan gold (accent). Implementasikan sebagai design tokens/CSS variables agar mudah diganti.

## Keputusan Produk

Lihat `docs/user-story.md` bagian "Keputusan" untuk detail (simulasi KPR, grouping properti per developer, kondisi baru/second, dll).
