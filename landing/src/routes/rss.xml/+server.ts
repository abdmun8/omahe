import { artikelTayang } from '$lib/artikel';
import { SITE } from '$lib/config';
import { bacaArtikel, hariIniWib } from '$lib/server/artikel';
import type { RequestHandler } from './$types';

/** Escape teks bebas untuk XML (judul/deskripsi bisa mengandung & < >). */
function escapeXml(teks: string): string {
	return teks
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

/**
 * RSS 2.0 — 20 artikel terbaru yang sudah tayang. Pola cache sama dengan
 * sitemap (`s-maxage=3600` di CDN). `pubDate` RFC 822, tanggal tayang WIB.
 */
export const GET: RequestHandler = async ({ setHeaders }) => {
	const daftar = artikelTayang(bacaArtikel(), hariIniWib()).slice(0, 20);

	setHeaders({
		'content-type': 'application/rss+xml',
		'cache-control': 'public, max-age=0, s-maxage=3600'
	});

	const items = daftar
		.map(
			(a) => `\t\t<item>
\t\t\t<title>${escapeXml(a.judul)}</title>
\t\t\t<link>${SITE.url}/artikel/${a.slug}</link>
\t\t\t<guid isPermaLink="true">${SITE.url}/artikel/${a.slug}</guid>
\t\t\t<pubDate>${new Date(`${a.tanggal}T00:00:00+07:00`).toUTCString()}</pubDate>
\t\t\t<description>${escapeXml(a.deskripsi)}</description>
\t\t</item>`
		)
		.join('\n');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
\t<channel>
\t\t<title>Artikel Omahe</title>
\t\t<link>${SITE.url}/artikel</link>
\t\t<description>${escapeXml(SITE.deskripsi)}</description>
\t\t<language>id</language>
${items}
\t</channel>
</rss>`
	);
};
