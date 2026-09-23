/**
 * Satu-satunya pintu Omahe ke backend `perumahan`. SERVER-ONLY — dipanggil
 * dari `+page.server.ts`/`+layout.server.ts` saja, jangan dari komponen
 * (base URL & kredensial API tidak boleh sampai ke browser).
 *
 * Dua mode, ditentukan env:
 *   - `OMAHE_API_BASE_URL` kosong          → SEMUA data dari fixture.
 *   - base URL ada, `OMAHE_API_SEARCH=0/-` → detail perumahan dari API asli
 *     (endpoint `GET /public/perumahan/:slug` memang SUDAH ADA), pencarian &
 *     direktori developer masih fixture (UNIT-04/DEVELOPER-01 belum landed).
 *   - base URL ada + `OMAHE_API_SEARCH=1`  → semuanya dari API asli.
 *
 * Mode tengah itu yang bikin repo ini bisa jalan HARI INI tanpa menunggu dua
 * epic di repo sebelah selesai, dan pindah ke API asli per-endpoint begitu
 * masing-masing mendarat.
 */
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { SITE } from '$lib/config';
import * as fixtures from './fixtures';
import type {
	ApiEnvelope,
	DeveloperDetail,
	DeveloperSummary,
	KontakOmahe,
	LeadInput,
	PageMeta,
	Paginated,
	PerumahanDetail,
	PublicSlider,
	RegionOption,
	UnitListing,
	UnitQuery,
	PublicMitra,
	TipeDetail
} from './types';

/** `fetch` bawaan SvelteKit `load` — dioper masuk supaya ikut dedupe & SSR. */
type Fetch = typeof globalThis.fetch;

const baseUrl = () => env.OMAHE_API_BASE_URL?.replace(/\/+$/, '') ?? '';
const hasApi = () => baseUrl() !== '';
/** UNIT-04 + DEVELOPER-01 sudah live di backend? */
const hasSearchApi = () => hasApi() && env.OMAHE_API_SEARCH === '1';

/** Timeout — landing publik tidak boleh menggantung gara-gara API lambat. */
const TIMEOUT_MS = Number(env.OMAHE_API_TIMEOUT_MS ?? 8000);

async function apiGet<T>(fetchFn: Fetch, path: string, params?: URLSearchParams): Promise<T> {
	const url = `${baseUrl()}${path}${params && [...params].length ? `?${params}` : ''}`;
	const res = await fetchFn(url, {
		headers: { accept: 'application/json' },
		signal: AbortSignal.timeout(TIMEOUT_MS)
	});

	if (res.status === 404) error(404, 'Halaman tidak ditemukan.');
	if (!res.ok) {
		// Jangan teruskan pesan error internal backend ke pengunjung.
		console.error(`[omahe:api] GET ${url} → ${res.status}`);
		error(502, 'Data sedang tidak bisa dimuat. Coba lagi sebentar lagi.');
	}

	const body = (await res.json()) as ApiEnvelope<T>;
	return body.data;
}

// ---------------------------------------------------------------------------
// Pencarian unit (UNIT-04)
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 12;

