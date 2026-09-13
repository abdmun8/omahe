/**
 * Kontrak API publik backend `perumahan` — SUMBER KEBENARAN ADA DI SANA,
 * file ini cuma mirror TypeScript-nya (Omahe consume API, tidak pernah
 * menyentuh DB `perumahan` langsung; CLAUDE.md §Arsitektur).
 *
 * Status tiap endpoint per 2026-09-13:
 *   `GET /public/perumahan/:slug`  — SUDAH ADA (epic LANDING-01 + LANDING-02)
 *   `GET /public/units`            — BELUM ADA (epic UNIT-04, `todo`)
 *   `GET /public/developers`       — BELUM ADA (epic DEVELOPER-01, `todo`)
 *   `GET /public/developers/:slug` — BELUM ADA (epic DEVELOPER-01, `todo`)
 *
 * Selama tiga yang terakhir belum ada, `src/lib/api/fixtures.ts` yang
 * dipakai (lihat `client.ts`). Bentuk fixture SENGAJA dibuat identik dengan
 * tipe di bawah supaya saat endpoint asli mendarat, yang berubah cuma
 * sumber datanya — bukan satu pun komponen.
 *
 * Asumsi yang perlu dikonfirmasi saat UNIT-04 diimplementasi di repo
 * `perumahan` — lihat `docs/api-contract.md`.
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
	/** Nama region proyek-proyeknya, sudah dedupe. Untuk baris "cakupan". */
	cakupanLokasi: string[];
}

export interface DeveloperDetail extends DeveloperSummary {
	proyek: DeveloperProject[];
}

export interface DeveloperProject {
	nama: string;
	slug: string;
	regionNama: string | null;
	fotoUrl: string | null;
	/** Harga termurah unit tersedia di proyek ini; null = tidak ada unit tersedia. */
	hargaMulai: number | null;
	unitTersedia: number;
}

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
