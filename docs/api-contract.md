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
| `GET /public/perumahan` (list) | UNIT-04 | **sudah ada** (`done` 2026-09-14), BARU — tidak ada di versi dokumen sebelumnya; `+prioritas` MONET-01 | belum ada halaman Omahe yang eksplisit memakainya |
| `GET /public/sliders` | MONET-02 | **sudah ada** (`done` 2026-09-18), BARU — lihat §7 | `/` (carousel) |
| `POST /public/leads` | MONET-03 | **sudah ada** (`done` 2026-09-18), BARU — lihat §8 | dialog LeadForm kartu/detail partner berbayar |
| `GET /public/mitra` | MITRA-01 | **belum ada** (epic `todo` 2026-09-21) — lihat §9 | `/mitra` (direktori KJPP & Notaris) |
| `GET /public/regions` | — (belum dibahas) | belum ada — `/public/wilayah/{level}` ADA di `perumahan` tapi TIDAK difilter ke region yang punya perumahan aktif (lihat §5, gap masih terbuka) | opsi filter lokasi |

Semua endpoint di atas SEKARANG BISA dipakai — peralihan dari
`landing/src/lib/api/fixtures.ts` ke API asli (env per-endpoint, lihat
`landing/README.md`) sudah bisa dikerjakan kapan saja. Revisi sisi Omahe
yang dulu tertunda (2026-09-15, `landing/src/lib/api/types.ts` +
`client.ts`): `cakupanLokasi` developer SUDAH dihapus dari tipe + UI
(bukan gap terbuka lagi) dan stats per-proyek
(`regionNama`/`hargaMulai`/`unitTersedia`) di developer detail SUDAH
di-enrich sisi Omahe via `GET /public/units?perumahanSlug=...` per proyek
(lihat §2/§3) — tidak ada lagi field yang diakses tapi selalu `undefined`.

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
keputusan grouping ini), jadi endpoint ini AMAN di-switch dari fixture.
Asumsi `developerSlug` di query-builder Omahe SUDAH ditangani (2026-09-15):
`client.ts::getUnits` kini TIDAK mengirim `developerSlug` ke backend dan
memfilter client-side pakai field `developer.slug` tiap item (trade-off:
`meta.total` tidak disesuaikan saat filter developer aktif — paginasi
kurang presisi, disadari & diterima; perbaikan presis butuh dukungan
backend, belum diminta).

Field operasional (`blok`, `nomor`, `marketingUserId`, `siteplanSheetId`,
`posX`, `posY`) tidak boleh ada di response ini.

## 2. `GET /public/developers` (DEVELOPER-01, `done` 2026-09-13)

Shape AKTUAL (dikoreksi 2026-09-14) — `cakupanLokasi` **TIDAK
diimplementasikan**. Sudah ditangani di sisi Omahe (2026-09-15, bukan gap
terbuka lagi): field `cakupanLokasi` DIHAPUS dari `types.ts`/fixture dan
badge "Cakupan" DIHAPUS dari UI (keputusan produk: disembunyikan
sepenuhnya, bukan dicari penggantinya):

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

`proyek[]` HANYA perumahan `isActive=true` milik developer ini. Sudah
ditangani di sisi Omahe (2026-09-15, bukan gap terbuka lagi):
`client.ts::getDeveloper` meng-enrich stats per-proyek (`regionNama`,
`hargaMulai`, `unitTersedia`) dengan memanggil
`GET /public/units?perumahanSlug=<slug proyek>` per proyek secara PARALEL
(`Promise.all` — jalur SSR, tidak menambah round-trip browser), lalu
mengagregasi (`regionNama` dari `items[0]`, `hargaMulai` = `hargaMin`
termurah non-null, `unitTersedia` = jumlah) — field stats tetap ada di
`DeveloperProject` (`types.ts`) dan tetap ditampilkan UI. Alternatif
`GET /public/perumahan` direktori list (§Status — punya
`jumlahTipeTersedia` + `regionNama` per perumahan) tidak dipakai untuk
kasus ini karena tidak bisa difilter by developer.

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

## 5. `GET /public/regions` — `done` 2026-09-23 (LOKASI-02; gap terbuka 2026-09-14 s/d 2026-09-23)

**Update 2026-09-23 — SELESAI**: diimplementasikan epic `LOKASI-02` repo
`perumahan`. `[{ kode, nama }]` = kabupaten/kota (`perumahan.region_kode`)
dari perumahan AKTIF yang punya ≥ 1 unit `tersedia` (basis yang sama
dengan `GET /public/units`, jadi opsi filter tidak pernah berujung hasil
kosong), `nama` = "Kabupaten Bogor, Jawa Barat", urut nama. Perumahan
harus diisi lokasinya di admin (Profil & Landing Page → Lokasi Perumahan)
supaya muncul. Teks di bawah ini riwayat.

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

## 7. `GET /public/sliders` (MONET-02, `done` 2026-09-18, BARU)