export async function getUnits(fetchFn: Fetch, query: UnitQuery): Promise<Paginated<UnitListing>> {
	const page = Math.max(1, query.page ?? 1);
	const pageSize = Math.min(48, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));

	if (hasSearchApi()) {
		// `developerSlug` TIDAK ada di backend (api-contract.md §1) — kalau
		// tetap dikirim, backend mengabaikannya diam-diam dan filter developer
		// tidak beneran bekerja. Keluarkan dari query backend, lalu filter
		// client-side di bawah.
		const { developerSlug, ...backendQuery } = query;
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries({ ...backendQuery, page, pageSize })) {
			if (value !== undefined && value !== '') params.set(key, String(value));
		}
		const url = `${baseUrl()}/public/units?${params}`;
		const res = await fetchFn(url, {
			headers: { accept: 'application/json' },
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		if (!res.ok) {
			console.error(`[omahe:api] GET ${url} → ${res.status}`);
			error(502, 'Data sedang tidak bisa dimuat. Coba lagi sebentar lagi.');
		}
		const body = (await res.json()) as { data: RawUnitListing[]; meta: PageMeta };
		// Trade-off yang disadari: `meta` (termasuk `total`) TIDAK disesuaikan
		// setelah filter developer — paginasi jadi kurang presisi saat filter
		// aktif (api-contract.md §1). Perbaikannya butuh facet di backend,
		// di luar scope ini.
		const semua = body.data.map(normalisasiUnit);
		const items = developerSlug ? semua.filter((u) => u.developer?.slug === developerSlug) : semua;
		return { items, meta: body.meta };
	}

	return filterFixtureUnits({ ...query, page, pageSize });
}

/**
 * Bentuk item MENTAH `GET /public/units`: backend (MONET-01) menaruh
 * prioritas efektif di level ITEM (`item.prioritas`), BUKAN di
 * `item.perumahan.prioritas` yang dibaca komponen (badge "Promosi",
 * gerbang form minat MONET-03, analytics). Ditemukan 2026-09-23 dari laporan
 * user (prioritas Salihara = 1 tapi badge gold tidak muncul) — fixture
 * menaruhnya di `perumahan` sehingga selisih kontrak tak terlihat saat dev.
 */
type RawUnitListing = Omit<UnitListing, 'perumahan'> & {
	prioritas?: number;
	perumahan: Omit<UnitListing['perumahan'], 'prioritas'> & { prioritas?: number };
};

/** Satukan ke bentuk yang dipakai komponen: `perumahan.prioritas` selalu number. */
function normalisasiUnit(u: RawUnitListing): UnitListing {
	const { prioritas, ...rest } = u;
	return {
		...rest,
		perumahan: { ...u.perumahan, prioritas: prioritas ?? u.perumahan.prioritas ?? 0 }
	};
}

/** Mirror filter `GET /public/units` di atas fixture — bentuk hasil identik. */
function filterFixtureUnits(query: UnitQuery & { page: number; pageSize: number }) {
	const matched = fixtures.UNIT_LISTINGS.filter((u) => {
		if (query.regionKode && u.perumahan.regionKode !== query.regionKode) return false;
		if (query.perumahanSlug && u.perumahan.slug !== query.perumahanSlug) return false;
		if (query.developerSlug && u.developer?.slug !== query.developerSlug) return false;
		if (query.tipe && !u.tipe.toLowerCase().includes(query.tipe.toLowerCase())) return false;
		// Rentang harga dibandingkan ke harga TERENDAH tipe ini — kartu yang
		// punya satu unit di bawah plafon tetap relevan buat pencari.
		if (query.hargaMin !== undefined && (u.hargaMax ?? 0) < query.hargaMin) return false;
		if (query.hargaMax !== undefined && (u.hargaMin ?? 0) > query.hargaMax) return false;
		return true;
	}).sort((a, b) => (a.hargaMin ?? 0) - (b.hargaMin ?? 0));

	const offset = (query.page - 1) * query.pageSize;
	return {
		items: matched.slice(offset, offset + query.pageSize),
		meta: { total: matched.length, page: query.page, pageSize: query.pageSize }
	};
}

/** Kartu unggulan homepage — termurah per lokasi, tanpa filter. */
export async function getFeaturedUnits(fetchFn: Fetch, limit = 6): Promise<UnitListing[]> {
	const { items } = await getUnits(fetchFn, { pageSize: limit, page: 1 });
	return items;
}

// ---------------------------------------------------------------------------
// Developer (DEVELOPER-01)
// ---------------------------------------------------------------------------

