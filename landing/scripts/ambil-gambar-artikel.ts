/**
 * Unduh cover artikel dari Unsplash ke `static/artikel/` + regenerasi
 * `src/content/artikel/CREDITS.md`.
 *
 *   bun scripts/ambil-gambar-artikel.ts            # unduh yang belum ada
 *   bun scripts/ambil-gambar-artikel.ts --force    # unduh ulang semua
 *
 * File gambar DI-COMMIT ke repo (bukan fetch saat build CI — network di CI
 * rapuh; lihat TASKS.md item "Artikel (1/7)"). Lisensi Unsplash: komersial
 * boleh tanpa atribusi wajib — sumber & fotografer tetap dicatat di
 * CREDITS.md supaya terlacak.
 *
 * Sumber gambar ditentukan frontmatter tiap artikel:
 *   cover         → path publik lokal (mis. /artikel/x-cover.jpg)
 *   coverSumber   → URL gambar Unsplash lengkap dengan param ukuran
 *   coverFotografer, coverHalaman → untuk CREDITS.md
 */
import { parseFrontmatterArtikel } from '../src/lib/artikel';

const PANGGIL_DIR = import.meta.dir;
const DIR_KONTEN = `${PANGGIL_DIR}/../src/content/artikel`;
const DIR_STATIS = `${PANGGIL_DIR}/../static/artikel`;
const FILE_CREDITS = `${DIR_KONTEN}/CREDITS.md`;
const force = process.argv.includes('--force');

await Bun.write(DIR_STATIS + '/.gitkeep', '');

let unduh = 0;
let lewati = 0;
let gagal = 0;
const barisCredits: { slug: string; fotografer: string; halaman: string; sumber: string }[] = [];

for await (const nama of new Bun.Glob('*.md').scan({ cwd: DIR_KONTEN })) {
	if (nama === 'CREDITS.md') continue; // bukan artikel — file kredit
	const a = parseFrontmatterArtikel(nama, await Bun.file(`${DIR_KONTEN}/${nama}`).text());
	const target = `${DIR_STATIS}/${a.cover.replace('/artikel/', '')}`;
	barisCredits.push({
		slug: a.slug,
		fotografer: a.coverFotografer ?? '—',
		halaman: a.coverHalaman ?? '—',
		sumber: a.coverSumber ?? '—'
	});
	if (!a.coverSumber) {
		console.log(`LEWATI  ${a.slug}: frontmatter tanpa \`coverSumber\``);
		continue;
	}
	if ((await Bun.file(target).exists()) && !force) {
		console.log(`ADA    ${a.cover} (pakai --force untuk unduh ulang)`);
		lewati++;
		continue;
	}
	const res = await fetch(a.coverSumber);
	if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/')) {
		console.error(`GAGAL  ${a.slug}: ${a.coverSumber} → ${res.status} ${res.headers.get('content-type')}`);
		gagal++;
		continue;
	}
	await Bun.write(target, await res.arrayBuffer());
	console.log(`UNDUH  ${a.cover} ← ${a.coverFotografer ?? 'Unsplash'}`);
	unduh++;
}

const credits = `# Kredit gambar artikel

Seluruh cover artikel diambil dari [Unsplash](https://unsplash.com) —
[Lisensi Unsplash](https://unsplash.com/license): penggunaan komersial
diperbolehkan tanpa atribusi wajib. Sumber dicatat di bawah sebagai bentuk
apresiasi dan agar mudah dilacak ulang. File ini DIREGENERASI OTOMATIS oleh
\`scripts/ambil-gambar-artikel.ts\` — jangan diedit manual.

| Artikel | Fotografer | Halaman foto | Sumber gambar |
| --- | --- | --- | --- |
${barisCredits
	.map((b) => `| ${b.slug} | ${b.fotografer} | ${b.halaman} | ${b.sumber} |`)
	.join('\n')}
`;
await Bun.write(FILE_CREDITS, credits);

console.log(`\nSelesai: ${unduh} unduh, ${lewati} sudah ada, ${gagal} gagal.`);
if (gagal > 0) process.exit(1);
