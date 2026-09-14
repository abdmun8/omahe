# Kontrak API yang dibutuhkan Omahe dari backend `perumahan`

Omahe **consume** API backend `perumahan`, tidak pernah menyentuh DB-nya
langsung (CLAUDE.md §Arsitektur). Dokumen ini merangkum apa yang sudah bisa
dipakai, apa yang masih ditunggu, dan **asumsi yang perlu dikonfirmasi**
saat epic di repo sebelah dikerjakan.

Mirror TypeScript-nya ada di `landing/src/lib/api/types.ts` — kalau kontrak
di sini berubah, file itu yang pertama ikut berubah.

Semua endpoint membungkus payload dengan envelope yang sudah jadi pola di
backend `perumahan`:

```jsonc
{ "success": true, "data": ..., "meta": { "total": 0, "page": 1, "pageSize": 12 } }
```

## Status per 2026-09-14

**Update besar**: ketiga epic yang tadinya `todo` (`DEVELOPER-01`,
`UNIT-04`, `LANDING-05`) sekarang SEMUA `done` dan live di produksi
`perumahan`. Shape di bawah sudah DIKOREKSI mengikuti implementasi
AKTUAL (bukan lagi rencana/asumsi) — beberapa field yang tadinya
diasumsikan di versi dokumen ini TERNYATA TIDAK diimplementasikan,
ditandai eksplisit per-section.

| Endpoint | Epic | Status | Dipakai Omahe di |
|---|---|---|---|
| `GET /public/perumahan/:slug` | LANDING-01/02, diperluas DEVELOPER-01/UNIT-04/LANDING-05 | **sudah ada** (+`developer`, `regionNama`, `redirectUrl`) — lihat GOTCHA §4 | `/perumahan/:slug` |
| `GET /public/units` | UNIT-04 | **sudah ada** (`done` 2026-09-14) | `/`, `/cari`, `/perumahan/:slug` |
| `GET /public/developers` | DEVELOPER-01 | **sudah ada** (`done` 2026-09-13) | `/`, `/developer` |
| `GET /public/developers/:slug` | DEVELOPER-01 | **sudah ada** (`done` 2026-09-13) — shape `proyek[]` lebih ringkas dari asumsi awal, lihat §3 | `/developer/:companySlug` |
| `GET /public/perumahan` (list) | UNIT-04 | **sudah ada** (`done` 2026-09-14), BARU — tidak ada di versi dokumen sebelumnya | belum ada halaman Omahe yang eksplisit memakainya |
| `GET /public/regions` | — (belum dibahas) | belum ada — `/public/wilayah/{level}` ADA di `perumahan` tapi TIDAK difilter ke region yang punya perumahan aktif (lihat §5, gap masih terbuka) | opsi filter lokasi |

Semua endpoint di atas SEKARANG BISA dipakai — peralihan dari
`landing/src/lib/api/fixtures.ts` ke API asli (env per-endpoint, lihat
`landing/README.md`) sudah bisa dikerjakan kapan saja. **Belum
dikerjakan** di sisi Omahe per 2026-09-14 — `landing/src/lib/api/types.ts`
dan `fixtures.ts` kemungkinan perlu direvisi mengikuti koreksi shape di
bawah (`cakupanLokasi` developer dan `regionNama`/`hargaMulai`/
`unitTersedia` per-proyek di `/public/developers/:slug` TIDAK ada di
response asli) SEBELUM switch, supaya tidak ada field yang diakses tapi
selalu `undefined`.

## 1. `GET /public/units` (UNIT-04, `done` 2026-09-14)

Query AKTUAL: `regionKode` (kode kabupaten exact ATAU kode provinsi
prefix-match — mis. `32` mencakup semua kabupaten `32.xx`), `hargaMin`,
`hargaMax` (overlap-check, unit tanpa harga TIDAK PERNAH ter-exclude oleh
dua param ini), `tipe` (contains, case-insensitive), `perumahanSlug`
(exact), `page`, `pageSize`. **`developerSlug` TIDAK ADA** (sempat
diasumsikan di versi dokumen sebelumnya, tidak diimplementasikan — filter
by developer lewat `perumahanSlug` per-perumahan, atau filter di sisi
Omahe pakai field `developer.slug` di tiap item). Hanya unit
`status=tersedia` dari perumahan `isActive=true`.

