# Backlog pengembangan lanjutan

Dikerjakan lewat `/loop` — implementor `pi` (provider `zai`, model `glm-5.3`),
review tiap iterasi oleh Claude sebelum di-commit. Satu item = satu iterasi.
Urutan boleh disusun ulang; jangan hapus item yang belum selesai.

- [x] **SEO structured data (JSON-LD)** — `Organization` di root layout,
      `RealEstateListing` di `/perumahan/:slug`, `BreadcrumbList` di
      `/perumahan/:slug` & `/developer/:companySlug`. Diimplementasikan
      lewat `src/lib/jsonld.ts` (`amankanJsonLd()`) + `{@html}` satu tag
      penuh (pola `<script type="...">{@html x}</script>` tidak valid di
      Svelte 5 — `script_duplicate`). Escape `</` → `<\/` diverifikasi
      end-to-end dengan payload `</script><script>alert(1)</script>` di
      deskripsi fixture: tetap inert, tidak lolos sebagai tag. (2026-09-13,
      implementor pi/glm-5.3, review Claude)
- [x] **OpenGraph metadata di halaman yang belum punya** — `/`, `/cari`,
      `/developer`, `/developer/:companySlug`, `/kpr`, `/tentang`, `/kontak`
      sekarang punya `og:title`/`og:description`/`og:image` (fallback
      `${SITE.url}/omahe-logo.jpeg`, URL absolut). `/cari` &
      `/developer/:companySlug` di-refactor jadi `const deskripsi = $derived(...)`
      supaya `meta description` & `og:description` satu sumber, bukan dua
      literal yang bisa drift. `/perumahan/:slug` (og:image kondisional dari
      foto asli) & `/privasi`/`/syarat-ketentuan` tidak disentuh — diverifikasi.
      (2026-09-13, implementor pi/glm-5.3, review Claude)
- [x] **Component test dasar (1/2) — pasang toolchain + contact-buttons** —
      `vitest` + `@testing-library/svelte` + `@testing-library/jest-dom` +
      `jsdom` terpasang sebagai runner TERPISAH (`vitest.config.ts`,
      `bun run test:component`). `bun test` tidak disentuh (script `test`
      sama persis) dan tetap 23 pass — file tes baru otomatis ke-skip di
      situ lewat `describe.skipIf(typeof document === 'undefined')` (bun
      ikut menjemput file `*.test.ts` yang sama, jadi guard ini wajib).
      `vitest.config.ts` pakai `resolve.conditions: ['browser']` (kalau
      tidak, `svelte` resolve ke `index-server` dan `mount()` gagal). 4 tes
      `contact-buttons.svelte` lulus. (2026-09-13, implementor pi/glm-5.3,
      review Claude — diverifikasi independen: `bun test` 23 pass + 4 skip,
      `bun run test:component` 4 pass, `check`/`build` tetap hijau)
- [x] **Component test dasar (2/2) — unit-card** — 7 tes: harga ringkas,
      baris developer (muncul/tidak), badge "unit tersisa" (muncul kalau
      `unitTersedia <= 3`), tombol WA/Telepon selalu ada, dan link nama
      perumahan (`hrefDetail`) bawa `?ref=` yang disisipkan SEBELUM
      `#tipe-unit`. `unit-card.svelte` meng-import `$lib/ref` →
      `$env/dynamic/public` (modul virtual, tidak resolve di plugin svelte
      polos vitest.config.ts) — di-mock per-file via `vi.mock('$lib/ref')`.
      **Revisi reviewer**: draft awal implementor punya mock `withRef` yang
      tidak menangani pemisahan `#hash` (semua test awalnya pakai
      `ref=null` jadi celah ini tidak ketahuan sendiri) — diminta perbaiki
      jadi tiruan baris-per-baris `ref.ts` + tambah test `ref` non-null pada
      link yang justru mengandung hash (`hrefDetail`), supaya celah itu
      sekalian kebuktikan tertutup. (2026-09-13, implementor pi/glm-5.3,
      review + 1 revisi Claude)
