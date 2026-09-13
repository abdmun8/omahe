/**
 * Header cache untuk halaman publik. Pakai cache bawaan Vercel dulu, bukan
 * Redis terpisah (CLAUDE.md §Stack).
 *
 * SENGAJA `Cache-Control: s-maxage` di edge, BUKAN ISR adapter-vercel:
 * ISR mengabaikan query string kecuali di-`allowQuery` eksplisit, jadi
 * halaman yang sudah ter-cache TANPA `?ref=` bisa tersaji ke pengunjung
 * yang datang DENGAN `?ref=` — semua link CTA-nya kehilangan atribusi dan
 * komisi mitra hilang tanpa error apa pun. Cache CDN biasa memasukkan query
 * string ke cache key, jadi `?ref=abc` jadi entri sendiri dan aman.
 */
import type { RequestEvent } from '@sveltejs/kit';

type SetHeaders = RequestEvent['setHeaders'];

/** Konten yang berubah beberapa menit sekali (listing, direktori, detail). */
export function cacheKonten(setHeaders: SetHeaders, detik = 300) {
	setHeaders({
		'cache-control': `public, max-age=0, s-maxage=${detik}, stale-while-revalidate=${detik * 12}`
	});
}

/** Halaman statis (tentang, legal) — boleh jauh lebih lama. */
export function cacheStatis(setHeaders: SetHeaders, detik = 86_400) {
	setHeaders({
		'cache-control': `public, max-age=0, s-maxage=${detik}, stale-while-revalidate=${detik}`
	});
}
