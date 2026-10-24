# Artikel harian otomatis

Satu artikel per hari, dikaitkan dengan berita ekonomi/regulasi terkini — tanpa
rencana editorial manual. Jalan di server `hadirapp01` via cron user `abdul`.

## Alur (`jalankan.sh`)

1. **Riset — Claude Code headless** (`prompt-riset.md`): WebSearch/WebFetch berita
   7 hari terakhir (BI, BPS, JDIH, Kementerian PKP, BP Tapera, pajak, OJK…), verifikasi
   ke sumber (PDF peraturan dibaca lewat `pdftotext`), pilih cover Unsplash yang
   belum dipakai → `brief.md` (slug, tag, cover, dosier fakta + sumber).
2. **Tulis — pi `zai/glm-5.3-flash`** (`prompt-tulis.md`) hanya dari brief. Bila pi
   gagal (kuota GLM habis/timeout) atau hasil tidak lolos validasi → Claude menulis.
3. **Cek fakta — Claude** (`prompt-cek.md`): angka/tanggal/kutipan harus didukung
   dosier, wacana tidak boleh ditulis seolah berlaku, simulasi dihitung ulang.
4. **Publikasi**: `landing/scripts/ambil-gambar-artikel.ts` (cover + CREDITS.md),
   `validasi.ts`, commit + push ke `main` → Vercel deploy otomatis.

Pengaman: lock (`flock`), idempoten per tanggal WIB (artikel bertanggal hari ini
sudah ada → keluar), menunggu CI runner selesai & RAM ≥ 900 MB (maks 2 jam), clone
terpisah `~/projects/omahe-artikel-bot` (repo kerja tidak disentuh), commit ditolak
bila ada perubahan di luar folder artikel.

## Jadwal

```
# crontab -e (zona server Europe/London; dua slot supaya aman saat pergantian DST)
30 21 * * * /home/abdul/projects/omahe-artikel-bot/ops/artikel-otomatis/jalankan.sh
30 22 * * * /home/abdul/projects/omahe-artikel-bot/ops/artikel-otomatis/jalankan.sh
```
21:30/22:30 waktu London = 03:30–05:30 WIB → artikel tayang sebelum pagi. Slot kedua
otomatis keluar bila slot pertama sudah menerbitkan.

## Log & pemantauan

- `~/.local/state/omahe-artikel/ringkasan.log` — satu baris per hari (TERBIT/GAGAL).
- `~/.local/state/omahe-artikel/<tanggal>/` — `log.txt`, `brief.md`, keluaran tiap tahap.
- Uji tanpa push: `ARTIKEL_DRY_RUN=1 ARTIKEL_TANGGAL=2026-10-26 ./jalankan.sh`.

## Validasi (`validasi.ts`)

`bun ops/artikel-otomatis/validasi.ts <artikel.md> <YYYY-MM-DD>` — frontmatter
(`parseFrontmatterArtikel`), tanggal, slug & cover unik, 700–1700 kata, ≥ 2 tautan
internal valid (tidak ke artikel yang belum tayang), bagian `## Sumber` ≥ 2 URL.

## Catatan

- Kuota: riset + cek fakta memakai kuota Claude (±2 sesi/hari); penulisan memakai GLM.
- Konten AI tanpa review manusia: artikel salah tetap mungkin. Baca `ringkasan.log`
  dan koreksi lewat commit biasa bila perlu.
- Workflow GitHub `artikel-harian.yml` (deploy hook pagi) tetap dibiarkan — tidak
  bentrok, hanya re-deploy.
