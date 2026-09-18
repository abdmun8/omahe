import { getAllProjectSlugs, getDevelopers } from '$lib/api';
import { artikelTayang } from '$lib/artikel';
import { SITE } from '$lib/config';
import { bacaArtikel, hariIniWib } from '$lib/server/artikel';
import type { RequestHandler } from './$types';

const STATIS = ['', '/cari', '/developer', '/artikel', '/kpr', '/tentang', '/kontak'];

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
	const [slugProyek, developers, artikel] = await Promise.all([
		getAllProjectSlugs(fetch),
		getDevelopers(fetch),
		// Artikel dihitung sinkron dari konten repo — bukan fetch API.
		Promise.resolve(artikelTayang(bacaArtikel(), hariIniWib()))
	]);

	// Satu timestamp untuk semua URL non-artikel di response ini: data dari
	// API tidak punya field timestamp per-halaman, jadi <lastmod>-nya cuma
	// bisa mencerminkan waktu response dibuat — format ISO 8601 (W3C
	// Datetime) sesuai spec sitemaps.org.
	const lastmod = new Date().toISOString();

	// ARTIKEL PUNYA TANGGAL NYATA dari frontmatter — dipakai per-URL,
	// beda dari halaman API di bawah. Hanya yang sudah tayang.
	const urlArtikel = artikel.map((a) => ({ loc: `${SITE.url}/artikel/${a.slug}`, lastmod: a.tanggal }));

	const urls = [
		...STATIS.map((path) => ({ loc: `${SITE.url}${path}`, lastmod })),
		...urlArtikel,
		...developers.map((d) => ({ loc: `${SITE.url}/developer/${d.slug}`, lastmod })),
		...slugProyek.map((slug) => ({ loc: `${SITE.url}/perumahan/${slug}`, lastmod }))
	];

	setHeaders({
		'content-type': 'application/xml',
		'cache-control': 'public, max-age=0, s-maxage=3600'
	});

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		({ loc, lastmod: lm }) =>
			`\t<url><loc>${loc}</loc><lastmod>${lm}</lastmod></url>`
	)
	.join('\n')}
</urlset>`
	);
};