Slider event/kegiatan untuk carousel homepage. TANPA auth, TANPA paginasi
(selalu array kecil). Filter di server: `status='aktif'` (disetujui
principal) DAN dalam masa aktif (`aktifDari ≤ now ≤ aktifSampai`) DAN
perumahan pemilik `isActive=true`. Urutan: `prioritas` efektif DESC
(partner berbayar MONET-01 duluan) → `aktifDari` ASC (FIFO). Maks 10
item; item yang gagal presign gambarnya DI-SKIP (bukan `gambarUrl`
null — slide tanpa gambar tak berguna di carousel).

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "judul": "Open House Griya Asri",
      "subjudul": "Sabtu-Minggu, 27-28 Sep",      // nullable
      "gambarUrl": "https://...",                // SELALU string (gagal presign = di-skip)
      "linkUrl": "https://...",                  // nullable — null = klik default /perumahan/:slug
      "perumahan": { "slug": "griya-asri", "nama": "Griya Asri" },
      "prioritas": 40                             // efektif pemilik (badge styling, debug rotasi)
    }
  ]
}
```

Klik slide di Omahe: `linkUrl` kalau terisi (tab baru, `rel="noopener"`),
selain itu `/perumahan/{perumahan.slug}` **bawa passthrough `?ref=`**
(kewajiban arsitektur — jangan putus rantai komisi mitra).

## 8. `POST /public/leads` (MONET-03, `done` 2026-09-18, BARU)

Submit lead dari form publik Omahe — HANYA untuk perumahan partner
berbayar (prioritas efektif MONET-01 > 0; selain itu 404 seragam).
TANPA auth. Body JSON:

```jsonc
{
  "perumahanSlug": "griya-asri",     // wajib
  "nama": "Budi",                    // wajib, 1-100
  "telepon": "08123456789",          // wajib — dinormalisasi server ke 62xxx
  "tipeMinat": "36/72",              // opsional, ≤50 (string tipe bebas dari /public/units)
  "pesan": "Minta brosur",           // opsional, ≤500
  "sumber": "card",                  // wajib: 'card' | 'slider' | 'detail' — pemanggil yang men-set
  "ref": "QR-XXX",                   // opsional, ≤50 — passthrough ?ref= dari URL (atribusi mitra)
  "website": ""                      // HONEYPOT — field tersembunyi, WAJIB kosong
}
```

Respons: sukses & honeypot SAMA: `{ "success": true, "data": { "ok": true } }`.
Error: 400 field invalid; 404 perumahan tidak ada/tidak berbayar
(PESAN SERAGAM — jangan dipakai membedakan status komersial di UI);
429 rate limit (3 lead / 24 jam / telepon × perumahan — pesan error
backend sudah ramah, tampilkan apa adanya). Lead tersimpan terlihat
staf perumahan (cap `manage_leads`) + principal di app `perumahan`,
owner perumahan dapat notifikasi WA best-effort.

UI Omahe pasca-submit: pesan sukses "Tim {nama perumahan} akan
menghubungi Anda" + tombol sekunder WA ke nomor umum Omahe — TIDAK
ada redirect ke WA partner (itu seluruh inti fitur ini). Checkbox
persetujuan privasi WAJIB dicentang sebelum submit (menaut `/privasi`).

## MONET-01 — field `prioritas` di endpoint lama (`done` 2026-09-18)

`GET /public/units` (§1), `GET /public/developers` (§2), dan
`GET /public/perumahan` (§6) kini menyertakan `"prioritas": <int ≥ 0>`
per item DAN terurut prioritas efektif DESC (lalu tie-breaker stabil:
id grup ASC / nama ASC). Prioritas efektif = max(perumahan, developer
aktif-nya), kedaluwarsa otomatis di query-time. `0` = gratis — item
tetap tampil urutan netral. Omahe merender badge "Promosi" kecil untuk
`prioritas > 0`; prioritas TIDAK pernah meloloskan item dari filter
yang seharusnya mengecualikannya.

**2026-09-18 (tambahan)**: `GET /public/perumahan/:slug` (§4) juga kini
menyertakan `prioritas` (efektif penuh di jalur `?full=1`; jalur
skip-resolve LANDING-05 = own-only, tanpa lookup developer) — dipakai
halaman detail Omahe untuk men-gate LeadFormDialog MONET-03 di
sticky-CTA.

## 10. `GET /public/app-settings` — kontak Omahe (ADMIN-05, `done` 2026-09-23, BARU)

Tanpa auth. Diatur principal di admin `perumahan` (Pengaturan → Kontak
Omahe). Nomor tersimpan ternormalisasi `62xxx`; `null` = belum diisi.

```json
{ "success": true, "data": {
  "appTitle": "PROPERTI",
  "kontak": { "whatsapp": "6281234567890", "telepon": "62215551234", "email": "cs@omahe.co.id" }
} }
```

Pemakaian Omahe: `getKontak()` (`landing/src/lib/api/client.ts`) dipanggil
`src/routes/+layout.server.ts` → `page.data.kontak`, dipakai tombol
WhatsApp/Telepon kartu, sticky CTA, form lead, footer, JSON-LD, `/kontak`.
Fail-soft per field ke `SITE.*` (`src/lib/config.ts`) — timeout 2,5 detik,
cache in-memory 60 detik. `/kontak` tidak di-prerender lagi (SSR +
`s-maxage=300`); halaman legal tetap prerender (email = nilai saat build).
`appTitle` TIDAK dipakai Omahe (itu judul aplikasi admin).

## 11. Detail tipe rumah & lokasi lengkap (UNIT-05 + LOKASI-01, `done` 2026-09-23, BARU)

**Endpoint baru** `GET /public/perumahan/:slug/tipe/:tipeSlug` (tanpa auth,
TIDAK ikut skip-resolve LANDING-05). 404 seragam kalau perumahan nonaktif
atau tipe tidak dikenal; tipe tanpa unit tersedia tetap 200
(`unitTersedia: 0`, `hargaMin/Max: null`).

```json
{ "success": true, "data": {
  "perumahan": { "nama": "…", "slug": "…", "regionNama": "Kabupaten Bogor",
    "provinsiNama": "Jawa Barat", "kecamatanNama": "Cibinong", "alamat": "Jl. …",
    "developer": { "nama": "…", "slug": "…" } },
  "tipe": { "nama": "Tipe 36/72", "slug": "tipe-36-72", "deskripsi": "## Desain\n…",
    "kamarTidur": 2, "kamarMandi": 1, "carport": 1,
    "photos": [{ "key": "…", "url": "https://…presigned" }],
    "hargaMin": 450000000, "hargaMax": 470000000, "luasTanah": 72, "luasBangunan": 36,
    "unitTersedia": 2 }
} }
```

`deskripsi` = Markdown MENTAH tulisan admin tenant → Omahe WAJIB render lewat
`landing/src/lib/markdown.ts` (salinan subset aman admin, escape HTML), BUKAN
`marked`. `slug` tipe = `slugifyTipe(nama)` (lowercase, non-alfanumerik → `-`).

**Field tambahan (additive)**:
- Item `GET /public/units`: `tipeSlug`, `fotoTipeUrl` (cover galeri tipe,
  null → pakai `fotoUrl`), `kamarTidur`, `kamarMandi`, `carport`; objek
  `perumahan` di item: `provinsiNama`, `kecamatanNama`, `alamat`.
- `GET /public/perumahan/:slug`: `provinsiNama`, `kecamatanNama`, `alamat`
  (null di jalur skip-resolve tanpa `?full=1`).

Omahe: route `/perumahan/[slug]/tipe/[tipeSlug]`; kartu `/cari` & daftar tipe
di `/perumahan/:slug` link ke sana (fallback `#tipe-unit` kalau `tipeSlug`
belum dikirim backend lama). Lokasi ditampilkan via `formatLokasi()`.