/**
 * Shape MENTAH `GET /public/developers/:slug` (api-contract.md §3) —
 * `proyek[]` HANYA `{id, nama, slug, fotoUrl}`, TANPA stats per-proyek.
 * Internal `client.ts` saja; jangan paksa `apiGet<DeveloperDetail>` untuk
 * shape ini — tipe publik sudah punya field stats yang belum ada di
 * response mentah (TypeScript diam, tapi runtime-nya `undefined`).
 */
interface RawDeveloperProject {
	id: string;
	nama: string;
	slug: string;
	fotoUrl: string | null;
}

interface DeveloperDetailRaw extends Omit<DeveloperDetail, 'proyek'> {
	proyek: RawDeveloperProject[];
}

export async function getDevelopers(fetchFn: Fetch): Promise<DeveloperSummary[]> {
	if (hasSearchApi()) return apiGet<DeveloperSummary[]>(fetchFn, '/public/developers');
	return fixtures.DEVELOPER_SUMMARIES;
}

export async function getDeveloper(fetchFn: Fetch, slug: string): Promise<DeveloperDetail> {
	if (hasSearchApi()) {
		const raw = await apiGet<DeveloperDetailRaw>(
			fetchFn,
			`/public/developers/${encodeURIComponent(slug)}`
		);
		// Enrichment stats per-proyek (api-contract.md §3): response mentah
		// tidak punya `regionNama`/`hargaMulai`/`unitTersedia` — ambil dari
		// `GET /public/units?perumahanSlug=<slug>` per proyek, PARALEL
		// (`Promise.all`; ini SSR di `+page.server.ts`, N request paralel tidak
		// menambah round-trip di browser). Satu item hasil filter
		// `perumahanSlug` pasti share `perumahan` yang sama.
		const proyek = await Promise.all(
			raw.proyek.map(async (p) => {
				const { items } = await getUnits(fetchFn, { perumahanSlug: p.slug, page: 1, pageSize: 48 });
				const harga = items.map((u) => u.hargaMin).filter((h): h is number => h !== null);
				return {
					nama: p.nama,
					slug: p.slug,
					fotoUrl: p.fotoUrl,
					regionNama: items[0]?.perumahan.regionNama ?? null,
					hargaMulai: harga.length > 0 ? Math.min(...harga) : null,
					unitTersedia: items.reduce((sum, u) => sum + u.unitTersedia, 0)
				};
			})
		);
		return { ...raw, proyek };
	}
	const detail = fixtures.developerDetail(slug);
	if (!detail) error(404, 'Developer tidak ditemukan.');
	return detail;
}

// ---------------------------------------------------------------------------
// Detail perumahan (LANDING-01 + LANDING-02 — endpoint SUDAH ADA)
// ---------------------------------------------------------------------------

export async function getPerumahan(fetchFn: Fetch, slug: string): Promise<PerumahanDetail> {
	if (hasApi()) {
		// `?full=1` (epic `LANDING-06`, repo `perumahan`, done 2026-09-15) —
		// bypass optimasi skip-resolve `LANDING-05`. Tanpa ini, tenant yang
		// SUDAH migrasi ke Omahe (`redirectUrl` terisi) akan dapat profil
		// KOSONG dari endpoint ini (`/p/:slug` React app satu-satunya yang
		// boleh andalkan default skip-resolve, karena dia redirect duluan
		// dan tidak pernah render datanya) — justru tenant itu yang paling
		// butuh profil lengkap di sini.
		return apiGet<PerumahanDetail>(
			fetchFn,
			`/public/perumahan/${encodeURIComponent(slug)}`,
			new URLSearchParams({ full: '1' })
		);
	}
	const detail = fixtures.perumahanDetail(slug);
	if (!detail) error(404, 'Perumahan tidak ditemukan.');
	return detail;
}

// ---------------------------------------------------------------------------
// Detail tipe rumah (UNIT-05)
// ---------------------------------------------------------------------------

/**
 * `GET /public/perumahan/:slug/tipe/:tipeSlug` — gate `hasApi()` sama
 * `getPerumahan` (endpoint detail, bukan pencarian). Endpoint ini TIDAK
 * ikut skip-resolve LANDING-05, jadi tanpa `?full=1`.
 */
