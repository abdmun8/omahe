# 02 — Strategi Iklan Berbayar

Kembali ke [ringkasan](README.md). Batas biaya per lead (CPL) dihitung di README §3:
**subsidi ≤ ± Rp24.000/lead, komersil ≤ ± Rp42.000/lead**. Semua keputusan iklan diukur terhadap angka ini.

---

## 1. Prinsip

1. **Iklan memperbesar konten yang sudah terbukti**, bukan menggantikan. Video organik dengan retensi tinggi → jadikan iklan (TikTok Spark Ads / IG partnership/boost).
2. **Lead ke WhatsApp dulu.** Di Indonesia, Click-to-WhatsApp (CTWA) hampir selalu lebih murah & lebih cepat jadi percakapan dibanding mengarahkan ke website.
3. **Kreatif adalah targeting.** Dengan algoritma sekarang, targeting luas + kreatif yang spesifik ("buat karyawan Jababeka") mengalahkan targeting minat yang sempit.
4. **Geografi adalah filter terkuat.** Pembeli rumah hampir selalu tinggal/bekerja dalam radius ±25 km dari perumahan.

---

## 2. Funnel & jenis kampanye

| Tahap | Tujuan | Platform & format | Porsi anggaran (awal → skala) |
|---|---|---|---|
| **TOFU**: kenal | Jangkauan murah ke audiens baru, isi audiens retargeting | TikTok Spark Ads (video organik terbaik), Meta Reels — objektif *Engagement/Video views* | 15% → 25% |
| **MOFU**: pertimbangkan | Penonton video 50%+, pengunjung web, interaksi IG/FB | Meta **Instant Form** (lead form dengan pertanyaan kualifikasi), carousel perbandingan perumahan | 25% → 25% |
| **BOFU**: hubungi | Percakapan WA | Meta **Click-to-WhatsApp**, TikTok **Messaging/Lead ads ke WA**, **Google Search** (fase 2) | 60% → 50% |

### Lead form Meta (MOFU): pertanyaan kualifikasi

Pakai tipe *Higher intent* (ada layar konfirmasi) supaya lead asal-klik berkurang.

1. Domisili / lokasi kerja (pilihan kota)
2. Pekerjaan: karyawan tetap / kontrak / wiraswasta / ASN-TNI-Polri / lainnya
3. Penghasilan per bulan (rentang): < 4 jt / 4–7 jt / 7–12 jt / > 12 jt
4. Rumah pertama? Ya / Tidak
5. Kapan ingin punya rumah? < 3 bulan / 3–6 bulan / > 6 bulan
6. Nama & nomor WA (otomatis dari profil)

> Jangan tanya kolektibilitas SLIK di form (sensitif). Tanyakan di WA setelah ada rapport.

---

## 3. Struktur kampanye

```
Kampanye: [BOFU] CTWA – Subsidi – Bekasi/Cikarang
  ├─ Ad set: Radius 25 km dari Perumahan A, usia 21–40, Advantage+ audience
  │    ├─ Iklan 1: Video "Rumah Sejutaan" Perumahan A
  │    ├─ Iklan 2: Video "Bedah Gaji Rp4,5 jt"
  │    └─ Iklan 3: Carousel foto + harga + "DP 0%* + cashback 1 jt"
  └─ Ad set: Radius 25 km dari kawasan industri X (pekerja pabrik)
       └─ (kreatif sama, hook disesuaikan: "Kerja di [kawasan]?")

Kampanye: [BOFU] CTWA – Komersil – [kota]
Kampanye: [MOFU] Lead Form – Retarget video 50% + web 30 hari
Kampanye: [TOFU] Spark Ads – video organik top minggu ini
```

- **Kelompokkan per area**, bukan per perumahan, kalau beberapa perumahan saling berdekatan. Anggaran per ad set yang terlalu kecil membuat algoritma tidak sempat belajar.
- Usia default 21–45; jangan sempitkan minat di awal. Biarkan algoritma belajar, lalu buat **lookalike** dari lead terkualifikasi setelah ±100 lead.
- **Teks pembuka WA otomatis** per kampanye berisi kode sumber, mis. `Halo Omahe, saya mau info rumah DP 0% di Cikarang [IG-ADS-CKR]`, untuk atribusi.

---

## 4. Anggaran bertahap

Angka awal, sesuaikan dengan kas. Mulai kecil, naikkan hanya yang terbukti.

