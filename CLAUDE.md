# Omahe

Corporate website & property marketplace portal (referensi: mybeyond.co.id, brighton.co.id, rumah123.com).
Tagline: "Where your story begins".

## Status

Skeleton app SvelteKit sudah berdiri di `landing/` — seluruh route site map di bawah sudah dirender, lengkap dengan design token, passthrough `?ref=`, dan kalkulator KPR. Peralihan fixture→API asli diatur env, per-endpoint, tanpa mengubah komponen — lihat `landing/README.md`.

**Update 2026-09-15 — peralihan ke API asli SELESAI & diverifikasi live**: ketiga epic backend (`DEVELOPER-01`, `UNIT-04`, `LANDING-05`) `done`, PLUS epic follow-up `LANDING-06` (`?full=1` — bypass skip-resolve `LANDING-05` supaya Omahe dapat profil lengkap untuk tenant yang sudah migrasi, bukan Omahe cuma dapat profil kosong seperti sebelumnya). Sisi Omahe sudah dikoreksi mengikuti shape API asli (bukan lagi asumsi dari `api-contract.md`):
- `cakupanLokasi` developer — dihapus dari tipe + UI (tidak ada penggantinya, keputusan produk).
- Stats per-proyek (`regionNama`/`hargaMulai`/`unitTersedia`) di halaman detail developer — di-enrich `client.ts::getDeveloper` via `GET /public/units?perumahanSlug=...` per proyek (paralel), field tetap tampil di UI.
- Filter `developerSlug` di `/cari` — di-strip sebelum fetch backend (tidak didukung), difilter client-side di Omahe.
- `getPerumahan` mengirim `?full=1` (LANDING-06) supaya tenant migrasi dapat profil lengkap.
- `getRegions` fail-soft ke `[]` kalau `GET /public/regions` 404 (endpoint itu memang belum ada, §5 gap terbuka) — TANPA fallback ini homepage & `/cari` 404 TOTAL begitu `OMAHE_API_SEARCH=1` dinyalakan (ditemukan lewat verifikasi live, bukan cuma baca kode).

Diverifikasi live 2026-09-15: seed data nyata ke Postgres dev `perumahan` (developer + 2 perumahan salah satunya bertanda migrasi + unit), `OMAHE_API_BASE_URL`/`OMAHE_API_SEARCH=1` di `.env` lokal, `bun run dev` bareng backend — homepage, `/cari`, `/developer`, `/developer/:slug`, `/perumahan/:slug` (termasuk tenant migrasi) semua render data asli, HTTP 200, tanpa `undefined`/`NaN`. Data uji sudah dibersihkan dari dev DB. Detail shape final: `docs/api-contract.md` §Status (kedua gap ditandai selesai, `GET /public/regions` §5 masih gap terbuka tapi sudah fail-soft, bukan blocker).

Brainstorm produk lengkap: `docs/user-story.md`. Kontrak API yang dibutuhkan dari repo `perumahan` (termasuk asumsi yang masih perlu dikonfirmasi): `docs/api-contract.md`.

## Arsitektur

Landing/marketplace ini **terpisah** dari aplikasi admin yang sudah ada dan berjalan di repo `~/projects/perumahan`:

- **Admin/backend (existing, repo `perumahan`)**: Hono + Bun + Postgres, frontend React. Ini aplikasi booking & referral **multi-tenant** — satu tenant = satu `perumahan` (proyek hunian). Sudah punya alur booking konsumen penuh, referral QR (perusahaan mitra), komisi 2 tingkat, dan **landing page publik per perumahan sendiri** (`/p/:slug`, section builder Hero/Gallery/Pricing/dll) + alur `/ajukan/:slug`. Sumber kebenaran domain: `docs/PRD.md` di repo tsb.
- **`developer` (perusahaan pengembang) adalah entitas TERPISAH dari `perumahan`** (epic `DEVELOPER-01`, `done` 2026-09-13) — satu developer bisa menaungi banyak proyek `perumahan`. Jangan disamakan; `perumahan.developerId` nullable.
- API publik yang sudah ada (semua tanpa auth): `GET /public/perumahan/:slug` (satu perumahan, LANDING-01/02, diperluas DEVELOPER-01/UNIT-04/LANDING-05), `GET /public/units` (pencarian per-tipe lintas-perumahan, UNIT-04, `done` 2026-09-14), `GET /public/perumahan` (direktori list perumahan aktif, UNIT-04, `done` 2026-09-14 — belum ada halaman Omahe yang eksplisit memakainya), `GET /public/developers[/:slug]` (DEVELOPER-01, `done` 2026-09-13). Detail shape aktual per endpoint (termasuk koreksi vs asumsi awal): `docs/api-contract.md`.
- **Landing/Marketplace (repo ini, `landing/`)**: SvelteKit, dijalankan di Bun runtime (konsisten dengan admin). Consume + extend API dari `perumahan` — tidak akses DB-nya langsung. Omahe berperan sebagai (1) direktori/pencarian lintas-perumahan (gap yang belum ada di `perumahan`) dan (2) render sendiri halaman detail per developer/perumahan (keputusan: bukan link-out ke `/p/:slug` yang sudah ada, meski itu artinya ada duplikasi UI landing page dengan React di `perumahan` — trade-off yang disadari, lihat `docs/user-story.md`).
- Booking, verifikasi KPR, dan komisi/referral **tidak dibangun ulang** di Omahe — itu tetap alur `perumahan` yang sudah jadi.

