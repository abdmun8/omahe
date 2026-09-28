import { error, redirect } from '@sveltejs/kit';
import { getKartuNamaAgen } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import type { PageServerLoad } from './$types';

/**
 * AGEN-OMAHE-05 — kartu nama digital agen (dibagikan agen sendiri). SSR,
 * cache edge pendek (status/kontak bisa berubah saat membership berakhir).
 * Kode lama → redirect ke kode kanonik.
 */
export const load: PageServerLoad = async ({ fetch, params, setHeaders }) => {
	const kartu = await getKartuNamaAgen(fetch, params.kode ?? '');
	if (!kartu) error(404, 'Kartu nama agen tidak ditemukan.');
	if (kartu.kodeAgen !== params.kode)
		redirect(301, `/agen-omahe/${encodeURIComponent(kartu.kodeAgen)}`);
	cacheKonten(setHeaders, 60);
	return { kartu };
};