- [x] **Aksesibilitas pass — kontras warna** — dihitung reviewer (formula
      WCAG relative luminance, bukan tebakan) atas SEMUA pasangan
      teks/latar yang benar-benar dipakai di kode. Hasil: 3 GAGAL, sisanya
      (ink/muted/primary di atas putih & surface, teks putih di atas
      primary, `accent-light/25` untuk callout box, dll) sudah lolos AA —
      JANGAN diubah.

      **Perbaikan wajib (3 titik, di `src/lib/components/ui/button.svelte`
      dan `src/lib/components/ui/badge.svelte`):**
      1. Button `whatsapp`: `bg-whatsapp text-white` = **1.98:1** (gagal
         jauh, standar minimal teks normal 4.5:1). Ganti `text-white` →
         `text-ink` → jadi 8.46:1. `hover:brightness-95` yang sudah ada
         TETAP (ink di atas whatsapp-brightness-95 ≈ 7.67:1, masih lolos).
      2. Button `accent`: `bg-accent text-white` = **3.24:1** (gagal untuk
         teks normal, cuma cukup untuk UI besar). Ganti `text-white` →
         `text-ink` → jadi 5.19:1. TAPI hover-nya (`hover:bg-accent-dark`)
         kalau dibiarkan + `text-ink` jadi 3.36:1 (gagal lagi) — ganti
         `hover:bg-accent-dark` → `hover:brightness-95` (pola yang sama
         persis dengan variant `whatsapp` di atasnya) → ink di atas itu
         ≈ 4.71:1, lolos.
      3. Badge `accent`: `bg-accent-light/50 text-accent-dark` = **4.26:1**
         (gagal tipis untuk teks kecil `text-xs`). Turunkan opacity `/50`
         → `/25` → jadi ≈4.63:1.

      Warna brand WhatsApp (`--wa-green`/`bg-whatsapp`) itu sendiri JANGAN
      diubah (keputusan 2026-09-13 §Kontak langsung di card — cuma warna
      TEKS di atasnya yang berubah, bukan latarnya).

      **Verifikasi wajib**: setelah tiap perubahan, hitung ulang rasio
      kontras (boleh pakai script Python/Node kecil dengan formula relative
      luminance WCAG — searchable, atau tanya reviewer polanya) dan laporkan
      angkanya, jangan cuma "kelihatan lebih gelap".

      **Sudah dicek reviewer, TIDAK perlu diubah** (laporkan status
      "sudah patuh" untuk masing-masing, jangan diam-diam dilewati):
      semua ikon SVG dekoratif sudah `aria-hidden="true"` (langsung atau
      lewat wrapper `photo-placeholder.svelte`); hamburger menu
      (`site-header.svelte`) sudah punya `aria-expanded`/`aria-controls`/
      `aria-label`; chip filter (`filter-chips.svelte`) sudah `<a>` asli
      (focusable native); FAQ (`landing-sections.svelte`) sudah pakai
      `<details>`/`<summary>` native (keyboard-operable bawaan browser).

      **Hasil**: `button.svelte` whatsapp & accent → `text-ink` (8.46:1 &
      5.19:1), hover accent → `hover:brightness-95` (4.71:1, `bg-accent-dark`
      lama gagal 3.36:1 dikombinasi `text-ink`). `badge.svelte` accent →
      `accent-light/25` (4.63:1). Implementor menghitung ulang independen
      dengan skrip sendiri — angkanya cocok persis dengan hitungan reviewer
      di atas. 4 poin "sudah patuh" dikonfirmasi ulang, tidak diubah.
      (2026-09-13, implementor pi/glm-5.3, review Claude)
- [x] **Sitemap: tambahkan `<lastmod>`** — dicek ulang reviewer:
      `/tentang` & `/kontak` TERNYATA SUDAH ada di `STATIS` (deskripsi item
      ini sempat salah asumsi, ditulis sebelum cek isi file — abaikan
      klaim "belum ada halaman legal" di judul lama). Yang benar-benar
      kurang cuma `<lastmod>`. Cek `src/lib/api/types.ts`: TIDAK ADA field
      timestamp apa pun (`createdAt`/`updatedAt`) di `PerumahanDetail`,
      `DeveloperSummary`, atau `UnitListing` — jadi tidak ada "data yang
      ada" untuk dipakai per-halaman. Solusi jujur: SEMUA `<lastmod>` pakai
      satu timestamp build-time yang sama (`new Date().toISOString()`
      dipanggil sekali di handler, bukan per-URL — supaya nilainya
      konsisten dalam satu response), format W3C Datetime sesuai spec
      sitemaps.org (ISO 8601, `YYYY-MM-DDTHH:mm:ssZ` valid). `/privasi` &
      `/syarat-ketentuan` (noindex) TETAP TIDAK masuk sitemap — jangan
      ditambahkan, kontradiktif dengan noindex.

      **Hasil**: diff 6 baris di `src/routes/sitemap.xml/+server.ts` —
      `STATIS`/urutan/header tidak disentuh. Reviewer parse ulang XML
      output pakai `xml.etree.ElementTree` (bukan `grep`): 15 URL, semua
      punya `<lastmod>` valid, `/privasi`/`/syarat-ketentuan` tidak bocor.
      (2026-09-13, implementor pi/glm-5.3, review Claude)
