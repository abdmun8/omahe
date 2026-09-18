/**
 * Kontrak API publik backend `perumahan` — SUMBER KEBENARAN ADA DI SANA,
 * file ini cuma mirror TypeScript-nya (Omahe consume API, tidak pernah
 * menyentuh DB `perumahan` langsung; CLAUDE.md §Arsitektur).
 *
 * Status tiap endpoint per 2026-09-14 — SEMUA sudah ada di produksi
 * `perumahan` (epic `DEVELOPER-01`/`UNIT-04`/`LANDING-05` selesai):
 *   `GET /public/perumahan/:slug`  — ADA (LANDING-01/02, diperluas
 *                                    DEVELOPER-01/UNIT-04/LANDING-05)
 *   `GET /public/units`            — ADA (UNIT-04)
 *   `GET /public/developers`       — ADA (DEVELOPER-01)
 *   `GET /public/developers/:slug` — ADA (DEVELOPER-01) — shape `proyek[]`
 *                                    LEBIH RINGKAS dari tipe di bawah,
 *                                    lihat `docs/api-contract.md` §3
 *
 * Peralihan fixture→API asli BELUM dikerjakan di repo ini (`client.ts`
 * masih pakai `src/lib/api/fixtures.ts`) — koreksi shape 2026-09-14 SUDAH
 * ditangani di sisi tipe/klien (2026-09-15): `cakupanLokasi` developer
 * TIDAK ada di response asli dan SUDAH dihapus dari tipe + UI (badge
 * "Cakupan" disembunyikan sepenuhnya, keputusan produk), sedangkan
 * `regionNama`/`hargaMulai`/`unitTersedia` per-proyek di developer detail
 * memang TIDAK ada di response asli TAPI field-nya DIPERTAHANKAN di UI —
 * datanya diisi oleh enrichment tambahan sisi Omahe di
 * `client.ts::getDeveloper` (satu panggilan `GET /public/units?
 * perumahanSlug=<slug>` per proyek, paralel), bukan langsung dari
 * endpoint developer. Lihat `docs/api-contract.md` §2/§3.
 */

/** Semua endpoint backend `perumahan` membungkus payload seperti ini. */
export interface ApiEnvelope<T> {
	success: true;
	data: T;
	meta?: Record<string, unknown>;
}

export interface PageMeta {
	total: number;
	page: number;
	pageSize: number;
}

export interface Paginated<T> {
	items: T[];
	meta: PageMeta;
}

// ---------------------------------------------------------------------------
// UNIT-04 — pencarian publik lintas-perumahan
// ---------------------------------------------------------------------------

/**
 * Satu kartu hasil pencarian = satu TIPE unit di satu perumahan (bukan satu
 * baris `unit`) — keputusan granularitas 2026-09-13. Beberapa unit fisik
 * dengan `tipe` sama di perumahan yang sama tampil sebagai SATU kartu,
 * dengan `unitTersedia` sebagai jumlahnya.
 *
 * Field operasional internal (`blok`, `nomor`, `marketingUserId`,
 * `siteplanSheetId`, `posX`/`posY`) TIDAK pernah ada di sini — tidak boleh
 * diekspos publik (UNIT-04).
 */
export interface UnitListing {
	/** Stabil per (perumahanSlug, tipe) — dipakai sebagai key list & anchor. */
	id: string;
	tipe: string;
	/** m², null kalau data unit belum diisi. */
	luasTanah: number | null;
	/** m², null kalau data unit belum diisi. */
	luasBangunan: number | null;
	/** Rupiah. Sama dengan `hargaMax` kalau semua unit setipe seharga sama. */
	hargaMin: number | null;
	hargaMax: number | null;
	/** Jumlah unit `status=tersedia` pada tipe ini. Selalu >= 1. */
	unitTersedia: number;
	perumahan: UnitListingPerumahan;
	/** Null = perumahan belum dikaitkan ke developer (`developerId` nullable). */
	developer: DeveloperRef | null;
	/** Foto perumahan pertama (presigned). Null = tampilkan placeholder. */
	fotoUrl: string | null;
}

