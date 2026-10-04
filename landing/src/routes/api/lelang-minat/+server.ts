/**
 * LELANG-01 — proxy form minat rumah lelang → backend
 * `POST /public/lelang/:slug/minat` (`client.ts` server-only). Pesan backend
 * (400/404/429) diteruskan apa adanya.
 */
import { ApiError, kirimMinatLelang } from '$lib/api';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, fetch }) => {
	let body: {
		slug?: unknown;
		nama?: unknown;
		telepon?: unknown;
		pesan?: unknown;
		website?: unknown;
	};
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Permintaan tidak valid.' }, { status: 400 });
	}
	if (typeof body.slug !== 'string' || !/^[a-z0-9-]{1,120}$/.test(body.slug)) {
		return json({ message: 'Permintaan tidak valid.' }, { status: 400 });
	}
	try {
		await kirimMinatLelang(fetch, body.slug, {
			nama: typeof body.nama === 'string' ? body.nama : '',
			telepon: typeof body.telepon === 'string' ? body.telepon : '',
			pesan: typeof body.pesan === 'string' ? body.pesan : undefined,
			website: typeof body.website === 'string' ? body.website : undefined
		});
	} catch (err) {
		if (err instanceof ApiError) return json({ message: err.message }, { status: err.status });
		console.error('[omahe:api] POST /api/lelang-minat gagal tak terduga', err);
		return json({ message: 'Pengiriman gagal. Coba lagi sebentar lagi.' }, { status: 502 });
	}
	return json({ success: true, data: { ok: true } });
};