- [x] **Regression test: proyek nonaktif tidak bikin crash** — dicek ulang
      reviewer dulu (sebelum dispatch, biar tidak membangun ulang yang
      sudah ada):
      - Empty state "Tidak ada unit yang tersedia" di `/perumahan/:slug`
        SUDAH ADA sejak awal (`src/routes/perumahan/[slug]/+page.svelte`) —
        JANGAN dibangun ulang.
      - `getPerumahan()`/`apiGet()` (`src/lib/api/client.ts`) SUDAH benar
        panggil `error(404, ...)` dari `@sveltejs/kit` untuk slug yang
        tidak ada — diverifikasi manual reviewer: `curl /perumahan/tidak-ada`
        sudah balas 404 lewat `+error.svelte` custom (bukan crash generik),
        dan `error()` melempar objek `{ status: 404, body: { message } }`
        (diverifikasi langsung lewat Node).

      **Yang benar-benar belum ada**: regression test otomatis yang
      MENGUNCI perilaku itu di level data layer (`src/lib/api/client.ts`),
      supaya kalau nanti ada yang mengubah `apiGet`/`getPerumahan` secara
      tidak sengaja dan menghilangkan `error(404,...)`-nya, `bun test`
      langsung merah — bukan baru ketahuan pas production 500.

      Buat `src/lib/api/client.test.ts` (`bun:test`, BUKAN vitest — ini
      murni fungsi, tidak merender komponen, tidak butuh DOM):
      1. `getPerumahan(fetchDummy, 'slug-tidak-ada')` → harus `throw` objek
         dengan `.status === 404` (assert pakai
         `expect(...).rejects.toMatchObject({ status: 404 })` atau
         try/catch manual — cek dulu API `bun:test` yang benar untuk
         async-throw sebelum menulis).
      2. `getPerumahan(fetchDummy, 'griya-asri-bogor')` (slug valid di
         fixture) → HARUS TIDAK throw, resolve normal.
      3. `getUnits(fetchDummy, { perumahanSlug: 'slug-tidak-ada' })` → HARUS
         TIDAK throw — resolve dengan `items: []` (ini bukti "/cari" sendiri
         tidak pernah crash walau filter tidak match apa pun, beda dari
         kasus #1 yang memang sengaja 404).
      4. `fetchDummy` = fungsi yang `throw` kalau benar-benar dipanggil —
         membuktikan di mode fixture (env kosong, default `bun:test`)
         semua ini tidak pernah menyentuh network sama sekali.

      **Hasil**: `src/lib/api/client.test.ts`, 4 test, `bun test` naik
      23→27 pass (bukan cuma "lulus" — file baru benar-benar ke-run).
      Reviewer mutation-test: hapus baris `error(404,...)` di
      `getPerumahan` sementara → test #1 langsung merah persis seperti
      dirancang, lalu dikembalikan (bukan tautologi yang selalu lolos).
      (2026-09-13, implementor pi/glm-5.3, review Claude)

      **Backlog ini sekarang kosong** — semua item tuntas.

## Monetisasi Omahe (2026-09-18 — antre, TUNGGU backend `MONET-01..03`)

Sumber kebenaran: `../docs/user-story.md` §Monetisasi + epic
`MONET-{01,02,03}` di repo `~/projects/perumahan/docs/epics/`. Jangan
mulai sebelum endpoint publik terkait sudah `done` di backend (field
`prioritas` di response list, `GET /public/sliders`, `POST /public/leads`).

- [x] **Badge "Promosi" + type prioritas** — `client.ts`: field
      `prioritas` (number) di `UnitListing.perumahan`, item direktori
      `/public/perumahan`, dan `DeveloperSummary`. Badge kecil "Promosi"
      di `unit-card`, `project-card`, `developer-card` untuk
      `prioritas > 0` (gaya netral, jangan menyamai badge status unit).
- [x] **SearchForm kompak (mobile-first)** — homepage: satu baris
      (lokasi/kata kunci + tombol) di mobile, proporsional di desktop;
      filter lengkap tetap di `/cari`; `?ref=` passthrough tidak boleh
      hilang. Diimplementasikan lewat prop `kompak` di
      `search-form.svelte` (dipakai homepage): mobile = flex satu baris
      (lokasi ~42% + input tipe `flex-1` + tombol ikon "Cari" 44px) + link
      "Filter lanjutan (harga, dll.)" ke `/cari` yang membawa lokasi/kata
      kunci/ref live (`$derived` dari `bind:value`); select harga tetap di
      DOM tapi `hidden sm:block` — field tersembunyi tetap ikut submit GET,
      jadi semantik query form identik. sm+ = grid penuh sama seperti
      varian lama (4 field, tinggi 48px). Varian default (dipakai `/cari`)
      tidak berubah — diverifikasi live via `preview`: SSR
      `/cari?regionKode=32.01&tipe=36` tetap merender option `selected` +
      `value="36"` (bind:value aman untuk no-JS/SEO). Ref passthrough
      dikunci tes komponen baru `search-form.test.ts` (10 tes: hidden
      input di kedua varian, href link bawa ref, label sr-only ter-associate)
      + SSR homepage `?ref=uji-ref` memperlihatkan hidden input & href
      bawa ref. Hero homepage dirampingkan mobile saja (`py-8`, card
      `mt-6`): baris form turun 4→2, tinggi hero+search mobile ~590px →
      ~400px (≈2/3). (2026-09-18, implementor pi/glm-4.7)
- [x] **Slider carousel homepage** — komponen carousel (`GET
      /public/sliders` via `client.ts::getSliders`): autoplay + swipe +
      dots + pause on hover + hormati `prefers-reduced-motion`, lazy
      load, alt = judul; klik → `linkUrl` eksternal (tab baru,
      `rel="noopener"`) ATAU default `/perumahan/{slug}` **bawa
      passthrough `?ref=`**; dirender DI ATAS search; section disembunyikan
      total (bukan spinner) saat response kosong/gagal (fail-soft).
- [x] **LeadFormDialog partner berbayar** — `client.ts::createLead`
      (`POST /public/leads`, honeypot field `website` tersembunyi,
      konsen privasi wajib); tombol CTA kartu/detail dengan
      `prioritas > 0` membuka dialog INI, bukan WA; state sukses +
      tombol sekunder WA nomor umum; tombol WA partner gratis TIDAK
      berubah; `ref` dari URL ikut terkirim; sumber (`card|slider|detail`)
      di-set pemanggilnya.

## Sprint SEO & artikel (ditambahkan 2026-09-15)

Dua tujuan: (1) optimasi TTFB halaman statis via prerender — host-agnostic,
berguna di Vercel maupun Docker self-host; (2) fitur artikel/blog sebagai
mesin content-marketing SEO: 30 artikel untuk 30 hari berikutnya, tema
investasi / properti / perumahan, posting harian. Urutan item = urutan
dependensi — jangan diacak. Semua item tunduk pada "Aturan untuk implementor"
di bawah (termasuk larangan menyentuh `src/lib/ref.ts`).

- [x] **Prerender halaman statis (`/tentang`, `/kontak`, `/privasi`,
      `/syarat-ketentuan`, `/kpr`)** — lima halaman ini murni statis (tidak
      ada `load`/fetch backend) tapi masih dirender SSR per-request. Tambah
      `+page.ts` berisi `export const prerender = true;` di tiap halaman
      (flag prerender TIDAK boleh di `+page.svelte` — SvelteKit hanya membaca
      config dari modul `+page(.server).js/.ts`).

      **GOTCHA `?ref=` (wajib diverifikasi end-to-end — ini kunci komisi
      referral, lihat CLAUDE.md):** root `+layout.ts` membaca `ref` dari
      `url` saat load. Saat prerender, load dijalankan build-time TANPA query
      string → HTML awal berisi `ref` kosong; universal load di-re-run
      browser saat hydration dengan query lengkap. Buktikan: `bun run build
      && bun run preview`, buka `/kpr?ref=uji` (dan `/kontak?ref=uji`) —
      SETELAH hydration, semua link yang memakai `page.data.ref`/`withRef`
      harus bawa `ref=uji`; bandingkan dengan halaman SSR yang tidak
      di-prerender. Kalau ref TIDAK terbaca pasca-hydration: JANGAN paksa,
      batalkan item dan laporkan (passthrough komisi > TTFB).

      Verifikasi lain:
      - `OMAHE_ADAPTER=node bun run build` → `build/prerendered/` berisi
        kelima halaman (Docker self-host dapat manfaat yang sama).
      - `/privasi` & `/syarat-ketentuan` TETAP noindex dan TETAP TIDAK masuk
        sitemap — prerender ≠ boleh diindeks; jangan sentuh keduanya.
      - `bun run check`, `bun test`, `bun run test:component`,
        `bun run build` semua hijau.

      **Hasil**: 5× `+page.ts` (`export const prerender = true`). Satu
      perubahan di luar 5 file itu: root `+layout.ts` — `readRef(url)`
      melempar saat prerender (SvelteKit MELARANG akses `url.searchParams`
      build-time, build langsung gagal), jadi pemanggilnya dibungkus
      try/catch → `ref` null di HTML bake, diisi ulang universal load
      re-run di browser saat hidrasi; `src/lib/ref.ts` TIDAK disentuh.
      Diverifikasi Playwright headless (chromium) terhadap `node build`:
      HTML server `/kpr?ref` memang tanpa ref (bake); pasca-hidrasi 6+ link
      nav header/footer membawa `?ref` (diuji `/kpr` & `/kontak`); klik
      nav → `/cari` tetap bawa ref; homepage SSR (pembanding) tetap bawa
      ref di HTML server — passthrough SSR tidak berubah. Output:
      `.vercel/output/static/*.html` (Vercel) + `build/prerendered/` dengan
      .br/.gz (Docker). Sitemap tetap tanpa privasi/syarat-ketentuan,
      keduanya tetap noindex. `check`/`bun test` (79)/`test:component`
      (40)/`build` kedua adapter hijau. (2026-09-18, pi, review Abdul)

- [x] **Artikel (1/7): fondasi — markdown in-repo, `/artikel` +
      `/artikel/[slug]`, gambar Unsplash lokal, on-page SEO** — keputusan
      produk: konten artikel HIDUP DI REPO sebagai markdown
      (`src/content/artikel/*.md`), TANPA CMS/DB/API backend. Halaman artikel
      harus render identik di mode fixture maupun API asli, dan tidak pernah
      5xx gara-gara backend.

      - Frontmatter per artikel: `judul`, `deskripsi` (≤160 char — menjadi
        meta description + og:description), `tanggal` (`YYYY-MM-DD`, tanggal
        publish WIB), `tag` (`investasi`|`properti`|`perumahan`), `cover`
        (path di bawah `/artikel/`), `penulis`.
      - Baca konten build-time via
        `import.meta.glob('/src/content/artikel/*.md', { eager: true, query: '?raw', import: 'default' })`.
        **GOTCHA: JANGAN pakai `fs.readFile` di load** — jalan di dev lokal
        tapi MATI di Vercel (fs tidak ke-bundle di serverless).
      - Markdown → HTML via `marked`; parser frontmatter boleh `gray-matter`
        atau hand-rolled — pilih yang paling sedikit dependency baru.
      - **Helper tunggal `artikelTayang(list, hariIni)`**: hanya artikel
        `tanggal <= hari ini` yang tampil (future-dated = tersembunyi).
        SATU fungsi dipakai semua konsumen (index, detail, sitemap, RSS,
        terkait) — jangan copy-paste kondisinya; satu titik lupa = artikel
        future-dated bocor duluan.
      - **Gambar Unsplash**: JANGAN hotlink `images.unsplash.com` di produksi
        (latency dari Indonesia + dependency eksternal). Script bun
        `scripts/ambil-gambar-artikel.ts`: unduh dari URL Unsplash dengan
        param ukuran/quality (`?auto=format&fit=crop&w=1600&q=80`) → simpan
        `static/artikel/<slug>-cover.jpg`, file di-commit ke repo (bukan
        fetch saat build CI — network di CI itu rapuh). Catat URL sumber +
        nama fotografer di `src/content/artikel/CREDITS.md` (lisensi
        Unsplash: komersial boleh, atribusi tidak wajib — tapi dicatat).
      - Routing: `/artikel` (index urut `tanggal` desc; filter tag via query
        `?tag=` client-side — canonical TETAP `/artikel` polos) dan
        `/artikel/[slug]` detail. Keduanya `prerender = true`; route dinamis
        WAJIB export `entries` (listing slug dari glob yang sama, bukan fs).
      - On-page SEO per artikel: `<svelte:head>` title (<60 char) + meta
        description, `og:type=article`, og:image cover absolut, JSON-LD
        `Article` + `BreadcrumbList` — pakai `amankanJsonLd()` dari
        `src/lib/jsonld.ts` (pola & escape `</` sudah teruji, jangan buat
        pola baru), navigasi artikel sebelum/berikutnya.
      - Nav: tambahkan tautan "Artikel" di header & footer mengikuti pola
        link yang sudah ada (perilaku `?ref=`-nya ikut pola global).
      - Layout artikel mobile-first, lebar teks `max-w-prose`, pakai design
        token yang ada — jangan perkenalkan gaya baru.
      - Update dokumen: site map di `../CLAUDE.md` + keputusan "blog markdown
        in-repo, bukan CMS" di `../docs/user-story.md` §Keputusan.
      - Verifikasi: `check`/`bun test`/`test:component`/`build` hijau;
        `build/prerendered/artikel` terisi; satu artikel dicek manual:
        canonical `SITE.url/artikel/...`, JSON-LD di-parse (bukan grep),
        og:image absolut, artikel future-dated TIDAK tampil.

      **Hasil**: parser/filter murni di `src/lib/artikel.ts` (+11 unit
      test, termasuk validasi fail-fast frontmatter) + glue build-time di
      `src/lib/server/artikel.ts` (glob `?raw` + `marked`) — isi markdown
      TIDAK pernah masuk bundle JS client (diverifikasi grep chunk
      immutable kosong); halaman detail menerima HTML jadi via data load.
      Route `/artikel` (filter `?tag=` client-side, guard `browser` karena
      `url.searchParams` dilarang saat prerender) + `/artikel/[slug]`
      (`entries` dari artikel tayang) keduanya prerender. Script
      `scripts/ambil-gambar-artikel.ts` mengunduh cover Unsplash
      1600×900 (`fm=jpg&fit=crop`) → `static/artikel/`, regenerasi
      `CREDITS.md`; 2 artikel contoh (1 tayang, 1 future-dated
      2026-09-25). JSON-LD Article+Breadcrumb via `amankanJsonLd()`
      ter-parse valid (3 blok); og:image/canonical absolut; artikel
      future-dated 404 & tidak bocor di index. Passthrough `?ref=`:
      nav via `withRef` seperti biasa + link body markdown di-rewrite
      `$effect` pasca-hidrasi — diverifikasi Playwright (nav + body
      bawa ref, klik `/kpr` utuh). `check`/`bun test` (90)/
      `test:component` (40)/`build` kedua adapter hijau.
      (2026-09-18, pi, review Abdul)

- [x] **Artikel (2/7): distribusi — sitemap per-artikel (lastmod NYATA),
      RSS, artikel terkait** —
      - `sitemap.xml`: tambah `/artikel` + semua URL artikel yang tayang;
        `<lastmod>` artikel diambil dari `tanggal` frontmatter (nyata per
        artikel — BEDA dari halaman API yang cuma punya timestamp build;
        jangan ubah perilaku lastmod halaman lain).
      - RSS `/rss.xml` (`+server.ts`, pola cache seperti sitemap,
        `s-maxage`), 20 artikel terbaru, URL absolut via `SITE.url`, plus
        `<link rel="alternate" type="application/rss+xml">` di root layout.
      - Artikel terkait: 3 artikel `tag` sama terbaru (fallback tag lain
        bila kurang) — dirender build-time, bukan runtime.
      - **Audit internal linking**: setiap artikel minimal 2 tautan internal
        ke route yang PASTI ada di kedua mode data (`/cari`, `/kpr`,
        `/artikel/...`). JANGAN tautkan ke slug fixture spesifik
        (`/perumahan/griya-asri-bogor` dll) — slug itu tidak ada di mode API
        asli → tautan mati diam-diam di produksi.
      - `robots.txt`: tidak perlu perubahan (semua artikel indexable) —
        cukup konfirmasi, jangan tambah apa pun.

      **Hasil**: sitemap + `/artikel` (17 URL — artikel detail pakai
      `<lastmod>` NYATA dari frontmatter, halaman lain tetap timestamp
      build; privasi/syarat-ketentuan tetap tidak bocor — diverifikasi
      parse XML, bukan grep). RSS `/rss.xml` (RSS 2.0, escapeXml, pubDate
      RFC 822 dari tanggal WIB, s-maxage=3600) + `<link rel="alternate">`
      di root layout — terparse valid. Terkait: 3 se-tag terbaru fallback
      lintas tag, build-time; terbukti render lewat tes sementara (tanggal
      artikel future dimajukan → section muncul → direvert bersih).
      Audit internal link: 0 tautan ke slug fixture. robots.txt tanpa
      perubahan. check/test(90)/build hijau. (2026-09-18, pi, review Abdul)

- [x] **Artikel (3/7): rencana editorial 30 hari** — deliverable:
      `src/content/artikel/PLAN.md`, BUKAN artikel. Isi: 30 judul — 10 per
      tema (`investasi`, `properti`, `perumahan`), dirotasi lintas tema
      (jangan 10 hari investasi beruntun — variasikan klaster keyword per
      minggu). Per judul: keyword target + search intent, angle unik,
      tanggal publish, pilihan cover Unsplash (URL + fotografer). Bar
      kualitas untuk menilai batch nanti: 800–1200+ kata, struktur H2/H3,
      angka konkret (simulasi KPR, hitungan DP/cicilan nyata), E-E-A-T
      konteks pasar Indonesia, satu suara bahasa Indonesia konsisten dengan
      copy site. WAJIB: disclaimer "bukan nasihat keuangan" di artikel
      bertema investasi; JANGAN janji imbal hasil/ROI spesifik. Arah judul
      (contoh, bukan final): "Cicilan vs Sewa: Hitungan 5 Tahun", "SHM vs
      SHGB: Bedanya Sebelum Tanda Tangan", "Tipe 36 vs 45 untuk Keluarga
      Muda".

      **Hasil**: `src/content/artikel/PLAN.md` — 30 slot (Hari 1 = 2026-09-18
      s.d. Hari 30 = 2026-10-17), 10 per tema, rotasi tanpa 3-hari-beruntun,
      klaster keyword per minggu; per judul ada keyword+intent+angle+tanggal.
      H1 & H8 = 2 artikel yang sudah ada. Pool 295 kandidat cover Unsplash
      dikurasi via napi (disimpan lokal saat penyusunan; cover final dipilih
      per artikel saat batch). PLAN.md/CREDITS.md dikecualikan dari glob
      artikel (server module + script). Build tetap hijau.
      (2026-09-18, pi, review Abdul)

- [x] **Artikel (4/7): mekanisme publish harian** — supaya "posting tiap
      hari" terjadi tanpa commit manual harian. Dua opsi, pilih SATU dan
      dokumentasikan pilihannya: (1) rekomendasi — GitHub Action cron
      ~05:30 WIB memanggil Vercel deploy hook tiap pagi (re-deploy commit
      terakhir; build baru = helper `artikelTayang` melepas artikel yang
      tanggalnya tiba); (2) fallback yang disadari — publish batch manual
      2–3x/minggu, tiap deploy melepas beberapa artikel sekaligus (SEO
      tidak terpengaruh; moving parts lebih sedikit). Konfigurasi via
      secret/env, dokumentasikan di `README.md`. Verifikasi: future-dated
      tidak muncul di index/detail/sitemap/RSS/terkait sebelum tanggalnya
      (semua lewat helper yang sama), dan muncul otomatis setelah re-build
      dengan tanggal yang dimajukan.

      **Hasil**: opsi (1) cron dipilih — `.github/workflows/artikel-harian.yml`
      (22:30 UTC = 05:30 WIB, `workflow_dispatch` utk manual, gagal eksplisit
      kalau secret `VERCEL_DEPLOY_HOOK_URL` belum diset) + fallback batch &
      varian self-host Docker didokumentasikan di README §Rilis artikel
      harian. Semua konsumen tanggal sudah lewat helper `artikelTayang`
      (item 1/7) — tidak ada kondisi tersebar. "Muncul setelah re-build
      dengan tanggal dimajukan" terbukti di pengujian item 2/7 (tanggal
      sementara dimajukan → artikel muncul di index/detail/sitemap →
      direvert). (2026-09-18, pi, review Abdul)

