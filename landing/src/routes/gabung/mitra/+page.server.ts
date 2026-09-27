import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/** ADMIN-05 — cache edge 5 menit: nomor kontak baru dari admin tampil tanpa
 *  redeploy, setelah cache kedaluwarsa. Pola `/kontak`. */
export const load: PageServerLoad = ({ setHeaders }) => {
	cacheKonten(setHeaders);
};
