# Strategi Konten Sosial Media Omahe (short video)

Disusun 2026-11-08. Status: **disetujui arah, belum dibangun** — langkah pertama prototipe (§9 F0).

## 1. Tujuan & batasan

- **Tujuan**: akun TikTok, Instagram, Facebook Omahe (sudah akun Business) terisi 1 video vertikal/hari,
  konsisten, akurat, dan mengalirkan kunjungan + lead ke `www.omahe.co.id`.
- **Batasan keras** (keputusan user):
  1. **Semua gratis dulu** — tanpa langganan berbayar baru.
  2. **Semua bisa dipanggil lewat API/CLI** (tanpa klik manual di aplikasi web pihak ketiga),
     supaya bisa jalan dari cron seperti pipeline artikel (`ops/artikel-otomatis/`).
  3. **Review manusia lewat Telegram** sebelum tayang.
- Perumahan partner **boleh** ditampilkan (sudah setuju) — batch awal §5.

## 2. Pilar konten & porsi

| Pilar | Isi | Porsi/minggu | Sumber data |
|---|---|---|---|
| **Marketing** | "Rumah pilihan": satu perumahan/tipe — foto asli, harga mulai, LT/LB, KT/KM, lokasi, estimasi cicilan | 3 video | API publik Omahe (`/public/units`, `/public/perumahan/:slug`) |
| **Edukasi** | KPR, subsidi/FLPP, biaya akad, DP, SLIK/BI-Checking, cek legalitas, tips survei | 2 video | Artikel harian + dosier faktanya (sudah dicek fakta) |
| **Berita** | Dampak berita/regulasi pekan ini ke pembeli rumah | 1 video | Dosier artikel (bagian `## Sumber`) |
| **Perkenalan** | Apa itu Omahe, cara cari rumah, simulasi KPR, cek agen asli, Gabung Jaringan | 1 video | Naskah tetap + rekaman layar situs (Playwright) |

Minggu pertama setelah peluncuran: 3 video perkenalan dulu (akun baru perlu "siapa kami").

### Kalender mingguan (1 video/hari)

| Hari | Pilar | Template |
|---|---|---|
| Senin | Edukasi | T3 Poin-poin |
| Selasa | Marketing | T1 Rumah Pilihan |
| Rabu | Edukasi (hitungan) | T2 Hitung KPR |
| Kamis | Marketing | T1 Rumah Pilihan |
| Jumat | Berita pekan ini | T4 Berita |
| Sabtu | Marketing (kurasi) | T1b "3 rumah di bawah Rp X di Karawang" |
| Minggu | Perkenalan / fitur Omahe | T5 Rekaman layar |

## 3. Template video

Semua: **1080×1920, 30–45 dtk, subtitle tertanam** (mayoritas ditonton tanpa suara), narasi TTS
+ musik latar pelan, warna brand (`#0B3D28` hijau, `#B8862F` emas), font Plus Jakarta Sans/Inter,
penutup 2 dtk: logo + "Cari di omahe.co.id".

| Kode | Nama | Struktur adegan |
|---|---|---|
| T1 | Rumah Pilihan | Hook harga (0–3 dtk) → 4–6 foto asli efek zoom pelan + label tipe/LT/LB/KT/KM → lokasi (kab/kecamatan) → harga mulai + estimasi cicilan → CTA |
| T1b | Kurasi | Hook "3 rumah di bawah Rp200 jt di Karawang" → 3 kartu perumahan → CTA |
| T2 | Hitung KPR | Pertanyaan ("Gaji 5 juta bisa KPR berapa?") → angka teranimasi (harga, DP, tenor, bunga, cicilan) dari rumus kalkulator `/kpr` → kesimpulan → CTA ke `/kpr` |
| T3 | Poin-poin | Hook → 3–5 poin (teks besar + video stok Pexels) → ringkasan → CTA ke artikel |
| T4 | Berita | Judul berita → "artinya buat kamu" 2–3 poin → sumber (tulisan kecil) → CTA artikel |
| T5 | Perkenalan | Rekaman layar `omahe.co.id` (Playwright, dibingkai mockup HP) + narasi |

