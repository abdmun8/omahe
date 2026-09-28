/**
 * Proxy internal lihat tagihan (TAGIHAN-02, api-contract §27) — pola
 * `/api/lead`: browser POST ke sini, `client.ts` (server-only) yang
 * memanggil backend; status & pesan backend diteruskan apa adanya
 * (403/404/429/503). URL backend tidak pernah sampai ke browser.
 */
import { ApiError, lihatTagihanBayar } from '$lib/api';
import { TOKEN_BAYAR_PATTERN } from '$lib/bayar';
import { json, type RequestHandler } from '@sveltejs/kit';

/** Rincian tagihan = data finansial privat → jangan pernah di-cache. */
const NO_STORE = { 'cache-control': 'no-store' };

export const POST: RequestHandler = async ({ request, fetch, params }) => {
	const token = params.token ?? '';
	// Salah format = pasti tidak ada di backend — 404 tanpa memanggil backend
	// (hemat rate limit 300/menit/IP; pesan seragam anti enumeration).
	if (!TOKEN_BAYAR_PATTERN.test(token))
		return json(
			{ message: 'Link bayar tidak ditemukan atau sudah diganti.' },
			{ status: 404, headers: NO_STORE }
		);

	let body: { turnstile?: unknown };
	try {
		body = (await request.json()) as { turnstile?: unknown };
	} catch {
		return json({ message: 'Permintaan tidak valid.' }, { status: 400, headers: NO_STORE });
	}
	const turnstile = typeof body?.turnstile === 'string' ? body.turnstile : '';
	if (!turnstile)
		return json(
			{ message: 'Verifikasi keamanan belum selesai — tunggu widget selesai memuat.' },
			{ status: 400, headers: NO_STORE }
		);

	try {
		const data = await lihatTagihanBayar(fetch, token, turnstile);
		return json({ success: true, data }, { headers: NO_STORE });
	} catch (err) {
		if (err instanceof ApiError)
			return json({ message: err.message }, { status: err.status, headers: NO_STORE });
		console.error('[omahe:api] POST /api/bayar/:token/lihat gagal tak terduga', err);
		return json(
			{ message: 'Data tagihan tidak dapat dimuat. Coba lagi sebentar lagi.' },
			{ status: 502, headers: NO_STORE }
		);
	}
};