```jsonc
{
  "id": "griya-asri-bogor--tipe-36-72",  // stabil per (perumahanSlug, tipe)
  "tipe": "Tipe 36/72",
  "luasTanah": 72,          // m², nullable
  "luasBangunan": 36,       // m², nullable
  "hargaMin": 385000000,    // rupiah, number (bukan string numeric), nullable
  "hargaMax": 385000000,
  "unitTersedia": 12,
  "perumahan": { "nama": "...", "slug": "...", "regionKode": "32.01", "regionNama": "Kab. Bogor, Jawa Barat" },
  "developer": { "nama": "PT ...", "slug": "..." },  // null kalau developerId null
  "fotoUrl": "https://..."  // presigned, null kalau presign gagal
}
```

### Keputusan (2026-09-13) — granularitas baris: `GROUP BY` di backend

Keputusan produk bilang kartu hasil pencarian adalah **per tipe rumah**
("tiap tipe unit mis. 'Tipe 36' jadi kartu sendiri"), sementara epic bilang
query-nya **di level `unit`**. Dua hal itu tidak otomatis sama: satu
perumahan bisa punya 12 baris `unit` bertipe "Tipe 36/72" yang identik di
mata konsumen.

**Keputusan**: endpoint `GET /public/units` mengembalikan **satu baris per
(perumahan, tipe)** — hasil `GROUP BY` DI BACKEND, dengan `unitTersedia`
sebagai `COUNT` dan `hargaMin`/`hargaMax` sebagai rentang harganya. Ini
harus dikerjakan di backend `perumahan` (bagian dari epic `UNIT-04`),
BUKAN di-grouping ulang di Omahe — kalau backend mengirim baris `unit`
mentah lalu Omahe yang mengelompokkan, paginasi jadi tidak akurat (halaman
berisi 12 unit bisa menyusut jadi 2-3 kartu setelah dikelompokkan).

`landing/src/lib/api/fixtures.ts` dan `landing/src/lib/api/types.ts` sudah
dibuat sesuai kontrak ini — **dikonfirmasi 2026-09-14**: shape asli
`GET /public/units` PERSIS sesuai kontrak di atas (backend mengikuti
keputusan grouping ini), jadi endpoint ini AMAN di-switch dari fixture
tanpa perlu revisi `types.ts` (kecuali menghapus asumsi `developerSlug`
kalau ada di query-builder Omahe).

Field operasional (`blok`, `nomor`, `marketingUserId`, `siteplanSheetId`,
`posX`, `posY`) tidak boleh ada di response ini.

## 2. `GET /public/developers` (DEVELOPER-01, `done` 2026-09-13)

Shape AKTUAL (dikoreksi 2026-09-14) — `cakupanLokasi` **TIDAK
diimplementasikan**, hapus dari asumsi Omahe kalau ada:

```jsonc
{
  "id": "...", "nama": "PT Nusa Land Development", "slug": "nusa-land-development",
  "deskripsi": "...",            // nullable
  "logoUrl": "https://...",      // presigned, nullable
  "jumlahProyek": 2              // perumahan isActive=true milik developer ini
}
```

Query: `page`, `pageSize` (`parsePaginationParams` — tidak ada filter
region/lokasi di endpoint ini).

## 3. `GET /public/developers/:slug` (DEVELOPER-01, `done` 2026-09-13)

Sama seperti di atas (tanpa `cakupanLokasi`), plus `proyek[]`. Shape
AKTUAL (dikoreksi 2026-09-14) — **JAUH lebih ringkas** dari asumsi awal:
`regionNama`/`hargaMulai`/`unitTersedia` per-proyek **TIDAK ADA**:

```jsonc
"proyek": [
  { "id": "...", "nama": "...", "slug": "...", "fotoUrl": null }
]
```

`proyek[]` HANYA perumahan `isActive=true` milik developer ini. Kalau
halaman `/developer/:companySlug` butuh `regionNama`/harga/jumlah tipe
tersedia per proyek, panggil `GET /public/units?perumahanSlug=<slug
proyek>` terpisah per proyek (atau `GET /public/perumahan` direktori
list, §Status — punya `jumlahTipeTersedia` + `regionNama` per perumahan,
TAPI tidak bisa difilter by developer, jadi butuh filter manual di sisi
Omahe kalau dipakai untuk kasus ini).

## 4. `GET /public/perumahan/:slug` — perluasan yang diminta (`done`)

Endpoint ini **sudah jalan** dan Omahe sudah memakainya apa adanya
(`id`, `nama`, `slug`, `deskripsi`, `photos[]`, `sections` | `null`).

