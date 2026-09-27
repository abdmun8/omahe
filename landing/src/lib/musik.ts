/**
 * ADMIN-07 — preferensi musik latar pengunjung (per browser). `'mati'` =
 * pengunjung pernah mematikan musik → jangan mulai otomatis lagi di
 * kunjungan berikutnya. Semua akses storage dibungkus try/catch: mode
 * privat / storage diblokir tidak boleh menjatuhkan halaman (musik tetap
 * bisa diputar manual).
 */
export const KUNCI_PREFERENSI_MUSIK = 'omahe-musik';

export type PreferensiMusik = 'nyala' | 'mati';

export function bacaPreferensiMusik(storage: Pick<Storage, 'getItem'> | null): PreferensiMusik {
	try {
		return storage?.getItem(KUNCI_PREFERENSI_MUSIK) === 'mati' ? 'mati' : 'nyala';
	} catch {
		return 'nyala';
	}
}

export function simpanPreferensiMusik(
	storage: Pick<Storage, 'setItem'> | null,
	nilai: PreferensiMusik
): void {
	try {
		storage?.setItem(KUNCI_PREFERENSI_MUSIK, nilai);
	} catch {
		// Storage tidak tersedia — preferensi hanya berlaku di halaman ini.
	}
}

/** URL musik dari API harus http(s) — selain itu dianggap tidak ada. */
export function musikValid(v: unknown): { url: string; judul: string } | null {
	if (!v || typeof v !== 'object') return null;
	const m = v as { url?: unknown; judul?: unknown };
	if (typeof m.url !== 'string' || !/^https?:\/\//.test(m.url)) return null;
	return { url: m.url, judul: typeof m.judul === 'string' ? m.judul : '' };
}
