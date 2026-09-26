import { getAgen } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/** AGEN-PROPERTI-01 — profil agen + kawasan yang dipasarkannya. */
export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const agen = await getAgen(fetch, params.slug);
	cacheKonten(setHeaders, 900);
	return { agen };
};
