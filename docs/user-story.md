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
- Aplikasi admin **sudah ada dan berjalan** di repo terpisah `~/projects/perumahan`: Hono + Bun + Postgres, frontend React. Ini adalah aplikasi **booking & referral multi-tenant** — satu tenant = satu `perumahan` (developer), dengan alur booking konsumen penuh (survei → KTP → verifikasi KPR multi-bank manual → DP bertahap → akad), referral berbasis QR dari `perusahaan` mitra, dan komisi 2 tingkat. Detail lengkap: `docs/PRD.md` di repo tsb.
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

## Theme color & Design System (2026-09-13)
- **Warna** — disampling langsung dari pixel `omahe-logo.jpeg`:
  - Primary (hijau): base `#0B3D28`, gelap `#062015`, terang `#1B5E3A`
  - Accent (gold): base `#B8862F`, gelap `#8C6A21`, terang `#F0D9A0`
  - Diimplementasikan sebagai CSS variables/design tokens agar mudah diganti (kebutuhan asli user-story).
- **Component approach**: Tailwind CSS + shadcn-svelte (bits-ui headless, di-copy ke project bukan npm dependency berat) — kontrol penuh atas markup, mudah di-theme lewat CSS variables.
- **Dark mode**: tidak perlu untuk sekarang — light-only (konsisten dengan referensi mybeyond/brighton/rumah123, semua light-only).
- **Font**: heading — Plus Jakarta Sans (bold, modern, cocok angka harga besar); body — Inter (readable). Pairing umum fintech/property, gampang diganti kalau perlu.

## Scope B2C vs B2B (2026-09-13)
- **Keputusan**: Omahe murni marketplace **konsumen (B2C)** — cari & lihat rumah untuk dibeli. Halaman rekrutmen developer/agen/mitra baru (jual sistem hadirapp, B2B) TETAP scope terpisah — sudah ada epic `SITE-01-landing-principal.md` (`todo`) di repo `perumahan` untuk itu, tidak digabung ke Omahe. Bisa disambung lewat link CTA dari Omahe ke sana nanti kalau perlu, bukan dibangun di dalam Omahe.

## Domain & URL (2026-09-13, direvisi setelah entitas developer ditambah)
- Domain final: **`www.omahe.co.id`** — diganti dari rencana awal `omahe.id` pada
  2026-09-20 (sebelum go-live; apex `omahe.co.id` redirect ke www, DNS di
  Vercel). Deploy di Vercel (`abdmun8/omahe`, lihat catatan Stack).
  **Tindak lanjut lintas-repo**: `LANDING-05` di repo `perumahan` masih
  memakai `omahe.id` sebagai referensi resmi — perlu disinkronkan ke domain
  baru (dokumen epic + `omaheLandingUrl` milik tenant yang sudah terisi
  lama).
- **Revisi pola URL** (setelah keputusan entitas `developer` terpisah dari `perumahan`, lihat epic [`DEVELOPER-01`](../../perumahan/docs/epics/DEVELOPER-01-entitas-pengembang.md) di repo `perumahan`):
  - `/developer` — direktori **perusahaan developer** (bukan proyek). Satu developer bisa menaungi banyak proyek `perumahan`.
  - `/developer/:companySlug` — profil satu developer + daftar semua proyek perumahan miliknya.
  - `/perumahan/:slug` — detail satu proyek perumahan (**dipindah dari `/developer/:slug` sebelumnya** — nama lama tabrakan makna dengan direktori developer di atas). Halaman ini yang di-render Omahe sendiri (hero, galeri, fasilitas, lokasi, testimoni, FAQ, daftar tipe unit), plus baris "Dikembangkan oleh [Nama Developer]" yang link ke `/developer/:companySlug`.

