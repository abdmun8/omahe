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
