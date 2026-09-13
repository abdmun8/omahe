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
- [ ] **Aksesibilitas pass** — audit manual: kontras warna accent/primary di
      atas putih & di atas gelap, semua ikon dekoratif punya `aria-hidden`,
      urutan fokus hamburger menu & filter chip, `<details>` FAQ bisa
      dioperasikan keyboard-only.
- [ ] **Sitemap lebih lengkap** — tambahkan `lastmod` (dari data yang ada;
      kalau tidak ada timestamp, boleh tanggal deploy) dan halaman legal
      (`/tentang`, `/kontak`) ke `sitemap.xml`; sertakan `<lastmod>` sesuai
      spec sitemaps.org.
- [ ] **404 unit-not-found di anchor `#tipe-unit`** — kalau proyek tidak
      punya `tipeUnit` sama sekali, halaman `/perumahan/:slug` sudah punya
      empty state; pastikan juga kartu di `/cari` yang link ke proyek yang
      sudah tidak aktif (404 di backend) tidak bikin seluruh halaman crash —
      cek penanganan error di `getPerumahan`.

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
