/**
 * Proxy internal AGEN-OMAHE-11 iterasi 3 — unit tersedia untuk dialog
 * "Daftarkan Pembeli" mode Booking unit (`GET /api/agen-unit?slug=`).
 * Agen dari SESI (cookie `session` diteruskan). Status error backend
 * (401 sesi mati / 404 perumahan tidak boleh di-input) diteruskan supaya
 * dialog bisa menampilkan pesan yang tepat. `private, no-store` +
 * `vary: cookie` — daftar ini bergantung pada agen, tidak boleh di-cache.
 */
import { ApiError, getUnitTersediaAgen } from '$lib/api';
import { json, type RequestHandler } from '@sveltejs/kit';

const HEADER = { 'cache-control': 'private, no-store', vary: 'cookie' } as const;
const SLUG = /^[a-z0-9-]{1,100}$/;

export const GET: RequestHandler = async ({ url, request, fetch }) => {
	const slug = (url.searchParams.get('slug') ?? '').trim();
	if (!SLUG.test(slug)) {
		return json({ message: 'Perumahan tidak valid.' }, { status: 400, headers: HEADER });
	}
	try {
		const unit = await getUnitTersediaAgen(fetch, request.headers.get('cookie'), slug);
		return json({ unit }, { headers: HEADER });
	} catch (err) {
		if (err instanceof ApiError)
			return json({ message: err.message }, { status: err.status, headers: HEADER });
		console.error('[omahe:api] GET /api/agen-unit gagal tak terduga', err);
		return json(
			{ message: 'Daftar unit gagal dimuat. Coba lagi sebentar lagi.' },
			{ status: 502, headers: HEADER }
		);
	}
};
