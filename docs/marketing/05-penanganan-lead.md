# 05 — Penanganan Lead (WhatsApp → Akad)

Kembali ke [ringkasan](README.md).

Iklan & konten bisa sempurna, tapi **uang hilang di sini** kalau lead dibalas lambat atau tidak di-follow-up.
Data industri konsisten: lead yang dibalas dalam **5 menit** jauh lebih mungkin jadi percakapan dibanding yang dibalas 1 jam kemudian. Di jam itu mereka sering sudah chat ke developer/agen lain.

---

## 1. Setup WhatsApp Business

- Nomor khusus marketing (bukan nomor pribadi), profil bisnis lengkap: logo, jam buka, alamat/website, **katalog** berisi perumahan hero (foto, harga mulai, link omahe.co.id).
- Bila volume > 50 chat/hari atau admin > 1 orang: pertimbangkan **WhatsApp Business Platform/API** via penyedia (shared inbox, label, auto-assign).
- **Label**: `Baru` · `Terkualifikasi` · `Jadwal Survei` · `Sudah Survei` · `Berkas` · `Booking` · `Proses KPR` · `Akad` · `Tidak Lolos` · `Dingin`
- **Pesan sambutan otomatis** (di luar jam kerja):
  > Halo, terima kasih sudah menghubungi Omahe 🏠 Kami balas mulai jam 08.00. Sambil menunggu, boleh info: 1) kota tempat kerja, 2) rentang penghasilan per bulan, 3) rumah pertama atau bukan? Supaya kami bisa langsung carikan yang cocok.

---

## 2. Alur kualifikasi (5 pertanyaan, dalam 1–2 pesan)

| # | Pertanyaan | Kenapa |
|---|---|---|
| 1 | Domisili & lokasi kerja | Menentukan perumahan yang relevan |
| 2 | Pekerjaan (tetap/kontrak/wiraswasta/ASN) & lama kerja | Syarat bank |
| 3 | Rentang penghasilan (pribadi/gabungan) | Plafon cicilan (± maks 30–40% penghasilan) |
| 4 | Rumah pertama? Pernah KPR/kredit? Ada cicilan berjalan? | Subsidi vs komersil, risiko SLIK |
| 5 | Target kapan pindah | Prioritas follow-up |

**Skor lead (A/B/C):**
- **A, Panas**: penghasilan & pekerjaan cocok, ingin < 3 bulan → tawarkan **jadwal survei minggu ini**
- **B, Hangat**: cocok tapi 3–6 bulan / masih menimbang → kirim 2–3 pilihan + simulasi, follow-up terjadwal
- **C, Dingin/belum layak**: penghasilan belum cukup, SLIK bermasalah → edukasi, masukkan ke daftar broadcast, follow-up bulanan. **Jangan dibuang**: kondisi orang berubah.

---

## 3. Template balasan cepat (Quick Replies)

**`/salam`**
> Halo Kak [nama] 👋 terima kasih sudah menghubungi Omahe! Saya [admin], siap bantu carikan rumah yang cocok. Boleh tahu dulu: 1) kerja di daerah mana, 2) rentang penghasilan per bulan, 3) ini rumah pertama? 🙏

**`/rekomendasi`**
> Dari info Kakak, ini 3 pilihan yang paling cocok:
> 1. [Perumahan A], [lokasi], cicilan mulai Rp[…]/bln → omahe.co.id/perumahan/[slug]
> 2. …
> Semua bisa DP mulai 0%\* dan lewat Omahe dapat **cashback Rp1 juta** setelah akad. Mau saya jadwalkan lihat lokasi Sabtu/Minggu ini?

**`/biaya`** (jujur sejak awal)
> Untuk [Perumahan A], DP bisa 0%\*. Biaya lain yang perlu disiapkan sekitar Rp[…] (akad, BPHTB, asuransi, dll.; sebagian bisa ditanggung developer, saya cekkan detailnya). Jadi tidak ada kejutan di akhir ya Kak.

**`/survei`**
> Siap! Survei [Perumahan A] hari [..] jam [..] ya Kak. Lokasi: [link Maps]. Nanti ditemani [nama marketing/agen], nomor [..]. Saya ingatkan H-1 🙏

**`/berkas`**: daftar berkas KPR (KTP, KK, NPWP, slip gaji 3 bln, rekening koran 3 bln, SK kerja, surat nikah, dll., disesuaikan bank & tipe pekerjaan).

---

## 4. Ritme follow-up

| Kapan | Isi |
|---|---|
| H+0 | Balasan pertama < 5 menit (jam 08–21) |
| H+1 | Kirim video/foto perumahan yang direkomendasikan |
| H+3 | Simulasi cicilan personal (dari /kpr) |
| H+7 | Ajak survei akhir pekan / info promo terbaru |
| H+14 | Testimoni pembeli lain / konten edukasi |
| H+30, lalu bulanan | Broadcast: stok baru, promo, undangan live |

Maks. 1 pesan per follow-up dan berhenti bila diminta. Spam = nomor dilaporkan = WhatsApp Business diblokir.

---

## 5. Dari survei ke akad: jangan lupakan `ref`

1. **Survei**: konfirmasi H-1, pendamping (marketing perumahan/agen) diberi konteks lead.
2. **Booking**: admin mengirim link **`omahe.co.id/perumahan/:slug?ref=<kode>`** atau langsung **`/ajukan/:slug?ref=<kode>`**. Kode `ref` = kode Omahe atau kode Agen Omahe yang menangani. **Tanpa `ref`, booking tidak tercatat sebagai penjualan Omahe → fee 3% berisiko tidak tertagih.**
3. Setelah booking: cek di sistem bahwa booking muncul dengan referral yang benar.
4. **Proses KPR**: update pembeli setiap 3–5 hari (status berkas, jadwal wawancara bank, SP3K). Pembeli yang dibiarkan tanpa kabar mudah membatalkan.
5. **Akad**: dokumentasi (dengan izin) → konten testimoni/serah kunci.
6. **Cashback Rp1 juta**: cair sesuai S&K setelah fee diterima; kirim konfirmasi tertulis ke pembeli. Minta **ulasan Google / video testimoni** saat itu juga (momen paling bahagia pembeli).
7. **Referral pembeli**: tawarkan pembeli yang sudah akad menjadi pemberi referensi / Agen Omahe (`/gabung/agen`).

---

## 6. Pencatatan (CRM sederhana)

Google Sheet atau CRM, satu baris per lead:

`tanggal masuk · nama · no WA · sumber (kode: TT-LIVE / IG-ADS-CKR / WEB / FB-GRUP / …) · domisili · pekerjaan · rentang penghasilan · skor A/B/C · perumahan diminati · status (label) · tgl survei · tgl booking · kode ref dipakai · tgl akad · harga · fee · cashback cair · catatan`

Data ini dipakai untuk:
- **CAC per kanal** (README §6): biaya kanal ÷ akad dari kanal tersebut
- Konversi per tahap (lead → survei → booking → akad) untuk mencari kebocoran
- Audiens lookalike & offline conversion iklan (02 §6)

> Data pribadi pembeli (nomor, penghasilan, berkas) hanya diakses tim yang perlu. Jangan dibagikan di grup umum & jangan dipakai di konten tanpa izin tertulis.
