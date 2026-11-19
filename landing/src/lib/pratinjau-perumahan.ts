/**
 * SHARE-02 — susun pratinjau tautan perumahan (og:title/og:description dan
 * kartu gambar OG `/perumahan/<slug>/og.jpg`).
 *
 * MODUL MURNI — tanpa I/O (tanpa fetch/fs), bisa diimpor browser (komponen
 * halaman) maupun server (route gambar OG). Semua keputusan promosi di sini
 * SATU pintu supaya teks meta dan gambar OG tidak pernah beda:
 *
 * - `poinKeunggulan`: field `keunggulan` perumahan (maks 3); kosong → 3 label
 *   pertama section `facilities` builder; tetap kosong → [].
 * - `badgePromo` (maks 3, urut): "DP 0%*" (programOmahe.dp0) → "Cashback
 *   Rp…" (programOmahe.cashback, DISEMBUNYIKAN bila `ref` agen —
 *   `refTanpaCashback`, aturan KOMISI-OMAHE-02/04) → `promoAktif[].judul`
 *   (dipotong 40 karakter dengan "…").
 * - `judul`: "<nama> — <kab/kota> · mulai Rp…" (halaman tipe: "<tipe> di
 *   <nama> · mulai Rp…"), bagian kosong dilewati, maks ~90 karakter.
 * - `deskripsi`: promo dulu, lalu keunggulan ("✓ SHM · ✓ 5 menit ke tol"),
 *   lalu "<N> unit tersedia", lalu cuplikan deskripsi (`cuplikanDeskripsi`
 *   — teks POLOS, tanpa markdown/HTML) sepanjang muat. Maks 200 karakter,
 *   dipotong di batas kata dengan "…".
 *
 * Semua teks dari input dibersihkan (tag HTML dilucuti, spasi dirapikan) —
 * pratinjau tidak pernah meng-echo markup mentah dari data admin/query URL.
 */
import type { LandingSection, PromoAktif, ProgramOmahe } from '$lib/api/types';
import { cuplikanDeskripsi } from '$lib/markdown';
import { refTanpaCashback } from '$lib/ref-pola';
import { SITE } from '$lib/config';
import { formatRupiah } from '$lib/utils';

const MAKS_JUDUL = 90;
const MAKS_DESKRIPSI = 200;
const MAKS_POIN = 3;
const MAKS_BADGE = 3;
const MAKS_JUDUL_PROMO = 40;

/** Subjek pratinjau — `PerumahanDetail` penuh ATAU potongan `TipeDetail.perumahan`. */
export interface PratinjauPerumahanInput {
	nama: string;
	slug: string;
	regionNama?: string | null;
	kecamatanNama?: string | null;
	provinsiNama?: string | null;
	/**
	 * Deskripsi (Markdown tenant) untuk cuplikan meta — opsional: potongan
	 * `TipeDetail.perumahan` tidak memilikinya (halaman tipe memakai timpaan
	 * `deskripsi` di argumen `susunPratinjauPerumahan`).
	 */
	deskripsi?: string | null;
	keunggulan?: string[] | null;
	promoAktif?: PromoAktif[] | null;
	programOmahe?: ProgramOmahe | null;
	sections?: LandingSection[] | null;
}

/** Varian halaman tipe — harga & stok dari tipe, bukan agregat perumahan. */
export interface PratinjauTipe {
	nama: string;
	hargaMin?: number | null;
	unitTersedia?: number | null;
}

/** Minimal yang dibutuhkan dari `UnitListing` — mudah di-mock di test. */
export interface PratinjauUnit {
	hargaMin: number | null;
	unitTersedia: number;
}

export interface Pratinjau {
	judul: string;
	deskripsi: string;
	poinKeunggulan: string[];
	badgePromo: string[];
	hargaMulai: number | null;
	lokasiPendek: string | null;
}

