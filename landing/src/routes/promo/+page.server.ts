import { getPromoList } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/** PROMO-02 — daftar Halaman Promo Omahe yang sedang tayang. */
export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const daftar = await getPromoList(fetch);
	cacheKonten(setHeaders);
	return { daftar };
};
