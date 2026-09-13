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
- [ ] **OpenGraph image di halaman tanpa foto** — `/`, `/cari`, `/developer`,
      `/kpr` belum punya `og:image` (perumahan detail sudah, pakai foto
      hero). Opsi murah: satu static og-image branded di `static/`, dipakai
      sebagai fallback lewat `SITE` config.
- [ ] **Component test dasar** — pasang `@testing-library/svelte` + `jsdom`,
      tes render untuk `unit-card.svelte` (harga tampil benar, link developer
      hanya muncul kalau `developer` tidak null, tombol WA/Telepon selalu
      ada) dan `contact-buttons.svelte` (href `wa.me`/`tel:` benar).
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
