/**
 * Validasi artikel harian otomatis (tanpa dependency — cukup `bun`).
 *
 *   bun ops/artikel-otomatis/validasi.ts <path-artikel.md> <YYYY-MM-DD>
 *
 * Gagal (exit 1) bila: frontmatter tidak lolos `parseFrontmatterArtikel`,
 * tanggal ≠ tanggal yang diminta, slug bentrok dengan artikel lain, panjang
 * di luar 700–1700 kata, < 2 tautan internal yang valid, ada tautan internal
 * ke artikel yang tidak ada / belum tayang, atau tidak ada bagian
 * `## Sumber` dengan ≥ 2 URL http(s).
 */
import { parseFrontmatterArtikel } from '../../landing/src/lib/artikel';

const [path, tanggalDiminta] = process.argv.slice(2);
if (!path || !tanggalDiminta) {
	console.error('pakai: bun validasi.ts <artikel.md> <YYYY-MM-DD>');
	process.exit(2);
}

const DIR = `${import.meta.dir}/../../landing/src/content/artikel`;
const ROUTE_STATIS = new Set(['/kpr', '/cari', '/artikel', '/developer', '/mitra', '/lelang', '/gabung']);
const masalah: string[] = [];

const nama = path.split('/').pop()!;
const mentah = await Bun.file(path).text();
let artikel;
try {
	artikel = parseFrontmatterArtikel(nama, mentah);
} catch (e) {
	console.error(`GAGAL frontmatter: ${(e as Error).message}`);
	process.exit(1);
}

if (artikel.tanggal !== tanggalDiminta) masalah.push(`tanggal ${artikel.tanggal} ≠ ${tanggalDiminta}`);
if (!artikel.coverSumber?.startsWith('https://images.unsplash.com/photo-')) {
	masalah.push('coverSumber wajib URL https://images.unsplash.com/photo-…');
}
if (artikel.cover !== `/artikel/${artikel.slug}-cover.jpg`) {
	masalah.push(`cover harus /artikel/${artikel.slug}-cover.jpg`);
}

// Artikel lain (tanggal & slug) — untuk cek bentrok slug/cover & tautan.
const lain = new Map<string, string>();
const coverLain = new Set<string>();
for await (const f of new Bun.Glob('*.md').scan({ cwd: DIR })) {
	if (f === 'CREDITS.md' || f === 'PLAN.md' || f === nama) continue;
	const a = parseFrontmatterArtikel(f, await Bun.file(`${DIR}/${f}`).text());
	lain.set(a.slug, a.tanggal);
	if (a.coverSumber) coverLain.add(a.coverSumber.split('?')[0]);
	if (a.tanggal === artikel.tanggal) masalah.push(`sudah ada artikel lain bertanggal sama: ${f}`);
}
if (artikel.coverSumber && coverLain.has(artikel.coverSumber.split('?')[0])) {
	masalah.push('foto cover sudah dipakai artikel lain');
}

const kata = artikel.markdown.split(/\s+/).filter(Boolean).length;
if (kata < 700 || kata > 1700) masalah.push(`panjang ${kata} kata (harus 700–1700)`);

let internalValid = 0;
for (const m of artikel.markdown.matchAll(/\]\((\/[^)\s#?]*)[^)]*\)/g)) {
	const href = m[1].replace(/\/$/, '') || '/';
	const art = /^\/artikel\/([a-z0-9-]+)$/.exec(href);
	if (art) {
		const tgl = lain.get(art[1]);
		if (!tgl) masalah.push(`tautan ke artikel yang tidak ada: ${href}`);
		else if (tgl > artikel.tanggal) masalah.push(`tautan ke artikel yang belum tayang: ${href}`);
		else internalValid++;
	} else if (ROUTE_STATIS.has(href)) {
		internalValid++;
	} else {
		masalah.push(`tautan internal tak dikenal: ${href}`);
	}
}
if (internalValid < 2) masalah.push(`tautan internal valid hanya ${internalValid} (min 2)`);

const sumber = /\n## Sumber\s*\n([\s\S]*?)(\n## |\n---|$)/.exec(artikel.markdown);
const urlSumber = sumber ? [...sumber[1].matchAll(/https?:\/\/[^\s)>\]]+/g)].length : 0;
if (urlSumber < 2) masalah.push(`bagian "## Sumber" wajib berisi ≥ 2 URL (ada ${urlSumber})`);

if (masalah.length) {
	console.error(`GAGAL ${nama}:\n- ${masalah.join('\n- ')}`);
	process.exit(1);
}
console.log(`OK ${nama}: "${artikel.judul}" · ${artikel.tag} · ${kata} kata · ${internalValid} tautan internal · ${urlSumber} sumber`);
