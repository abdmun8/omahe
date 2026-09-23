import { getTipeDetail } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/**
 * UNIT-05 — detail satu tipe rumah (`GET /public/perumahan/:slug/tipe/:tipeSlug`).
 * 404 dari backend/fixture diteruskan apa adanya (halaman error SvelteKit).
 */
export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const detail = await getTipeDetail(fetch, params.slug, params.tipeSlug);
	cacheKonten(setHeaders);
	return { detail };
};
