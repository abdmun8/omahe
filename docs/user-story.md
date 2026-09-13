# Landing Page & website
Saya ingin membuat Website Perusahaan (Corporate Website) berbasis Portal / Marketplace Properti referensi:  https://www.mybeyond.co.id/, https://www.brighton.co.id/ dan https://www.rumah123.com/

# Theme color
sesuaikan dengan omahe-logo.jpeg
pastika support ganti warna dengan mudah

# Simulasi cicilan KPR Bank
Referensi: https://www.rumah123.com/kpr/bank/

Apakah kita juga perlu real cicilan KPR langsung di website? sample https://www.bankmandiri.co.id/en/kalkulator-kpr

# Grouping Properti berdasarkan pengembang perumahan atau mereka juga bisa cari perumahannya

# Rumah Baru dan Second

Mari diskusikan, mana yang lebih baik kita pakai? saya tidak prefer nextjs karena berat untuk development

# Keputusan (hasil diskusi)

## Tech stack
- **Landing/Marketplace**: SvelteKit, dijalankan di Bun runtime. Alasan: SSR built-in (bagus untuk SEO), lebih ringan & sederhana dibanding Next.js, tapi tetap full app framework (routing, server load functions, form actions) — cocok untuk kebutuhan full marketplace, bukan cuma content site.
- Astro dipertimbangkan tapi tidak dipilih karena filosofinya "mostly static + islands", kurang cocok untuk bagian app-y (dashboard, auth, form CRUD) yang dibutuhkan marketplace penuh.

## Arsitektur: Landing terpisah dari Admin
- Aplikasi admin **sudah ada dan berjalan** di repo terpisah `~/Code/Project/perumahan`: Hono + Bun + Postgres, frontend React. Ini adalah aplikasi **booking & referral multi-tenant** — satu tenant = satu `perumahan` (developer), dengan alur booking konsumen penuh (survei → KTP → verifikasi KPR multi-bank manual → DP bertahap → akad), referral berbasis QR dari `perusahaan` mitra, dan komisi 2 tingkat. Detail lengkap: `docs/PRD.md` di repo tsb.
- App tsb **sudah punya public landing page per perumahan** (`/p/:slug`, section builder: Hero/Gallery/Facilities/Location/Pricing/Testimonials/FAQ/CTA/Contact) + alur booking publik (`/ajukan/:slug`, wizard, status pengajuan) — semua di-render React frontend yang sama. QR referral kerjasama perumahan×perusahaan saat ini mengarah langsung ke `/p/:slug` ini.
- **Keputusan**: Omahe **tetap me-render sendiri** halaman detail per developer/perumahan (bukan cuma link-out ke `/p/:slug` yang sudah ada) — data di-fetch dari API `perumahan`, dan kalau API yang ada belum cukup (mis. butuh endpoint baru untuk field tertentu), endpoint baru ditambahkan di backend `perumahan`. Konsekuensi: ada duplikasi kerja render dengan landing page React yang sudah ada.
- **Resolusi QR/`\/p/:slug`** (epic [`LANDING-05`](../../perumahan/docs/epics/LANDING-05-redirect-omahe.md) di repo `perumahan`, `todo`): per-tenant, self-service oleh perumahan owner. Field `omaheLandingUrl` (nullable) di tabel `perumahan` — kalau diisi, `/p/:slug` redirect ke URL Omahe tenant tsb (query string `?ref=` ikut terbawa); kalau kosong, tetap fallback ke section builder lama. Jadi `/p/:slug` tetap jadi entry point QR yang stabil selamanya, migrasi ke Omahe per-tenant tanpa merusak QR yang sudah dicetak.
- **Kewajiban di sisi Omahe** (supaya `LANDING-05` di atas jalan end-to-end): baca query param `ref` saat landing dibuka, teruskan lagi ke link CTA booking (`/ajukan/:slug?ref=...`) yang balik ke app `perumahan` — kalau putus di salah satu hop, komisi referral perusahaan mitra tidak tercatat (PRD §4 & §7 di repo `perumahan`).
- API publik yang **sudah ada** di `perumahan`: `GET /public/perumahan/:slug` (profil satu perumahan, termasuk `sections` landing builder — TANPA auth, 404 kalau `isActive=false`). **Belum ada** endpoint list/search lintas-perumahan — ini perlu ditambahkan di backend `perumahan` untuk kebutuhan direktori/pencarian Omahe.
- **Gap data & endpoint pencarian** (epic [`UNIT-04`](../../perumahan/docs/epics/UNIT-04-pencarian-publik-lintas-perumahan.md) di repo `perumahan`, `todo`): tabel `perumahan` belum punya field lokasi — ditambah `regionKode` (relasi ke `regions`/modul `wilayah` yang sudah ada, data Kemendagri berjenjang). Endpoint baru `GET /public/units` (tanpa auth, paginasi, filter `regionKode`/`hargaMin`/`hargaMax`/`tipe`/`perumahanSlug`, hanya unit `status=tersedia` dari perumahan `isActive=true`) — field operasional internal (`blok`, `nomor`, `marketingUserId`, `siteplanSheetId`, `posX`/`posY`) TIDAK diekspos publik.
- Omahe **consume API** dari `perumahan`, tidak akses DB-nya langsung.
- Alasan pisah repo: landing = public-facing, SEO-heavy, read-mostly, traffic tinggi; admin = internal, write-heavy, auth-gated. Kebutuhan render & scaling beda, jadi lebih sehat dipisah daripada digabung.
- Pertimbangkan cache layer di depan API `perumahan` karena traffic publik landing kemungkinan jauh lebih tinggi dari traffic admin.

