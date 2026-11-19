/**
 * SHARE-02 — kartu gambar OG `/perumahan/<slug>/og.jpg` (1200×630) untuk
 * pratinjau tautan WhatsApp/Facebook: foto + nama + "mulai Rp…" + badge
 * promo + keunggulan (aturan teks SATU pintu lewat
 * `susunPratinjauPerumahan` — meta dan gambar tidak pernah beda).
 *
 * Query:
 * - `?tipe=<tipeSlug>` — varian halaman tipe (judul = nama tipe, harga tipe).
 *   Slug divalidasi pola — teks query bebas TIDAK pernah di-echo ke gambar
 *   (nama tipe selalu dari `getTipeDetail`, bukan dari URL).
 * - `?ref=<ref>` — HANYA ref agen (`refTanpaCashback`, pola AO-/OMHA-/OMH-)
 *   yang mengubah gambar: badge cashback disembunyikan (KOMISI-OMAHE-02/04).
 *   `ogImageUrl()` sisi halaman hanya menempelkan ref berpola itu.
 *
 * Fail-soft: slug tidak dikenal → 404 (diteruskan dari `getPerumahan`);
 * error backend/render lain → 302 ke gambar statis `/og-default.jpg`
 * (pratinjau tautan tidak boleh 500 — crawler cuma butuh gambar apa pun).
 * Cache publik 1 jam (s-maxage) + stale-while-revalidate; foto presign
 * difetch server-side dengan timeout 2,5 dtk (gagal → panel brand).
 *
 * TIDAK di-prerender & tidak masuk sitemap (sitemap hanya memuat URL halaman).
 */
import { isHttpError } from '@sveltejs/kit';
import { getPerumahan, getUnits, getTipeDetail } from '$lib/api';
import { susunPratinjauPerumahan } from '$lib/pratinjau-perumahan';
import {
	bangunKartuOg,
	muatFotoDataUrl,
	renderKartuOg,
	OG_LEBAR,
	OG_TINGGI
} from '$lib/server/og/kartu';
import type { PerumahanDetail, TipeDetail } from '$lib/api/types';
import type { RequestHandler } from './$types';

export const prerender = false;

const SLUG_TIPE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CACHE_OG = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

/** `?tipe=` divalidasi pola slug — selain itu dianggap tidak ada (bukan 404). */
function validasiSlugTipe(raw: string | null): string | null {
	if (!raw) return null;
	const slug = raw.trim().toLowerCase();
	return slug.length <= 80 && SLUG_TIPE_PATTERN.test(slug) ? slug : null;
}

function keFallback(url: URL, err: unknown): Response {
	console.error('[omahe:og] gagal render kartu — redirect ke /og-default.jpg:', err);
	return new Response(null, {
		status: 302,
		headers: { location: new URL('/og-default.jpg', url.origin).toString() }
	});
}

/** Foto untuk panel kiri: cover tipe (varian tipe) dulu, lalu foto perumahan. */
function pilihFoto(perumahan: PerumahanDetail, tipe: TipeDetail | null): string | null {
	if (tipe) {
		const cover = tipe.tipe.photos.find((f) => f.url !== null)?.url;
		if (cover) return cover;
	}
	return perumahan.photos.find((f) => f.url !== null)?.url ?? null;
}

export const GET: RequestHandler = async ({ params, fetch, url }) => {
	const ref = url.searchParams.get('ref');
	const tipeSlug = validasiSlugTipe(url.searchParams.get('tipe'));

	let perumahan: PerumahanDetail;
	try {
		perumahan = await getPerumahan(fetch, params.slug);
	} catch (err) {
		// Slug tidak dikenal → 404 apa adanya (SvelteKit). Selain itu fail-soft.
		if (isHttpError(err) && err.status === 404) throw err;
		return keFallback(url, err);
	}

	let tipe: TipeDetail | null = null;
	if (tipeSlug) {
		try {
			tipe = await getTipeDetail(fetch, params.slug, tipeSlug);
		} catch {
			// Tipe tidak ada/gagal → kartu perumahan biasa (tetap 200).
			tipe = null;
		}
	}

	try {
		// Varian tipe tidak butuh agregat unit; harga dari tipe. Fail-soft [] —
		// gambar tetap jalan tanpa harga bila query unit gagal.
		const [unitItems, fotoDataUrl] = await Promise.all([
			tipe
				? Promise.resolve([])
				: getUnits(fetch, { perumahanSlug: params.slug, pageSize: 48 })
						.then((r) => r.items)
						.catch(() => []),
			muatFotoDataUrl(pilihFoto(perumahan, tipe))
		]);

		const pratinjau = susunPratinjauPerumahan({
			perumahan,
			tipeUnit: unitItems,
			ref,
			tipe: tipe
				? {
						nama: tipe.tipe.nama,
						hargaMin: tipe.tipe.hargaMin,
						unitTersedia: tipe.tipe.unitTersedia
					}
				: undefined
		});

		const png = await renderKartuOg(
			bangunKartuOg({
				nama: perumahan.nama,
				tipeNama: tipe ? tipe.tipe.nama : null,
				lokasiPendek: pratinjau.lokasiPendek,
				hargaMulai: pratinjau.hargaMulai,
				badgePromo: pratinjau.badgePromo,
				poinKeunggulan: pratinjau.poinKeunggulan,
				fotoDataUrl
			})
		);

		return new Response(new Uint8Array(png), {
			headers: {
				'content-type': 'image/jpeg',
				'cache-control': CACHE_OG
			}
		});
	} catch (err) {
		return keFallback(url, err);
	}
};
