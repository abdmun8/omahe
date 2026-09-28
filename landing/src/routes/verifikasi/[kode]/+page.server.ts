import { cacheKonten } from '$lib/cache';
import { getVerifikasiAgen } from '$lib/api';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * AGEN-OMAHE-01 — verifikasi ID card agen (QR membuka halaman ini). SSR
 * murni: status berubah saat membership berakhir/diperpanjang, jadi TIDAK
 * di-prerender. Cache edge 60 detik saja (lebih pendek dari konten lain —
 * hasil verifikasi yang basi terlalu lama menyesatkan pembeli).
 */
export const load: PageServerLoad = async ({ fetch, params, setHeaders }) => {
	const hasil = await getVerifikasiAgen(fetch, params.kode ?? '');
	// AGEN-OMAHE-05 — QR lama (`OMH-XXXXXX`) → URL kode kanonik `OMHA-A0001`.
	if (hasil.ketemu && hasil.data.kodeAgen !== params.kode) {
		redirect(301, `/verifikasi/${encodeURIComponent(hasil.data.kodeAgen)}`);
	}
	cacheKonten(setHeaders, 60);
	return { hasil };
};
