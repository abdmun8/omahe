import { getPromo } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/**
 * PROMO-02 — detail Halaman Promo Omahe. Draft / di luar periode / tidak ada
 * → 404 dari backend (halaman promo berakhir tidak dibiarkan tayang).
 */
export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const promo = await getPromo(fetch, params.slug);
	cacheKonten(setHeaders);
	return { promo };
};
