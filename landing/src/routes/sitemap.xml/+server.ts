import {
	getAgenList,
	getAllUnitListings,
	getDevelopers,
	getLokasiLelang,
	getMitra,
	getPromoList
} from '$lib/api';
import { artikelTayang } from '$lib/artikel';
import { SITE } from '$lib/config';
import { bacaArtikel, hariIniWib } from '$lib/server/artikel';
import type { RequestHandler } from './$types';

const STATIS = [
	'',
	'/cari',
	'/developer',
	'/agen',
	'/artikel',
	'/promo',
	'/mitra',
	'/lelang',
	'/gabung',
	'/gabung/agen',
	'/gabung/mitra',
	'/gabung/perumahan',
	'/kpr',
	'/tentang',
	'/kontak',
	// Dokumen legal dipublikasikan 2026-10-01 (bukan draf lagi) — boleh diindeks.
	'/privasi',
	'/syarat-ketentuan',
	'/hapus-akun'
];

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
	const [unit, developers, artikel, promo, agen, mitra, lokasiLelang] = await Promise.all([
		getAllUnitListings(fetch),
		getDevelopers(fetch),
		// Artikel dihitung sinkron dari konten repo — bukan fetch API.
		Promise.resolve(artikelTayang(bacaArtikel(), hariIniWib())),
		// PROMO-02 — fail-soft ke [] (getPromoList), sitemap tetap jalan.
		getPromoList(fetch),
		// AGEN-PROPERTI-01 — fail-soft ke [] (getAgenList).
		getAgenList(fetch),
		// PROFIL-01 — halaman profil mitra `/mitra/:slug` (fail-soft []).
		getMitra(fetch),
		// LELANG-03 — halaman rumah lelang per kabupaten (fail-soft []).
		getLokasiLelang(fetch)
	]);

	// Satu timestamp untuk semua URL non-artikel di response ini: data dari
	// API tidak punya field timestamp per-halaman, jadi <lastmod>-nya cuma
	// bisa mencerminkan waktu response dibuat — format ISO 8601 (W3C
	// Datetime) sesuai spec sitemaps.org.
	const lastmod = new Date().toISOString();

	const slugProyek = [...new Set(unit.map((u) => u.perumahan.slug))];
	// UNIT-05 — halaman detail tipe rumah (hanya tipe dengan unit tersedia;
	// item tanpa `tipeSlug` = backend lama, dilewati).
	const urlTipe = [
		...new Set(
			unit
				.filter((u) => u.tipeSlug)
				.map((u) => `${SITE.url}/perumahan/${u.perumahan.slug}/tipe/${u.tipeSlug}`)
		)
	];

	// ARTIKEL PUNYA TANGGAL NYATA dari frontmatter — dipakai per-URL,
	// beda dari halaman API di bawah. Hanya yang sudah tayang.
	const urlArtikel = artikel.map((a) => ({
		loc: `${SITE.url}/artikel/${a.slug}`,
		lastmod: a.tanggal
	}));

	const urls = [
		...STATIS.map((path) => ({ loc: `${SITE.url}${path}`, lastmod })),
		...urlArtikel,
		...promo.map((p) => ({ loc: `${SITE.url}/promo/${p.slug}`, lastmod })),
		...developers.map((d) => ({ loc: `${SITE.url}/developer/${d.slug}`, lastmod })),
		...agen.map((a) => ({ loc: `${SITE.url}/agen/${a.slug}`, lastmod })),
		...mitra.map((mi) => ({ loc: `${SITE.url}/mitra/${mi.slug}`, lastmod })),
		...slugProyek.map((slug) => ({ loc: `${SITE.url}/perumahan/${slug}`, lastmod })),
		...urlTipe.map((loc) => ({ loc, lastmod })),
		...lokasiLelang.map((l) => ({ loc: `${SITE.url}/lelang/lokasi/${l.slug}`, lastmod }))
	];

	setHeaders({
		'content-type': 'application/xml',
		'cache-control': 'public, max-age=0, s-maxage=3600'
	});

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(({ loc, lastmod: lm }) => `\t<url><loc>${loc}</loc><lastmod>${lm}</lastmod></url>`)
	.join('\n')}
</urlset>`
	);
};