## Site map (revisi 2026-09-13 — entitas developer terpisah dari perumahan)
| Route | Isi | Sumber data |
|---|---|---|
| `/` | Homepage — hero search (lokasi/harga/tipe), project unggulan, value prop, link ke direktori & KPR | `GET /public/units` (highlight), statis |
| `/cari` | Hasil pencarian, granularitas per-unit — filter lokasi/harga/tipe/developer, pagination | `GET /public/units` (`UNIT-04`, field developer ditambah `DEVELOPER-01`) |
| `/developer` | Direktori **perusahaan developer** — kartu per developer (logo, nama, jumlah proyek aktif, cakupan lokasi) | `GET /public/developers` (`DEVELOPER-01`, baru) |
| `/developer/:companySlug` | Profil satu developer — deskripsi, daftar semua proyek perumahan miliknya (kartu, link ke `/perumahan/:slug`) | `GET /public/developers/:slug` (`DEVELOPER-01`, baru) |
| `/perumahan/:slug` | Detail satu proyek perumahan (Omahe-rendered, dipindah dari `/developer/:slug`) — hero, galeri, fasilitas, lokasi, testimoni, FAQ (reuse konten `sections` dari `LANDING-02`) + daftar tipe unit + baris "Dikembangkan oleh" + CTA "Ajukan" → `/ajukan/:slug?ref=...` (passthrough `ref`, lihat `LANDING-05`) | `GET /public/perumahan/:slug` + `GET /public/units?perumahanSlug=` |
| `/kpr` | Simulasi cicilan KPR — kalkulator mandiri client-side (flat/anuitas), tanpa backend | — |
| `/tentang`, `/kontak` | Corporate info Omahe — statis | — |
| `/privasi`, `/syarat-ketentuan` | Legal Omahe sendiri (beda dari `/legal/:kind` milik app `perumahan` yang khusus proses booking) | statis |

Detail unit sebagai halaman tersendiri (`/unit/:id`) **ditunda** — cukup anchor/section di `/perumahan/:slug` untuk MVP, karena foto & deskripsi cuma ada di level perumahan (bukan per-unit), jadi halaman detail unit sendiri isinya akan tipis. Bisa dipecah nanti kalau ada kebutuhan deep-link dari hasil pencarian ke unit spesifik.

## Developer sebagai entitas terpisah (2026-09-13)
- **Keputusan**: "Developer" yang ditampilkan di card BUKAN sekadar nama perumahan itu sendiri — melainkan perusahaan induk yang bisa menaungi beberapa proyek perumahan sekaligus (mis. "PT Nusa Land Development" mengembangkan "Griya Asri Bogor" DAN "Villa Kenanga Residence"). Ini butuh entitas baru di backend `perumahan`, bukan cuma perubahan tampilan.
- Detail lengkap: epic [`DEVELOPER-01`](../../perumahan/docs/epics/DEVELOPER-01-entitas-pengembang.md) di repo `perumahan` — tabel `developer` baru, `perumahan.developerId` (nullable), endpoint publik `GET /public/developers` + `/:slug`, dan perluasan response `UNIT-04` supaya card di Omahe bisa tampilkan + link ke nama developer.
- Open question yang dicatat di epic: siapa yang mengelola relasi developer↔perumahan (draft: principal-only, mirip pola `AUTH-04`).

## Kontak langsung di card (WhatsApp + Telepon) (2026-09-13)
- **Keputusan**: setiap card properti/perumahan (homepage, hasil pencarian, direktori developer, profil developer) menampilkan tombol **WhatsApp** (warna brand WhatsApp `#25D366` — dipertahankan apa adanya karena universal/gampang dikenali, bukan pelanggaran brand Omahe) dan **Telepon** (ikon outline warna primary Omahe).
- **Keputusan lanjutan (2026-09-13)**: untuk tahap awal/go-live, nomor yang dipakai adalah **nomor kontak umum Omahe** (`SITE.whatsapp`/`SITE.telepon` di `landing/src/lib/config.ts`) yang mem-forward semua lead — BUKAN field per-perumahan/per-developer/per-marketing. Nama properti disisipkan otomatis ke pesan pembuka WA (mis. "...tentang Tipe 36/72 di Griya Asri Bogor...") supaya lead tetap bisa ditelusuri asalnya meski nomornya satu. Field kontak per-entitas (perumahan/developer/`unit.marketingUserId`) TIDAK memblokir launch — bisa menyusul sebagai iterasi terpisah kalau nanti dibutuhkan, tanpa mengubah pemanggil `ContactButtons` (cukup ganti prop `nomorWhatsapp`/`nomorTelepon`).