Tiga field tambahan sekarang ada (dua yang diminta + satu baru dari
`LANDING-05` yang TIDAK diminta lewat dokumen ini):

- `developer: { nama, slug } | null` — untuk baris "Dikembangkan oleh
  [Developer]" yang link ke `/developer/:companySlug` (DEVELOPER-01,
  `done` 2026-09-13).
- `regionNama: string | null` — untuk subjudul lokasi & `<title>` SEO
  (UNIT-04 menambah `perumahan.regionKode`, `done` 2026-09-14).
- `redirectUrl: string | null` — (LANDING-05, `done` 2026-09-14) URL
  Omahe milik tenant ini kalau owner sudah migrasi lewat `/p/:slug`
  (app `perumahan`). **Baca GOTCHA di `CLAUDE.md` §Redirect `/p/:slug`
  SEBELUM memakai endpoint ini untuk tenant yang mungkin sudah
  migrasi** — kalau `redirectUrl` TERISI, endpoint ini balikin
  `deskripsi`/`photos`/`sections`/`developer`/`regionNama` SEMUA
  kosong/null (optimasi skip-resolve di backend, didesain untuk
  `/p/:slug` yang redirect duluan — BELUM tentu aman dipakai Omahe untuk
  tenant yang sama, karena tenant itu justru yang paling relevan buat
  Omahe render).

Ketiganya diperlakukan **optional** di sisi Omahe, jadi menambahkannya
tidak akan merusak apa pun dan belum menambahkannya juga tidak — TAPI
`redirectUrl` butuh keputusan arsitektur dulu (lihat GOTCHA), bukan
sekadar tambah field ke tipe.

## 5. `GET /public/regions` — masih belum ada (gap terbuka per 2026-09-14)

Filter lokasi butuh daftar region yang benar-benar punya perumahan aktif
(bukan seluruh data Kemendagri — itu puluhan ribu baris dan sebagian besar
kosong). Bentuk minimal: `[{ "kode": "32.01", "nama": "Kab. Bogor, Jawa Barat" }]`.

**Update 2026-09-14**: `perumahan` PUNYA `GET /public/wilayah/{level}`
(`provinsi`/`kabupaten`/`kecamatan`/`desa`, filter `?provinsi=`/
`?kabupaten=`/dst + `?q=` search) — tapi itu SELURUH data Kemendagri
berjenjang (dipakai cascading-select admin isi lokasi), BUKAN difilter ke
"region yang punya perumahan aktif" seperti kebutuhan di sini. Gap ini
MASIH TERBUKA, belum ada epic yang menjawabnya.

Kalau endpoint ini tidak jadi dibuat, alternatifnya `GET /public/units`
mengembalikan daftar region yang tersedia di `meta` (facet) — tapi itu
membuat opsi filter ikut menyempit tiap kali pengguna memfilter, yang
biasanya bukan yang diharapkan.

## 6. `GET /public/perumahan` — direktori list (UNIT-04, `done` 2026-09-14, BARU)

Tidak diminta lewat dokumen ini, tapi mendarat sebagai bagian `UNIT-04`
(tidak boleh disamakan dengan `GET /public/perumahan/:slug` di §4 — itu
profil SATU perumahan). List perumahan `isActive=true`, filter
`regionKode` (exact kabupaten / prefix provinsi, sama pola §1), paginasi
`page`/`pageSize`:

```jsonc
{
  "nama": "...", "slug": "...",
  "fotoUrl": "https://...",              // foto pertama, presigned, nullable
  "regionKode": "32.01", "regionNama": "Kab. Bogor, Jawa Barat",  // nullable
  "developer": { "nama": "PT ...", "slug": "..." },               // null kalau tidak ada
  "jumlahTipeTersedia": 4                // COUNT DISTINCT tipe unit tersedia, BUKAN jumlah unit fisik
}
```

Belum ada halaman Omahe yang eksplisit memakai endpoint ini di site map
saat ini (§Site map di `CLAUDE.md`) — dicatat di sini supaya tidak
dibangun ulang lewat cara lain (mis. dedup manual dari `GET /public/units`)
kalau kebutuhan direktori "semua project" muncul nanti.

## Yang TIDAK diminta Omahe

Booking, verifikasi KPR, dan komisi/referral tidak dibangun ulang di Omahe.
Satu-satunya titik sentuh ke alur itu adalah link keluar
`/ajukan/:slug?ref=...` ke app `perumahan` — lihat `landing/src/lib/ref.ts`.