### Struktur naskah (dikeluarkan LLM sebagai JSON, bukan teks bebas)

```json
{
  "pilar": "marketing", "template": "T1", "durasiTarget": 40,
  "hook": "Rumah subsidi di Karawang mulai Rp166 juta?",
  "adegan": [{ "narasi": "...", "teksLayar": "...", "visual": { "jenis": "foto", "sumber": "<url>" } }],
  "caption": "...", "hashtag": ["#rumahsubsidi", "#karawang"],
  "cta": { "teks": "Cek di omahe.co.id", "url": "https://www.omahe.co.id/perumahan/klari-regency?utm_..." },
  "fakta": [{ "klaim": "harga mulai Rp166.000.000", "sumber": "api:/public/units?perumahanSlug=klari-regency" }]
}
```

Field `fakta[]` wajib — tiap angka di naskah harus punya sumber (API atau dosier), dipakai tahap cek fakta.

## 4. Aturan akurasi & kepatuhan

- **Harga/tipe/foto diambil dari API saat video dibuat**, tidak dari ingatan LLM. Tulis "mulai Rp…".
- Simulasi cicilan **wajib menyebut asumsi** (DP, tenor, bunga, fix/floating) + "simulasi, bukan penawaran".
  Rumah subsidi: skema FLPP yang berlaku (ambil dari dosier artikel, jangan dihafal).
- Dilarang: "pasti ACC KPR", "harga naik besok", janji imbal hasil investasi, klaim tanpa sumber.
- **Promo Omahe (keputusan user 2026-11-08): DP 0%* + cashback Rp1 juta setelah akad, berlaku s.d. 31 Des 2026,
  promo terbatas** — WAJIB ada di setiap video marketing perumahan (adegan promo + caption) sampai 31 Des 2026;
  selalu sebut batas waktu + "DP 0% melalui bank mitra Omahe, S&K berlaku". Tidak dipakai di konten KPR
  subsidi/FLPP (skema FLPP punya aturan uang muka sendiri). Per 2026-11-08 API `programOmahe.dp0` masih
  `false` untuk perumahan batch awal (cashback sudah 1.000.000) — situs belum menampilkan badge DP 0%.
- Foto: hanya foto perumahan dari API Omahe (milik tenant, sudah setuju) atau stok berlisensi bebas (Pexels).
- Musik: hanya bebas royalti (Pixabay Music / YouTube Audio Library) — **jangan lagu populer**
  (bisa dibisukan/diturunkan platform). File musik diunduh sekali, disimpan di repo + `CREDITS.md`.
- Tiap video tercatat (tanggal, slug, sumber fakta) supaya topik/perumahan tidak berulang terlalu cepat.

## 5. Batch awal perumahan marketing

Dicek ke API produksi 2026-11-08 (read-only):

| Perumahan | Slug | Developer | Lokasi | Harga mulai | Catatan |
|---|---|---|---|---|---|
| Klari Regency | `klari-regency` | PT Bumi Indah Propertindo | Kab. Karawang | Rp166 jt (28/60) | subsidi |
| Mercu Raya City | `mercu-raya-city` | PT Mercusuar Raya Property | Kab. Karawang | Rp166 jt (28/60) | subsidi |
| Nirwana Residence | `nirwana-residence` | PT Bumi Bangun Nirwana | Kab. Karawang | Rp166 jt (28/60) | subsidi; satu developer dengan Cluster Puri Nirwana (Rp450 jt) |
| Elang Buana Group (10 proyek) | `elang-buana-group` | — | Karawang (+ Dwara Pagon di Subang) | Rp166 jt – Rp1,2 M | dirotasi per proyek: Grand Purwasari, Taman Jati Mas, Mutiara Village, Pesona Cendana, Taman Palm Mas, Grand Mutiara Village, Bumi Indah Proklamasi, Cluster Mutiara Type, Royal Golden City, Dwara Pagon |
| Casa Green Karawang | `casa-green-karawang` | PT. Hanusentra Propertindo | Kab. Karawang | Rp600 jt (Aster Grande) | komersial — penyeimbang segmen subsidi |

