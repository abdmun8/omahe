/**
 * Validasi artikel harian otomatis (tanpa dependency — cukup `bun`).
 *
 *   bun ops/artikel-otomatis/validasi.ts <path-artikel.md> <YYYY-MM-DD>
 *
 * Gagal (exit 1) bila: frontmatter tidak lolos `parseFrontmatterArtikel`,
 * tanggal ≠ tanggal yang diminta, slug bentrok dengan artikel lain, panjang
 * di luar 700–1700 kata (hanya artikel era pipeline — lihat di bawah),
 * < 2 tautan internal yang valid, < 2 tautan FITUR Omahe (route non-`/artikel`),
 * tidak ada bagian `## Langkah berikutnya di Omahe` (2–4 butir ber-tautan,
 * sebelum `## Sumber`), ada tautan internal ke artikel yang tidak ada / belum
 * tayang, tautan ke slug perumahan/promo/developer/kategori mitra yang tidak
 * ada, atau (artikel era pipeline) tidak ada bagian `## Sumber` dengan
 * ≥ 2 URL http(s).
 *
 * Slug dinamis (`/perumahan/<slug>`, `/promo/<slug>`, `/developer/<slug>`,
 * `?kategori=` di `/mitra`) divalidasi ke API publik produksi — di-fetch SEKALI
 * per run, timeout 5 detik; kalau API tidak terjangkau, slug tetap diterima
 * dengan warning (publikasi tidak diblokir karena backend sedang gangguan).
 */
import { parseFrontmatterArtikel } from '../../landing/src/lib/artikel';

const [path, tanggalDiminta] = process.argv.slice(2);
if (!path || !tanggalDiminta) {
	console.error('pakai: bun validasi.ts <artikel.md> <YYYY-MM-DD>');
	process.exit(2);
}

const DIR = `${import.meta.dir}/../../landing/src/content/artikel`;
/**
 * Artikel sebelum tanggal ini adalah evergreen pra-pipeline (2026-09-18 s.d.
 * 2026-10-17, rata-rata 300–600 kata, tanpa `## Sumber`) — tidak pernah diikat
 * aturan 700–1700 kata & `## Sumber` yang lahir bersama pipeline berita
 * (2026-10-18). Aturan itu tetap BERLAKU PENUH untuk artikel pipeline;
 * artikel lama di-grandfather supaya validasi bisa dipakai untuk semuanya.
 */
const TANGGAL_MULA_PIPELINE = '2026-10-18';
const API_BASE = (process.env.OMAHE_API_BASE_URL ?? 'https://api.omahe.co.id').replace(/\/+$/, '');
const TIMEOUT_API_MS = 5000;

/** Route fitur statis yang selalu valid (query string diperbolehkan). */
const ROUTE_FITUR = new Set([
	'/kpr',
	'/cari',
	'/promo',
	'/mitra',
	'/lelang',
	'/developer',
	'/gabung',
	'/gabung/agen',
	'/gabung/mitra',
	'/gabung/perumahan'
]);
const masalah: string[] = [];
const peringatan: string[] = [];

const nama = path.split('/').pop()!;
const mentah = await Bun.file(path).text();
let artikel;
try {
	artikel = parseFrontmatterArtikel(nama, mentah);
} catch (e) {
	console.error(`GAGAL frontmatter: ${(e as Error).message}`);
	process.exit(1);
}

if (artikel.tanggal !== tanggalDiminta)
	masalah.push(`tanggal ${artikel.tanggal} ≠ ${tanggalDiminta}`);
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

// --- daftar slug nyata dari API publik (fetch sekali per run, fail-soft) ---
async function ambilDaftar(ruteApi: string): Promise<string[] | null> {
	try {
		const res = await fetch(`${API_BASE}${ruteApi}`, {
			signal: AbortSignal.timeout(TIMEOUT_API_MS)
		});
		if (!res.ok) return null;
		const json = (await res.json()) as { data?: unknown };
		if (!Array.isArray(json.data)) return null;
		return json.data.map((d) => String((d as Record<string, unknown>).slug ?? '')).filter(Boolean);
	} catch {
		return null;
	}
}
const slugKategoriMitra = await ambilDaftar('/public/mitra/kategori');
if (!slugKategoriMitra) {
	peringatan.push('API publik tidak terjangkau — kategori mitra diterima tanpa diverifikasi');
}

/**
 * Slug dinamis dicek SATU PER SATU ke endpoint detail (bukan daftar ber-
 * paginasi — daftar developer/perumahan bisa melebihi satu halaman sehingga
 * slug yang sah ikut ditolak). `true` = ada (perumahan: juga tayang di
 * Omahe), `false` = 404 / tidak tayang, `null` = API tak terjangkau
 * (diterima dengan peringatan — publikasi tidak diblokir gangguan backend).
 */
async function slugAda(
	jenis: 'perumahan' | 'promo' | 'developer',
	slug: string
): Promise<boolean | null> {
	const rute = {
		perumahan: `/public/perumahan/${slug}`,
		promo: `/public/promo/${slug}`,
		developer: `/public/developers/${slug}`
	}[jenis];
	try {
		const res = await fetch(`${API_BASE}${rute}`, {
			signal: AbortSignal.timeout(TIMEOUT_API_MS)
		});
		if (res.status === 404) return false;
		if (!res.ok) return null;
		if (jenis !== 'perumahan') return true;
		const json = (await res.json()) as { data?: { tayangOmahe?: boolean } };
		return json.data?.tayangOmahe !== false;
	} catch {
		return null;
	}
}