/** Bersihkan teks bebas (input admin/URL) → teks polos satu baris. */
function bersihkan(teks: unknown): string {
	if (typeof teks !== 'string') return '';
	return teks
		.replace(/<[^>]*>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Potong `teks` di maks karakter pada batas kata terakhir, ditutup "…".
 * Teks lebih pendek dilewati apa adanya (sudah dibersihkan `bersihkan`).
 */
function potongTeks(teks: string, maks: number): string {
	if (teks.length <= maks) return teks;
	const potong = teks.slice(0, maks - 1);
	const batasKata = potong.lastIndexOf(' ');
	return (batasKata > 0 ? potong.slice(0, batasKata) : potong).trimEnd() + '…';
}

/** "Kab. Bogor, Jawa Barat" → "Kab. Bogor" (fallback kecamatan, null = kosong). */
function susunLokasiPendek(perumahan: PratinjauPerumahanInput): string | null {
	const region = bersihkan(perumahan.regionNama);
	if (region) {
		const kabKota = region.split(',')[0]?.trim();
		if (kabKota) return kabKota;
	}
	return bersihkan(perumahan.kecamatanNama) || null;
}

/** Harga mulai perumahan = termurah `hargaMin` tipe yang tersedia. */
function hargaMulaiDariUnit(tipeUnit: PratinjauUnit[]): number | null {
	const harga = tipeUnit
		.map((u) => u.hargaMin)
		.filter((h): h is number => typeof h === 'number' && Number.isFinite(h));
	return harga.length > 0 ? Math.min(...harga) : null;
}

/** Keunggulan: field asli → fallback label section Fasilitas → []. */
function susunKeunggulan(perumahan: PratinjauPerumahanInput): string[] {
	const asli = (perumahan.keunggulan ?? []).map(bersihkan).filter(Boolean).slice(0, MAKS_POIN);
	if (asli.length > 0) return asli;
	// `enabled:false` sudah difilter server — cek tetap dilakukan karena
	// helper murni bisa menerima data apa pun (bukan hanya output client).
	const fasilitas = perumahan.sections?.find((s) => s.type === 'facilities' && s.enabled !== false);
	if (!fasilitas || fasilitas.type !== 'facilities') return [];
	return fasilitas.props.items
		.map((item) => bersihkan(item.label))
		.filter(Boolean)
		.slice(0, MAKS_POIN);
}

/** Badge promo (maks 3) — urutan keputusan arsitek lihat komentar file. */
function susunBadgePromo(perumahan: PratinjauPerumahanInput, ref: string | null): string[] {
	const badges: string[] = [];
	const program = perumahan.programOmahe;
	if (program?.dp0) badges.push('DP 0%*');
	if (program?.cashback && !refTanpaCashback(ref)) {
		badges.push(`Cashback ${formatRupiah(program.cashback)}`);
	}
	for (const promo of perumahan.promoAktif ?? []) {
		if (badges.length >= MAKS_BADGE) break;
		const judul = bersihkan(promo?.judul);
		if (!judul) continue;
		badges.push(potongTeks(judul, MAKS_JUDUL_PROMO));
	}
	return badges;
}

/** "<nama> — <kab/kota> · mulai Rp…" / tipe: "<tipe> di <nama> · mulai Rp…". */
function susunJudul(
	nama: string,
	lokasiPendek: string | null,
	hargaMulai: number | null,
	tipe: PratinjauTipe | undefined
): string {
	const harga = hargaMulai !== null ? `mulai ${formatRupiah(hargaMulai)}` : null;
	const namaBersih = bersihkan(nama);
	const judul = tipe
		? [`${bersihkan(tipe.nama)} di ${namaBersih}`, harga].filter(Boolean).join(' · ')
		: [[namaBersih, lokasiPendek].filter(Boolean).join(' — '), harga].filter(Boolean).join(' · ');
	return potongTeks(judul, MAKS_JUDUL);
}

/**
 * Deskripsi pratinjau: promo → keunggulan → jumlah unit → cuplikan deskripsi
 * sepanjang muat (potongTeks memotong 200 di batas kata, "…").
 */
function susunDeskripsi(
	perumahan: PratinjauPerumahanInput,
	poinKeunggulan: string[],
	badgePromo: string[],
	jumlahUnit: number | null
): string {
	const segmen: string[] = [];
	if (badgePromo.length > 0) segmen.push(`Promo: ${badgePromo.join(' · ')}`);
	if (poinKeunggulan.length > 0) segmen.push(poinKeunggulan.map((p) => `✓ ${p}`).join(' · '));
	if (jumlahUnit !== null && jumlahUnit > 0) segmen.push(`${jumlahUnit} unit tersedia`);
	const dasar = segmen.join(' · ');

	const cuplikan = perumahan.deskripsi
		? bersihkan(cuplikanDeskripsi(perumahan.deskripsi, MAKS_DESKRIPSI))
		: '';
	if (!dasar) return cuplikan ? potongTeks(cuplikan, MAKS_DESKRIPSI) : '';
	if (!cuplikan) return potongTeks(dasar, MAKS_DESKRIPSI);
	return potongTeks(`${dasar} · ${cuplikan}`, MAKS_DESKRIPSI);
}

/**
 * Pintu masuk utama — panggil dari halaman detail/tipe (`+page.svelte`) dan
 * route gambar OG dengan data yang SAMA supaya meta & gambar konsisten.
 */
export function susunPratinjauPerumahan({
	perumahan,
	tipeUnit,
	ref,
	tipe,
	deskripsi
}: {
	perumahan: PratinjauPerumahanInput;
	tipeUnit: PratinjauUnit[];
	ref: string | null;
	tipe?: PratinjauTipe;
	/** SHARE-02 — timpa deskripsi (halaman tipe memakai deskripsi tipe). */
	deskripsi?: string | null;
}): Pratinjau {
	const sumber = deskripsi !== undefined ? { ...perumahan, deskripsi } : perumahan;
	const poinKeunggulan = susunKeunggulan(sumber);
	const badgePromo = susunBadgePromo(sumber, ref);
	const lokasiPendek = susunLokasiPendek(sumber);
	const hargaMulai = tipe ? (tipe.hargaMin ?? null) : hargaMulaiDariUnit(tipeUnit);
	const jumlahUnit = tipe ? (tipe.unitTersedia ?? null) : jumlahUnitDariUnit(tipeUnit);
	return {
		judul: susunJudul(sumber.nama, lokasiPendek, hargaMulai, tipe),
		deskripsi: susunDeskripsi(sumber, poinKeunggulan, badgePromo, jumlahUnit),
		poinKeunggulan,
		badgePromo,
		hargaMulai,
		lokasiPendek
	};
}

function jumlahUnitDariUnit(tipeUnit: PratinjauUnit[]): number | null {
	if (tipeUnit.length === 0) return null;
	return tipeUnit.reduce((sum, u) => sum + (u.unitTersedia ?? 0), 0);
}

/**
 * URL gambar pratinjau (`og:image`) — TANPA `?ref` untuk umum (kanonikal,
 * supaya satu gambar ter-cache untuk semua pengunjung), +`?ref=` HANYA bila
 * ref itu ref agen (`refTanpaCashback` = pola AO-/OMHA-/OMH- — sekaligus
 * validasi pola; ref lain tidak pernah di-echo ke URL gambar) supaya
 * route gambar merender kartu TANPA badge cashback. `tipeSlug` diteruskan
 * untuk varian halaman tipe.
 */
export function ogImageUrl({
	slug,
	tipeSlug,
	ref
}: {
	slug: string;
	tipeSlug?: string | null;
	ref?: string | null;
}): string {
	const params = new URLSearchParams();
	if (tipeSlug) params.set('tipe', tipeSlug);
	if (ref && refTanpaCashback(ref)) params.set('ref', ref);
	const q = params.toString();
	return `${SITE.url}/perumahan/${encodeURIComponent(slug)}/og.jpg${q ? `?${q}` : ''}`;
}