("Klari Residence" di daftar awal = Klari Regency.)

Rotasi: Klari Regency, Mercu Raya City, Nirwana Residence, Casa Green Karawang masing-masing 1×/2 minggu, proyek Elang Buana bergiliran di slot sisanya,
Sabtu kurasi ("rumah subsidi Karawang Rp166 jt" — tema kuat karena 3 perumahan sekelas).

## 6. Alat (semua gratis + bisa via API/CLI)

| Kebutuhan | Pilihan | Biaya | Lewat |
|---|---|---|---|
| Riset & naskah | Claude Code headless (kuota langganan yang sudah ada) + pi `glm-5.3-flash` | Rp0 tambahan | CLI |
| Data properti | API publik Omahe `api.omahe.co.id/public/*` | Rp0 | REST |
| Suara (TTS) | **Azure Speech tier F0** — `id-ID-ArdiNeural`/`id-ID-GadisNeural`, 500 rb karakter/bln (kebutuhan ±20 rb), timing per kata untuk subtitle. Prototipe pakai `edge-tts` (suara sama, tanpa akun, tidak resmi) | Rp0 | REST |
| Video stok | Pexels API (komersial OK, tanpa atribusi wajib) | Rp0 | REST |
| Rekaman layar | Playwright (rekam `omahe.co.id`) | Rp0 | CLI |
| Render | **Revideo** (MIT) — template TypeScript, render headless. Alternatif: Remotion (gratis hanya untuk ≤3 karyawan) atau ffmpeg murni | Rp0 | CLI |
| Mesin render | **GitHub Actions runner hosted** (`ubuntu-latest`, BUKAN runner self-hosted produksi) — 2.000 mnt/bln gratis, perkiraan ±90 mnt/bln | Rp0 | `gh workflow run` / REST |
| Review | Telegram Bot API (`sendVideo`, inline keyboard ✅/✏️/❌, `getUpdates`) | Rp0 | REST |
| Posting IG + FB | Meta Graph API — IG Reels (`/media` + `media_type=REELS`, unggah resumable) & FB Page Reels (`/video_reels`); app mode development cukup untuk akun milik sendiri | Rp0 | REST |
| Posting TikTok | Tahap awal **manual** (file dari Telegram → unggah dari HP). Content Posting API: klien belum diaudit hanya bisa posting privat — dicoba `video.upload` (masuk draf/inbox TikTok) di F3 | Rp0 | — / REST |
| Analitik | UTM → GA4 (sudah ada); IG/FB Insights via Graph API | Rp0 | REST |

> Fakta kebijakan platform (kuota, syarat audit TikTok, izin Meta) diverifikasi ulang saat implementasi
> masing-masing tahap — kebijakan sering berubah.

**Tidak butuh MCP** — semua layanan di atas punya REST API yang dipanggil skrip; Claude headless cukup
menjalankan skrip/`curl`.

### Rahasia (di luar repo)

| Rahasia | Lokasi |
|---|---|
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (bot **@omaheofficialbot**) | server `hadirapp01`: `~/.config/omahe-sosmed/env` (600) — **sudah** |
| `META_PAGE_TOKEN`, `IG_USER_ID`, `FB_PAGE_ID` | file yang sama (F2) |
| `AZURE_SPEECH_KEY`, `PEXELS_API_KEY` | GitHub Actions secret (dipakai saat render) |

Bot review: **@omaheofficialbot** (khusus Omahe, tanpa webhook → `getUpdates` aman dipakai poller).

## 7. Alur otomatis