## Mobile-first (2026-09-13)
- **Keputusan**: desain Omahe wajib mobile-first, bukan cuma desktop yang "menyempit". Pola mobile yang dipakai: header dengan hamburger menu, search bar bertumpuk vertikal, filter pencarian jadi horizontal scrollable chips (bukan sidebar permanen), hasil pencarian jadi kartu horizontal ringkas, dan halaman detail perumahan pakai **sticky bottom bar** (WhatsApp + Ajukan) supaya CTA utama selalu terlihat tanpa menggambar fake status bar/keyboard.

## Mockup visual (2026-09-13)
- Draf visual 10 artboard (desktop + mobile) sudah dibuat mencakup: Homepage, Hasil Pencarian, Direktori Developer, Profil Developer, Detail Perumahan, Simulasi KPR.
- Published sebagai Claude Artifact (Design Canvas), privat milik akun `hadirapp.dev@gmail.com`: https://claude.ai/code/artifact/5d4fa421-0da2-4461-af7d-96be65191a33 — kalau link ini basi/dipindah, cari ulang lewat daftar artifact akun tsb (judul "Omahe Marketplace Mockup").
- Ini masih statis (bukan clickable prototype) — placeholder foto pakai blok gradien + ikon rumah (bukan foto asli), data developer/harga di mockup adalah data contoh, bukan data real.

## Halaman legal (`/privasi`, `/syarat-ketentuan`) (2026-09-13)
- **Keputusan**: naskah `/privasi` dan `/syarat-ketentuan` (`landing/src/routes/privasi`, `.../syarat-ketentuan`) tetap berstatus **draf** — sudah diberi `<meta name="robots" content="noindex">` dan banner "Draf, belum ditinjau penasihat hukum" di halamannya sendiri. Ini TIDAK memblokir pekerjaan lain; ditinjau ulang menjelang go-live, dan `noindex` baru dilepas setelah naskah final disetujui penasihat hukum.

## Monetisasi: ranking berbayar, slider event, lead form (2026-09-18)

Permintaan user 2026-09-18; rincian lengkap + task backend di repo
`perumahan` `docs/epics/MONET-{01,02,03}-*.md` (sumber kebenaran).
Keputusan desain didelegasikan architect 2026-09-18.

- **Ranking berbayar (`MONET-01`)**: partner berbayar (prioritas efektif
  > 0 — angka 0–100 di-set principal, kedaluwarsa otomatis) tampil lebih
  atas di hasil `/cari`, direktori developer & perumahan. API publik
  mengekspos field `prioritas` per item; Omahe merender badge **"Promosi"**
  kecil untuk `prioritas > 0` (transparansi — hasil pencarian user tetap
  terurut relevansi terhadap filter, item berbayar tak pernah lolos dari
  filter yang mengecualikannya).
- **Slider event homepage (`MONET-02`)**: carousel di ATAS search di
  homepage, isi = event/kegiatan perumahan (gambar + judul + masa aktif
  max 30 hari, submit tenant → approval principal, `GET /public/sliders`).
  Klik slide → default halaman `/perumahan/:slug` pemiliknya (bawa
  passthrough `?ref=`!), atau `linkUrl` eksternal hasil approval
  (tab baru). Gratis untuk tenant v1; urutan rotasi pakai prioritas
  efektif (hook monetisasi). Slider TIDAK muncul di `/cari`.
- **Search kompak**: `SearchForm` homepage dikecilkan jadi satu baris
  kompak di mobile (input lokasi/kata kunci + tombol cari; filter lengkap
  tetap di halaman `/cari`) karena ruang atas diambil slider — desktop
  menyusut secara proporsional, fungsi tidak berkurang.
