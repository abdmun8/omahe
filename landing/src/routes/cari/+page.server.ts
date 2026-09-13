import { getRegions, getUnits } from '$lib/api';
import type { UnitQuery } from '$lib/api/types';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/** Angka dari query string; nilai tidak valid diabaikan, bukan bikin error —
 *  URL pencarian sering diedit manual atau dipotong saat dibagikan. */
function angka(raw: string | null): number | undefined {
	if (raw === null || raw.trim() === '') return undefined;
	const n = Number(raw);
	return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export const load: PageServerLoad = async ({ url, fetch, setHeaders }) => {
	const query: UnitQuery = {
		regionKode: url.searchParams.get('regionKode') || undefined,
		tipe: url.searchParams.get('tipe') || undefined,
		developerSlug: url.searchParams.get('developerSlug') || undefined,
		hargaMin: angka(url.searchParams.get('hargaMin')),
		hargaMax: angka(url.searchParams.get('hargaMax')),
		page: angka(url.searchParams.get('page')) || 1
	};

	const [hasil, regions] = await Promise.all([getUnits(fetch, query), getRegions(fetch)]);

	cacheKonten(setHeaders);
	return { hasil, regions, query };
};