| Fase | Anggaran harian | Alokasi | Aturan |
|---|---|---|---|
| **Uji** (Minggu 3–6) | Rp150–250 rb/hari total (± Rp5–7,5 jt/bulan) | Meta CTWA 60%, TikTok 30%, retarget 10% | 3–5 kreatif per ad set, jangan ubah apa pun 3 hari pertama |
| **Skala** (Minggu 7–12) | Naik 20–30%/minggu pada pemenang | Tambah Google Search 10–20% | Hanya naikkan ad set dengan CPL < target selama 7 hari |
| **Mapan** (bulan 4+) | Ditentukan dari CAC nyata | Sesuai kanal dengan CAC/closing terbaik | Total iklan ≤ 30% fee bersih bulan berjalan |

### Aturan matikan / pertahankan

| Kondisi | Tindakan |
|---|---|
| Sudah habis 2–3× target CPL, belum ada lead | **Matikan iklan** itu |
| CPL < target, lead terkualifikasi ≥ 30% | **Pertahankan**, buat 2 variasi hook baru |
| CPL < target tapi lead tidak berkualitas (asal klik, di luar area) | Perbaiki: perjelas harga & syarat di kreatif, ganti ke lead form *higher intent* |
| Frekuensi > 3 dan CPL naik | Kelelahan kreatif → ganti kreatif |
| CPL bagus selama 7 hari | Naikkan anggaran 20–30% (bukan 2× sekaligus) |

---

## 5. Kreatif iklan

Kreatif iklan terbaik biasanya **terlihat seperti konten organik**, bukan brosur.

**Matriks uji (minimal 1 dari tiap sudut per area):**

| Sudut | Contoh hook |
|---|---|
| Uang / cicilan | "Cicilan Rp1,1 juta, lebih murah dari kontrakan kamu." |
| Hambatan DP | "Tidak punya tabungan DP? Rumah ini bisa DP 0%*." |
| Bonus | "Beli lewat Omahe dapat cashback Rp1 juta setelah akad." |
| Lokasi / pekerjaan | "Kerja di Jababeka? Ini rumah 10 menit dari pabrik." |
| Ketakutan | "Takut KPR ditolak? Cek kelayakan dulu, gratis." |
| Bukti | Video serah kunci / testimoni (setelah ada closing) |

**Format**: video vertikal 9:16, 15–30 dtk, subtitle selalu ada (banyak yang menonton tanpa suara), logo Omahe kecil, angka harga/cicilan besar.

**Kepatuhan iklan**: tetap pakai "DP mulai 0%\*" + S&K di teks iklan, jangan "pasti ACC", jangan menyebut atribut pribadi penonton ("Kamu yang gajinya kecil…"). Kebijakan Meta melarang menyiratkan pengetahuan tentang kondisi keuangan pribadi; ganti dengan "Gaji Rp4 juta bisa…".

---

## 6. Tracking & data (prasyarat teknis)

GA4 sudah terpasang di omahe.co.id (event `whatsapp_click`, `lead_form_submit`, `cta_ajukan`, `kpr_simulasi`, dll. Lihat `docs/user-story.md` §Google Analytics 4). Yang **belum ada** dan perlu dikerjakan tim dev:

- [ ] **Meta Pixel** + event standar `Lead`/`Contact` (dipetakan dari `whatsapp_click` & `lead_form_submit`) untuk retargeting & optimasi konversi web
- [ ] **TikTok Pixel**, event yang sama
- [ ] Perbarui `/privasi` (pixel pihak ketiga)
- [ ] Konvensi **UTM** untuk semua link bio & iklan: `?utm_source=tiktok&utm_medium=bio|ads|live&utm_campaign=<area>-<bulan>`; pastikan UTM tidak mengganggu passthrough `?ref=`
- [ ] (Bulan 3+) Conversions API / upload offline conversion: kirim balik lead yang **booking** ke Meta supaya algoritma mengoptimasi ke pembeli nyata, bukan sekadar pengisi form

**Sumber kebenaran penjualan** tetap sistem `perumahan` (booking dengan `ref` Omahe). Rekap bulanan: cocokkan booking ↔ kode sumber lead di CRM untuk menghitung CAC per kanal.

---

## 7. Google Search Ads (fase 2, niat tertinggi)

Orang yang mengetik "perumahan dp 0 bekasi" sudah siap beli. Volume kecil, tapi kualitasnya tinggi.

- Kata kunci: `rumah subsidi [kota]`, `perumahan dp 0 [kota]`, `kpr subsidi [kota]`, `rumah murah dekat [kawasan industri]`, `perumahan [nama perumahan hero]`
- Kata kunci negatif: `sewa`, `kontrakan`, `kos`, `lowongan`, `gratis`, `second` (Omahe hanya rumah baru)
- Arahkan ke `omahe.co.id/cari?regionKode=…` atau `/perumahan/:slug` + ekstensi panggilan/WA
- Mulai Rp50–100 rb/hari, 1 area dulu
