# 06 — Membuat Video Perkenalan Omahe dengan AI

Kembali ke [ringkasan](README.md). Jadwal tayang: [07 — Rencana 7 hari pertama](07-rencana-7-hari-pertama.md), Hari 1.

**Prinsip utama: AI untuk adegan cerita, rekaman asli untuk produk.**

- **Adegan dari AI:** keluarga ngontrak, bingung beli rumah, serah kunci.
- **Rekaman asli:** layar omahe.co.id dan foto/video perumahan.

Jangan menampilkan rumah buatan AI seolah-olah perumahan yang dijual. Itu bisa dianggap iklan menyesatkan (UU Perlindungan Konsumen) dan merusak kepercayaan.

---

## Langkah 1: Tentukan format

- **Durasi:** 35–45 detik
- **Rasio:** vertikal 9:16 (1080×1920), satu file untuk TikTok, Reels, dan FB
- **Gaya:** cerita singkat "dari ngontrak ke rumah sendiri", diisi suara narator
- **Tanpa dialog di layar.** Gerakan bibir AI untuk bahasa Indonesia sering kurang natural, jadi narasi cukup lewat voiceover.

## Langkah 2: Naskah & storyboard

| # | Detik | Visual | Sumber | Voiceover |
|---|---|---|---|---|
| 1 | 0–4 | Pasangan muda di kamar kontrakan sempit, menghitung uang, wajah lelah | **AI** | "Masih ngontrak? Tiap bulan bayar, tapi rumahnya bukan milikmu." |
| 2 | 4–9 | Si istri scroll HP di kasur, bingung | **AI** | "Mau beli rumah, tapi bingung mulai dari mana. DP-nya, KPR-nya, lokasinya." |
| 3 | 9–17 | Rekam layar HP: buka omahe.co.id → /cari → scroll kartu perumahan | **Asli** | "Kenalin, Omahe. Bandingkan banyak perumahan baru sekaligus, dalam satu tempat." |
| 4 | 17–24 | Rekam layar: /kpr, isi harga, cicilan muncul | **Asli** | "Hitung cicilan sesuai gajimu, langsung dari HP." |
| 5 | 24–32 | Pasangan bersalaman dengan konsultan, lalu menerima kunci. Teks: **DP mulai 0%\* · Cashback Rp1 jt** | **AI** + teks | "Lewat Omahe, DP mulai nol persen, plus cashback satu juta setelah akad. Kami dampingi gratis sampai serah kunci." |
| 6 | 32–40 | Pasangan membuka pintu rumah baru saat sore keemasan → **end card**: logo, `omahe.co.id`, `@omaheofficial`, "\*S&K berlaku" | **AI** + desain | "Omahe. Where your story begins. Follow @omaheofficial." |

Total narasi sekitar 90–100 kata untuk ±40 detik.

## Langkah 3: Pilih tools

Tools AI berubah cepat; daftar ini per Oktober 2026, jadi cek harga dan fitur terbarunya:

| Kebutuhan | Rekomendasi | Alternatif |
|---|---|---|
| Gambar karakter referensi | Gemini (Nano Banana) / ChatGPT Image | Midjourney |
| Gambar → video | **Kling AI** atau **Google Veo** (via Gemini/Flow) | Runway, Hailuo (MiniMax), Sora |
| Voiceover | **Suara sendiri** (paling dipercaya), atau ElevenLabs suara Indonesia | Fitur text-to-speech CapCut |
| Edit, subtitle, musik | **CapCut** | — |

⚠️ **Lisensi:** paket gratis biasanya ada watermark dan/atau tidak boleh dipakai komersial. Ambil paket berbayar minimal 1 bulan di tool video yang dipakai.

## Langkah 4: Buat karakter yang konsisten

Kesalahan paling umum di video AI adalah wajah tokoh yang berubah di setiap adegan. Caranya:

1. Buat **1 gambar referensi** pasangan dulu, lalu pakai gambar itu terus.
2. Buat gambar awal untuk setiap adegan dari referensi itu (fitur *reference image*), dengan baju yang sama.
3. Jadikan gambar itu video lewat **image-to-video**, bukan text-to-video. Hasilnya jauh lebih konsisten.

Prompt gambar referensi (bahasa Inggris biasanya memberi hasil lebih baik):

```
Indonesian married couple in their late 20s, warm friendly faces, wife wears
a simple hijab and pastel blouse, husband wears a plain navy t-shirt, natural
Southeast Asian features, realistic photo, soft natural light, 9:16 vertical
```

