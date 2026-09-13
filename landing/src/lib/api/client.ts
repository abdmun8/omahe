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
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries({ ...query, page, pageSize })) {
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
		return { items: body.data, meta: body.meta };
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

export async function getDevelopers(fetchFn: Fetch): Promise<DeveloperSummary[]> {
	if (hasSearchApi()) return apiGet<DeveloperSummary[]>(fetchFn, '/public/developers');
	return fixtures.DEVELOPER_SUMMARIES;
}

export async function getDeveloper(fetchFn: Fetch, slug: string): Promise<DeveloperDetail> {
	if (hasSearchApi()) {
		return apiGet<DeveloperDetail>(fetchFn, `/public/developers/${encodeURIComponent(slug)}`);
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
		return apiGet<PerumahanDetail>(fetchFn, `/public/perumahan/${encodeURIComponent(slug)}`);
	}
	const detail = fixtures.perumahanDetail(slug);
	if (!detail) error(404, 'Perumahan tidak ditemukan.');
	return detail;
}

// ---------------------------------------------------------------------------
// Wilayah — opsi filter lokasi
// ---------------------------------------------------------------------------

export async function getRegions(fetchFn: Fetch): Promise<RegionOption[]> {
	if (hasSearchApi()) return apiGet<RegionOption[]>(fetchFn, '/public/regions');
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