export interface UnitListingPerumahan {
	nama: string;
	slug: string;
	/** Kode region Kemendagri (modul `wilayah`). Null = belum diisi. */
	regionKode: string | null;
	/** Nama region siap tampil, mis. "Kab. Bogor, Jawa Barat". */
	regionNama: string | null;
	/**
	 * Prioritas promosi perumahan induk (MONET-01, `done` 2026-09-18) —
	 * int >= 0, `0` = gratis/urutan netral. Badge "Promosi" dirender untuk
	 * nilai > 0. Prioritas TIDAK pernah meloloskan item dari filter.
	 */
	prioritas: number;
}

export interface DeveloperRef {
	nama: string;
	slug: string;
}

/** Query string `GET /public/units`. */
export interface UnitQuery {
	regionKode?: string;
	hargaMin?: number;
	hargaMax?: number;
	tipe?: string;
	perumahanSlug?: string;
	developerSlug?: string;
	page?: number;
	pageSize?: number;
}

// ---------------------------------------------------------------------------
// DEVELOPER-01 — perusahaan pengembang (entitas TERPISAH dari perumahan)
// ---------------------------------------------------------------------------

export interface DeveloperSummary {
	id: string;
	nama: string;
	slug: string;
	deskripsi: string | null;
	logoUrl: string | null;
	/** Jumlah proyek perumahan `isActive=true` milik developer ini. */
	jumlahProyek: number;
	/** Prioritas promosi (MONET-01) — semantik sama dengan
	 * `UnitListingPerumahan.prioritas`; badge "Promosi" untuk nilai > 0. */
	prioritas: number;
}

export interface DeveloperDetail extends DeveloperSummary {
	proyek: DeveloperProject[];
}

// Catatan (2026-09-18, MONET-01): field `prioritas` hanya dijamin di
// `GET /public/units` (di `UnitListingPerumahan`), `GET /public/developers`
// (`DeveloperSummary`), dan `GET /public/perumahan` (direktori — belum ada
// tipenya di sini karena belum ada halaman Omahe yang memakainya).
// `DeveloperProject` (proyek[] di detail developer) TIDAK membawa
// `prioritas` — jangan tambahkan sendiri tanpa konfirmasi backend.
export interface DeveloperProject {
	nama: string;
	slug: string;
	regionNama: string | null;
	fotoUrl: string | null;
	/** Harga termurah unit tersedia di proyek ini; null = tidak ada unit tersedia. */
	hargaMulai: number | null;
	unitTersedia: number;
}

// Catatan (2026-09-15): `GET /public/developers/:slug` asli hanya
// mengembalikan `proyek[]` berisi `{id, nama, slug, fotoUrl}` — field stats
// per-proyek di atas (`regionNama`/`hargaMulai`/`unitTersedia`) TIDAK ada
// di response asli; di jalur API asli, `client.ts::getDeveloper` mengisi
// semuanya lewat enrichment `GET /public/units?perumahanSlug=<slug>` per
// proyek (lihat blok komentar atas file ini). Jalur fixture mengkomputasi
// stats langsung dari data mock lokal.

// ---------------------------------------------------------------------------
// LANDING-01 / LANDING-02 — detail satu perumahan (endpoint SUDAH ADA)
// ---------------------------------------------------------------------------

export interface ProfilePhoto {
	key: string;
	/** Presigned; null = presign gagal → renderer tampilkan placeholder. */
	url: string | null;
}

export interface PerumahanDetail {
	id: string;
	nama: string;
	slug: string;
	deskripsi: string | null;
	photos: ProfilePhoto[];
	/**
	 * null = perumahan belum pakai section builder → render mode LEGACY
	 * (deskripsi + galeri `photos`). Section `enabled:false` sudah difilter
	 * di server, jangan difilter ulang di sini.
	 */
	sections: LandingSection[] | null;
	/**
	 * Perluasan DEVELOPER-01 — optional karena endpoint yang SEKARANG jalan
	 * belum mengembalikannya. Jangan asumsikan ada.
	 */
	developer?: DeveloperRef | null;
	/** Perluasan UNIT-04 (field lokasi `perumahan.regionKode`) — optional, idem. */
	regionNama?: string | null;
}

// ---------------------------------------------------------------------------
// Section builder (LANDING-02) — 10 preset, discriminated union via `type`.
// Bentuk "resolved": `imageKey` sudah jadi URL presigned oleh server.
// ---------------------------------------------------------------------------

