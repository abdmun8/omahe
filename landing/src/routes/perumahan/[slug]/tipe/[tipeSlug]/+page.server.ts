import { getAgenPemasar, getTipeDetail } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import { adalahRefAgenPilihan, readRef } from '$lib/ref';
import type { PageServerLoad } from './$types';

/**
 * UNIT-05 — detail satu tipe rumah (`GET /public/perumahan/:slug/tipe/:tipeSlug`).
 * 404 dari backend/fixture diteruskan apa adanya (halaman error SvelteKit).
 *
 * AGEN-OMAHE-18 — blok "Agen yang memasarkan" juga tampil di halaman tipe
 * (manfaat utama Premium): data sama dengan halaman perumahan
 * (`getAgenPemasar`, fail-soft `[]`; hanya `?ref=AO-…` yang diteruskan).
 */
export const load: PageServerLoad = async ({ params, fetch, setHeaders, url }) => {
	const ref = readRef(url);
	const [detail, agen] = await Promise.all([
		getTipeDetail(fetch, params.slug, params.tipeSlug),
		getAgenPemasar(fetch, params.slug, adalahRefAgenPilihan(ref) ? ref : null)
	]);
	cacheKonten(setHeaders);
	return { detail, agen };
};
