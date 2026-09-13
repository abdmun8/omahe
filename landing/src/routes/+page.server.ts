import { getDevelopers, getFeaturedUnits, getRegions } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const [unitUnggulan, developers, regions] = await Promise.all([
		getFeaturedUnits(fetch, 6),
		getDevelopers(fetch),
		getRegions(fetch)
	]);

	cacheKonten(setHeaders);
	return { unitUnggulan, developers: developers.slice(0, 3), regions };
};