export interface HeroProps {
	headline: string;
	subheadline?: string;
	imageKey?: string;
	imageUrl?: string | null;
	ctaLabel: string;
}

export interface RichTextProps {
	heading?: string;
	/** Plain text, newline dipertahankan — BUKAN HTML, jangan pakai {@html}. */
	body: string;
}

export interface GalleryProps {
	heading?: string;
	imageKeys: string[];
	/** Paralel dengan `imageKeys` (index sama). null = presign gagal. */
	imageUrls: (string | null)[];
	layout: 'grid' | 'carousel';
}

export interface PricingItem {
	tipe: string;
	luas?: string;
	harga?: string;
	catatan?: string;
}

export interface PricingProps {
	heading?: string;
	items: PricingItem[];
}

export interface FacilitiesProps {
	heading?: string;
	items: { label: string }[];
}

export interface LocationProps {
	heading?: string;
	address: string;
	/** Sudah divalidasi host `www.google.com` di server. */
	mapsEmbedUrl?: string;
	directionsUrl?: string;
}

export interface TestimonialItem {
	name: string;
	role?: string;
	quote: string;
	imageKey?: string;
	imageUrl?: string | null;
}

export interface TestimonialsProps {
	heading?: string;
	items: TestimonialItem[];
}

export interface FaqProps {
	heading?: string;
	items: { q: string; a: string }[];
}

export interface CtaProps {
	headline: string;
	body?: string;
	/** Target selalu `/ajukan/:slug` — ditentukan renderer, tidak disimpan. */
	ctaLabel: string;
}

export interface ContactProps {
	heading?: string;
	whatsapp?: string;
	phone?: string;
	email?: string;
	hours?: string;
}

export type LandingSection =
	| { id: string; type: 'hero'; enabled: boolean; props: HeroProps }
	| { id: string; type: 'rich_text'; enabled: boolean; props: RichTextProps }
	| { id: string; type: 'gallery'; enabled: boolean; props: GalleryProps }
	| { id: string; type: 'pricing'; enabled: boolean; props: PricingProps }
	| { id: string; type: 'facilities'; enabled: boolean; props: FacilitiesProps }
	| { id: string; type: 'location'; enabled: boolean; props: LocationProps }
	| { id: string; type: 'testimonials'; enabled: boolean; props: TestimonialsProps }
	| { id: string; type: 'faq'; enabled: boolean; props: FaqProps }
	| { id: string; type: 'cta'; enabled: boolean; props: CtaProps }
	| { id: string; type: 'contact'; enabled: boolean; props: ContactProps };

// ---------------------------------------------------------------------------
// Wilayah (modul `wilayah` di backend `perumahan`, data Kemendagri berjenjang)
// ---------------------------------------------------------------------------

export interface RegionOption {
	kode: string;
	nama: string;
}

// ---------------------------------------------------------------------------
// MONET-02 — slider event/kegiatan homepage (api-contract.md §7)
// ---------------------------------------------------------------------------

/**
 * Satu slide carousel homepage. Response `GET /public/sliders` berupa
 * `ApiEnvelope<PublicSlider[]>` (tanpa paginasi, maks 10) — urutan sudah
 * benar di server (prioritas efektif DESC → FIFO), JANGAN diurutkan ulang
 * di sini. Filter masa-aktif & status juga diurus server.
 */
export interface PublicSlider {
	id: string;
	judul: string;
	subjudul: string | null;
	/**
	 * SELALU string — item yang gagal presign gambarnya di-skip di server
	 * (bukan `gambarUrl: null`; slide tanpa gambar tak berguna di carousel).
	 */
	gambarUrl: string;
	/**
	 * null = klik slide menuju default `/perumahan/{perumahan.slug}`
	 * (lewat `withRef()` — passthrough `?ref=` wajib). Terisi = URL eksternal,
	 * dibuka di tab baru dengan `rel="noopener"`.
	 */
	linkUrl: string | null;
	/** Perumahan pemilik slider — tujuan link default & konteks alt. */
	perumahan: { slug: string; nama: string };
	/**
	 * Prioritas efektif pemilik (MONET-01). Hanya relevan untuk urutan
	 * server-side — slider bukan kartu listing, JANGAN dirender sebagai badge.
	 */
	prioritas: number;
}
