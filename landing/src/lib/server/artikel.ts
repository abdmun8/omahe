/**
 * Glue build-time artikel: baca glob markdown + render HTML.
 * Harus di `src/lib/server/` — SvelteKit memblokir impor dari kode client,
 * jadi seluruh isi markdown (puluhan artikel) TIDAK pernah masuk bundle JS
 * browser; halaman detail menerima HTML jadi lewat data load yang
 * di-serialize. Lihat `src/lib/artikel.ts` untuk parser/filter murninya.
 */
import { marked } from 'marked';
import { parseFrontmatterArtikel, urutkanTerbaru, type Artikel, type ArtikelMeta } from '$lib/artikel';

// `?raw` = isi file sebagai string; eager supaya tersedia saat prerender.
// JANGAN ganti ke `fs.readFile` di load — jalan di dev, MATI di Vercel.
// `CREDITS.md` dikecualikan — bukan artikel.
const semuaBerkas = import.meta.glob('/src/content/artikel/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;
const berkas = Object.fromEntries(
	Object.entries(semuaBerkas).filter(([path]) => !path.endsWith('/CREDITS.md'))
);

/** Semua artikel terurut terbaru dulu. Validasi frontmatter fail-fast. */
export function bacaArtikel(): Artikel[] {
	const daftar: Artikel[] = [];
	for (const [path, mentah] of Object.entries(berkas)) {
		daftar.push(parseFrontmatterArtikel(path.split('/').pop()!, mentah));
	}
	return urutkanTerbaru(daftar);
}

/**
 * Tanggal hari ini zona WIB sebagai `YYYY-MM-DD` (`en-CA` adalah locale
 * yang formatnya persis ISO date). Artikel dijadwalkan tayang per tanggal
 * WIB, bukan UTC.
 */
export function hariIniWib(): string {
	return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

/** Markdown → HTML (GFM: tabel/list check). Konten in-repo, tepercaya. */
export function renderArtikelHtml(markdown: string): string {
	return marked.parse(markdown, { gfm: true, breaks: false, async: false });
}

/** Metadata saja — untuk daftar/sitemap/RSS/terkait, tanpa membocorkan isi. */
export function metaArtikel(a: Artikel): ArtikelMeta {
	const { markdown: _markdown, ...meta } = a;
	return meta;
}
