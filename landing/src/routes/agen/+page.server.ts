import { getAgenList } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/** AGEN-PROPERTI-01 — direktori agen properti (aktif & tampil di Omahe). */
export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const agen = await getAgenList(fetch);
	cacheKonten(setHeaders, 900);
	return { agen };
};
