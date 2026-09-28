import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { TOKEN_BAYAR_PATTERN } from '$lib/bayar';
import type { PageServerLoad } from './$types';

/**
 * TAGIHAN-02 — halaman bayar dari link (WA/email) ke pihak yang ditagih.
 * Rincian TIDAK di-SSR: butuh Turnstile dulu, jadi `load` cuma menyiapkan
 * token + site key; datanya diambil client-side lewat `/api/bayar/:token`.
 *
 * Privasi: token = kunci — halaman `noindex,nofollow` (meta + header
 * `X-Robots-Tag`), `Referrer-Policy: no-referrer` (token tidak bocor ke
 * header referrer situs lain), `Cache-Control: no-store` (rincian finansial
 * tidak boleh ter-cache di edge). TIDAK di-prerender.
 */
export const prerender = false;

/** Site key Turnstile test Cloudflare (selalu lolos) — khusus dev. */
const TURNSTILE_TEST_KEY = '1x00000000000000000000AA';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const token = params.token ?? '';
	// Salah format = pasti tidak ada; 404 halaman (pesan seragam backend).
	if (!TOKEN_BAYAR_PATTERN.test(token))
		error(404, 'Link bayar tidak ditemukan atau sudah diganti.');

	setHeaders({
		'cache-control': 'no-store',
		'referrer-policy': 'no-referrer',
		'x-robots-tag': 'noindex, nofollow'
	});

	// Site key PUBLIK by design (terlihat di HTML semua pemakai Turnstile);
	// secret key-nya hanya di backend (`TURNSTILE_SECRET_KEY`). Kosong di
	// dev → test key Cloudflare supaya alur bisa dicoba tanpa konfigurasi.
	const siteKey = env.PUBLIC_TURNSTILE_SITE_KEY || (import.meta.env.DEV ? TURNSTILE_TEST_KEY : '');

	return { token, siteKey };
};
