import { getKerjasamaQr } from '$lib/api';
import type { RequestHandler } from './$types';

/**
 * KERJASAMA-02 — QR cetak kerjasama perumahan×perusahaan mitra meng-encode
 * `https://www.omahe.co.id/q/<KODE>` (bukan URL panjang), supaya QR tetap
 * kecil/mudah dipindai dan tujuan bisa dipindah tanpa cetak ulang. Route
 * ini me-resolve kode → 302 `/perumahan/:slug?ref=<ref>`; atribusi komisi
 * lanjut lewat passthrough `?ref=` biasa (`src/lib/ref.ts`).
 *
 * `+server.ts` GET saja (bukan halaman): tidak ada UI, hanya redirect.
 *
 * Header keketatan:
 *   - `cache-control: no-store` — SETIAP pindai QR yang ketemu dihitung
 *     "pindai" di backend (`GET /public/kerjasama/q/:kode`). Kalau 302-nya
 *     disimpan edge Vercel/browser, pindai berikutnya tidak pernah sampai
 *     ke backend dan hitungan pindai bolong. `getKerjasamaQr` sendiri juga
 *     tidak menyimpan apa pun.
 *   - `x-robots-tag: noindex` — URL utilitarian, bukan konten.
 *
 * Tidak di-prerender (dinamis + no-store) dan tidak masuk sitemap
 * (`sitemap.xml` memakai daftar statis + API — `/q` tidak pernah terdaftar).
 * Kode tidak dikenal/nonaktif (termasuk backend gagal — fail-soft `null`)
 * tetap 302 ke `/`: pemindai tidak pernah melihat error.
 */
export const prerender = false;

export const GET: RequestHandler = async ({ fetch, params }) => {
	const qr = await getKerjasamaQr(fetch, params.kode ?? '');
	// KERJASAMA-03 — dua jenis: QR perumahan → halaman detail perumahan;
	// QR Omahe×perusahaan → homepage dengan ref GLOBAL `OP-…` + `mitra`
	// (nama perusahaan, LABEL TAMPILAN SAJA — atribusi tetap dari `ref`
	// yang divalidasi backend; nama di bersihkan ulang di layout sebelum
	// disimpan). Keduanya `cache-control: no-store` — hitung pindai.
	let location = '/';
	if (qr?.jenis === 'perumahan') {
		location = `/perumahan/${encodeURIComponent(qr.perumahanSlug)}?ref=${encodeURIComponent(qr.ref)}`;
	} else if (qr?.jenis === 'omahe') {
		location = `/?ref=${encodeURIComponent(qr.ref)}&mitra=${encodeURIComponent(qr.namaPerusahaan)}`;
	}
	return new Response(null, {
		status: 302,
		headers: {
			location,
			'cache-control': 'no-store',
			'x-robots-tag': 'noindex'
		}
	});
};
