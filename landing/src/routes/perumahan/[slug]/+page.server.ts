import { getPerumahan, getUnits } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	// Detail dulu — kalau slug-nya 404, tidak perlu menunggu query unit.
	const perumahan = await getPerumahan(fetch, params.slug);
	const unit = await getUnits(fetch, { perumahanSlug: params.slug, pageSize: 48 });

	cacheKonten(setHeaders);
	return { perumahan, tipeUnit: unit.items };
};
