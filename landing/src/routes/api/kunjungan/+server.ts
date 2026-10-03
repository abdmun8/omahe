/**
 * ANALITIK-01 — proxy beacon kunjungan halaman perumahan → backend
 * `POST /public/kunjungan` (`client.ts` server-only). SELALU 204 — statistik
 * internal tidak boleh memunculkan error ke pengunjung. User-agent bot /
 * crawler / pratinjau tautan tidak diteruskan (mereka juga jarang
 * menjalankan JS, ini lapisan kedua).
 */
import { catatKunjungan } from '$lib/api';
import type { RequestHandler } from '@sveltejs/kit';

const UA_BOT =
	/bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python|java\//i;
const SLUG = /^[a-z0-9-]{1,120}$/;
const PENGUNJUNG = /^[A-Za-z0-9_-]{16,64}$/;

export const POST: RequestHandler = async ({ request, fetch }) => {
	const ua = request.headers.get('user-agent') ?? '';
	if (!ua || UA_BOT.test(ua)) return new Response(null, { status: 204 });
	try {
		const body = (await request.json()) as { slug?: unknown; pengunjung?: unknown };
		if (
			typeof body.slug === 'string' &&
			SLUG.test(body.slug) &&
			typeof body.pengunjung === 'string' &&
			PENGUNJUNG.test(body.pengunjung)
		) {
			await catatKunjungan(fetch, { slug: body.slug, pengunjung: body.pengunjung });
		}
	} catch {
		// body aneh — abaikan.
	}
	return new Response(null, { status: 204 });
};
