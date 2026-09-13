import { getAllProjectSlugs, getDevelopers } from '$lib/api';
import { SITE } from '$lib/config';
import type { RequestHandler } from './$types';

const STATIS = ['', '/cari', '/developer', '/kpr', '/tentang', '/kontak'];

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
	const [slugProyek, developers] = await Promise.all([
		getAllProjectSlugs(fetch),
		getDevelopers(fetch)
	]);

	const urls = [
		...STATIS.map((path) => `${SITE.url}${path}`),
		...developers.map((d) => `${SITE.url}/developer/${d.slug}`),
		...slugProyek.map((slug) => `${SITE.url}/perumahan/${slug}`)
	];

	// Satu timestamp untuk semua URL di response ini (dipanggil sekali, bukan
	// per-URL): data dari API tidak punya field timestamp per-halaman, jadi
	// <lastmod> hanya mencerminkan waktu response dibuat — format ISO 8601
	// (W3C Datetime) sesuai spec sitemaps.org.
	const lastmod = new Date().toISOString();

	setHeaders({
		'content-type': 'application/xml',
		'cache-control': 'public, max-age=0, s-maxage=3600'
	});

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `\t<url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>`
	);
};
