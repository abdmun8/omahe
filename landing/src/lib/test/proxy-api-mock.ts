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
 * proxy mana pun (`createLead` + `kirimMinatAgen` + `ApiError`) — file
 * test baru yang butuh nama lain HARUS ditambahkan ke sini, bukan membuat
 * mock.module sendiri. Kelas `ApiErrorTiruan` dibagikan supaya cek
 * `err instanceof ApiError` di handler kena walau registrasi mock
 * terakhir datang dari file lain.
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

/** Pasang mock `$lib/api` — panggil SEBELUM `await import('./+server')`. */
export function pasangMockLibApi(): void {
	mock.module('$lib/api', () => ({
		ApiError: ApiErrorTiruan,
		createLead: createLeadMock,
		kirimMinatAgen: kirimMinatAgenMock
	}));
}
