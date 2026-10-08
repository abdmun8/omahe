/**
 * Proxy internal minat umum ke agen Omahe (AGEN-OMAHE-04, api-contract §23)
 * — pola `/api/lead`: `client.ts` server-only, dialog browser POST ke sini;
 * status & pesan backend (400/404/429) diteruskan apa adanya. LEAD-02:
 * `whatsapp` = nomor agen diteruskan ke dialog supaya chat peminat ke
 * NOMOR AGEN (dulu jatuh ke nomor umum/principal Omahe).
 */
import { ApiError, kirimMinatAgen } from '$lib/api';
import type { AgenMinatInput } from '$lib/api/types';
import { json, type RequestHandler } from '@sveltejs/kit';

const KODE_AGEN = /^OMHA?-[A-Z0-9]{1,16}$/i;

export const POST: RequestHandler = async ({ request, fetch }) => {
	let input: AgenMinatInput;
	try {
		input = (await request.json()) as AgenMinatInput;
	} catch {
		return json({ message: 'Permintaan tidak valid.' }, { status: 400 });
	}
	if (typeof input?.kodeAgen !== 'string' || !KODE_AGEN.test(input.kodeAgen)) {
		return json({ message: 'Agen tidak ditemukan.' }, { status: 404 });
	}
	let whatsapp: string | null;
	try {
		({ whatsapp } = await kirimMinatAgen(fetch, input));
	} catch (err) {
		if (err instanceof ApiError) return json({ message: err.message }, { status: err.status });
		console.error('[omahe:api] POST /api/agen-minat gagal tak terduga', err);
		return json({ message: 'Pengiriman gagal. Coba lagi sebentar lagi.' }, { status: 502 });
	}
	// LEAD-02 — nomor tujuan WA peminat (nomor agen) diteruskan ke dialog.
	return json({ success: true, data: { ok: true, whatsapp } });
};
