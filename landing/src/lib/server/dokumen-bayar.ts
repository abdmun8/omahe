/**
 * Proxy unduh dokumen link bayar — invoice & kwitansi (TAGIHAN-02,
 * api-contract §27). Token di URL
 * adalah satu-satunya kunci, TANPA Turnstile (backend juga begitu). Body
 * di-stream dari backend (tidak di-buffer), `Cache-Control: no-store`
 * karena invoice mencerminkan status tagihan yang bisa berubah.
 */
import { ApiError, unduhDokumenBayar } from '$lib/api';
import { TOKEN_BAYAR_PATTERN } from '$lib/bayar';
import { error, type RequestHandler } from '@sveltejs/kit';

export function proxyDokumenBayar(jenis: 'invoice' | 'kwitansi'): RequestHandler {
	return async ({ fetch, params }) => {
		const token = params.token ?? '';
		if (!TOKEN_BAYAR_PATTERN.test(token))
			error(404, 'Link bayar tidak ditemukan atau sudah diganti.');
		try {
			const res = await unduhDokumenBayar(fetch, token, jenis);
			// Nama file dari backend (memuat nomor dokumen) diteruskan kalau ada.
			const disposition =
				res.headers.get('content-disposition') ?? `attachment; filename="${jenis}.pdf"`;
			return new Response(res.body, {
				status: 200,
				headers: {
					'content-type': 'application/pdf',
					'content-disposition': disposition,
					'cache-control': 'no-store'
				}
			});
		} catch (err) {
			if (err instanceof ApiError) error(err.status, err.message);
			console.error(`[omahe:api] GET /bayar/:token/${jenis}.pdf gagal tak terduga`, err);
			error(502, 'Dokumen tidak dapat diunduh. Coba lagi sebentar lagi.');
		}
	};
}
