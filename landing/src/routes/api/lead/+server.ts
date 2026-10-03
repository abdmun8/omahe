/**
 * Proxy internal submit lead (MONET-03, api-contract.md §8; LEAD-02: semua
 * perumahan) — perantara WAJIB antara dialog di browser dan `createLead()`:
 * `client.ts` itu server-only (import `$env/dynamic/private` tidak boleh
 * masuk bundle browser), jadi komponen tidak bisa memanggilnya langsung.
 *
 * Dialog POST JSON ke sini; status + pesan backend diteruskan apa adanya
 * (mis. 429 rate limit yang pesannya sudah ramah) supaya UI menampilkannya
 * tanpa perlu tahu detail status komersial (404 pun seragam, §8).
 */
import { ApiError, createLead, type LeadInput } from '$lib/api';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, fetch }) => {
	let input: LeadInput;
	try {
		input = (await request.json()) as LeadInput;
	} catch {
		return json({ message: 'Permintaan tidak valid.' }, { status: 400 });
	}

	let whatsapp: string | null;
	try {
		({ whatsapp } = await createLead(fetch, input));
	} catch (err) {
		if (err instanceof ApiError) return json({ message: err.message }, { status: err.status });
		console.error('[omahe:api] POST /api/lead gagal tak terduga', err);
		return json({ message: 'Pengiriman gagal. Coba lagi sebentar lagi.' }, { status: 502 });
	}
	// LEAD-02 — nomor tujuan WA peminat diteruskan ke dialog.
	return json({ success: true, data: { ok: true, whatsapp } });
};