const kata = artikel.markdown.split(/\s+/).filter(Boolean).length;
const eraPipeline = artikel.tanggal >= TANGGAL_MULA_PIPELINE;
if (eraPipeline && (kata < 700 || kata > 1700)) {
	masalah.push(`panjang ${kata} kata (harus 700–1700)`);
}

/**
 * Tautan fitur = tautan internal NON-`/artikel/…` (route fitur Omahe:
 * /cari, /kpr, /promo, /mitra, /lelang, /developer, /gabung, /perumahan/…).
 * Aturan 2026-11-19: setiap artikel wajib ≥ 2 tautan fitur yang relevan.
 */
let internalValid = 0;
let fiturValid = 0;
for (const m of artikel.markdown.matchAll(/\]\((\/[^)\s]+)\)/g)) {
	const [mentahPath, query = ''] = m[1].split('?');
	const href = mentahPath.replace(/\/$/, '') || '/';
	const params = new URLSearchParams(query);
	const art = /^\/artikel\/([a-z0-9-]+)$/.exec(href);
	if (art) {
		const tgl = lain.get(art[1]);
		if (!tgl) masalah.push(`tautan ke artikel yang tidak ada: ${href}`);
		else if (tgl > artikel.tanggal) {
			// Artikel era pipeline tidak boleh menaut artikel yang tayang
			// LEBIH LAMBAT darinya; artikel evergreen pra-pipeline di-
			// grandfather (semuanya sudah tayang jauh sebelum hari ini —
			// `amankanTautanArtikel` pun tetap menormalkannya saat build).
			if (eraPipeline) masalah.push(`tautan ke artikel yang belum tayang: ${href}`);
			else peringatan.push(`tautan ke artikel bertanggal lebih baru: ${href}`);
		} else internalValid++;
		continue;
	}
	if (ROUTE_FITUR.has(href)) {
		// `/mitra?kategori=<slug>` — kategori wajib ada di master kategori.
		const kategori = params.get('kategori');
		if (
			href === '/mitra' &&
			kategori !== null &&
			slugKategoriMitra &&
			!slugKategoriMitra.includes(kategori)
		) {
			masalah.push(`kategori mitra tidak ada: ?kategori=${kategori}`);
			continue;
		}
		internalValid++;
		fiturValid++;
		continue;
	}
	const dinamis: Array<[RegExp, 'perumahan' | 'promo' | 'developer']> = [
		[/^\/perumahan\/([a-z0-9-]+)$/, 'perumahan'],
		[/^\/promo\/([a-z0-9-]+)$/, 'promo'],
		[/^\/developer\/([a-z0-9-]+)$/, 'developer']
	];
	const cocok = dinamis.find(([pola]) => pola.exec(href));
	if (cocok) {
		const [pola, jenis] = cocok;
		const ada = await slugAda(jenis, pola.exec(href)![1]);
		if (ada === false) {
			masalah.push(`slug ${jenis} tidak ada / tidak tayang di Omahe: ${href}`);
			continue;
		}
		if (ada === null)
			peringatan.push(`slug ${jenis} belum terverifikasi (API tak terjangkau): ${href}`);
		internalValid++;
		fiturValid++;
		continue;
	}
	masalah.push(`tautan internal tak dikenal: ${href}`);
}
if (internalValid < 2) masalah.push(`tautan internal valid hanya ${internalValid} (min 2)`);
if (fiturValid < 2) {
	masalah.push(`tautan fitur Omahe (non-/artikel) hanya ${fiturValid} (min 2)`);
}

// --- bagian "## Langkah berikutnya di Omahe" (sebelum ## Sumber) ---
const posSumber = artikel.markdown.indexOf('\n## Sumber');
const cocokLangkah = /\n## Langkah berikutnya di Omahe\s*\n([\s\S]*?)(?=\n## |\n---|$)/.exec(
	artikel.markdown
);
if (!cocokLangkah) {
	masalah.push('belum ada bagian "## Langkah berikutnya di Omahe"');
} else {
	const posLangkah = artikel.markdown.indexOf(cocokLangkah[0]);
	if (posSumber !== -1 && posLangkah > posSumber) {
		masalah.push('bagian "## Langkah berikutnya di Omahe" harus SEBELUM "## Sumber"');
	}
	const butir = [...cocokLangkah[1].matchAll(/^\s*-\s+\S.*$/gm)].map((b) => b[0]);
	if (butir.length < 2 || butir.length > 4) {
		masalah.push(`bagian "## Langkah berikutnya di Omahe" harus 2–4 butir (ada ${butir.length})`);
	}
	const tanpaTautan = butir.filter((b) => !/\]\((\/[^)\s]+)\)/.test(b));
	if (tanpaTautan.length > 0) {
		masalah.push(
			'setiap butir "## Langkah berikutnya di Omahe" wajib berisi ≥ 1 tautan fitur internal'
		);
	}
}

const sumber = /\n## Sumber\s*\n([\s\S]*?)(\n## |\n---|$)/.exec(artikel.markdown);
const urlSumber = sumber ? [...sumber[1].matchAll(/https?:\/\/[^\s)>\]]+/g)].length : 0;
if (eraPipeline && (!sumber || urlSumber < 2)) {
	masalah.push(`bagian "## Sumber" wajib berisi ≥ 2 URL (ada ${sumber ? urlSumber : 0})`);
}

if (masalah.length) {
	console.error(`GAGAL ${nama}:\n- ${masalah.join('\n- ')}`);
	process.exit(1);
}
const catatan = peringatan.length ? `\n  ! ${peringatan.join('; ')}` : '';
console.log(
	`OK ${nama}: "${artikel.judul}" · ${artikel.tag} · ${kata} kata · ${internalValid} tautan internal (${fiturValid} fitur) · ${urlSumber} sumber${catatan}`
);
