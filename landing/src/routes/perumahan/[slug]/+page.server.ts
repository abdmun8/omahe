import { getAgenPemasar, getPerumahan, getUnits } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import { readRef } from '$lib/ref';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, setHeaders, url }) => {
	// Detail dulu — kalau slug-nya 404, tidak perlu menunggu query unit.
	const perumahan = await getPerumahan(fetch, params.slug);
	// AGEN-OMAHE-03 — agen pemasar paralel dengan unit; `ref` agen → backend
	// hanya mengembalikan agen itu. Fail-soft `[]` (blok tidak tampil).
	const [unit, agen] = await Promise.all([
		getUnits(fetch, { perumahanSlug: params.slug, pageSize: 48 }),
		getAgenPemasar(fetch, params.slug, readRef(url))
	]);

	cacheKonten(setHeaders);
	return { perumahan, tipeUnit: unit.items, agen };
};
