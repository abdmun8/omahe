/**
 * Proxy internal AGEN-OMAHE-11 iterasi 3 — booking unit atas nama pembeli
 * dari dialog "Daftarkan Pembeli" (`POST /api/agen-booking` →
 * `POST /public/agen-omahe/booking`). Pola `/api/agen-lead`: agen dari
 * SESI, `ref` tidak pernah dikirim, validasi ringan di pintu (mirror
 * `inputBookingAgenSchema` backend), status + pesan backend diteruskan.
 */
import { ApiError, inputBookingAgen, type InputBookingAgenBody } from '$lib/api';
import { json, type RequestHandler } from '@sveltejs/kit';

const HEADER_NO_STORE = { 'cache-control': 'private, no-store' } as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const teksValid = (v: unknown, min: number, maks: number): v is string =>
	typeof v === 'string' && v.trim().length >= min && v.trim().length <= maks;
const tolak = (message: string) => json({ message }, { status: 400, headers: HEADER_NO_STORE });

export const POST: RequestHandler = async ({ request, fetch }) => {
	let body: Partial<InputBookingAgenBody>;
	try {
		body = (await request.json()) as Partial<InputBookingAgenBody>;
	} catch {
		return tolak('Permintaan tidak valid.');
	}

	if (!teksValid(body.slug, 1, 100)) return tolak('Perumahan tidak valid.');
	if (typeof body.unitId !== 'string' || !UUID.test(body.unitId))
		return tolak('Pilih unit terlebih dahulu.');
	if (!teksValid(body.namaPembeli, 2, 100)) return tolak('Nama pembeli wajib 2–100 karakter.');
	if (!teksValid(body.whatsappPembeli, 5, 20)) return tolak('Nomor WhatsApp tidak valid.');
	if (
		body.catatan !== undefined &&
		body.catatan !== null &&
		(typeof body.catatan !== 'string' || body.catatan.length > 1000)
	) {
		return tolak('Catatan terlalu panjang.');
	}

	const input: InputBookingAgenBody = {
		slug: body.slug.trim(),
		unitId: body.unitId,
		namaPembeli: body.namaPembeli.trim(),
		whatsappPembeli: body.whatsappPembeli.trim(),
		catatan: body.catatan?.trim() || undefined
	};

	try {
		const data = await inputBookingAgen(fetch, request.headers.get('cookie'), input);
		return json({ success: true, data }, { headers: HEADER_NO_STORE });
	} catch (err) {
		if (err instanceof ApiError)
			return json({ message: err.message }, { status: err.status, headers: HEADER_NO_STORE });
		console.error('[omahe:api] POST /api/agen-booking gagal tak terduga', err);
		return json(
			{ message: 'Booking gagal. Coba lagi sebentar lagi.' },
			{ status: 502, headers: HEADER_NO_STORE }
		);
	}
};
