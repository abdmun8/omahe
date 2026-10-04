import { getLelangDetail } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/** LELANG-01 — detail rumah lelang; tetap tampil setelah lelang selesai. */
export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const rumah = await getLelangDetail(fetch, params.slug);
	cacheKonten(setHeaders);
	return { rumah };
};
