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
import { musikValid } from '$lib/musik';
import { error } from '@sveltejs/kit';
import { SITE } from '$lib/config';
import { TOKEN_BAYAR_PATTERN, pdfInvoiceContoh } from '$lib/bayar';
import * as fixtures from './fixtures';
import { parseUrutan, urutkanUnitFixture } from '$lib/urutan-unit';
import { HARGA_TERJANGKAU } from '$lib/config';
import type {
	ApiEnvelope,
	DeveloperDetail,
	DeveloperSummary,
	AgenDetail,
	AgenSummary,
	KontakOmahe,
	LeadHasil,
	LeadInput,
	PageMeta,
	Paginated,
	PerumahanDetail,
	PublicSlider,
	RegionOption,
	UnitListing,
	UnitQuery,
	PublicMitra,
	MitraDetail,
	KategoriMitraMaster,
	PromoDetail,
	PromoSummary,
	TeksOmahe,
	TipeDetail,
	VerifikasiAgen,
	AgenPemasar,
	AgenDirektori,
	AgenMinatInput,
	KartuNamaAgen,
	DetailBayar,
	PerumahanDirektori,
	InfoSitus,
	Sosial,
	RumahLelangKartu,
	RumahLelangDetail,
	LelangQuery,
	LokasiLelang
} from './types';

/** `fetch` bawaan SvelteKit `load` — dioper masuk supaya ikut dedupe & SSR. */
type Fetch = typeof globalThis.fetch;

/**
 * AGEN-PROPERTI-03 — penanda permintaan dari server Omahe: backend lalu
 * menyembunyikan perumahan milik agen properti yang tidak tampil di Omahe
 * (situs agen & booking `/ajukan` tidak mengirim header ini).
 */
const KONSUMEN = { 'x-konsumen': 'omahe' } as const;

const baseUrl = () => env.OMAHE_API_BASE_URL?.replace(/\/+$/, '') ?? '';
const hasApi = () => baseUrl() !== '';
/** UNIT-04 + DEVELOPER-01 sudah live di backend? */
const hasSearchApi = () => hasApi() && env.OMAHE_API_SEARCH === '1';

/** Timeout — landing publik tidak boleh menggantung gara-gara API lambat. */
const TIMEOUT_MS = Number(env.OMAHE_API_TIMEOUT_MS ?? 8000);

