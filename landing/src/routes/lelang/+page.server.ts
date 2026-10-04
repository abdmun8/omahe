import { getBankLelang, getLelang, getRegions } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/**
 * LELANG-01 — daftar rumah lelang yang akan datang (urut tanggal lelang),
 * filter wilayah/bank/nilai limit lewat query string (GET form, tanpa JS
 * tetap jalan). Nilai aneh diabaikan.
 */
function angka(raw: string | null): number | undefined {
	if (raw === null || raw.trim() === '') return undefined;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? n : undefined;
}

export const load: PageServerLoad = async ({ url, fetch, setHeaders }) => {
	const query = {
		regionKode: url.searchParams.get('regionKode') || undefined,
		bankId: url.searchParams.get('bankId') || undefined,
		limitMax: angka(url.searchParams.get('limitMax')),
		page: angka(url.searchParams.get('page')) || 1
	};
	const [hasil, regions, bank] = await Promise.all([
		getLelang(fetch, query),
		getRegions(fetch),
		getBankLelang(fetch)
	]);
	cacheKonten(setHeaders);
	return { hasil, regions, bank, query };
};
