Kamu bekerja di repo {{REPO}} (SvelteKit di `landing/`). Tugas: tulis SATU artikel blog di `landing/src/content/artikel/{{SLUG}}.md` berdasarkan brief di bawah. JANGAN mengubah file lain, JANGAN commit/push, JANGAN menjalankan build/dev server.

## Baca dulu
- `landing/src/content/artikel/PLAN.md` (bar kualitas) dan 2 artikel contoh: `inflasi-harga-rumah-menabung-dulu.md`, `bunga-fixed-vs-floating-kpr.md` — tiru suara bahasa, struktur, gaya tautan internal, penutup disclaimer.

## Aturan
- 800–1200 kata, H2/H3, Bahasa Indonesia rapi (sapaan "Anda"), nada INFORMATIF & EDUKATIF — bukan clickbait, bukan menakut-nakuti, bukan promosi.
- Kaitkan berita/regulasi di brief dengan DAMPAK PRAKTIS bagi pembeli rumah: apa artinya, apa yang perlu dicek/dilakukan, simulasi angka sederhana bila relevan (label "ilustrasi"; cek ulang aritmetika — cicilan anuitas: P·r/(1−(1+r)^−n), r bunga bulanan).
- HANYA pakai fakta dari "Dosier fakta" brief. Jangan mengarang angka/tanggal/nomor peraturan/kutipan/lembaga. Wacana ditulis sebagai wacana.
- ≥ 2 tautan internal: `/kpr`, `/cari`, atau `/artikel/<slug>` yang FILE-nya ada di folder dan bertanggal ≤ {{TANGGAL}}.
- Akhiri dengan `## Sumber` (daftar URL dari brief yang dipakai), lalu `---` dan disclaimer miring (investasi: "bukan nasihat keuangan"; regulasi: "rujuk naskah resmi").

## Frontmatter (format persis, petik tunggal; hindari petik tunggal di dalam nilai)
```
---
judul: '<≤ 60 char>'
deskripsi: '<≤ 155 char>'
tanggal: '{{TANGGAL}}'
tag: '<tag dari brief>'
cover: '/artikel/{{SLUG}}-cover.jpg'
coverSumber: 'https://images.unsplash.com/<cover-id>?fm=jpg&fit=crop&w=1600&h=900&q=80'
coverFotografer: '<cover-fotografer>'
coverHalaman: '<cover-halaman>'
penulis: 'Tim Omahe'
---
```

## Verifikasi sebelum selesai
`bun ops/artikel-otomatis/validasi.ts landing/src/content/artikel/{{SLUG}}.md {{TANGGAL}}` harus `OK` (cover belum terunduh itu normal — validator tidak mengeceknya). Perbaiki sampai OK.

## Brief
{{BRIEF_ISI}}
