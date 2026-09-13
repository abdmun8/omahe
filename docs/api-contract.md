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

## Status per 2026-09-13

| Endpoint | Epic | Status | Dipakai Omahe di |
|---|---|---|---|
| `GET /public/perumahan/:slug` | LANDING-01 + LANDING-02 | **sudah ada** | `/perumahan/:slug` |
| `GET /public/units` | UNIT-04 | belum ada (`todo`) | `/`, `/cari`, `/perumahan/:slug` |
| `GET /public/developers` | DEVELOPER-01 | belum ada (`todo`) | `/`, `/developer` |
| `GET /public/developers/:slug` | DEVELOPER-01 | belum ada (`todo`) | `/developer/:companySlug` |
| `GET /public/regions` | — (belum dibahas) | belum ada | opsi filter lokasi |

Selama yang `todo` belum mendarat, Omahe memakai
`landing/src/lib/api/fixtures.ts` — bentuk datanya sengaja identik dengan
kontrak di bawah, jadi peralihannya cuma ganti env (lihat
`landing/README.md`), bukan ganti komponen.

## 1. `GET /public/units` (UNIT-04)

Query: `regionKode`, `hargaMin`, `hargaMax`, `tipe`, `perumahanSlug`,
`developerSlug`, `page`, `pageSize`. Hanya unit `status=tersedia` dari
perumahan `isActive=true`.

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

### ASUMSI YANG PERLU DIKONFIRMASI — granularitas baris

Keputusan produk bilang kartu hasil pencarian adalah **per tipe rumah**
("tiap tipe unit mis. 'Tipe 36' jadi kartu sendiri"), sementara epic bilang
query-nya **di level `unit`**. Dua hal itu tidak otomatis sama: satu
perumahan bisa punya 12 baris `unit` bertipe "Tipe 36/72" yang identik di
mata konsumen.

Omahe di sini mengasumsikan endpoint mengembalikan **satu baris per
(perumahan, tipe)** — hasil `GROUP BY` di level unit, dengan `unitTersedia`
sebagai `COUNT` dan `hargaMin`/`hargaMax` sebagai rentang harganya. Kalau
tidak, hasil pencarian akan penuh kartu kembar.

Kalau UNIT-04 nanti diputuskan mengembalikan baris `unit` mentah, yang
berubah cuma `getUnits()` di `landing/src/lib/api/client.ts` (grouping
pindah ke sisi Omahe) — tapi paginasinya jadi salah (halaman berisi 12 unit
bisa menyusut jadi 2 kartu), jadi **lebih baik diputuskan di backend**.

Field operasional (`blok`, `nomor`, `marketingUserId`, `siteplanSheetId`,
`posX`, `posY`) tidak boleh ada di response ini.

## 2. `GET /public/developers` (DEVELOPER-01)

```jsonc
{
  "id": "...", "nama": "PT Nusa Land Development", "slug": "nusa-land-development",
  "deskripsi": "...",            // nullable
  "logoUrl": "https://...",      // presigned, nullable
  "jumlahProyek": 2,             // perumahan isActive=true milik developer ini
  "cakupanLokasi": ["Kab. Bogor, Jawa Barat", "Kota Bogor, Jawa Barat"]
}
```

## 3. `GET /public/developers/:slug` (DEVELOPER-01)

Sama seperti di atas, plus:

```jsonc
"proyek": [
  { "nama": "...", "slug": "...", "regionNama": "...", "fotoUrl": null,
    "hargaMulai": 385000000, "unitTersedia": 22 }
]
```

## 4. `GET /public/perumahan/:slug` — perluasan yang diminta

Endpoint ini **sudah jalan** dan Omahe sudah memakainya apa adanya
(`id`, `nama`, `slug`, `deskripsi`, `photos[]`, `sections` | `null`).

Dua field tambahan yang dibutuhkan halaman `/perumahan/:slug`:

- `developer: { nama, slug } | null` — untuk baris "Dikembangkan oleh
  [Developer]" yang link ke `/developer/:companySlug` (DEVELOPER-01).
- `regionNama: string | null` — untuk subjudul lokasi & `<title>` SEO
  (UNIT-04 menambah `perumahan.regionKode`).

Keduanya diperlakukan **optional** di sisi Omahe, jadi menambahkannya tidak
akan merusak apa pun dan belum menambahkannya juga tidak.

## 5. `GET /public/regions` — belum ada epic-nya

Filter lokasi butuh daftar region yang benar-benar punya perumahan aktif
(bukan seluruh data Kemendagri — itu puluhan ribu baris dan sebagian besar
kosong). Bentuk minimal: `[{ "kode": "32.01", "nama": "Kab. Bogor, Jawa Barat" }]`.

Kalau endpoint ini tidak jadi dibuat, alternatifnya `GET /public/units`
mengembalikan daftar region yang tersedia di `meta` (facet) — tapi itu
membuat opsi filter ikut menyempit tiap kali pengguna memfilter, yang
biasanya bukan yang diharapkan.

## Yang TIDAK diminta Omahe

Booking, verifikasi KPR, dan komisi/referral tidak dibangun ulang di Omahe.
Satu-satunya titik sentuh ke alur itu adalah link keluar
`/ajukan/:slug?ref=...` ke app `perumahan` — lihat `landing/src/lib/ref.ts`.
