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
`src/lib/api/fixtures.ts` — jadi repo ini bisa dikembangkan **sebelum** epic
`UNIT-04` dan `DEVELOPER-01` di repo `perumahan` selesai.

| Perintah         | Kegunaan                        |
| ---------------- | ------------------------------- |
| `bun run dev`    | dev server                      |
| `bun run build`  | build produksi (adapter Vercel) |
| `bun test`       | unit test (`src/lib/*.test.ts`) |
| `bun run check`  | type-check Svelte + TS          |
| `bun run format` | Prettier                        |

## Sumber data: tiga tahap

Diatur lewat dua env (lihat `.env.example`):

| `OMAHE_API_BASE_URL` | `OMAHE_API_SEARCH` | Detail perumahan | Pencarian & developer |
| -------------------- | ------------------ | ---------------- | --------------------- |
| kosong               | —                  | fixture          | fixture               |
| terisi               | `0`                | **API asli**     | fixture               |
| terisi               | `1`                | **API asli**     | **API asli**          |

Baris tengah adalah keadaan sekarang begitu backend tersedia:
`GET /public/perumahan/:slug` memang sudah ada, sementara `GET /public/units`
dan `GET /public/developers` masih `todo`. Peralihannya per-endpoint, tanpa
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

## Catatan yang masih menggantung

- **Nomor kontak di kartu properti** belum diputuskan sumbernya (perumahan /
  developer / marketing pemegang unit). Sementara memakai nomor Omahe di
  `src/lib/config.ts`, dengan nama properti disisipkan ke pesan pembuka WA
  supaya lead tetap bisa ditelusuri.
- **`/privasi` dan `/syarat-ketentuan` masih draf** — belum ditinjau penasihat
  hukum, dan sudah diberi `noindex` sampai ditinjau.
- **Granularitas `GET /public/units`** — lihat "ASUMSI YANG PERLU
  DIKONFIRMASI" di `../docs/api-contract.md`.
