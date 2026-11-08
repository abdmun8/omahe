# Video sosmed Omahe — prototipe (F0)

Strategi: `docs/sosmed-strategi.md`. Folder ini = mesin render video vertikal 1080×1920 dari
naskah JSON. Semua gratis: Revideo (MIT), Edge TTS (`msedge-tts`, suara `id-ID-GadisNeural`),
ffmpeg statis (`@ffmpeg-installer`), Telegram Bot API.

## Alur

```
naskah/<id>.json ──siapkan.ts──▶ public/kerja/<id>/{foto-*.jpg, narasi.wav, data.json}
                 ──render.ts───▶ keluaran/<id>.mp4
                 ──kirim-telegram.ts──▶ @omaheofficialbot (video + tombol ✅/✏️/❌ + fakta)
```

```bash
npm ci
npx tsx siapkan.ts naskah/2026-11-08-casa-green-karawang.json
npx tsx render.ts 2026-11-08-casa-green-karawang
npx tsx kirim-telegram.ts 2026-11-08-casa-green-karawang
```

## Naskah (`src/tipe.ts` → `Naskah`)

- Adegan `foto` (judul/sub/chip di atas foto bergeser), `poin` (kartu daftar), `angka`
  (baris label–nilai, `sorot` = kartu emas), `penutup` (logo + URL, layar putih).
- `narasi` dibacakan TTS **dan** jadi subtitle — tulis angka apa adanya ("Rp166 juta"),
  hindari singkatan yang dieja aneh (LT/LB), alamat situs ditulis "omahe titik co titik id"
  (penutup memakai `subtitle:false` karena URL sudah tampil besar).
- Foto `api:tipe/<slugPerumahan>/<slugTipe>#<i>` diambil dari API publik saat `siapkan` (URL
  storage presign kedaluwarsa 24 jam — jangan ditulis langsung).
- `fakta[]` wajib: tiap angka/klaim + sumbernya — ikut dikirim ke Telegram untuk review.

## Catatan lingkungan

- Durasi: tiap adegan = panjang narasi + jeda 0,25 dtk; visual & audio dihitung dari angka yang
  sama (`data.json`) sehingga tetap sinkron.
- Render ±60–70 dtk per video 45 dtk di laptop (1 worker). **Jangan render di `hadirapp01`**
  (RAM bersama produksi) — rencana F1: GitHub Actions `ubuntu-latest`.
- Mesin tanpa library sistem Chrome & tanpa sudo (laptop dev): library diunduh sebagai `.deb`
  lalu diekstrak ke `~/.cache/omahe-sosmed/chrome-libs` —
  ```bash
  export LD_LIBRARY_PATH=$HOME/.cache/omahe-sosmed/chrome-libs/root/usr/lib/x86_64-linux-gnu
  export CHROME_BIN=$(ls ~/.cache/puppeteer/chrome-headless-shell/*/*/chrome-headless-shell)
  ```
  Browser: `npx puppeteer browsers install chrome-headless-shell` (butuh `yauzl` bila tak ada `unzip`).
- `@revideo/ui` wajib terpasang walau tidak memakai editor (vite-plugin me-`require` paket itu).
- Scene diimpor biasa (`import video from './scenes/video'`), **bukan** `?scene` — pola `?scene`
  memicu "The thread is not available in the current context".
- Edge TTS tidak resmi (bisa berhenti sewaktu-waktu) — produksi F1 pindah ke Azure Speech F0
  (suara sama, data waktu per kata juga ada).
- Belum ada musik latar (perlu unduh sekali trek bebas royalti Pixabay/YouTube Audio Library).