async function apiGet<T>(fetchFn: Fetch, path: string, params?: URLSearchParams): Promise<T> {
	const url = `${baseUrl()}${path}${params && [...params].length ? `?${params}` : ''}`;
	const res = await fetchFn(url, {
		headers: { accept: 'application/json', ...KONSUMEN },
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
		const { developerSlug, sort, ...backendQuery } = query;
		const params = new URLSearchParams();
		// UNIT-07 — `rekomendasi` = default backend: tidak dikirim (URL & cache
		// sama dengan sebelum ada fitur urutan).
		const urutan = parseUrutan(sort);
		for (const [key, value] of Object.entries({
			...backendQuery,
			sort: urutan === 'rekomendasi' ? undefined : urutan,
			page,
			pageSize
		})) {
			if (value !== undefined && value !== '') params.set(key, String(value));
		}
		const url = `${baseUrl()}/public/units?${params}`;
		const res = await fetchFn(url, {
			headers: { accept: 'application/json', ...KONSUMEN },
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
	const cocok = fixtures.UNIT_LISTINGS.filter((u) => {
		if (query.regionKode && u.perumahan.regionKode !== query.regionKode) return false;
		if (query.perumahanSlug && u.perumahan.slug !== query.perumahanSlug) return false;
		if (query.developerSlug && u.developer?.slug !== query.developerSlug) return false;
		if (query.tipe && !u.tipe.toLowerCase().includes(query.tipe.toLowerCase())) return false;
		// Rentang harga dibandingkan ke harga TERENDAH tipe ini — kartu yang
		// punya satu unit di bawah plafon tetap relevan buat pencari.
		if (query.hargaMin !== undefined && (u.hargaMax ?? 0) < query.hargaMin) return false;
		if (query.hargaMax !== undefined && (u.hargaMin ?? 0) > query.hargaMax) return false;
		return true;
	});
	const matched = urutkanUnitFixture(cocok, parseUrutan(query.sort));

	const offset = (query.page - 1) * query.pageSize;
	return {
		items: matched.slice(offset, offset + query.pageSize),
		meta: { total: matched.length, page: query.page, pageSize: query.pageSize }
	};
}

/** Kartu "Rekomendasi Hari Ini" homepage — urutan default backend
 *  (partner berbayar dulu, sisanya rotasi harian — LANDING-07). */
export async function getFeaturedUnits(fetchFn: Fetch, limit = 6): Promise<UnitListing[]> {
	const { items } = await getUnits(fetchFn, { pageSize: limit, page: 1 });
	return items;
}

/** LANDING-07 — tipe dengan harga mulai ≤ `HARGA_TERJANGKAU`, termurah dulu. */
export async function getUnitTerjangkau(fetchFn: Fetch, limit = 6): Promise<UnitListing[]> {
	const { items } = await getUnits(fetchFn, {
		hargaMax: HARGA_TERJANGKAU,
		sort: 'harga_asc',
		pageSize: limit,
		page: 1
	});
	return items;
}

/**
 * LANDING-07 — 4 perumahan yang paling baru bergabung + jumlah perumahan
 * aktif (`GET /public/perumahan?sort=terbaru`). Mode fixture → kosong
 * (seksi tersembunyi).
 */
export async function getPerumahanTerbaru(
	fetchFn: Fetch,
	limit = 4
): Promise<{ items: PerumahanDirektori[]; total: number }> {
	if (!hasSearchApi()) return { items: [], total: 0 };
	const url = `${baseUrl()}/public/perumahan?sort=terbaru&page=1&pageSize=${limit}`;
	const res = await fetchFn(url, {
		headers: { accept: 'application/json', ...KONSUMEN },
		signal: AbortSignal.timeout(TIMEOUT_MS)
	});
	if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
	const body = (await res.json()) as { data: PerumahanDirektori[]; meta: PageMeta };
	return { items: body.data, total: body.meta.total };
}

/**
 * ANALITIK-01 — teruskan beacon kunjungan halaman perumahan ke backend
 * (`POST /public/kunjungan`). Fail-soft total: statistik internal tidak
 * boleh mengganggu pengunjung. Mode fixture → no-op.
 */
export async function catatKunjungan(
	fetchFn: Fetch,
	input: { slug: string; pengunjung: string }
): Promise<void> {
	if (!hasApi()) return;
	try {
		await fetchFn(`${baseUrl()}/public/kunjungan`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', accept: 'application/json', ...KONSUMEN },
			body: JSON.stringify(input),
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
	} catch (err) {
		console.error('[omahe:api] POST /public/kunjungan gagal (diabaikan)', err);
	}
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
// AGEN-PROPERTI-01 — direktori agen properti
// ---------------------------------------------------------------------------

interface AgenDetailRaw extends AgenSummary {
	perumahan: Array<{
		nama: string;
		slug: string;
		fotoUrl: string | null;
		regionNama: string | null;
	}>;
}

/** Agen aktif & tampil di Omahe. Fixture/API gagal → [] (halaman tetap jalan). */
export async function getAgenList(fetchFn: Fetch): Promise<AgenSummary[]> {
	if (!hasSearchApi()) return [];
	try {
		return await apiGet<AgenSummary[]>(fetchFn, '/public/agen');
	} catch (err) {
		console.error('[omahe:api] daftar agen gagal', err);
		return [];
	}
}

export async function getAgen(fetchFn: Fetch, slug: string): Promise<AgenDetail> {
	if (!hasSearchApi()) error(404, 'Agen tidak ditemukan.');
	const raw = await apiGet<AgenDetailRaw>(fetchFn, `/public/agen/${encodeURIComponent(slug)}`);
	// Stats per perumahan dari `/public/units` (pola getDeveloper) — kartu
	// proyek yang sama dengan halaman developer.
	const perumahan = await Promise.all(
		raw.perumahan.map(async (p) => {
			const { items } = await getUnits(fetchFn, { perumahanSlug: p.slug, page: 1, pageSize: 48 });
			const harga = items.map((u) => u.hargaMin).filter((h): h is number => h !== null);
			return {
				nama: p.nama,
				slug: p.slug,
				fotoUrl: p.fotoUrl,
				regionNama: p.regionNama,
				hargaMulai: harga.length > 0 ? Math.min(...harga) : null,
				unitTersedia: items.reduce((sum, u) => sum + u.unitTersedia, 0)
			};
		})
	);
	return { ...raw, perumahan };
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
/**
 * Semua grup unit tersedia (untuk sitemap). Menelusuri SEMUA halaman
 * `/public/units` — dulu hanya halaman 1 (48 grup), sehingga perumahan di
 * luar 48 grup pertama hilang diam-diam dari sitemap. Dibatasi
 * `MAX_HALAMAN` sebagai pengaman.
 */
export async function getAllUnitListings(fetchFn: Fetch): Promise<UnitListing[]> {
	if (!hasSearchApi()) return fixtures.UNIT_LISTINGS;
	const MAX_HALAMAN = 20;
	const semua: UnitListing[] = [];
	for (let page = 1; page <= MAX_HALAMAN; page++) {
		const { items, meta } = await getUnits(fetchFn, { pageSize: 48, page });
		semua.push(...items);
		if (items.length === 0 || page * meta.pageSize >= meta.total) break;
	}
	return semua;
}

export async function getAllProjectSlugs(fetchFn: Fetch): Promise<string[]> {
	if (hasSearchApi()) {
		const items = await getAllUnitListings(fetchFn);
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
 * Pesan ramah dari body error backend `perumahan` — bentuknya
 * `{ error, code, issues? }` (middleware `globalErrorHandler`), BUKAN
 * `{ message }`. 400 validasi: pesan issue pertama (mis. "Nomor WhatsApp
 * tidak valid."), selain itu `error` (mis. 429 rate limit). 5xx / body
 * aneh → null (pemanggil memakai pesan generik; detail internal tidak
 * pernah diteruskan).
 */
export async function pesanErrorBackend(res: Response): Promise<string | null> {
	if (res.status >= 500) return null;
	try {
		const body = (await res.json()) as {
			error?: unknown;
			message?: unknown;
			issues?: Array<{ message?: unknown }>;
		};
		const issue = Array.isArray(body.issues) ? body.issues[0]?.message : undefined;
		for (const kandidat of [issue, body.error, body.message]) {
			if (typeof kandidat === 'string' && kandidat && kandidat !== 'Validation failed')
				return kandidat;
		}
	} catch {
		// body bukan JSON — pakai pesan generik.
	}
	return null;
}

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
export async function createLead(fetchFn: Fetch, input: LeadInput): Promise<LeadHasil> {
	if (!hasSearchApi()) return { whatsapp: null };

	let res: Response;
	try {
		res = await fetchFn(`${baseUrl()}/public/leads`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', accept: 'application/json', ...KONSUMEN },
			// Honeypot `website` & `ref` dikirim APA ADANYA (tanpa filter klien) —
			// keputusan honeypot ada di server, bukan di sini (api-contract.md §8).
			body: JSON.stringify(input),
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
	} catch {
		throw new ApiError(502, 'Tidak bisa menghubungi server. Coba lagi sebentar lagi.');
	}
	if (res.ok) {
		// LEAD-02 — nomor tujuan WA peminat (owner perumahan / agen Omahe);
		// backend lama tanpa field ini / body aneh → null (nomor umum Omahe).
		const body = (await res.json().catch(() => null)) as {
			data?: { whatsapp?: unknown };
		} | null;
		const whatsapp = body?.data?.whatsapp;
		return { whatsapp: typeof whatsapp === 'string' && whatsapp.trim() ? whatsapp : null };
	}

	// Pesan server lebih tahu: 400 punya detail field, 429 rate limit sudah
	// ramah, 404 PESAN SERAGAM (jangan dipakai membedakan status komersial
	// di UI). Yang tidak berpesan → generik; error internal backend tidak
	// pernah diteruskan mentah-mentah.
	const serverMessage = await pesanErrorBackend(res);
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
 * epic MITRA-01 di backend `done` 2026-09-22 — kalau instance tujuan
 * belum dideploy/migrasi, halaman `/mitra` tetap jalan dengan empty-state
 * sampai endpoint live. JANGAN fail-soft ke fixture di sini: fixture
 * memuat nomor WA fiktif, tidak boleh tampil di produksi.
 *
 * `kategori` string bebas (omahe#3): halaman /mitra kini memanggil TANPA
 * filter lalu menyaring sendiri server-side supaya chip kategori bisa
 * diderive dari data yang sama (satu fetch); param tetap dipertahankan
 * untuk pemanggil lain.
 */
export async function getMitra(fetchFn: Fetch, kategori?: string): Promise<PublicMitra[]> {
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
		console.error('[omahe:api] GET /public/mitra gagal — fallback ke [] (empty-state)', err);
		return [];
	}
}

/**
 * Slug mitra bentuknya normalisasi backend (lowercase, run non-alfanumerik
 * → '-', trim '-'; kosong → 'mitra') — slug `kategori` cadangan ditolak
 * backend karena bentrok route. Pola ini penjaga LOKAL: URL aneh tidak
 * layak satu round-trip ke backend (pola `KODE_AGEN_PATTERN`).
 */
const SLUG_MITRA_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * PROFIL-01 — `GET /public/mitra/:slug` (api-contract.md §29): profil satu
 * mitra yang tampil publik (aktif + masa aktif + kategori aktif); selain
 * itu backend membalas 404 SERAGAM → diteruskan `error(404)` Kit lewat
 * `apiGet` (mitra nonaktif tidak dibedakan dari tidak ada — privacy).
 *
 * Slug dinormalisasi lokal (trim + lowercase); halaman me-redirect ke slug
 * kanonik bila beda. Fixture HANYA non-produksi (guard `PROD === true`,
 * pola `getKartuNamaAgen`): detail memuat nomor WA FIKTIF — produksi tanpa
 * API jujur 404, bukan kontak palsu.
 */
export async function getMitraDetail(fetchFn: Fetch, slugRaw: string): Promise<MitraDetail> {
	const slug = slugRaw.trim().toLowerCase();
	if (!SLUG_MITRA_PATTERN.test(slug)) error(404, 'Mitra tidak ditemukan.');
	if (!hasSearchApi()) {
		if (import.meta.env.PROD === true) error(404, 'Mitra tidak ditemukan.');
		const detail = fixtures.mitraDetail(slug);
		if (!detail) error(404, 'Mitra tidak ditemukan.');
		return detail;
	}
	return apiGet<MitraDetail>(fetchFn, `/public/mitra/${encodeURIComponent(slug)}`);
}

/**
 * MITRA-04 — master kategori mitra (`GET /public/mitra/kategori`,
 * api-contract.md §28) untuk chip/tab `/mitra` dari master (bukan turunan
 * data) supaya kategori TANPA mitra tetap tampil.
 *
 * Fail-soft `null` (BUKAN `[]`, BUKAN throw): `null` = master tidak
 * tersedia → pemanggil fallback ke chip turunan data (perilaku lama),
 * halaman tidak pernah jatuh. `[]` dari API dibedakan (master memang
 * kosong). Fixture HANYA non-produksi (guard `PROD === true` pola
 * `getVerifikasiAgen`): label master fixture aman (tanpa kontak), tapi
 * produksi tanpa API harus jujur pakai chip dari data, bukan fixture.
 */
export async function getKategoriMitra(fetchFn: Fetch): Promise<KategoriMitraMaster[] | null> {
	if (!hasSearchApi()) {
		if (import.meta.env.PROD === true) return null;
		return fixtures.KATEGORI_MITRA_MASTER;
	}
	try {
		const data = await apiGet<KategoriMitraMaster[]>(fetchFn, '/public/mitra/kategori');
		return Array.isArray(data) ? data : null;
	} catch (err) {
		console.error('[omahe:api] GET /public/mitra/kategori gagal — fallback chip dari data', err);
		return null;
	}
}

// Verifikasi ID card agen Omahe (AGEN-OMAHE-01) ---------------------------------

/** Hasil verifikasi: ketemu, atau tidak — dan kalau tidak, apakah karena
 *  layanan backend sedang bermasalah (UI harus jujur "tidak dapat
 *  memverifikasi", BUKAN pura-pura "kode tidak dikenali"). */
export type HasilVerifikasi =
	{ ketemu: true; data: VerifikasiAgen } | { ketemu: false; layananError: boolean };

/**
 * Bentuk kode agen backend: `OMHA-A0001` (berurutan, AGEN-OMAHE-05) ATAU
 * kode acak lama `OMH-XXXXXX` (alias QR/ID card yang sudah tercetak).
 */
export const KODE_AGEN_PATTERN = /^(OMHA-[A-Z]\d{4}|OMH-[A-HJ-KM-NP-Z2-9]{1,16})$/;

/**
 * Verifikasi publik ID card agen (api-contract §20). Sengaja TIDAK lewat
 * `apiGet`: 404 dari backend = "kode tidak dikenali" yang harus jadi STATE
 * halaman (bukan `error(404)` Kit — QR salah ketik tetap pantas dapat
 * penjelasan di halaman verifikasi, bukan halaman 404 situs).
 *
 * Pola `getMitra`: fixture HANYA dev; mode API asli fail-soft `ketemu:false`
 * (dengan `layananError` sesuai kondisi) — verifikasi tidak pernah
 * menjatuhkan halaman. Kode tak sesuai pola tidak di-fetch sama sekali.
 */
export async function getVerifikasiAgen(fetchFn: Fetch, kodeRaw: string): Promise<HasilVerifikasi> {
	const kode = kodeRaw.trim().toUpperCase();
	if (!KODE_AGEN_PATTERN.test(kode)) return { ketemu: false, layananError: false };

	if (!hasSearchApi()) {
		// Fixture HANYAH di non-produksi — profil agen di bawah FIKTIF; produksi
		// tanpa API jujur "tidak dapat memverifikasi" (bukan agen palsu).
		// Guard `PROD !== true` (bukan `.DEV` pola getMitra): di build produksi
		// Vite menggantinya jadi `false` statis sehingga cabang fixture
		// TER-TREE-SHAKE total (diverifikasi di output .vercel), sementara di
		// `bun test` (tidak ada DEV/PROD) fixture tetap teruji.
		if (import.meta.env.PROD === true) return { ketemu: false, layananError: true };
		const data = fixtures.VERIFIKASI_AGEN[kode];
		return data ? { ketemu: true, data } : { ketemu: false, layananError: false };
	}

	let res: Response;
	try {
		res = await fetchFn(`${baseUrl()}/public/agen-omahe/verifikasi/${encodeURIComponent(kode)}`, {
			headers: { accept: 'application/json', ...KONSUMEN },
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
	} catch (err) {
		console.error('[omahe:api] GET verifikasi agen gagal — fail-soft', err);
		return { ketemu: false, layananError: true };
	}
	if (res.status === 404) return { ketemu: false, layananError: false };
	if (!res.ok) {
		console.error(`[omahe:api] GET verifikasi agen → ${res.status}`);
		return { ketemu: false, layananError: true };
	}
	try {
		const body = (await res.json()) as ApiEnvelope<VerifikasiAgen>;
		return body.data ? { ketemu: true, data: body.data } : { ketemu: false, layananError: true };
	} catch (err) {
		console.error('[omahe:api] GET verifikasi agen — body bukan JSON', err);
		return { ketemu: false, layananError: true };
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
// Halaman Promo Omahe (PROMO-02)
// ---------------------------------------------------------------------------

/**
 * `GET /public/promo` — promo yang sedang tayang. Fail-soft ke `[]` (pola
 * slider/regions): kegagalan backend menyembunyikan daftar, tidak
 * menjatuhkan halaman `/promo` atau sitemap.
 */
export async function getPromoList(fetchFn: Fetch): Promise<PromoSummary[]> {
	if (!hasApi())
		return fixtures.PROMO.map(
			({ konten: _k, ctaLabel: _l, ctaUrl: _u, perumahan: _p, ...ringkas }) => ringkas
		);
	try {
		const data = await apiGet<PromoSummary[]>(fetchFn, '/public/promo');
		return Array.isArray(data) ? data : [];
	} catch (err) {
		console.error('[omahe:api] GET /public/promo gagal — fallback ke []', err);
		return [];
	}
}

/** `GET /public/promo/:slug` — 404 (draft/di luar periode/tidak ada) diteruskan. */
export async function getPromo(fetchFn: Fetch, slug: string): Promise<PromoDetail> {
	if (hasApi()) {
		return apiGet<PromoDetail>(fetchFn, `/public/promo/${encodeURIComponent(slug)}`);
	}
	const promo = fixtures.PROMO.find((p) => p.slug === slug);
	if (!promo) error(404, 'Promo tidak ditemukan.');
	return promo;
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

/** ADMIN-05 + ADMIN-06 — hasil satu fetch `/public/app-settings`. */
interface SiteSettings {
	kontak: KontakOmahe;
	teks: TeksOmahe;
	/** Jeda perpindahan slide carousel homepage (detik; bawaan 3). */
	sliderDelayDetik: number;
	/** ADMIN-07 — musik latar (null = tidak ada / nonaktif). */
	musik: { url: string; judul: string } | null;
	/** KONTAK-01 — alamat kantor & media sosial (tanpa fallback SITE). */
	situs: InfoSitus;
}

const situsKosong = (): InfoSitus => ({ alamatKantor: null, sosial: {} });

/** KONTAK-01 — hanya URL https untuk platform yang dikenal (data liar dibuang). */
export function sosialValid(raw: unknown): Sosial {
	const hasil: Sosial = {};
	if (!raw || typeof raw !== 'object') return hasil;
	for (const k of ['instagram', 'facebook', 'tiktok', 'youtube'] as const) {
		const v = (raw as Record<string, unknown>)[k];
		if (typeof v === 'string' && v.startsWith('https://')) hasil[k] = v;
	}
	return hasil;
}

/** Jeda slide bawaan & batas aman (detik) — sinkron backend app-setting. */
export const SLIDER_DELAY_DEFAULT = 3;

/** Angka 2–30 dari API; selain itu bawaan. */
export function normalisasiSliderDelay(v: unknown): number {
	return typeof v === 'number' && Number.isInteger(v) && v >= 2 && v <= 30
		? v
		: SLIDER_DELAY_DEFAULT;
}

let siteCache: { nilai: SiteSettings; kedaluwarsa: number } | null = null;

const kontakFallback = (): KontakOmahe => ({
	whatsapp: SITE.whatsapp,
	telepon: SITE.telepon,
	email: SITE.email
});

/** ADMIN-06 — teks hero bawaan (`config.ts`) saat admin belum mengisi. */
const teksFallback = (): TeksOmahe => ({
	tagline: SITE.tagline,
	heroJudul: SITE.heroJudul,
	heroSubjudul: SITE.heroSubjudul
});

/** null/undefined/bukan string berisi → fallback SITE untuk field itu saja. */
function ambilAtauFallback(nilai: unknown, fallback: string): string {
	return typeof nilai === 'string' && nilai.trim() !== '' ? nilai : fallback;
}

/**
 * Kontak + teks hero Omahe dari admin (satu fetch, cache 60 dtk, timeout
 * pendek, fail-soft per field ke `SITE`). JANGAN pernah throw.
 */
export async function getSiteSettings(fetchFn: Fetch): Promise<SiteSettings> {
	// Tanpa API (fixture mode) tidak ada sumber selain SITE.
	if (!hasApi())
		return {
			kontak: kontakFallback(),
			teks: teksFallback(),
			sliderDelayDetik: SLIDER_DELAY_DEFAULT,
			musik: null,
			situs: situsKosong()
		};

	if (siteCache && Date.now() < siteCache.kedaluwarsa) return siteCache.nilai;

	const nilai = await fetchSiteSettings(fetchFn);
	siteCache = { nilai, kedaluwarsa: Date.now() + KONTAK_CACHE_TTL_MS };
	return nilai;
}

/** Kompatibel ADMIN-05 — kontak saja. */
export async function getKontak(fetchFn: Fetch): Promise<KontakOmahe> {
	return (await getSiteSettings(fetchFn)).kontak;
}

/** Selalu resolve — semua kegagalan sudah jadi fallback di dalam sini. */
async function fetchSiteSettings(fetchFn: Fetch): Promise<SiteSettings> {
	try {
		const res = await fetchFn(`${baseUrl()}/public/app-settings`, {
			headers: { accept: 'application/json', ...KONSUMEN },
			signal: AbortSignal.timeout(KONTAK_TIMEOUT_MS)
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const body = (await res.json()) as {
			data?: {
				kontak?: Record<string, unknown> | null;
				omahe?: Record<string, unknown> | null;
				sliderDelayDetik?: unknown;
				musik?: unknown;
				alamatKantor?: unknown;
				sosial?: unknown;
			} | null;
		};
		const k = body.data?.kontak;
		const o = body.data?.omahe;
		return {
			kontak: {
				whatsapp: ambilAtauFallback(k?.whatsapp, SITE.whatsapp),
				telepon: ambilAtauFallback(k?.telepon, SITE.telepon),
				email: ambilAtauFallback(k?.email, SITE.email)
			},
			teks: {
				tagline: ambilAtauFallback(o?.tagline, SITE.tagline),
				heroJudul: ambilAtauFallback(o?.heroJudul, SITE.heroJudul),
				heroSubjudul: ambilAtauFallback(o?.heroSubjudul, SITE.heroSubjudul)
			},
			sliderDelayDetik: normalisasiSliderDelay(body.data?.sliderDelayDetik),
			musik: musikValid(body.data?.musik),
			situs: {
				alamatKantor:
					typeof body.data?.alamatKantor === 'string' && body.data.alamatKantor.trim() !== ''
						? body.data.alamatKantor
						: null,
				sosial: sosialValid(body.data?.sosial)
			}
		};
	} catch (err) {
		console.error(
			'[omahe:api] GET /public/app-settings gagal — fallback kontak & teks SITE (ADMIN-05/06)',
			err
		);
		return {
			kontak: kontakFallback(),
			teks: teksFallback(),
			sliderDelayDetik: SLIDER_DELAY_DEFAULT,
			musik: null,
			situs: situsKosong()
		};
	}
}

// Agen Omahe pemasar perumahan (AGEN-OMAHE-03) ------------------------------------

/**
 * Agen Omahe yang memasarkan satu perumahan (api-contract §21). `ref`
 * diteruskan apa adanya: kalau milik salah satu agen, backend hanya
 * mengembalikan agen itu. Blok ini PELENGKAP halaman detail — gagal apa pun
 * → `[]` (blok tidak tampil), halaman tidak ikut jatuh. Fixture HANYA dev
 * (pola `getMitra`): agen fiktif tidak boleh tampil di produksi.
 */
export async function getAgenPemasar(
	fetchFn: Fetch,
	slug: string,
	ref: string | null
): Promise<AgenPemasar[]> {
	if (!hasSearchApi()) {
		// Guard `PROD === true` pola `getVerifikasiAgen`: cabang fixture
		// ter-tree-shake di build produksi, tetap teruji di `bun test`.
		if (import.meta.env.PROD === true) return [];
		const semua = fixtures.AGEN_PEMASAR[slug] ?? [];
		const milikRef = ref ? semua.filter((a) => a.kodeRef === ref.toUpperCase()) : [];
		return milikRef.length > 0 ? milikRef : semua;
	}
	try {
		const q = ref ? `?ref=${encodeURIComponent(ref)}` : '';
		const data = await apiGet<AgenPemasar[]>(
			fetchFn,
			`/public/agen-omahe/perumahan/${encodeURIComponent(slug)}${q}`
		);
		return Array.isArray(data) ? data : [];
	} catch (err) {
		console.error('[omahe:api] GET agen pemasar gagal — fallback ke [] (blok tidak tampil)', err);
		return [];
	}
}

// Direktori agen Omahe + minat umum (AGEN-OMAHE-04) -------------------------------

/**
 * Agen Omahe aktif untuk tab "Agen Omahe" di `/mitra` (api-contract §23).
 * Pola `getAgenPemasar`: fixture HANYA non-produksi, gagal → `[]`
 * (tab menampilkan empty-state, halaman tidak jatuh).
 */
export async function getDirektoriAgen(fetchFn: Fetch): Promise<AgenDirektori[]> {
	if (!hasSearchApi()) {
		if (import.meta.env.PROD === true) return [];
		return fixtures.DIREKTORI_AGEN;
	}
	try {
		const data = await apiGet<AgenDirektori[]>(fetchFn, '/public/agen-omahe');
		return Array.isArray(data) ? data : [];
	} catch (err) {
		console.error('[omahe:api] GET /public/agen-omahe gagal — fallback ke [] (empty-state)', err);
		return [];
	}
}

/**
 * Kirim minat umum ke agen (`POST /public/agen-omahe/:kode/minat`). Pola
 * `createLead`: pesan backend (400/404/429) diteruskan lewat `ApiError`;
 * respons memuat `whatsapp` = nomor agen (LEAD-02 — chat peminat ke agen,
 * bukan nomor umum Omahe/principal). Mode fixture → whatsapp null (dev).
 */
export async function kirimMinatAgen(fetchFn: Fetch, input: AgenMinatInput): Promise<LeadHasil> {
	if (!hasSearchApi()) return { whatsapp: null };
	const { kodeAgen, ...body } = input;
	let res: Response;
	try {
		res = await fetchFn(`${baseUrl()}/public/agen-omahe/${encodeURIComponent(kodeAgen)}/minat`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', accept: 'application/json', ...KONSUMEN },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
	} catch {
		throw new ApiError(502, 'Tidak bisa menghubungi server. Coba lagi sebentar lagi.');
	}
	if (res.ok) {
		// Backend lama tanpa field ini / body aneh → null (nomor umum Omahe).
		const body = (await res.json().catch(() => null)) as {
			data?: { whatsapp?: unknown };
		} | null;
		const whatsapp = body?.data?.whatsapp;
		return { whatsapp: typeof whatsapp === 'string' && whatsapp.trim() ? whatsapp : null };
	}
	const serverMessage = await pesanErrorBackend(res);
	console.error(`[omahe:api] POST minat agen → ${res.status}`);
	throw new ApiError(res.status, serverMessage ?? 'Pengiriman gagal. Coba lagi sebentar lagi.');
}

// Kartu nama digital agen (AGEN-OMAHE-05) ------------------------------------------

/**
 * Kartu nama digital agen (api-contract §26). Kode berpola salah → `null`
 * (halaman 404 tanpa fetch); kode tak dikenal → 404 Kit dari `apiGet`;
 * gangguan backend → 502 Kit. Fixture HANYA non-produksi (nomor WA fiktif).
 */
export async function getKartuNamaAgen(
	fetchFn: Fetch,
	kodeRaw: string
): Promise<KartuNamaAgen | null> {
	const kode = kodeRaw.trim().toUpperCase();
	if (!KODE_AGEN_PATTERN.test(kode)) return null;
	if (!hasSearchApi()) {
		if (import.meta.env.PROD === true) return null;
		return fixtures.KARTU_NAMA_AGEN[kode] ?? null;
	}
	return apiGet<KartuNamaAgen>(fetchFn, `/public/agen-omahe/kartu/${encodeURIComponent(kode)}`);
}

// Link bayar publik (TAGIHAN-02) ----------------------------------------------

/**
 * Link bayar publik `/public/bayar/:token/*` (api-contract §27) — TIDAK
 * lewat `apiGet`: error di sini BUKAN `error()` Kit melainkan `ApiError`
 * yang statusnya diteruskan proxy `/api/bayar/:token/*` apa adanya ke
 * browser (403 Turnstile invalid, 404 token tak dikenal, 409 tagihan tidak
 * sedang menunggu pembayaran, 429 rate limit, 503 siteverify bermasalah).
 *
 * Gate `hasApi()` (bukan `hasSearchApi()`) — endpoint ini terbit sendiri
 * di TAGIHAN-02, tidak terikat saklar pencarian. Fixture HANYA non-produksi
 * (guard `PROD === true` pola `getVerifikasiAgen`: ter-tree-shake di build
 * produksi, tetap teruji di `bun test`); produksi tanpa API → 503 jujur.
 */
const PESAN_BAYAR_TAK_TERSEDIA = 'Layanan pembayaran belum tersedia. Coba lagi sebentar lagi.';

/** Token pasti salah format → 404 TANPA memanggil backend (backend pun
 *  membalas 404 seragam; ini menghemat rate limit 300/menit). */
function tagihanFixtureBayar(token: string): DetailBayar {
	if (!TOKEN_BAYAR_PATTERN.test(token))
		throw new ApiError(404, 'Link bayar tidak ditemukan atau sudah diganti.');
	const d = fixtures.TAGIHAN_BAYAR[token];
	if (!d) throw new ApiError(404, 'Link bayar tidak ditemukan atau sudah diganti.');
	return d;
}

/** `POST /public/bayar/:token/lihat { turnstile }` → rincian tagihan. */
export async function lihatTagihanBayar(
	fetchFn: Fetch,
	token: string,
	turnstile: string
): Promise<DetailBayar> {
	if (!hasApi()) {
		if (import.meta.env.PROD === true) throw new ApiError(503, PESAN_BAYAR_TAK_TERSEDIA);
		return tagihanFixtureBayar(token);
	}
	let res: Response;
	try {
		res = await fetchFn(`${baseUrl()}/public/bayar/${encodeURIComponent(token)}/lihat`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', accept: 'application/json', ...KONSUMEN },
			body: JSON.stringify({ turnstile }),
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
	} catch {
		throw new ApiError(502, 'Tidak bisa menghubungi server. Coba lagi sebentar lagi.');
	}
	return balasanBayar(res);
}

/**
 * `POST /public/bayar/:token/bukti` multipart `file` + `turnstile`.
 * Validasi tipe/ukuran SUDAH di proxy Omahe (mirror backend) sebelum
 * sampai sini; 409 (bukan “menunggu pembayaran”) diteruskan apa adanya.
 */
export async function kirimBuktiBayar(
	fetchFn: Fetch,
	token: string,
	file: File,
	turnstile: string
): Promise<DetailBayar> {
	if (!hasApi()) {
		if (import.meta.env.PROD === true) throw new ApiError(503, PESAN_BAYAR_TAK_TERSEDIA);
		// Simulasi sukses dev: status pindah ke menunggu verifikasi.
		return { ...tagihanFixtureBayar(token), status: 'menunggu_verifikasi', bisaUnggah: false };
	}
	const form = new FormData();
	form.append('file', file);
	form.append('turnstile', turnstile);
	let res: Response;
	try {
		res = await fetchFn(`${baseUrl()}/public/bayar/${encodeURIComponent(token)}/bukti`, {
			method: 'POST',
			headers: { accept: 'application/json', ...KONSUMEN },
			body: form,
			// Unggah beberapa MB + simpan ke storage — timeout umum (8 dtk) terlalu ketat.
			signal: AbortSignal.timeout(Math.max(TIMEOUT_MS, 30_000))
		});
	} catch {
		throw new ApiError(502, 'Tidak bisa menghubungi server. Coba lagi sebentar lagi.');
	}
	return balasanBayar(res);
}

/** Envelope sukses → data; selain itu `ApiError` status + pesan backend. */
async function balasanBayar(res: Response): Promise<DetailBayar> {
	if (res.ok) {
		const body = (await res.json()) as ApiEnvelope<DetailBayar>;
		if (!body?.data) throw new ApiError(502, PESAN_BAYAR_TAK_TERSEDIA);
		return body.data;
	}
	const pesan = await pesanErrorBackend(res);
	console.error(`[omahe:api] POST /public/bayar/:token → ${res.status}`);
	throw new ApiError(res.status, pesan ?? PESAN_BAYAR_TAK_TERSEDIA);
}

/**
 * `GET /public/bayar/:token/{invoice,kwitansi}.pdf` — TANPA Turnstile
 * (token = kunci). Kwitansi hanya untuk tagihan lunas (backend 409 selain
 * itu); tagihan batal → 409 untuk keduanya. Mengembalikan `Response`
 * mentah (body TIDAK di-buffer) supaya proxy tinggal me-stream-kan; caller
 * yang men-set header final.
 */
export async function unduhDokumenBayar(
	fetchFn: Fetch,
	token: string,
	jenis: 'invoice' | 'kwitansi'
): Promise<Response> {
	if (!hasApi()) {
		if (import.meta.env.PROD === true) throw new ApiError(503, PESAN_BAYAR_TAK_TERSEDIA);
		const d = tagihanFixtureBayar(token); // token tak dikenal → 404 juga di fixture.
		if (jenis === 'kwitansi' && d.status !== 'lunas')
			throw new ApiError(409, 'Kwitansi hanya tersedia untuk tagihan lunas.');
		return new Response(pdfInvoiceContoh(), {
			status: 200,
			headers: {
				'content-type': 'application/pdf',
				'content-disposition': `attachment; filename="${jenis}-contoh.pdf"`
			}
		});
	}
	let res: Response;
	try {
		res = await fetchFn(`${baseUrl()}/public/bayar/${encodeURIComponent(token)}/${jenis}.pdf`, {
			headers: { accept: 'application/pdf', ...KONSUMEN },
			signal: AbortSignal.timeout(Math.max(TIMEOUT_MS, 20_000))
		});
	} catch {
		throw new ApiError(502, 'Tidak bisa menghubungi server. Coba lagi sebentar lagi.');
	}
	if (res.ok) return res;
	const pesan = await pesanErrorBackend(res);
	console.error(`[omahe:api] GET /public/bayar/:token/${jenis}.pdf → ${res.status}`);
	throw new ApiError(res.status, pesan ?? 'Dokumen tidak dapat diunduh.');
}

// ---------------------------------------------------------------------------
// LELANG-01 — rumah lelang
// ---------------------------------------------------------------------------

/**
 * Daftar rumah lelang yang AKAN datang. Backend tanpa fitur `lelang`
 * (instance lain / belum dinyalakan) membalas 404 → diperlakukan daftar
 * kosong, bukan error. Mode fixture → kosong.
 */
export async function getLelang(
	fetchFn: Fetch,
	query: LelangQuery = {}
): Promise<
	Paginated<RumahLelangKartu> & { lokasi: Omit<LokasiLelang, 'jumlah' | 'prioritas'> | null }
> {
	const page = Math.max(1, query.page ?? 1);
	const pageSize = Math.min(48, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));
	const kosong = { items: [], meta: { total: 0, page, pageSize }, lokasi: null };
	if (!hasSearchApi()) return kosong;
	const params = new URLSearchParams();
	for (const [k, v] of Object.entries({ ...query, page, pageSize })) {
		if (v !== undefined && v !== '') params.set(k, String(v));
	}
	const url = `${baseUrl()}/public/lelang?${params}`;
	const res = await fetchFn(url, {
		headers: { accept: 'application/json', ...KONSUMEN },
		signal: AbortSignal.timeout(TIMEOUT_MS)
	});
	if (res.status === 404) return kosong;
	if (!res.ok) {
		console.error(`[omahe:api] GET ${url} → ${res.status}`);
		error(502, 'Data sedang tidak bisa dimuat. Coba lagi sebentar lagi.');
	}
	const body = (await res.json()) as {
		data: RumahLelangKartu[];
		meta: PageMeta & { lokasi?: Omit<LokasiLelang, 'jumlah' | 'prioritas'> | null };
	};
	return { items: body.data, meta: body.meta, lokasi: body.meta.lokasi ?? null };
}

/** LELANG-03 — kabupaten ber-rumah-lelang tayang (fail-soft → []). */
export async function getLokasiLelang(fetchFn: Fetch): Promise<LokasiLelang[]> {
	if (!hasSearchApi()) return [];
	try {
		const res = await fetchFn(`${baseUrl()}/public/lelang/lokasi`, {
			headers: { accept: 'application/json', ...KONSUMEN },
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		if (!res.ok) return [];
		return ((await res.json()) as { data: LokasiLelang[] }).data;
	} catch {
		return [];
	}
}

/** Bank yang punya rumah lelang tampil (opsi filter) — fail-soft `[]`. */
export async function getBankLelang(fetchFn: Fetch): Promise<{ id: string; nama: string }[]> {
	if (!hasSearchApi()) return [];
	try {
		const res = await fetchFn(`${baseUrl()}/public/lelang/bank`, {
			headers: { accept: 'application/json', ...KONSUMEN },
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		if (!res.ok) return [];
		return ((await res.json()) as { data: { id: string; nama: string }[] }).data;
	} catch {
		return [];
	}
}

/** Detail rumah lelang (404 → halaman 404). */
export async function getLelangDetail(fetchFn: Fetch, slug: string): Promise<RumahLelangDetail> {
	if (!hasSearchApi()) error(404, 'Halaman tidak ditemukan.');
	return apiGet<RumahLelangDetail>(fetchFn, `/public/lelang/${encodeURIComponent(slug)}`);
}

/** Form minat rumah lelang → `POST /public/lelang/:slug/minat`. */
export async function kirimMinatLelang(
	fetchFn: Fetch,
	slug: string,
	input: { nama: string; telepon: string; pesan?: string; website?: string }
): Promise<void> {
	if (!hasSearchApi()) return;
	let res: Response;
	try {
		res = await fetchFn(`${baseUrl()}/public/lelang/${encodeURIComponent(slug)}/minat`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', accept: 'application/json', ...KONSUMEN },
			body: JSON.stringify(input),
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
	} catch {
		throw new ApiError(502, 'Tidak bisa menghubungi server. Coba lagi sebentar lagi.');
	}
	if (res.ok) return;
	const pesan = await pesanErrorBackend(res);
	throw new ApiError(res.status, pesan ?? 'Pengiriman gagal. Coba lagi sebentar lagi.');
}
