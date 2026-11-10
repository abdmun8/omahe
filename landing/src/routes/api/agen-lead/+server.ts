/**
 * Proxy internal AGEN-OMAHE-11 — dialog "Daftarkan Pembeli" (input lead
 * agen ke semua perumahan tayang). Pola `/api/lead`: `client.ts`
 * server-only, dialog browser POST ke sini; status + pesan backend
 * (400/401/404/409/429) diteruskan apa adanya lewat `ApiError`.
 *
 * Agen ditetapkan backend dari SESI (cookie `session` diteruskan), bukan
 * dari body — `ref` TIDAK ADA di jalur ini (SESI-OMAHE-01 §Desain teknis).
 * Validasi ringan di pintu (mirror skema backend) supaya body sampah tidak
 * menumpuk round-trip; validasi penuh tetap di backend.
 */
import { ApiError, inputLeadAgen, type InputLeadAgenBody } from '$lib/api';
import { json, type RequestHandler } from '@sveltejs/kit';

const HEADER_NO_STORE = { 'cache-control': 'private, no-store' } as const;

const slugValid = (v: unknown): v is string =>
	typeof v === 'string' && v.trim().length >= 1 && v.trim().length <= 100;
const teksValid = (v: unknown, min: number, maks: number): v is string =>
	typeof v === 'string' && v.trim().length >= min && v.trim().length <= maks;

export const POST: RequestHandler = async ({ request, fetch }) => {
	let body: Partial<InputLeadAgenBody>;
	try {
		body = (await request.json()) as Partial<InputLeadAgenBody>;
	} catch {
		return json({ message: 'Permintaan tidak valid.' }, { status: 400, headers: HEADER_NO_STORE });
	}

	// Validasi ringan — pesan ramah, selaras skema `inputLeadAgenSchema`
	// backend (nama 2–100, WA 5–20, catatan ≤ 1000, tipeSlug ≤ 120).
	if (!slugValid(body.slug)) {
		return json({ message: 'Perumahan tidak valid.' }, { status: 400, headers: HEADER_NO_STORE });
	}
	if (!teksValid(body.namaPembeli, 2, 100)) {
		return json(
			{ message: 'Nama pembeli wajib 2–100 karakter.' },
			{ status: 400, headers: HEADER_NO_STORE }
		);
	}
	if (!teksValid(body.whatsappPembeli, 5, 20)) {
		return json(
			{ message: 'Nomor WhatsApp tidak valid.' },
			{ status: 400, headers: HEADER_NO_STORE }
		);
	}
	if (
		body.catatan !== undefined &&
		body.catatan !== null &&
		(typeof body.catatan !== 'string' || body.catatan.length > 1000)
	) {
		return json({ message: 'Catatan terlalu panjang.' }, { status: 400, headers: HEADER_NO_STORE });
	}
	if (
		body.tipeSlug !== undefined &&
		body.tipeSlug !== null &&
		(typeof body.tipeSlug !== 'string' || body.tipeSlug.trim().length > 120)
	) {
		return json({ message: 'Tipe tidak valid.' }, { status: 400, headers: HEADER_NO_STORE });
	}

	const input: InputLeadAgenBody = {
		slug: body.slug.trim(),
		namaPembeli: body.namaPembeli.trim(),
		whatsappPembeli: body.whatsappPembeli.trim(),
		tipeSlug: body.tipeSlug?.trim() || undefined,
		catatan: body.catatan?.trim() || undefined
	};

	try {
		const data = await inputLeadAgen(fetch, request.headers.get('cookie'), input);
		return json({ success: true, data }, { headers: HEADER_NO_STORE });
	} catch (err) {
		if (err instanceof ApiError)
			return json({ message: err.message }, { status: err.status, headers: HEADER_NO_STORE });
		console.error('[omahe:api] POST /api/agen-lead gagal tak terduga', err);
		return json(
			{ message: 'Pendaftaran gagal. Coba lagi sebentar lagi.' },
			{ status: 502, headers: HEADER_NO_STORE }
		);
	}
};