export async function getTipeDetail(
	fetchFn: Fetch,
	perumahanSlug: string,
	tipeSlug: string
): Promise<TipeDetail> {
	if (hasApi()) {
		return apiGet<TipeDetail>(
			fetchFn,
			`/public/perumahan/${encodeURIComponent(perumahanSlug)}/tipe/${encodeURIComponent(tipeSlug)}`
		);
	}
	const detail = fixtures.tipeDetail(perumahanSlug, tipeSlug);
	if (!detail) error(404, 'Tipe rumah tidak ditemukan.');
	return detail;
}

// ---------------------------------------------------------------------------
// Wilayah — opsi filter lokasi
// ---------------------------------------------------------------------------

export async function getRegions(fetchFn: Fetch): Promise<RegionOption[]> {
	if (hasSearchApi()) {
		// `GET /public/regions` (LOKASI-02 repo `perumahan`, done 2026-09-23 —
		// sebelumnya gap api-contract.md §5): kabupaten/kota dengan unit
		// tersedia. Tetap fail-soft ke array kosong (filter lokasi kosong)
		// daripada menjatuhkan SELURUH homepage/`/cari` lewat `error()` di
		// `apiGet` saat backend bermasalah — ditemukan 2026-09-15: tanpa
		// fallback ini, kedua halaman 404 TOTAL waktu endpoint belum ada.
		try {
			return await apiGet<RegionOption[]>(fetchFn, '/public/regions');
		} catch (err) {
			console.error(
				'[omahe:api] GET /public/regions gagal — fallback ke [] (lihat api-contract.md §5)',
				err
			);
			return [];
		}
	}
	return fixtures.REGIONS;
}

/** Dipakai `/sitemap.xml` — daftar slug proyek untuk halaman detail. */
export async function getAllProjectSlugs(fetchFn: Fetch): Promise<string[]> {
	if (hasSearchApi()) {
		const { items } = await getUnits(fetchFn, { pageSize: 48, page: 1 });
		return [...new Set(items.map((u) => u.perumahan.slug))];
	}
	return fixtures.projectSlugs();
}

/**
 * Error POST dengan status TERJAGA — dipakai route proxy `/api/lead`
 * meneruskan status + pesan backend (mis. 429 rate limit yang sudah ramah,
 * api-contract.md §8) apa adanya ke browser, tanpa membuka error internal.
 */
