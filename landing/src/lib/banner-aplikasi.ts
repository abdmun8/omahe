/**
 * Banner "Pasang aplikasi Omahe" (Android) — padanan Smart App Banner iOS
 * yang TIDAK disediakan Android secara bawaan. Logika murni di sini (dites
 * `bun test`), komponen `banner-aplikasi.svelte` hanya merangkai.
 *
 * Banner tampil hanya bila SEMUA terpenuhi:
 * - perangkat Android (bukan iPhone/desktop — Omahe belum punya app iOS);
 * - BUKAN sedang di dalam aplikasi Omahe sendiri (TWA bubblewrap);
 * - aplikasi belum terpasang (`navigator.getInstalledRelatedApps`, Chrome
 *   Android; browser lain tidak mendukung → dianggap belum terpasang);
 * - belum ditutup pengunjung dalam 30 hari terakhir.
 */

/** Paket aplikasi Play Store (TWA, PLAY-01) — sama dengan `assetlinks.json`
 *  dan `related_applications` di `manifest.webmanifest`. */
export const PAKET_APLIKASI = 'id.co.omahe.app.twa';

const KUNCI_TUTUP = 'omahe:banner-aplikasi:tutup';
const KUNCI_DI_APLIKASI = 'omahe:di-aplikasi';
export const JEDA_TUTUP_MS = 30 * 24 * 60 * 60 * 1000;

export function apakahAndroid(userAgent: string): boolean {
	return /Android/i.test(userAgent);
}

/**
 * Di dalam aplikasi Omahe? TWA membuka halaman pertama dengan
 * `document.referrer = android-app://<paket>` — HANYA di muatan pertama, jadi
 * hasil positif disimpan di sessionStorage untuk muat ulang berikutnya dalam
 * sesi yang sama. `display-mode: standalone` menutup kasus sisanya (TWA &
 * PWA terpasang sama-sama standalone — keduanya tidak perlu banner).
 */
export function diDalamAplikasi(opsi: {
	referrer: string;
	standalone: boolean;
	storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
}): boolean {
	const dariTwa = opsi.referrer.startsWith(`android-app://${PAKET_APLIKASI}`);
	if (dariTwa) {
		try {
			opsi.storage?.setItem(KUNCI_DI_APLIKASI, '1');
		} catch {
			// Storage diblokir — cukup hasil untuk muatan ini.
		}
		return true;
	}
	if (opsi.standalone) return true;
	try {
		return opsi.storage?.getItem(KUNCI_DI_APLIKASI) === '1';
	} catch {
		return false;
	}
}

/** Masih dalam jeda 30 hari setelah ditutup? Nilai rusak/storage error → false. */
export function masihDitutup(
	storage: Pick<Storage, 'getItem'> | null | undefined,
	now: number
): boolean {
	try {
		const t = Number(storage?.getItem(KUNCI_TUTUP));
		return Number.isFinite(t) && t > 0 && now - t < JEDA_TUTUP_MS;
	} catch {
		return false;
	}
}

export function simpanDitutup(
	storage: Pick<Storage, 'setItem'> | null | undefined,
	now: number
): void {
	try {
		storage?.setItem(KUNCI_TUTUP, String(now));
	} catch {
		// Storage diblokir — banner tertutup untuk kunjungan ini saja.
	}
}

type RelatedApp = { platform?: string; id?: string };
type NavigatorRelated = { getInstalledRelatedApps?: () => Promise<RelatedApp[]> };

/**
 * `true` terpasang, `false` belum, `null` tidak bisa dicek (browser tidak
 * mendukung / error). Pemanggil memperlakukan `null` seperti belum terpasang.
 */
export async function cekTerpasang(nav: NavigatorRelated): Promise<boolean | null> {
	if (typeof nav.getInstalledRelatedApps !== 'function') return null;
	try {
		const apps = await nav.getInstalledRelatedApps();
		return apps.some((a) => a.id === PAKET_APLIKASI);
	} catch {
		return null;
	}
}

/** Halaman yang TIDAK menampilkan banner (alur sensitif/fokus). */
export function halamanTanpaBanner(pathname: string): boolean {
	return pathname.startsWith('/bayar/') || pathname.startsWith('/q/');
}

/**
 * URL Play Store + install referrer (terbaca di Play Console → Akuisisi),
 * supaya pemasangan dari banner situs bisa diukur.
 */
export function urlPasang(playStoreUrl: string): string {
	const url = new URL(playStoreUrl);
	url.searchParams.set(
		'referrer',
		'utm_source=omahe.co.id&utm_medium=banner&utm_campaign=pasang_aplikasi'
	);
	return url.toString();
}

/**
 * Varian teks banner — dipilih ACAK per sesi kunjungan (tetap sama selama
 * sesi, bisa berganti di kunjungan berikutnya). Varian dicatat di event GA4
 * (`varian`) supaya varian yang paling banyak diklik bisa dibandingkan.
 * Varian agen mengarah ke pendaftaran agen (rekrutmen), varian pembeli ke
 * Play Store. Klaim komisi WAJIB "hingga" (3% tanpa sponsor, 2,9% bersponsor,
 * hanya perumahan Program Omahe — KOMISI-AGEN-01).
 */
export type VarianBanner = {
	id: 'pembeli' | 'agen_uang' | 'agen_komisi';
	judul: string;
	sub: string;
	tombol: string;
	tujuan: 'play' | 'gabung_agen';
};

export const VARIAN_BANNER: readonly VarianBanner[] = [
	{
		id: 'pembeli',
		judul: 'Aplikasi Omahe',
		sub: 'Gratis di Google Play',
		tombol: 'Pasang',
		tujuan: 'play'
	},
	{
		id: 'agen_uang',
		judul: 'Mau dapat uang dari properti?',
		sub: 'Jadi agen Omahe, gratis',
		tombol: 'Daftar',
		tujuan: 'gabung_agen'
	},
	{
		id: 'agen_komisi',
		judul: 'Komisi hingga 3% per rumah',
		sub: 'Jadi agen Omahe, gratis',
		tombol: 'Daftar',
		tujuan: 'gabung_agen'
	}
];

const KUNCI_VARIAN = 'omahe:banner-aplikasi:varian';

/**
 * Pilih varian: di halaman `/gabung…` selalu varian pembeli (pengunjung
 * sudah di halaman pendaftaran — ajakan "jadi agen" berulang tidak berguna);
 * selain itu varian sesi tersimpan, atau acak baru bila belum ada/rusak.
 */
export function pilihVarian(
	pathname: string,
	acak: () => number,
	storage: Pick<Storage, 'getItem' | 'setItem'> | null | undefined
): VarianBanner {
	const pembeli = VARIAN_BANNER[0]!;
	if (pathname === '/gabung' || pathname.startsWith('/gabung/')) return pembeli;
	try {
		const tersimpan = VARIAN_BANNER.find((v) => v.id === storage?.getItem(KUNCI_VARIAN));
		if (tersimpan) return tersimpan;
	} catch {
		// Storage diblokir — acak untuk muatan ini saja.
	}
	const idx = Math.min(VARIAN_BANNER.length - 1, Math.floor(acak() * VARIAN_BANNER.length));
	const varian = VARIAN_BANNER[Math.max(0, idx)]!;
	try {
		storage?.setItem(KUNCI_VARIAN, varian.id);
	} catch {
		// abaikan
	}
	return varian;
}

/** Tujuan tombol per varian. */
export function hrefVarian(varian: VarianBanner, playStoreUrl: string): string {
	return varian.tujuan === 'play' ? urlPasang(playStoreUrl) : '/gabung/agen';
}
