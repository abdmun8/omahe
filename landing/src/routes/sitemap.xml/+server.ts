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

	setHeaders({
		'content-type': 'application/xml',
		'cache-control': 'public, max-age=0, s-maxage=3600'
	});

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `\t<url><loc>${url}</loc></url>`).join('\n')}
</urlset>`
	);
};
