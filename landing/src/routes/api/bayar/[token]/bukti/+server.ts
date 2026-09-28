/**
 * Proxy internal unggah bukti bayar (TAGIHAN-02, api-contract §27) —
 * multipart diteruskan sebagai multipart. Validasi tipe & ukuran file
 * (mirror backend: JPG/PNG/PDF; ≤ 4 MB karena batas body Vercel) dilakukan DI SINI sebelum
 * diteruskan — file terlalu besar ditolak tanpa memakai kuota rate limit backend
 * dan tanpa men-upload body besar. 409 (tagihan tidak sedang menunggu
 * pembayaran) diteruskan apa adanya.
 */
import { ApiError, kirimBuktiBayar } from '$lib/api';
import { TOKEN_BAYAR_PATTERN, validasiFileBukti } from '$lib/bayar';
import { json, type RequestHandler } from '@sveltejs/kit';

const NO_STORE = { 'cache-control': 'no-store' };

export const POST: RequestHandler = async ({ request, fetch, params }) => {
	const token = params.token ?? '';
	if (!TOKEN_BAYAR_PATTERN.test(token))
		return json(
			{ message: 'Link bayar tidak ditemukan atau sudah diganti.' },
			{ status: 404, headers: NO_STORE }
		);

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return json({ message: 'Permintaan tidak valid.' }, { status: 400, headers: NO_STORE });
	}

	const file = form.get('file');
	const turnstile = form.get('turnstile');
	if (!(file instanceof File))
		return json({ message: 'Berkas bukti wajib diunggah.' }, { status: 400, headers: NO_STORE });
	if (typeof turnstile !== 'string' || !turnstile)
		return json(
			{ message: 'Verifikasi keamanan belum selesai — ulangi verifikasi lalu coba lagi.' },
			{ status: 400, headers: NO_STORE }
		);

	// Validasi SEBELUM diteruskan (spesifikasi TAGIHAN-02) — pesan meniru
	// backend supaya pengalaman error konsisten di kedua lapis.
	const hasil = validasiFileBukti(file);
	if (!hasil.ok) return json({ message: hasil.pesan }, { status: 400, headers: NO_STORE });

	try {
		const data = await kirimBuktiBayar(fetch, token, file, turnstile);
		return json({ success: true, data }, { headers: NO_STORE });
	} catch (err) {
		if (err instanceof ApiError)
			return json({ message: err.message }, { status: err.status, headers: NO_STORE });
		console.error('[omahe:api] POST /api/bayar/:token/bukti gagal tak terduga', err);
		return json(
			{ message: 'Unggah bukti gagal. Coba lagi sebentar lagi.' },
			{ status: 502, headers: NO_STORE }
		);
	}
};