## Scope awal
- Full marketplace dari awal (bukan MVP landing statis): direktori/pencarian lintas-perumahan (yang belum ada di `perumahan`) + halaman detail per developer/perumahan yang di-render Omahe sendiri, keduanya consume/API-extend backend `perumahan` yang sudah ada. Booking, KPR verification, dan commission logic TIDAK dibangun ulang — itu tetap tanggung jawab app `perumahan` yang sudah jadi.

## Simulasi KPR
- Mulai dengan kalkulator estimasi sendiri (flat/anuitas manual), tanpa integrasi real-time ke API bank — integrasi bank butuh kemitraan resmi yang belum tentu tersedia. Upgrade ke partnership bank bisa menyusul kalau sudah ada kerja sama bisnis.

## Grouping properti & granularitas pencarian
- Dua mode berjalan bersamaan, bukan pilih salah satu: halaman pencarian bebas (filter lokasi/harga/tipe) dan halaman per-developer/pengembang (branded listing seperti mybeyond/brighton).
- **Keputusan granularitas** (2026-09-13): hasil pencarian berupa kartu **per-unit/tipe rumah** (bukan per-project) — tiap tipe unit (mis. "Tipe 36") jadi kartu sendiri dengan harga masing-masing, developer jadi filter/badge. Konsekuensi: butuh endpoint publik baru di backend `perumahan` yang query di level `unit`, bukan `perumahan` — lihat `UNIT-04` di atas.

## Rumah baru vs second
- **Keputusan (2026-09-13)**: Rumah Second **dikeluarkan dari scope awal**. Backend `perumahan` sama sekali tidak punya model data untuk resale (semua alur booking/DP/KPR/komisi dibangun khusus unit baru dari developer) — rumah second butuh infrastruktur berbeda (akun penjual perorangan, listing, verifikasi, tanpa funnel booking developer yang ada). Didesain terpisah nanti kalau memang mau dikejar, bukan bagian dari MVP marketplace ini.

## Theme color
- Diturunkan dari `omahe-logo.jpeg`: hijau tua sebagai primary, gold sebagai accent. Diimplementasikan sebagai design tokens/CSS variables agar warna mudah diganti.