## Langkah 5: Generate klip video (prompt per adegan)

Setiap klip dibuat 5–8 detik. Generate 3–4 versi per adegan, lalu pilih yang terbaik.

**Adegan 1:**
```
The same couple sitting on the floor of a small, cramped rented room in an
Indonesian suburb, counting rupiah banknotes, tired expressions, fan spinning,
slow push-in camera, realistic, cinematic natural light, vertical 9:16,
no text, no logos
```

**Adegan 2:**
```
The wife lying on a thin mattress scrolling her smartphone, confused and
thoughtful, the husband sitting beside her, evening warm lamp light,
handheld camera, realistic, vertical 9:16, no text, no logos
```

**Adegan 5:**
```
The couple shaking hands with a friendly property consultant in a bright
modern marketing office, then receiving a set of house keys, smiling,
realistic, cinematic, vertical 9:16, no text, no logos
```

**Adegan 6:**
```
The couple opening the front door of a modest new two-bedroom house in an
Indonesian housing complex at golden hour, looking at each other happily,
slow camera dolly back, realistic, cinematic, vertical 9:16, no text, no logos
```

Tips:
- *"no text, no logos"* wajib, karena AI sering membuat tulisan aneh.
- Buang klip yang tangan, jari, atau wajahnya cacat.

## Langkah 6: Rekam bagian asli

- Rekam layar HP (fitur bawaan Android/iPhone) saat membuka **omahe.co.id → /cari → /perumahan/... → /kpr**.
- Scroll pelan-pelan, dan matikan notifikasi HP dulu.
- Opsional: di CapCut, tempel rekaman layar ke dalam mockup HP supaya terlihat rapi.

## Langkah 7: Voiceover

- Rekam di ruangan sunyi dengan mic clip-on/HP, nada hangat, tidak terlalu cepat.
- Kalau pakai ElevenLabs, pilih suara Indonesia yang natural, lalu dengarkan ulang pelafalan "Omahe" dan "KPR".

## Langkah 8: Edit di CapCut

1. Susun klip sesuai storyboard, lalu masukkan voiceover.
2. **Subtitle otomatis** (Auto captions, Bahasa Indonesia), lalu koreksi manual. Gunakan font tebal, teks putih dengan outline, dan letakkan di tengah layar, bukan di bawah (supaya tidak tertutup tampilan TikTok).
3. Teks overlay angka dibuat besar: **DP mulai 0%\***, **Cashback Rp1 jt**.
4. Warna brand: hijau `#0B3D28`, gold `#B8862F`.
5. Musik: pakai musik dari library CapCut/TikTok yang **boleh untuk komersial** dengan volume pelan (±15–20%). Jangan pakai lagu populer berhak cipta.
6. End card 3–4 detik: logo, `omahe.co.id`, `@omaheofficial`, "\*S&K berlaku, tergantung persetujuan bank & program developer".
7. Export **1080×1920, 30 fps**, kualitas tinggi.

## Langkah 9: Upload

- **Aktifkan label "AI-generated"**: TikTok punya toggle *AI-generated content*, Instagram/FB punya label *AI info*. Platform mewajibkan label ini untuk konten AI yang realistis, dan konten tanpa label bisa diturunkan jangkauannya.
- Pilih cover dari adegan 6 yang paling menarik, ditambah teks "Kenalan sama Omahe".
- Caption: lihat [07 — Hari 1](07-rencana-7-hari-pertama.md#hari-1--kamis-22-oktober-2026).
- **Pin** video ini di ketiga platform.

## Checklist sebelum posting

- [ ] Wajah tokoh konsisten di semua adegan AI
- [ ] Tidak ada tulisan/logo aneh buatan AI
- [ ] Rumah buatan AI tidak disebut sebagai perumahan tertentu
- [ ] Ada "\*S&K berlaku" untuk klaim DP 0% & cashback
- [ ] Subtitle sudah dikoreksi, `@omaheofficial` ejaannya benar
- [ ] Ditonton ulang di HP tanpa suara, pesannya tetap jelas

**Perkiraan waktu:** 1–2 hari kerja. **Perkiraan biaya:** langganan 1 bulan tool video AI (umumnya sekitar US$10–30), plus ElevenLabs kalau tidak pakai suara sendiri.

Template ini bisa dipakai ulang untuk video AI lain: ganti naskah di Langkah 2, tetapi pertahankan gambar referensi karakter yang sama supaya "keluarga Omahe" jadi tokoh yang dikenali penonton.
