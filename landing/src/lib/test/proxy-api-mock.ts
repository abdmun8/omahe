/**
 * Mock `$lib/api` BERSAMA untuk test proxy `/api/*` (bun test).
 *
 * PELAJARAN CI (lihat CLAUDE.md repo omahe): `mock.module` BOCOR antar
 * file test — bun memakai satu registry modul untuk semua file dalam satu
 * proses `bun test`, dan pendaftaran mock terakhir menang untuk import
 * yang sedang in-flight. Dua file proxy yang masing-masing me-mock
 * `$lib/api` dengan export BERBEDA saling meniadakan → `SyntaxError:
 * Export named '…' not found`.
 *
 * Karena itu mock ini WAJIB mengeksport SEMUA nama yang dipakai handler
 * mana pun (`createLead` + `kirimMinatAgen` + `ApiError`, + `getKerjasamaQr`
 * untuk route `/q/[kode]` — KERJASAMA-02; + `getAgenSaya`/`inputLeadAgen`
 * untuk proxy `/api/saya` & `/api/agen-lead` — SESI-OMAHE-01; + `getEstimasiKomisiAgen`
 * untuk `/api/agen-komisi` — KOMISI-AGEN-01; + `getUnitTersediaAgen`/`inputBookingAgen`
 * untuk `/api/agen-unit` & `/api/agen-booking` — AGEN-OMAHE-11; + `getNamaAgenPribadi`
 * untuk `/api/agen-nama/[kode]` — REF-AGEN-01) — file test
 * baru yang butuh nama lain HARUS ditambahkan ke sini, bukan membuat
 * mock.module sendiri. Kelas
 * `ApiErrorTiruan` dibagikan supaya cek `err instanceof ApiError` di handler
 * kena walau registrasi mock terakhir datang dari file lain.
 */
import { mock } from 'bun:test';

/** Tiruan `ApiError` — `status` + `message`, dipakai handler proxy. */
export class ApiErrorTiruan extends Error {
	readonly status: number;
	constructor(status: number, message: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

export const createLeadMock = mock<
	(fetchFn: typeof fetch, input: unknown) => Promise<{ whatsapp: string | null }>
>(async () => ({ whatsapp: null }));

export const kirimMinatAgenMock = mock<
	(fetchFn: typeof fetch, input: unknown) => Promise<{ whatsapp: string | null }>
>(async () => ({ whatsapp: null }));

/** KERJASAMA-02/03 — resolve kode QR pendek untuk route `/q/[kode]` (union dua jenis). */
export type KerjasamaQrMock =
	| { jenis: 'perumahan'; perumahanSlug: string; ref: string }
	| { jenis: 'omahe'; perumahanSlug: null; ref: string; namaPerusahaan: string };

export const getKerjasamaQrMock = mock<
	(fetchFn: typeof fetch, kode: unknown) => Promise<KerjasamaQrMock | null>
>(async (): Promise<KerjasamaQrMock | null> => null);

/** SESI-OMAHE-01 — agen dari sesi untuk proxy `/api/saya`. */
export const getAgenSayaMock = mock<
	(fetchFn: typeof fetch, cookieHeader: string | null) => Promise<unknown>
>(async () => null);

/** AGEN-OMAHE-11 — input lead agen untuk proxy `/api/agen-lead`. */
export const inputLeadAgenMock = mock<
	(fetchFn: typeof fetch, cookieHeader: string | null, input: unknown) => Promise<unknown>
>(async () => ({}));

/** KOMISI-AGEN-01 — estimasi komisi agen untuk proxy `/api/agen-komisi`. */
export const getEstimasiKomisiAgenMock = mock<
	(
		fetchFn: typeof fetch,
		cookieHeader: string | null,
		slug: string,
		tipeSlug?: string
	) => Promise<unknown>
>(async () => null);

/** AGEN-OMAHE-11 iterasi 3 — unit tersedia & booking agen (`/api/agen-unit`, `/api/agen-booking`). */
export const getUnitTersediaAgenMock = mock<
	(fetchFn: typeof fetch, cookieHeader: string | null, slug: string) => Promise<unknown>
>(async () => []);
export const inputBookingAgenMock = mock<
	(fetchFn: typeof fetch, cookieHeader: string | null, input: unknown) => Promise<unknown>
>(async () => ({}));

/** REF-AGEN-01 — nama agen pribadi untuk proxy `/api/agen-nama/[kode]` (fail-soft null). */
export const getNamaAgenPribadiMock = mock<
	(fetchFn: typeof fetch, kode: string) => Promise<string | null>
>(async () => null);

/** Pasang mock `$lib/api` — panggil SEBELUM `await import('./+server')`. */
export function pasangMockLibApi(): void {
	mock.module('$lib/api', () => ({
		ApiError: ApiErrorTiruan,
		createLead: createLeadMock,
		kirimMinatAgen: kirimMinatAgenMock,
		getKerjasamaQr: getKerjasamaQrMock,
		getAgenSaya: getAgenSayaMock,
		inputLeadAgen: inputLeadAgenMock,
		getEstimasiKomisiAgen: getEstimasiKomisiAgenMock,
		getUnitTersediaAgen: getUnitTersediaAgenMock,
		inputBookingAgen: inputBookingAgenMock,
		getNamaAgenPribadi: getNamaAgenPribadiMock
	}));
}