- [x] **Artikel (5/7): pilot 3 artikel (checkpoint kualitas)** — tulis 3
      artikel (satu per tema) sesuai PLAN.md + format fondasi (gambar sudah
      diunduh via script). Reviewer menilai: kedalaman (bukan konten AI
      generik), konsistensi suara, SEO on-page (judul <60 char, deskripsi
      ≤160, hierarki heading, ≥2 internal link), JSON-LD valid, render
      mobile, dan RELEVANSI cover Unsplash (bukan sekadar ada gambar).
      Pilot LULUS = format dikunci → item 6–7 jalan. Pilot GAGAL = revisi
      format dulu — jangan buang 27 artikel dengan format yang salah.

      **Hasil**: pilot perumahan H3 "Tipe 36 vs Tipe 45" (2026-09-20,
      cover Bailey Alexander) — satu per tema terpenuhi (H1 investasi, H8
      properti sudah ada dari fondasi). Format terkunci: frontmatter lengkap,
      H2/H3 + tabel GFM, ≥2 tautan internal (/kpr & /cari), disclaimer,
      cover 1600x900 relevan. Parser frontmatter memvalidasi judul/deskripsi/
      tanggal saat build; future-dated diverifikasi 404 + tidak muncul di
      RSS/index; check/test(90)/build hijau. (2026-09-18, pi, review Abdul)

