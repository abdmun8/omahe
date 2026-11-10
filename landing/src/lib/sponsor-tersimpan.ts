/**
 * AGEN-OMAHE-10 — kode SPONSOR agen tersimpan 90 hari, browser saja
 * (localStorage), kunci tunggal `omahe:sponsor`. Pola `ref-tersimpan.ts`.
 *
 * Motivasi: agen membagikan link referral
 * `https://www.omahe.co.id/gabung/agen?sponsor=OMHA-A0001` ke kenalannya
 * (ibu pengajian/pensiunan — sering lihat dulu, daftar BERHARI-HARI kemudian
 * lewat Google tanpa query string). Tanpa penyimpanan ini sponsor hilang dan
 * atribusi referral 1 tingkat agen tidak tercatat.
 *
 * DIPISAH total dari `ref` (`omahe:ref:*`): `?ref=` adalah atribusi PEMBELI
 * (AO-…/OP-…/hex kerjasama, dibaca root layout) — `?sponsor=` adalah
 * atribusi AGEN saat mendaftar. Mencampur keduanya bisa memindahkan komisi
 * pembeli (epic §Link referral sponsor), jadi modul ini TIDAK menyentuh
 * `ref` sama sekali.
 *
 * Aturan LAST-TOUCH: `?sponsor=` yang ada di URL selalu menimpa nilai
 * tersimpan. Semua akses localStorage dalam try/catch (mode privat/Safari
 * terblokir → sponsor hilang, halaman tidak boleh jatuh).
 */
import { REF_AGEN_PRIBADI_PATTERN } from './ref-pola';
import { ambilRefGlobal } from './ref-tersimpan';

/** Masa simpan 90 hari — sama dengan ref (KERJASAMA-02). */
const MASA_MS = 90 * 24 * 60 * 60 * 1000;

/** Satu-satunya kunci — sponsor lintas perumahan/global untuk agen. */
const KUNCI = 'omahe:sponsor';

/**
 * Bentuk kode sponsor yang diterima: `[A-Z0-9-]` maks 20 (pola `OMHA-A0001`).
 * Diuji SETELAH trim + uppercase — jadi `omha-a0001` dari tautan yang
 * dihitung orang diterima sebagai `OMHA-A0001`.
 */
export const SPONSOR_PATTERN = /^[A-Z0-9-]{1,20}$/;

/**
 * Normalisasi input sponsor dari URL: trim, uppercase, lalu harus cocok
 * penuh `SPONSOR_PATTERN`. Selain itu (spasi di tengah, karakter aneh,
 * > 20 char, kosong) → `null` / diabaikan — nilai URL tidak pernah
 * dipercaya dan tidak boleh menyelundupkan apa pun ke tautan CTA.
 */
export function normalisasiSponsor(raw: string | null | undefined): string | null {
	if (typeof raw !== 'string') return null;
	const rapi = raw.trim().toUpperCase();
	return SPONSOR_PATTERN.test(rapi) ? rapi : null;
}

interface MetaSponsor {
	sponsor: string;
	exp: number;
}

/** Simpan sponsor (LAST-TOUCH — menimpa), kedaluwarsa `now` + 90 hari.
 *  Input tak lolos normalisasi diabaikan. */
export function simpanSponsor(raw: string | null | undefined, now: number = Date.now()): void {
	const sponsor = normalisasiSponsor(raw);
	if (!sponsor) return;
	try {
		localStorage.setItem(KUNCI, JSON.stringify({ sponsor, exp: now + MASA_MS }));
	} catch {
		// Storage penuh/diblokir — atribusi sponsor hilang diam-diam.
	}
}

/** Ambil sponsor tersimpan — `null` bila tidak ada/kedaluwarsa/rusak
 *  (entri basi selalu dihapus supaya tidak menggantung). */
export function ambilSponsor(now: number = Date.now()): string | null {
	let raw: string | null;
	try {
		raw = localStorage.getItem(KUNCI);
	} catch {
		return null;
	}
	if (raw === null) return null;

	let meta: MetaSponsor | null = null;
	try {
		const data = JSON.parse(raw) as MetaSponsor;
		if (
			typeof data?.sponsor === 'string' &&
			SPONSOR_PATTERN.test(data.sponsor) &&
			typeof data?.exp === 'number' &&
			Number.isFinite(data.exp) &&
			data.exp > now
		) {
			meta = data;
		}
	} catch {
		// JSON rusak — jatuh ke penghapusan di bawah.
	}
	if (!meta) {
		try {
			localStorage.removeItem(KUNCI);
		} catch {
			// abaikan — entri basi akan ditimpa percobaan berikutnya.
		}
		return null;
	}
	return meta.sponsor;
}

/**
 * Logika halaman `/gabung/agen` (browser saja, dipanggil dalam `$effect`):
 * LAST-TOUCH — `?sponsor=` di URL (setelah dinormalisasi) menimpa nilai
 * tersimpan; tanpa sponsor di URL → pakai yang tersimpan.
 *
 * REF-AGEN-01 — fallback TERAKHIR: ref GLOBAL berbentuk kode agen pribadi
 * (link pribadi `?ref=OMHA-…` dua fungsi — pembeli & calon agen). Urutan
 * prioritas: `?sponsor=` > sponsor tersimpan > ref global kode agen; dua
 * yang pertama TETAP menang (link `?sponsor=` yang sudah tersebar tidak
 * berubah perilaku). Ref global HANYA dibaca — tidak dikopi ke kunci
 * `omahe:sponsor` (modul ini tetap tidak menulis kunci `omahe:ref:*`),
 * jadi sponsor efektif mengikuti last-touch ref global secara alami.
 * Diekstrak supaya bisa diuji langsung tanpa jsdom.
 */
export function sponsorEfektif(
	sponsorUrl: string | null | undefined,
	now: number = Date.now()
): string | null {
	const dariUrl = normalisasiSponsor(sponsorUrl);
	if (dariUrl) {
		simpanSponsor(dariUrl, now);
		return dariUrl;
	}
	const tersimpan = ambilSponsor(now);
	if (tersimpan) return tersimpan;
	const global = ambilRefGlobal(now);
	if (global && REF_AGEN_PRIBADI_PATTERN.test(global.ref)) return global.ref;
	return null;
}