```
cron hadirapp01 ±06:00 WIB (setelah artikel 03:30–05:30 WIB tayang)
 1. pilih slot hari ini dari kalender (§2) + riwayat (hindari ulang)
 2. kumpulkan data: API Omahe (marketing) / brief+dosier artikel hari ini (edukasi/berita)
 3. Claude: naskah JSON (§3)            ← pi glm sebagai alternatif penulis, Claude cek
 4. Claude: cek fakta naskah vs data/dosier; validasi.ts (durasi, panjang teks layar, fakta[], URL)
 5. gh workflow run render-video.yml (input: naskah JSON)
      Actions: TTS Azure → unduh foto/stok → render Revideo → artefak mp4 + thumbnail
 6. server unduh artefak → Telegram: video + caption + hashtag + daftar sumber
      tombol: ✅ Setujui  ✏️ Revisi (balas dengan catatan)  ❌ Lewati
 7. ✅ → F1: tandai siap, kirim file asli (sendDocument) untuk diunggah manual
        F2: otomatis unggah IG Reels + FB Reels pada jam tayang; TikTok tetap manual
    ✏️ → naskah dibuat ulang dengan catatan → kembali ke langkah 4 (maks 2 putaran)
```

Poller Telegram: cron tiap 1–2 menit (`getUpdates` + offset tersimpan) — tanpa webhook, tanpa
server tambahan. Jam tayang IG/FB awal: **11:30** atau **19:00 WIB** (dievaluasi dari Insights).

Pengaman seperti pipeline artikel: `flock`, idempoten per tanggal, log
`~/.local/state/omahe-sosmed/`, ringkasan satu baris per hari, tunggu RAM/CI sebelum memanggil Claude.

Lokasi kode: `ops/sosmed-otomatis/` (skrip, prompt, kalender, riwayat) + `ops/sosmed-otomatis/video/`
(proyek render terpisah, punya `package.json` sendiri — tidak masuk bundel `landing/`).

## 8. Ukuran keberhasilan

| Metrik | Sumber | Target awal (3 bulan) |
|---|---|---|
| Konsistensi | log pipeline | ≥ 26 video/bulan tayang |
| Retensi 3 dtk & rata-rata durasi tonton | Insights | naik tiap bulan (dipakai memilih hook) |
| Kunjungan dari sosmed | GA4 `utm_source=instagram|facebook|tiktok` | tumbuh bulanan |
| Lead dari sosmed | form minat dengan UTM/`src` | ada lead pertama di bulan 1 |
| Tingkat ✅ tanpa revisi | log review | ≥ 70% (ukur kualitas naskah) |

UTM: `utm_source=<platform>&utm_medium=social&utm_campaign=video-<YYYY-MM-DD>-<slug>`.
TikTok tidak bisa link di caption → link di bio ke `omahe.co.id` (+ UTM tiktok).

Laporan mingguan (F3): ringkasan Insights + GA4 dikirim ke Telegram tiap Senin.

## 9. Tahapan

| Tahap | Isi | Selesai bila |
|---|---|---|
| **F0 Prototipe** | 1 video T1 (Klari Regency) + 1 video T2, dirender lokal, `edge-tts` | user menyetujui gaya visual & suara |
| **F1 Harian + review** | pipeline §7 langkah 1–6, render di GitHub Actions, Azure TTS, Telegram ✅/✏️/❌, posting manual | 7 hari berturut-turut video sampai di Telegram |
| **F2 Auto IG/FB** | Meta app (mode development) + page token, unggah otomatis setelah ✅ | video ✅ tayang di IG & FB tanpa sentuhan |
| **F3 TikTok + laporan** | uji Content Posting API (draf), laporan mingguan Insights/GA4 | — |

## 10. Keputusan

- Batch awal: Elang Buana Group (10 proyek), Klari Regency, Mercu Raya City, Nirwana Residence,
  Casa Green Karawang (2026-11-08).
- Bot review: **@omaheofficialbot**.
- Wajah akun: **Ika Dewi** (karyawan) — video bicara ke kamera 1–2×/minggu, naskah + poin
  dikirim pipeline ke Telegram tiap Jumat untuk direkam akhir pekan. Narasi TTS memakai suara
  **wanita (`id-ID-GadisNeural`)** supaya "suara" akun konsisten dengan wajahnya.
- Terbuka: gaya visual & kualitas suara — dinilai di F0.