- **Lead form partner berbayar (`MONET-03`)**: kartu/detail partner
  berbayar TIDAK lagi WA langsung — tombol CTA membuka dialog form
  (nama + no HP wajib, tipe minat opsional, persetujuan privasi) →
  `POST /public/leads`. Sukses: "Tim {perumahan} akan menghubungi Anda"
  + tombol sekunder WA ke nomor umum Omahe. Tombol Telepon tetap nomor
  umum Omahe. **Partner gratis TIDAK berubah** (WA nomor umum, keputusan
  2026-09-13 di atas tetap berlaku untuk mereka).- **Artikel/blog (2026-09-18)**: konten artikel HIDUP DI REPO sebagai
  markdown (`src/content/artikel/*.md` + frontmatter), TANPA CMS/DB/API —
  di-prerender build-time (SEO + TTFB ~nol di Vercel & Docker), future-
  dated tersembunyi sampai tanggalnya (helper tunggal `artikelTayang`).
  Cover diambil dari Unsplash tapi SELF-HOST (diunduh via
  `scripts/ambil-gambar-artikel.ts`, di-commit, dicatat di `CREDITS.md`) —
  bukan hotlink. Rencana 30 artikel/30 hari (investasi/properti/perumahan)
  + mekanisme rilis harian: backlog `landing/TASKS.md` §Sprint SEO &
  artikel.


## Google Analytics 4 (2026-09-18)

Measurement ID `G-43S1SXD3GF` (publik by design). Implementasi:
`src/lib/analytics.ts` (helper `trackEvent`/`trackPageView`/`trackCtaAjukan`,
no-op aman saat SSR/dev/blocker, param `undefined` di-strip), gtag.js dimuat
di `+layout.svelte` HANYA saat `import.meta.env.PROD` (localhost bersih),
`send_page_view: false` + pageview manual via `afterNavigate` (anti
double-count, termasuk navigasi SPA).

- **Yang dilacak**: semua pageview; event `search` (region/tipe/harga/varian
  form), `select_property` (perumahan/developer/tipe/source/prioritas),
  `select_developer`, `slider_view` (impression per slide aktif) +
  `slider_click` (internal/eksternal), `whatsapp_click`/`phone_click`
  (entitas = nama perumahan/developer), `lead_form_open`/`lead_form_submit`
  (perumahan, sumber card/slider/detail, tipe minat, ada_ref),
  `cta_ajukan` (perumahan, ada_ref), `kpr_simulasi` (input dibulatkan kasar).
- **Larangan PII** (ToS Google): nama/nomor telepon/isi pesan user TIDAK
  PERNAH dikirim — hanya nama properti/developer/tipe/judul/slot non-identitas.
  Dikunci test di lead-form-dialog.test.ts.
- `/privasi` memuat butir analitik (cookie Google, tanpa data identitas).
- **Daftar custom dimension yang perlu didaftarkan di admin GA4** (nama
  parameter case-sensitive, scope SEMUA `Event`):
  | Prioritas | Dimension name | Event parameter | Dipakai di event |
  |---|---|---|---|
  | wajib | Nama Perumahan | `perumahan` | select_property, slider_view, slider_click, whatsapp_click, phone_click, lead_form_open, lead_form_submit, cta_ajukan |
  | wajib | Nama Developer | `developer` | select_property, select_developer |
  | wajib | Sumber Klik | `source` | select_property, select_developer |
  | wajib | Sumber Lead | `sumber` | lead_form_open, lead_form_submit |
  | tinggi | Tipe Unit | `tipe` | select_property |
  | tinggi | Tipe Diminati | `tipe_minat` | lead_form_submit |
  | tinggi | Ada Kode Referral | `ada_ref` | lead_form_submit, cta_ajukan |
  | sedang | Judul Slider | `judul` | slider_view, slider_click |
  | sedang | Jenis Link Slider | `link` | slider_click |
  | sedang | Varian Form | `form` | search |
  | sedang | Kode Region | `region` | search |
  | sedang | Metode Bunga | `metode` | kpr_simulasi |
  | opsional | Posisi Slide | `posisi` | slider_view |
  | opsional | Prioritas Partner | `prioritas` | select_property |
  Custom metrics (tab terpisah, unit Standard kecuali disebut): `harga`
  (Currency), `cicilan_bulatan` (Currency), `harga_max` (Standard),
  `dp_persen`, `tenor_tahun`, `bunga_persen`. `search_term` SUDAH dimensi
  standar GA4 — tidak perlu didaftarkan. Data historis sebelum
  pendaftaran umumnya kosong → daftarkan sebelum trafik mengalir.
- Catatan pelaporan: param kustom (`perumahan`, `developer`, `source`, dst.)
  perlu didaftarkan sebagai custom dimension di admin GA4 agar bisa dipakai
  di laporan utama; real-time sudah terlihat apa adanya.
