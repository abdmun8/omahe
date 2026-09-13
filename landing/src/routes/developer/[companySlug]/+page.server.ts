import { getDeveloper } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const developer = await getDeveloper(fetch, params.companySlug);
	cacheKonten(setHeaders, 900);
	return { developer };
};
