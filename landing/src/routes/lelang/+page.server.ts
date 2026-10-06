import { redirect } from '@sveltejs/kit';
import { getBankLelang, getLelang, getLokasiLelang } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import { angkaPositif as angka, sisaQueryLelang as sisaQuery } from '$lib/lelang';
import type { PageServerLoad } from './$types';

/**
 * LELANG-01/03 — daftar rumah lelang (urut area prioritas lalu jadwal),
 * filter bank & nilai limit lewat query string (GET form, tanpa JS tetap
 * jalan). Lokasi dialihkan (301) ke URL ramah SEO `/lelang/lokasi/:slug`:
 * `?lokasi=<slug>` (form) dan `?regionKode=<kode>` lama (tautan lama).
 */
export const load: PageServerLoad = async ({ url, fetch, setHeaders }) => {
	const slug = url.searchParams.get('lokasi')?.trim();
	if (slug) redirect(301, `/lelang/lokasi/${encodeURIComponent(slug)}${sisaQuery(url)}`);
	const [lokasi, bank] = await Promise.all([getLokasiLelang(fetch), getBankLelang(fetch)]);
	const kodeLama = url.searchParams.get('regionKode')?.trim();
	if (kodeLama) {
		const cocok = lokasi.find((l) => l.kode === kodeLama);
		if (cocok) redirect(301, `/lelang/lokasi/${cocok.slug}${sisaQuery(url)}`);
	}
	const query = {
		bankId: url.searchParams.get('bankId') || undefined,
		limitMax: angka(url.searchParams.get('limitMax')),
		page: angka(url.searchParams.get('page')) || 1
	};
	const hasil = await getLelang(fetch, query);
	cacheKonten(setHeaders);
	return { hasil, lokasi, bank, query };
};
