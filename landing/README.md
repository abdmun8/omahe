# Omahe — Landing & Marketplace

SvelteKit app untuk `omahe.id`. Direktori & pencarian properti lintas-perumahan,
plus halaman detail developer/perumahan yang dirender sendiri oleh Omahe.

Konteks produk & keputusan arsitektur: `../CLAUDE.md` dan `../docs/user-story.md`.
Kontrak API yang dikonsumsi: `../docs/api-contract.md`.

## Menjalankan

```bash
bun install
cp .env.example .env      # default-nya sudah jalan tanpa backend
bun run dev
```

Tanpa `OMAHE_API_BASE_URL`, seluruh data diambil dari
`src/lib/api/fixtures.ts` — awalnya supaya repo ini bisa dikembangkan
**sebelum** epic `UNIT-04`/`DEVELOPER-01`/`LANDING-05` di repo `perumahan`
selesai. **Update 2026-09-14**: ketiganya sekarang `done` dan live di
produksi — flag `OMAHE_API_SEARCH` di bawah masih relevan sebagai
saklar bertahap, tapi alasan "belum ada backend"-nya sudah tidak berlaku;
lihat `../docs/api-contract.md` §Status untuk shape aktual (beberapa
field fixture perlu dicek ulang sebelum switch penuh).

| Perintah                 | Kegunaan                                                        |
| ------------------------ | --------------------------------------------------------------- |
| `bun run dev`            | dev server                                                      |
| `bun run build`          | build produksi (adapter Vercel)                                 |
| `bun test`               | unit test (`src/lib/*.test.ts`)                                 |
| `bun run test:component` | component test (vitest + jsdom, `src/lib/components/*.test.ts`) |
| `bun run check`          | type-check Svelte + TS                                          |
| `bun run format`         | Prettier                                                        |

## Docker (self-host / staging)

```bash
# dari root repo

docker compose up --build                      # produksi, host :3000
LANDING_PORT=8080 docker compose up --build    # host :8080 (server multi-app)
OMAHE_API_BASE_URL= docker compose up --build  # mode fixture (tanpa backend)
docker compose --profile dev up dev            # dev server + HMR :5173 (Bun)
```

Build multi-stage: stage build pakai Bun (`oven/bun`), runtime pakai Node 24
(`adapter-node`, dipilih lewat `OMAHE_ADAPTER=node` saat build — default build
lokal/CI tetap adapter Vercel). Semua env app dibaca runtime (`$env/dynamic`),
satu image dipakai lintas environment. Detail: `../docker-compose.yml`,
`Dockerfile` di direktori ini.

## Rilis artikel harian

Artikel future-dated tersembunyi sampai `tanggal`-nya (helper `artikelTayang`,
build-time). Supaya "posting tiap hari" terjadi tanpa commit harian,
`.github/workflows/artikel-harian.yml` memicu **Vercel deploy hook tiap
05:30 WIB** (re-deploy commit terakhir → build baru melepas artikel hari
itu). Setup sekali: simpan URL deploy hook sebagai repo secret
`VERCEL_DEPLOY_HOOK_URL`.

Fallback yang disadari: tanpa cron, deploy manual batch 2–3×/minggu juga
valid — tiap deploy melepas beberapa artikel sekaligus, SEO tidak
 terpengaruh. Untuk self-host Docker: ganti langkah curl dengan
`docker compose up --build -d landing` di cron server.

## Sumber data: tiga tahap

Diatur lewat dua env (lihat `.env.example`):

| `OMAHE_API_BASE_URL` | `OMAHE_API_SEARCH` | Detail perumahan | Pencarian & developer |
| -------------------- | ------------------ | ---------------- | --------------------- |
| kosong               | —                  | fixture          | fixture               |
| terisi               | `0`                | **API asli**     | fixture               |
| terisi               | `1`                | **API asli**     | **API asli**          |

`GET /public/perumahan/:slug`, `GET /public/units`, dan
`GET /public/developers[/:slug]` SEMUA sudah ada di produksi per
2026-09-14 (lihat `../docs/api-contract.md` §Status) — baris mana yang
dipakai sekarang di repo ini tergantung kapan env di atas benar-benar
diisi, bukan lagi ketersediaan backend. Peralihannya per-endpoint, tanpa
mengubah satu pun komponen.

## Yang wajib dijaga di setiap PR

**Passthrough `?ref=`.** QR referral mitra masuk lewat `/p/:slug?ref=<qrCode>`
di app `perumahan`, lalu diredirect ke Omahe (epic `LANDING-05`). Setiap CTA
booking harus mengembalikan `ref` itu ke `/ajukan/:slug?ref=...`. Kalau putus
di satu hop saja, komisi mitra tidak tercatat — **dan tidak ada error yang
muncul**, cuma uang yang hilang diam-diam.

Aturannya:

- `ref` dibaca sekali di `src/routes/+layout.ts` → tersedia sebagai `data.ref`.
- Link internal: `withRef(path, ref)`.
- CTA booking: **selalu** `ajukanUrl(slug, ref)` — jangan pernah menulis
  href `/ajukan/...` manual.
- Form `GET` harus menyertakan `<input type="hidden" name="ref">` (submit
  membangun URL baru dari nol dan akan membuang query yang ada).

Dikunci oleh `src/lib/ref.test.ts`.

**Cache pakai `Cache-Control`, bukan ISR.** `src/lib/cache.ts` menjelaskan
kenapa: ISR mengabaikan query string, jadi halaman ter-cache tanpa `?ref=`
bisa tersaji ke pengunjung yang datang dengan `?ref=`.

## Struktur

```
src/lib/
  api/        kontrak + client backend `perumahan` (SERVER-ONLY) + fixture
  components/ kartu, header/footer, filter, renderer section builder
  ref.ts      passthrough referral  ← baca ini sebelum menyentuh routing/CTA
  kpr.ts      kalkulator KPR (client-side murni, tanpa API bank)
  cache.ts    header cache halaman publik
src/routes/   site map: /, /cari, /developer[/:companySlug], /perumahan/:slug,
              /kpr, /tentang, /kontak, /privasi, /syarat-ketentuan, /sitemap.xml
```

## Keputusan yang berlaku sekarang (2026-09-13)

- **Nomor kontak di kartu properti**: nomor Omahe (`src/lib/config.ts`)
  untuk semua kartu, bukan per-perumahan/developer/marketing — nama properti
  disisipkan ke pesan pembuka WA supaya lead tetap bisa ditelusuri. Field
  kontak per-entitas bisa menyusul nanti kalau dibutuhkan.
- **`/privasi` dan `/syarat-ketentuan` sengaja masih draf + `noindex`** —
  ditinjau ulang menjelang go-live, tidak memblokir pekerjaan lain sekarang.
- **Granularitas `GET /public/units`**: satu baris = satu (perumahan, tipe),
  `GROUP BY` di backend `perumahan`, bukan di-grouping ulang di Omahe. Detail:
  `../docs/api-contract.md`.
