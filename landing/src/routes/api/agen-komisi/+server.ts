/**
 * Proxy internal KOMISI-AGEN-01 — estimasi komisi agen untuk dialog
 * "Daftarkan Pembeli" (`GET /api/agen-komisi?slug=&tipeSlug=`). Agen dari
 * SESI (hanya cookie `session` diteruskan oleh client). Selalu 200
 * `{ estimasi: … | null }` — estimasi itu pelengkap; gagal = disembunyikan.
 * `private, no-store` + `vary: cookie`: angka komisi milik satu agen, tidak
 * boleh tersimpan di cache bersama.
 */
import { getEstimasiKomisiAgen } from '$lib/api';
import { json, type RequestHandler } from '@sveltejs/kit';

const HEADER = { 'cache-control': 'private, no-store', vary: 'cookie' } as const;
const SLUG = /^[a-z0-9-]{1,100}$/;

export const GET: RequestHandler = async ({ url, request, fetch }) => {
	const slug = (url.searchParams.get('slug') ?? '').trim();
	const tipeSlug = (url.searchParams.get('tipeSlug') ?? '').trim();
	if (!SLUG.test(slug) || (tipeSlug && !/^[a-z0-9-]{1,120}$/.test(tipeSlug))) {
		return json({ estimasi: null }, { headers: HEADER });
	}
	const cookie = request.headers.get('cookie');
	try {
		const estimasi = await getEstimasiKomisiAgen(fetch, cookie, slug, tipeSlug || undefined);
		return json({ estimasi }, { headers: HEADER });
	} catch (err) {
		console.error('[omahe:api] GET /api/agen-komisi gagal tak terduga', err);
		return json({ estimasi: null }, { headers: HEADER });
	}
};