Alasan pisah: landing itu public-facing/SEO-heavy/read-mostly, admin itu internal/write-heavy — kebutuhan render dan scaling berbeda.

### Redirect `/p/:slug` per-tenant (epic `LANDING-05` di repo `perumahan`, `done` 2026-09-14)

QR referral kerjasama perumahan×perusahaan mengarah ke `/p/:slug` (stabil, tidak boleh berubah). Per-tenant, perumahan owner bisa isi field `omaheLandingUrl` sendiri (self-service) — kalau terisi, `/p/:slug` (app `perumahan`) redirect client-side ke halaman tenant tsb di Omahe, SELURUH query string ikut terbawa; kalau kosong, tetap fallback ke section builder lama. Detail: `docs/epics/LANDING-05-redirect-omahe.md` di repo `perumahan`.

**GOTCHA arsitektur belum terselesaikan (2026-09-14)** — `GET /public/perumahan/:slug` (endpoint yang API-contract.md §4 bilang "Omahe sudah memakainya apa adanya" untuk render `/perumahan/:slug`) SEKARANG melakukan *skip-resolve*: kalau tenant itu punya `omahe_landing_url` terisi, endpoint balikin `redirectUrl` TAPI `deskripsi`/`photos`/`sections`/`developer`/`regionNama` SEMUA kosong/null (optimasi ini didesain dengan asumsi HANYA `/p/:slug` React yang manggil endpoint ini, dan dia redirect duluan jadi datanya tidak pernah dipakai). Tenant dengan `omaheLandingUrl` terisi justru tenant yang PALING relevan buat Omahe (mereka MEMILIH Omahe sebagai landing utama) — kalau Omahe memanggil endpoint publik yang SAMA untuk render `/perumahan/:slug` miliknya sendiri, Omahe akan dapat profil KOSONG untuk tenant-tenant ini. Belum diputuskan solusinya (opsi: endpoint terpisah untuk Omahe yang tidak ikut skip-resolve, atau param query untuk minta full-resolve meski redirectUrl terisi) — WAJIB dibahas/diselesaikan SEBELUM Omahe mulai konsumsi `GET /public/perumahan/:slug` sungguhan untuk tenant yang sudah migrasi.

**Kewajiban wajib di sisi Omahe**: setiap halaman detail developer/perumahan harus baca query param `ref` dari URL saat dibuka, dan meneruskannya lagi ke SETIAP link CTA booking (`/ajukan/:slug?ref=...`) yang balik ke app `perumahan`. Kalau `ref` hilang di satu saja titik hop (QR → `/p/:slug` → Omahe → `/ajukan/:slug`), komisi referral perusahaan mitra tidak tercatat (PRD §4 & §7 repo `perumahan`) — cek ini di setiap PR yang menyentuh routing/CTA booking.

### Pencarian & granularitas (epic `UNIT-04` di repo `perumahan`, `done` 2026-09-14)

Hasil pencarian Omahe granularitasnya **per-unit/tipe rumah** (bukan per-project) — konsumsi `GET /public/units` (paginasi, filter `regionKode`/`hargaMin`/`hargaMax`/`tipe`/`perumahanSlug`, cuma unit `status=tersedia`, dikelompokkan per (perumahan, tipe) di backend). **Tidak ada** filter `developerSlug` di endpoint ini (sempat diasumsikan di `docs/api-contract.md`, TIDAK diimplementasikan — filter by developer harus lewat `perumahanSlug` per-perumahan atau di sisi Omahe). Endpoint direktori list `GET /public/perumahan` (perumahan aktif + `jumlahTipeTersedia`, filter `regionKode`) juga sudah ada, belum ada halaman Omahe yang eksplisit memakainya. Detail: `docs/epics/UNIT-04-pencarian-publik-lintas-perumahan.md` di repo `perumahan`, shape aktual: `docs/api-contract.md`. Rumah Second **di luar scope** — backend `perumahan` tidak punya model data resale sama sekali.

