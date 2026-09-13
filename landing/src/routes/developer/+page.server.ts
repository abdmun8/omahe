import { getDevelopers } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const developers = await getDevelopers(fetch);
	cacheKonten(setHeaders, 900);
	return { developers };
};
