/**
 * "Fitur Omahe terkait" untuk halaman artikel (aturan 2026-11-19: setiap
 * artikel harus menghubungkan pembaca ke fitur Omahe).
 *
 * Modul MURNI (tanpa dependensi SvelteKit) supaya bisa di-unit-test lewat
 * `bun test` — pemakai (`routes/artikel/[slug]/+page.svelte`) tinggal
 * melewatkan hasilnya ke `withRef()` agar passthrough `?ref=` tetap jalan.
 *
 * Aturan desain: deterministik (urutan aturan tetap, nol keacakan), MAKS 3
 * kartu, tidak menduplikasi tautan fitur yang sudah ada di badan artikel.
 * Pencocokan cukup keyword di judul + deskripsi + isi (tag artikel hanya
 * 3 nilai luas — kurang informatif dibanding keyword).
 */
import type { Artikel } from './artikel';

export interface FiturArtikel {
	/** Path internal (tanpa domain) — dilewatkan `withRef()` oleh pemakai. */
	href: string;
	judul: string;
	deskripsi: string;
	/** Nama ikon `@lucide/svelte/icons/<ikon>` — dipetakan di pemakai. */
	ikon: string;
}

const KATALOG: Record<string, FiturArtikel> = {
	cari: {
		href: '/cari',
		judul: 'Cari rumah di Omahe',
		deskripsi: 'Filter per tipe, harga, dan kota.',
		ikon: 'search'
	},
	kpr: {
		href: '/kpr',
		judul: 'Simulasi cicilan KPR',
		deskripsi: 'Hitung angsuran dengan angka Anda sendiri.',
		ikon: 'calculator'
	},
	promo: {
		href: '/promo',
		judul: 'Promo berjalan',
		deskripsi: 'Program perumahan yang sedang tayang.',
		ikon: 'badge-percent'
	},
	lelang: {
		href: '/lelang',
		judul: 'Rumah lelang bank',
		deskripsi: 'Objek lelang yang sedang terdaftar.',
		ikon: 'gavel'
	},
	notaris: {
		href: '/mitra?kategori=notaris',
		judul: 'Mitra notaris/PPAT',
		deskripsi: 'Jasa legalitas & peralihan hak.',
		ikon: 'file-text'
	},
	kjpp: {
		href: '/mitra?kategori=kjpp',
		judul: 'Penilai publik (KJPP)',
		deskripsi: 'Appraisal independen untuk harga wajar.',
		ikon: 'landmark'
	},
	kontraktor: {
		href: '/mitra?kategori=kontraktor',
		judul: 'Mitra kontraktor',
		deskripsi: 'Renovasi & pembangunan terverifikasi.',
		ikon: 'hammer'
	},
	agen: {
		href: '/mitra?tab=agen',
		judul: 'Agen Omahe',
		deskripsi: 'Direktori agen properti terverifikasi.',
		ikon: 'users'
	},
	developer: {
		href: '/developer',
		judul: 'Direktori developer',
		deskripsi: 'Kenali pengembang di balik proyeknya.',
		ikon: 'building-2'
	},
	gabungAgen: {
		href: '/gabung/agen',
		judul: 'Jadi agen Omahe',
		deskripsi: 'Dampingi pembeli, dapat penghasilan tambahan.',
		ikon: 'user-plus'
	},
	gabungPerumahan: {
		href: '/gabung/perumahan',
		judul: 'Daftarkan perumahan',
		deskripsi: 'Pasarkan proyek developer di Omahe.',
		ikon: 'house'
	}
};

/**
 * Aturan pencocokan — urut SPESIFIK → UMUM. Semua grup yang cocok ikut
 * menyumbang kandidat (urutan grup = prioritas kandidat), lalu dilengkapi
 * pengisi bawaan sampai 3 kartu.
 */
const ATURAN: Array<{ kunci: string[]; pola: RegExp }> = [
	{ kunci: ['lelang'], pola: /\blelang/ },
	{
		kunci: ['notaris'],
		pola: /notaris|ppat|sertifikat|ajb|bphtb|shm|shgb|balik nama|waris|hibah|ahli waris|legalitas|hak milik|sitnotif|kepanjangan/
	},
	{ kunci: ['kjpp'], pola: /appraisal|penilai|kjpp|harga pasar|nilai wajar|dinilai/ },
	{ kunci: ['agen'], pola: /makelar|broker|agen properti|calon agen/ },
	{
		kunci: ['kontraktor'],
		pola: /renovasi|konstruksi|kontraktor|\bbangun\b|atap|pondasi|genteng|material|spesifikasi|serah terima|spek bangunan/
	},
	{
		kunci: ['gabungPerumahan'],
		pola: /ipps|rte|pengelola perumahan|moratorium|izin bangun|pbg|\bimb\b|permen pkp|program 3 juta|pohon perumahan/
	},
	{
		kunci: ['developer'],
		pola: /developer|site plan|master plan|cluster|kaveling|lingkungan perumahan/
	},
	{
		kunci: ['kpr', 'promo'],
		pola: /\bkpr\b|bunga|cicilan|anuitas|\bdp\b|uang muka|flpp|subsidi|plafond|asuransi jiwa|pelunasan|over.?kpr|floating|fixed/
	},
	{
		kunci: ['gabungAgen'],
		pola: /investasi|penghasilan|cash flow|kontrakan|disewa|\bsewa\b|yield|jual rumah|exit strategy/
	}
];

const PENGISI = ['cari', 'kpr', 'promo'];
const MAKS_KARTU = 3;

/**
 * Pilih 2–3 fitur Omahe yang relevan untuk satu artikel — dari keyword
 * judul/deskripsi/isi. Deterministik; tautan fitur yang SUDAH ada di badan
 * artikel dilewati supaya kotak ini bukan pengulangan CTA artikel.
 */
export function fiturTerkaitArtikel(
	artikel: Pick<Artikel, 'judul' | 'deskripsi' | 'markdown'>
): FiturArtikel[] {
	const teks = `${artikel.judul}\n${artikel.deskripsi}\n${artikel.markdown}`.toLowerCase();
	const kandidat: string[] = [];
	for (const aturan of ATURAN) {
		if (!aturan.pola.test(teks)) continue;
		for (const k of aturan.kunci) if (!kandidat.includes(k)) kandidat.push(k);
	}
	for (const k of PENGISI) if (!kandidat.includes(k)) kandidat.push(k);

	const hasil: FiturArtikel[] = [];
	for (const k of kandidat) {
		if (hasil.length >= MAKS_KARTU) break;
		const fitur = KATALOG[k];
		// Sudah ditautkan di badan artikel? Lewati — kotak bukan pengulangan.
		if (artikel.markdown.includes(`(${fitur.href})`)) continue;
		hasil.push(fitur);
	}
	return hasil;
}