## 12. Peta lokasi dari data perumahan (LOKASI-03, `done` 2026-09-23, BARU)

Field additive `mapsEmbedUrl` (embed Google Maps, divalidasi backend:
`https://www.google.com/maps/embed…`) dan `directionsUrl` (http/https) di
`GET /public/perumahan/:slug` (null di jalur skip-resolve) dan di objek
`perumahan` endpoint detail tipe. Diisi admin SEKALI di kartu Lokasi
Perumahan.

Section builder `location`: `props.address` kini OPSIONAL. Saat resolve
publik, field kosong diisi server dari data (alamat terformat, peta, arah);
field yang diisi di builder tetap menang; section yang tetap tanpa alamat &
peta tidak dikirim.

Omahe: komponen `peta-lokasi.svelte` (iframe hanya untuk URL lolos
`isMapsEmbedUrl`). Di `/perumahan/:slug` peta dari data tampil HANYA kalau
tidak ada section `location` (anti peta ganda); halaman tipe selalu
menampilkannya kalau ada.

## 13. Slide milik Omahe di `GET /public/sliders` (MONET-04, `done` 2026-09-23)

Perubahan additive pada §7: `perumahan` kini `{ slug, nama } | null` —
`null` = slide milik Omahe sendiri (dibuat superadmin). Slide Omahe SELALU
punya `linkUrl`: URL http(s) (tab baru, tanpa `?ref=`) ATAU path internal
Omahe diawali `/` seperti `/kpr` (tab sama, `?ref=` ditempel lewat
`withRef()`). Path `//…` diperlakukan eksternal. Urutan: slide Omahe
memakai prioritas manual superadmin, slide perumahan prioritas efektif
MONET-01; maksimal 10 slide.

**Koreksi 2026-09-23 (MONET-01 di `GET /public/units`)**: backend mengirim
prioritas efektif di level ITEM (`item.prioritas`), bukan
`item.perumahan.prioritas` seperti tertulis/diasumsikan sebelumnya. Omahe
menormalisasinya di `getUnits` (`normalisasiUnit` → `perumahan.prioritas`)
supaya badge "Promosi", gerbang form minat MONET-03, dan analytics kartu
berfungsi. Sebelum koreksi ini badge tidak pernah tampil di production
(fixture menaruh `prioritas` di `perumahan`, jadi tak terlihat saat dev).