export class ApiError extends Error {
	readonly status: number;
	constructor(status: number, message: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

// ---------------------------------------------------------------------------
// Lead partner berbayar (MONET-03, api-contract.md §8)
// ---------------------------------------------------------------------------

/**
 * Submit lead form publik `POST /public/leads` — HANYA untuk perumahan
 * partner berbayar (prioritas > 0); selain itu backend 404 seragam.
 *
 * PEMANGGILNYA route proxy `/api/lead`, BUKAN komponen langsung: file ini
 * server-only (komentar atas), `$env/dynamic/private` tidak boleh masuk
 * bundle browser — dialog merender fetch ke `/api/lead`, di sini yang
 * meneruskan ke backend.
 *
 * Env-gated pola `getSliders`: fixture mode = kembalikan ok TANPA network
 * (simpel — form dev tetap bisa "sukses" tanpa data dikirim ke mana pun).
 * Mode API asli: POST JSON; respons sukses & honeypot SAMA
 * `{success:true,data:{ok:true}}`, jadi cukup dibedakan statusnya.
 */
export async function createLead(fetchFn: Fetch, input: LeadInput): Promise<void> {
	if (!hasSearchApi()) return;

	let res: Response;
	try {
		res = await fetchFn(`${baseUrl()}/public/leads`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', accept: 'application/json' },
			// Honeypot `website` & `ref` dikirim APA ADANYA (tanpa filter klien) —
			// keputusan honeypot ada di server, bukan di sini (api-contract.md §8).
			body: JSON.stringify(input),
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
	} catch {
		throw new ApiError(502, 'Tidak bisa menghubungi server. Coba lagi sebentar lagi.');
	}
	if (res.ok) return;

	// Pesan server lebih tahu: 400 punya detail field, 429 rate limit sudah
	// ramah, 404 PESAN SERAGAM (jangan dipakai membedakan status komersial
	// di UI). Yang tidak berpesan → generik; error internal backend tidak
	// pernah diteruskan mentah-mentah.
	let serverMessage: string | null = null;
	try {
		const body = (await res.json()) as { message?: unknown };
		if (typeof body.message === 'string' && body.message) serverMessage = body.message;
	} catch {
		// body bukan JSON — pakai pesan generik di bawah.
	}
	console.error(`[omahe:api] POST /public/leads → ${res.status}`);
	throw new ApiError(res.status, serverMessage ?? 'Pengiriman gagal. Coba lagi sebentar lagi.');
}

// ---------------------------------------------------------------------------
// Mitra Profesional (MITRA-01)
// ---------------------------------------------------------------------------

/**
 * Direktori Mitra Profesional — KJPP & Notaris (api-contract.md §9).
 * Urutan & filter `aktif` diurus server (`urutan` ASC → `nama` ASC).
 *
 * Env-gated pola `getSliders`; fail-soft ke `[]` pola `getRegions`:
 * endpoint `GET /public/mitra` belum ada di backend (MITRA-01 `todo`) —
 * di mode API asli halaman `/mitra` menampilkan empty-state sampai
 * backend live. JANGAN fail-soft ke fixture di sini: fixture memuat
 * nomor WA fiktif, tidak boleh tampil di produksi.
 */
export async function getMitra(
	fetchFn: Fetch,
	kategori?: 'kjpp' | 'notaris'
): Promise<PublicMitra[]> {
	if (!hasSearchApi()) {
		// Fixture HANYAH di dev — nomor WA di fixture FIKTIF dan pernah bocor
		// ke produksi saat env OMAHE_API_SEARCH lupa di-set (2026-09-22);
		// produksi tanpa API → empty-state jujur, bukan kontak palsu.
		if (!import.meta.env.DEV) return [];
		return kategori ? fixtures.MITRA.filter((m) => m.kategori === kategori) : fixtures.MITRA;
	}
	try {
		const params = kategori ? `?kategori=${kategori}` : '';
		const data = await apiGet<PublicMitra[]>(fetchFn, `/public/mitra${params}`);
		return Array.isArray(data) ? data : [];
	} catch (err) {
		console.error(
			'[omahe:api] GET /public/mitra gagal — fallback ke [] (empty-state, MITRA-01 belum live)',
			err
		);
		return [];
	}
}

// ---------------------------------------------------------------------------
// Slider homepage (MONET-02)
// ---------------------------------------------------------------------------

/**
 * Slider event/kegiatan carousel homepage (api-contract.md §7). Urutan,
 * filter status/masa-aktif, dan batas 10 item diurus server — jangan
 * diurutkan/difilter ulang di sini.
 *
 * Env-gated mengikuti pola pencarian (`hasSearchApi()`): fixture saat
 * `OMAHE_API_SEARCH` off, API asli saat on — slider terbit bareng epic
 * `MONET-02` yang sudah `done`, jadi tidak butuh saklar tersendiri.
 *
 * Fail-soft ke `[]` pola `getRegions`: slider aksesoris homepage — kalau
 * endpoint gagal/404/shape tak dikenal, section-nya hilang TOTAL (bukan
 * menjatuhkan seluruh halaman lewat `error()` bawaan `apiGet`).
 */
export async function getSliders(fetchFn: Fetch): Promise<PublicSlider[]> {
	if (!hasSearchApi()) return fixtures.SLIDERS;
	try {
		const data = await apiGet<PublicSlider[]>(fetchFn, '/public/sliders');
		return Array.isArray(data) ? data : [];
	} catch (err) {
		console.error(
			'[omahe:api] GET /public/sliders gagal — fallback ke [] (section disembunyikan)',
			err
		);
		return [];
	}
}

// ---------------------------------------------------------------------------
// Kontak Omahe (ADMIN-05)
// ---------------------------------------------------------------------------

/**
 * Kontak publik Omahe (`GET /public/app-settings`, epic ADMIN-05 repo
 * `perumahan`) — dipanggil SEKALI dari layout root (`+layout.server.ts`) dan
 * disebarkan ke semua halaman via `page.data.kontak`.
 *
 * Fail-soft total, pola `getRegions`: kontak itu aksesoris di hampir semua
 * halaman — endpoint gagal/timeout/shape tak dikenal TIDAK BOLEH menjatuhkan
 * halaman, cukup kembali ke `SITE.*` (kontak fallback statis di
 * `$lib/config.ts`). Fungsi ini JANGAN pernah throw.
 *
 * Per-field independen: satu field null di backend hanya field itu yang
 * kembali ke `SITE.*`, field lain tetap dari API.
 *
 * Cache in-memory modul 60 detik — hasil sukses maupun fallback-karena-error
 * sama-sama ter-cache, jadi kegagalan endpoint tidak diulang di setiap request
 * SSR (request Vercel bisa datang berpaketaan); perubahan nomor di admin
 * tampil paling lambat 1 menit di server, tanpa redeploy.
 */

/** Endpoint-nya kecil & kritis lambat hanya jika backend down — jangan
 *  menahan render halaman selama TIMEOUT_MS penuh (8 detik). */
const KONTAK_TIMEOUT_MS = 2500;
const KONTAK_CACHE_TTL_MS = 60_000;

let kontakCache: { nilai: KontakOmahe; kedaluwarsa: number } | null = null;

const kontakFallback = (): KontakOmahe => ({
	whatsapp: SITE.whatsapp,
	telepon: SITE.telepon,
	email: SITE.email
});

/** null/undefined/bukan string berisi → fallback SITE untuk field itu saja. */
function ambilAtauFallback(nilai: unknown, fallback: string): string {
	return typeof nilai === 'string' && nilai.trim() !== '' ? nilai : fallback;
}

export async function getKontak(fetchFn: Fetch): Promise<KontakOmahe> {
	// Tanpa API (fixture mode) tidak ada sumber nomor selain SITE — dan
	// fixture MEMANG kontak Omahe sendiri, bukan data palsu backend.
	if (!hasApi()) return kontakFallback();

	if (kontakCache && Date.now() < kontakCache.kedaluwarsa) return kontakCache.nilai;

	const nilai = await fetchKontak(fetchFn);
	kontakCache = { nilai, kedaluwarsa: Date.now() + KONTAK_CACHE_TTL_MS };
	return nilai;
}

/** Selalu resolve — semua kegagalan sudah jadi fallback di dalam sini. */
async function fetchKontak(fetchFn: Fetch): Promise<KontakOmahe> {
	try {
		const res = await fetchFn(`${baseUrl()}/public/app-settings`, {
			headers: { accept: 'application/json' },
			signal: AbortSignal.timeout(KONTAK_TIMEOUT_MS)
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const body = (await res.json()) as {
			data?: { kontak?: Record<string, unknown> | null } | null;
		};
		const k = body.data?.kontak;
		return {
			whatsapp: ambilAtauFallback(k?.whatsapp, SITE.whatsapp),
			telepon: ambilAtauFallback(k?.telepon, SITE.telepon),
			email: ambilAtauFallback(k?.email, SITE.email)
		};
	} catch (err) {
		console.error(
			'[omahe:api] GET /public/app-settings gagal — fallback kontak SITE (ADMIN-05)',
			err
		);
		return kontakFallback();
	}
}