- [x] **Artikel (6/7): batch A — 14 artikel (hari 1–14)** — sesuai PLAN.md +
      format terkunci pilot, future-dated mengikuti jadwal (mekanisme rilis
      = item 4). Verifikasi per artikel sama dengan pilot + semua test hijau
      + build size masih sehat.

      **Hasil**: 11 artikel baru (H2 cek sertifikat BPN, H4 DP 10vs20, H5
      cluster, H6 BPHTB, H7 fixed vs floating, H9 site plan, H10 rumah
      sebagai aset, H11 lelang, H12 subsidi, H13 properti vs emas, H14
      IMB/PBG) — temuan desain penting saat verifikasi: artikel hari ini
      yang menaut artikel future memecah build (crawler prerender menolak
      link 404) DAN bikin 404 bagi pengunjung; diperbaiki dengan
      `amankanTautanArtikel()` (link ke slug belum tayang didegradasi ke
      /artikel saat build; rebuild harian deploy hook otomatis
      memulihkannya begitu target tayang) + unit test. Diverifikasi live:
      cek-sertifikat tayang, tautannya ke SHM (09-25) tertulis /artikel,
      akses langsung SHM 404. Jumlah aktual batch A = 11 (bukan 14 —
      H1/H3/H8 sudah terpenuhi fondasi+pilot). Cover via script (14 jpg,
      CREDITS.md termutakhir; 1 URL 404 diganti). check/test(91)/build
      hijau. (2026-09-19, pi, review Abdul)

