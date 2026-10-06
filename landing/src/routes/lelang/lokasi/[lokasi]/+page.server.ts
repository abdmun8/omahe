import { error } from '@sveltejs/kit';
import { getBankLelang, getLelang, getLokasiLelang } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import { angkaPositif as angka } from '$lib/lelang';
import type { PageServerLoad } from './$types';

/**
 * LELANG-03 — `/lelang/lokasi/:slug` (mis. `kabupaten-bandung`): halaman
 * rumah lelang per kabupaten/kota yang ramah SEO & bisa dibagikan. Slug
 * tidak dikenal backend → 404. Bank & nilai limit tetap query string.
 */
export const load: PageServerLoad = async ({ params, url, fetch, setHeaders }) => {
	const query = {
		lokasi: params.lokasi,
		bankId: url.searchParams.get('bankId') || undefined,
		limitMax: angka(url.searchParams.get('limitMax')),
		page: angka(url.searchParams.get('page')) || 1
	};
	const [hasil, lokasi, bank] = await Promise.all([
		getLelang(fetch, query),
		getLokasiLelang(fetch),
		getBankLelang(fetch)
	]);
	if (!hasil.lokasi) error(404, 'Lokasi tidak ditemukan.');
	cacheKonten(setHeaders);
	return { hasil, lokasi, bank, query, lokasiAktif: hasil.lokasi };
};