### Entitas Developer terpisah dari Perumahan (epic `DEVELOPER-01` di repo `perumahan`, `done` 2026-09-13)

**Revisi URL penting** — `/developer/:slug` yang dulu dipakai untuk detail SATU PERUMAHAN sudah TIDAK BENAR sejak keputusan ini. Skema baru:
- `/developer` — direktori **perusahaan developer** (`GET /public/developers`)
- `/developer/:companySlug` — profil satu developer + daftar proyek perumahan miliknya (`GET /public/developers/:slug` — perhatikan: item `proyek[]` di response HANYA `{id, nama, slug, fotoUrl}`, TIDAK ada `regionNama`/`hargaMulai`/`unitTersedia` per proyek meski sempat diasumsikan di `docs/api-contract.md` — kalau butuh info itu per-proyek, panggil `GET /public/units?perumahanSlug=...` terpisah)
- `/perumahan/:slug` — detail satu proyek perumahan (Omahe-rendered) — **ganti nama dari `/developer/:slug` lama**. Tampilkan baris "Dikembangkan oleh [Developer]" link ke `/developer/:companySlug`.

Detail: `docs/epics/DEVELOPER-01-entitas-pengembang.md` di repo `perumahan`, shape aktual: `docs/api-contract.md`.

## Site map (draf, direvisi setelah `DEVELOPER-01`)

Murni B2C (bukan rekrutmen developer/mitra — itu tetap `SITE-01` di repo `perumahan`, terpisah): `/` (homepage+search), `/cari` (hasil per-unit), `/developer` (direktori PERUSAHAAN developer), `/developer/:companySlug` (profil developer + daftar proyeknya), `/perumahan/:slug` (detail satu proyek, Omahe-rendered, CTA ke `/ajukan/:slug?ref=...`), `/kpr` (kalkulator), `/tentang`, `/kontak`, `/privasi`, `/syarat-ketentuan`. Detail unit tersendiri (`/unit/:id`) ditunda — cukup anchor di `/perumahan/:slug`. Rincian: `docs/user-story.md` §Site map.

Domain final: **`omahe.id`** (deploy sementara masih Vercel, lihat §Stack). Setiap card properti wajib ada tombol **WhatsApp + Telepon** (nomor kontaknya belum diputuskan sumbernya — perumahan/developer/marketing, lihat `docs/user-story.md` §Kontak langsung di card). Desain **mobile-first** wajib (pola: hamburger nav, filter jadi chip horizontal, sticky bottom CTA di halaman detail) — lihat `docs/user-story.md` §Mobile-first.

**Mockup visual**: 10 artboard (desktop+mobile) sudah dibuat, published sebagai Claude Artifact privat: https://claude.ai/code/artifact/5d4fa421-0da2-4461-af7d-96be65191a33 (masih statis, data contoh — bukan clickable prototype). Detail: `docs/user-story.md` §Mockup visual.

## Stack (landing)

- Framework: SvelteKit (SSR untuk SEO di halaman publik, prerender untuk halaman statis)
- Dev/tooling: Bun (`bun install`, `bun run dev`), konsisten dengan repo `perumahan`
- Deploy: Vercel untuk sementara (`@sveltejs/adapter-vercel`) — repo GitHub `abdmun8/omahe` (personal, bukan org `hadirapp-com`, khusus tahap ini). Runtime produksi jadi Node/Edge function Vercel, BUKAN Bun — Bun cuma dipakai lokal.
- Node version: lihat `.nvmrc`
- Data: fetch dari API admin via SvelteKit `load` functions (server-side)
- Cache: pakai cache bawaan Vercel (edge cache/ISR per-route) dulu selama di Vercel, bukan Redis terpisah — evaluasi ulang kalau nanti pindah infra sendiri

## Theme & Design System

- Warna (disampling dari `docs/omahe-logo.jpeg`): primary hijau `#0B3D28` (gelap `#062015`, terang `#1B5E3A`), accent gold `#B8862F` (gelap `#8C6A21`, terang `#F0D9A0`) — sebagai CSS variables agar mudah diganti.
- Tailwind CSS + shadcn-svelte (bits-ui), light-only (tanpa dark mode).
- Font: Plus Jakarta Sans (heading) + Inter (body).

## Keputusan Produk

Lihat `docs/user-story.md` bagian "Keputusan" untuk detail (simulasi KPR, grouping properti per developer, kondisi baru/second, dll).
