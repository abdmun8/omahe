import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/** ADMIN-05 — cache edge 5 menit: nomor baru dari admin tampil tanpa
 *  redeploy, setelah cache kedaluwarsa. */
export const load: PageServerLoad = ({ setHeaders }) => {
	cacheKonten(setHeaders);
};
