/**
 * Urutan acak harian per pengunjung (tab "Semua" `/mitra`, 2026-11-14).
 *
 * Setiap pengunjung punya id acak di cookie `omahe_acak` (1 tahun). Benih =
 * hash(id + tanggal WIB) → urutan STABIL sepanjang hari untuk pengunjung itu
 * (reload tidak mengocok ulang), berganti esok hari, dan berbeda antar
 * pengunjung — semua agen/mitra kebagian tampil di cuplikan 4 teratas.
 * Murni (tanpa I/O) supaya mudah dites.
 */

export const COOKIE_ACAK = 'omahe_acak';
/** Pola id cookie yang diterima — nilai lain (dirusak/kosong) diganti baru. */
export const POLA_ID_ACAK = /^[a-z0-9-]{8,64}$/i;

/** Tanggal kalender WIB (UTC+7) `YYYY-MM-DD`. */
export function tanggalWib(now: Date): string {
	return new Date(now.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Hash FNV-1a 32-bit. */
function fnv1a(s: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

/** Benih harian dari id pengunjung + tanggal WIB (+ garam per bagian). */
export function benihHarian(id: string, now: Date, garam = ''): number {
	return fnv1a(`${id}|${tanggalWib(now)}|${garam}`);
}

/** Benih turunan per bagian (mis. slug kategori) dari benih harian. */
export function benihBagian(benih: number, garam: string): number {
	return (benih ^ fnv1a(garam)) >>> 0;
}

/** Jumlah kartu per bagian di tab "Semua" `/mitra`. */
export const CUPLIKAN_PER_BAGIAN = 4;

/** PRNG mulberry32 — deterministik untuk benih yang sama. */
function mulberry32(benih: number): () => number {
	let a = benih >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Kocok (Fisher–Yates) salinan `daftar` dengan benih — input tidak diubah. */
export function kocok<T>(daftar: readonly T[], benih: number): T[] {
	const hasil = [...daftar];
	const acak = mulberry32(benih);
	for (let i = hasil.length - 1; i > 0; i--) {
		const j = Math.floor(acak() * (i + 1));
		[hasil[i], hasil[j]] = [hasil[j], hasil[i]];
	}
	return hasil;
}

/**
 * Ambil `n` item acak. `utama` (opsional) = item yang didahulukan — dipakai
 * agen berpromosi (prioritas berbayar tetap dihormati: promo dikocok di
 * antara sesamanya dulu, sisanya baru diisi item biasa yang dikocok).
 */
export function cuplikanAcak<T>(
	daftar: readonly T[],
	n: number,
	benih: number,
	utama: (x: T) => boolean = () => false
): T[] {
	const depan = kocok(
		daftar.filter((x) => utama(x)),
		benih
	);
	const belakang = kocok(
		daftar.filter((x) => !utama(x)),
		benih ^ 0x9e3779b9
	);
	return [...depan, ...belakang].slice(0, n);
}