- [x] **Artikel (7/7): batch B — 13 artikel (hari 15–30)** — idem batch A.
      Setelah merge: verifikasi sitemap berisi 30+1 URL artikel, RSS valid,
      dan tidak ada tautan internal mati (`grep` slug fixture di
      `src/content/`).

      **Hasil**: 16 artikel H15–H30 (strata, cash flow kontrakan, appraisal,
      spek bangunan, over KPR, sertifikat developer, RDTR, KPR kedua,
      lingkungan, jual-rumah-KPR, inflasi, kaveling vs jadi, renovasi, exit
      strategy, pengelola kawasan, waris). Total sprint: 30/30 artikel
      (2 fondasi + 1 pilot + 11 batch A + 16 batch B), 30 cover self-host
      + CREDITS.md. Verifikasi: build simulasi tanggal 2026-10-17 (override
      hariIniWib dgn revert try/finally) → 30 halaman prerender OK, semua
      tautan antar-artikel resolve (amankanTautanArtikel dari item 6/7);
      build tanggal riil juga hijau (3 tayang: cicilan, cek-sertifikat,
      + sesuai tanggal). check/test(91)/component(40) hijau. Jumlah aktual
      batch B = 16 (bukan 13 — lihat catatan item 6/7).
      (2026-09-19, pi, review Abdul)


## Aturan untuk implementor (pi/GLM)

- Baca `../CLAUDE.md`, `README.md`, dan file yang relevan dengan tugasnya
  dulu sebelum mengedit — ikuti konvensi yang SUDAH ADA (komentar Bahasa
  Indonesia, tab, single quote, mobile-first, dst), jangan perkenalkan gaya
  baru.
- Jangan menyentuh `src/lib/ref.ts` atau logika passthrough `?ref=` kecuali
  tugasnya secara eksplisit tentang itu — itu jalur yang paling gampang
  rusak diam-diam (lihat komentar di file itu).
- Jangan menjalankan perintah `git` apa pun (commit/push/reset) — commit
  dilakukan reviewer setelah review selesai.
- Sebelum melapor selesai: jalankan `bun run check`, `bun test`, dan
  `bun run build` di `landing/`, dan pastikan semuanya lulus. Perbaiki
  sendiri kalau ada yang gagal.
- Satu iterasi = satu item di atas. Jangan mengerjakan item lain sekaligus.
