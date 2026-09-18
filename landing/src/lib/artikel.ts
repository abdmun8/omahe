/**
 * Utilitas artikel — modul MURNI (tanpa dependensi SvelteKit/Vite) supaya
 * bisa di-unit-test lewat `bun test` dan dipakai script `scripts/ambil-gambar-artikel.ts`.
 * Glue build-time (glob + marked) ada di `src/lib/server/artikel.ts`.
 *
 * Konvensi konten: `src/content/artikel/<slug>.md`, frontmatter di antara
 * dua baris `---`. Lihat TASKS.md item "Artikel (1/7)" untuk keputusan
 * desain (in-repo, tanpa CMS; future-dated tersembunyi sampai tanggalnya).
 */

export const TAG_ARTIKEL = ['investasi', 'properti', 'perumahan'] as const;
export type TagArtikel = (typeof TAG_ARTIKEL)[number];

/** Metadata artikel yang aman/berguna untuk daftar, sitemap, RSS, terkait. */
export interface ArtikelMeta {
	slug: string;
	judul: string;
	/** ≤160 char — jadi meta description + og:description. */
	deskripsi: string;
	/** `YYYY-MM-DD` — tanggal tayang (WIB). */
	tanggal: string;
	tag: TagArtikel;
	/** Path publik cover, selalu di bawah `/artikel/` — file fisik di `static/`. */
	cover: string;
	penulis: string;
	/** URL gambar Unsplash lengkap dengan param — dipakai `scripts/ambil-gambar-artikel.ts`. */
	coverSumber?: string;
	/** Atribusi untuk `src/content/artikel/CREDITS.md`. */
	coverFotografer?: string;
	coverHalaman?: string;
}

/** Artikel lengkap (metadata + isi markdown setelah frontmatter). */
export interface Artikel extends ArtikelMeta {
	markdown: string;
}

const POLA_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/**
 * HELPER TUNGGAL filter tayang (TASKS.md "Artikel (1/7)"): hanya artikel
 * `tanggal <= hariIni` yang boleh tampil — dipakai OLEH SEMUA konsumen
 * (index, detail/entries, sitemap, RSS, terkait). Jangan copy-paste
 * kondisinya di tempat lain: satu titik lupa = artikel future-dated bocor.
 *
 * `hariIni` format `YYYY-MM-DD` (ambil dari `hariIniWib()`, zona WIB) —
 * perbandingan string aman untuk format ini.
 */
export function artikelTayang(daftar: Artikel[], hariIni: string): Artikel[] {
	return daftar.filter((a) => a.tanggal <= hariIni);
}

/** Urut terbaru dulu; tie-break `slug` supaya urutan build deterministik. */
export function urutkanTerbaru(daftar: Artikel[]): Artikel[] {
	return [...daftar].sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.slug.localeCompare(b.slug));
}

/**
 * Parse satu file markdown artikel. Melempar error dengan nama file kalau
 * frontmatter tidak lengkap/salah — sengaja fail-fast SAAT BUILD, bukan
 * diam-diam render artikel tanpa cover/deskripsi di produksi.
 */
export function parseFrontmatterArtikel(namaFile: string, mentah: string): Artikel {
	const cocok = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(mentah);
	if (!cocok) {
		throw new Error(`[artikel] ${namaFile}: tidak punya blok frontmatter \`---\` yang valid.`);
	}

	const nilai = new Map<string, string>();
	for (const baris of cocok[1].split(/\r?\n/)) {
		const kv = /^([a-zA-Z]+):\s*(.*)$/.exec(baris);
		if (kv) nilai.set(kv[1], kv[2].trim().replace(/^['"]|['"]$/g, ''));
	}

	const wajib = ['judul', 'deskripsi', 'tanggal', 'tag', 'cover', 'penulis'] as const;
	for (const kunci of wajib) {
		if (!nilai.get(kunci)) {
			throw new Error(`[artikel] ${namaFile}: frontmatter \`${kunci}\` kosong/hilang.`);
		}
	}

	const slug = namaFile.replace(/\.md$/, '');
	if (!POLA_SLUG.test(slug)) {
		throw new Error(`[artikel] ${namaFile}: nama file bukan slug yang valid (kebab-case).`);
	}
	const judul = nilai.get('judul')!;
	if (judul.length > 80) {
		throw new Error(`[artikel] ${namaFile}: judul ${judul.length} char (maks 80).`);
	}
	const deskripsi = nilai.get('deskripsi')!;
	if (deskripsi.length > 160) {
		throw new Error(`[artikel] ${namaFile}: deskripsi ${deskripsi.length} char (maks 160).`);
	}
	const tanggal = nilai.get('tanggal')!;
	if (!POLA_TANGGAL.test(tanggal) || Number.isNaN(Date.parse(`${tanggal}T00:00:00Z`))) {
		throw new Error(`[artikel] ${namaFile}: \`tanggal\` harus YYYY-MM-DD yang valid, dapat "${tanggal}".`);
	}
	const tag = nilai.get('tag')!;
	if (!TAG_ARTIKEL.includes(tag as TagArtikel)) {
		throw new Error(`[artikel] ${namaFile}: \`tag\` harus salah satu ${TAG_ARTIKEL.join('/')}, dapat "${tag}".`);
	}
	const cover = nilai.get('cover')!;
	if (!cover.startsWith('/artikel/')) {
		throw new Error(`[artikel] ${namaFile}: \`cover\` harus path di bawah /artikel/, dapat "${cover}".`);
	}

	return {
		slug,
		judul,
		deskripsi,
		tanggal,
		tag: tag as TagArtikel,
		cover,
		penulis: nilai.get('penulis')!,
		...(nilai.get('coverSumber') ? { coverSumber: nilai.get('coverSumber') } : {}),
		...(nilai.get('coverFotografer') ? { coverFotografer: nilai.get('coverFotografer') } : {}),
		...(nilai.get('coverHalaman') ? { coverHalaman: nilai.get('coverHalaman') } : {}),
		markdown: cocok[2].trim()
	};
}

/** `2026-09-18` → "18 September 2026". Zona UTC supaya tidak bergeser. */
export function formatTanggalArtikel(tanggal: string): string {
	return new Date(`${tanggal}T00:00:00Z`).toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
}
