Kamu bekerja di repo {{REPO}} (SvelteKit di `landing/`). Tugas: tulis SATU artikel blog di `landing/src/content/artikel/{{SLUG}}.md` berdasarkan brief di bawah. JANGAN mengubah file lain, JANGAN commit/push, JANGAN menjalankan build/dev server.

## Baca dulu
- `landing/src/content/artikel/PLAN.md` (bar kualitas) dan 2 artikel contoh: `inflasi-harga-rumah-menabung-dulu.md`, `bunga-fixed-vs-floating-kpr.md` — tiru suara bahasa, struktur, gaya tautan internal, penutup disclaimer.

## Aturan
- 800–1200 kata, H2/H3, Bahasa Indonesia rapi (sapaan "Anda"), nada INFORMATIF & EDUKATIF — bukan clickbait, bukan menakut-nakuti, bukan promosi.
- Kaitkan berita/regulasi di brief dengan DAMPAK PRAKTIS bagi pembeli rumah: apa artinya, apa yang perlu dicek/dilakukan, simulasi angka sederhana bila relevan (label "ilustrasi"; cek ulang aritmetika — cicilan anuitas: P·r/(1−(1+r)^−n), r bunga bulanan).
- HANYA pakai fakta dari "Dosier fakta" brief. Jangan mengarang angka/tanggal/nomor peraturan/kutipan/lembaga. Wacana ditulis sebagai wacana.
- **≥ 2 tautan ke FITUR Omahe** (route di bawah, BUKAN `/artikel/…`) yang RELEVAN dengan topik — diselipkan wajar di badan artikel (perpanjang/modifikasi kalimat yang memang membahas hal itu, bukan tumpukan tautan di akhir paragraf). Tambahan boleh: `/artikel/<slug>` yang FILE-nya ada di folder dan bertanggal ≤ {{TANGGAL}}.
- Akhiri isi dengan bagian `## Langkah berikutnya di Omahe` (2–4 butir `-`, SETIAP butir = 1 tautan fitur Omahe + alasan singkat satu baris) — letakkan SEBELUM `## Sumber`.
- Setelah itu `## Sumber` (daftar URL dari brief yang dipakai), lalu `---` dan disclaimer miring (investasi: "bukan nasihat keuangan"; regulasi: "rujuk naskah resmi").

## Fitur Omahe & peta topik → fitur (pilih yang RELEVAN, ≥ 2 per artikel)
Daftar slug NYATA di bawah diambil dari API publik Omahe saat artikel ini disiapkan — pakai apa adanya, JANGAN mengarang slug. Bila daftar kosong/tidak tersedia, pakai route statis saja (/cari, /kpr, /promo, /mitra, /lelang, /developer, /gabung beserta sub-rutenya).

{{DAFTAR_FITUR_OMAHE}}

Petunjuk memilih (sesuaikan sudut artikel, jangan asal tempel):
- Legal/sertifikat/AJB/BPHTB/balik nama/waris → `/mitra?kategori=notaris` (direktori mitra notaris/PPAT).
- Appraisal/penilaian/harga pasar → `/mitra?kategori=kjpp`.
- KPR/bunga/cicilan/DP → `/kpr` (simulasi) + `/promo` atau halaman `/perumahan/<slug>` yang punya program Omahe (cashback/DP 0% — sebut sesuai data, jangan mengarang).
- Subsidi/FLPP/MBR → `/cari` dengan filter yang cocok (mis. `?hargaMax=`, `?regionKode=`).
- Lelang bank → `/lelang`.
- Investasi/penghasilan tambahan/jadi makelar resmi → `/gabung/agen` (gratis) atau `/mitra?tab=agen` (direktori agen).
- Konstruksi/renovasi/spesifikasi bangunan → `/mitra?kategori=kontraktor`.
- Developer/regulasi perumahan/site plan → `/developer` atau `/gabung/perumahan` (developer mendaftarkan proyeknya).
- Memilih rumah/lokasi → `/cari` (plus filter `?regionKode=`/`?q=` bila konteksnya cocok).

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
`bun ops/artikel-otomatis/validasi.ts landing/src/content/artikel/{{SLUG}}.md {{TANGGAL}}` harus `OK` (cover belum terunduh itu normal — validator tidak mengeceknya). Perbaiki sampai OK — termasuk dua aturan baru: ≥ 2 tautan fitur dan bagian `## Langkah berikutnya di Omahe`.

## Brief
{{BRIEF_ISI}}
