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
import * as fixtures from './fixtures';
import type {
	ApiEnvelope,
	DeveloperDetail,
	DeveloperSummary,
	PageMeta,
	Paginated,
	PerumahanDetail,
	PublicSlider,
	RegionOption,
	UnitListing,
	UnitQuery
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
		const body = (await res.json()) as { data: UnitListing[]; meta: PageMeta };
		// Trade-off yang disadari: `meta` (termasuk `total`) TIDAK disesuaikan
		// setelah filter developer — paginasi jadi kurang presisi saat filter
		// aktif (api-contract.md §1). Perbaikannya butuh facet di backend,
		// di luar scope ini.
		const items = developerSlug
			? body.data.filter((u) => u.developer?.slug === developerSlug)
			: body.data;
		return { items, meta: body.meta };
	}

	return filterFixtureUnits({ ...query, page, pageSize });
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
// Wilayah — opsi filter lokasi
// ---------------------------------------------------------------------------

export async function getRegions(fetchFn: Fetch): Promise<RegionOption[]> {
	if (hasSearchApi()) {
		// `GET /public/regions` BELUM ADA di backend (api-contract.md §5, gap
		// terbuka) — 404-nya di sini berarti "fitur ini belum diimplementasikan
		// backend", BUKAN "resource tidak ditemukan" seperti 404 endpoint lain
		// (unit/developer/perumahan) yang MEMANG harus jadi halaman 404 asli.
		// Fail-soft ke array kosong (filter lokasi kosong/nonfungsi) daripada
		// menjatuhkan SELURUH halaman lewat `error(404, ...)` di `apiGet`.
		// Ditemukan 2026-09-15 saat verifikasi live: tanpa fallback ini,
		// homepage & `/cari` 404 TOTAL begitu `OMAHE_API_SEARCH=1` dinyalakan
		// (keduanya memanggil `getRegions` di load function-nya).
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
