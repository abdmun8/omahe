import { getDevelopers, getFeaturedUnits, getRegions, getSliders } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const [unitUnggulan, developers, regions, sliders] = await Promise.all([
		getFeaturedUnits(fetch, 6),
		getDevelopers(fetch),
		getRegions(fetch),
		getSliders(fetch)
	]);

	cacheKonten(setHeaders);
	return { unitUnggulan, developers: developers.slice(0, 3), regions, sliders };
};
