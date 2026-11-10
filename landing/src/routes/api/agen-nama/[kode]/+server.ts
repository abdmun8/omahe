/**
 * Proxy internal nama agen pribadi (REF-AGEN-01, api-contract.md §40) —
 * perantara antara banner homepage di browser dan `getNamaAgenPribadi()`:
 * `client.ts` itu server-only (import `$env/dynamic/private` tidak boleh
 * masuk bundle browser), jadi komponen tidak bisa memanggilnya langsung.
 *
 * Banner "Rekomendasi dari <nama agen>" memanggil sini CLIENT-SIDE bila
 * ref GLOBAL berbentuk kode agen pribadi (`?ref=OMHA-…`/`OMH-…`) — nama
 * TIDAK pernah dari query string (anti-spoof, pola KERJASAMA-03: `?mitra=`
 * hanya untuk hasil resolve `/q/:kode` yang divalidasi backend).
 *
 * GET saja; kode divalidasi LOKAL dengan pola yang sama (`normalisasiRefAgenPribadi`)
 * — salah bentuk → 404 tanpa menyentuh backend. Kode sah tapi asing/nonaktif
 * (backend 404 → fail-soft `null`) → juga 404: banner disembunyikan, bukan
 * error UI. Sukses → `{success, data:{nama}}` + `cache-control:
 * public, max-age=300` (nama agen jarang berubah — 5 menit cukup, pola
 * "cache publik pendek" di epic; KODE asing pun 404 aman di-cache karena
 * tidak ada hitungan/pindai di endpoint ini, BEDA dari `/q/[kode]`).
 */
import { ApiError, getNamaAgenPribadi } from '$lib/api';
import { normalisasiRefAgenPribadi } from '$lib/ref-pola';
import { json, type RequestHandler } from '@sveltejs/kit';

export const prerender = false;

export const GET: RequestHandler = async ({ fetch, params }) => {
	const kode = normalisasiRefAgenPribadi(params.kode);
	if (!kode) {
		return json({ message: 'Kode agen tidak dikenal.' }, { status: 404 });
	}

	let nama: string | null;
	try {
		nama = await getNamaAgenPribadi(fetch, kode);
	} catch (err) {
		if (err instanceof ApiError) return json({ message: err.message }, { status: err.status });
		console.error('[omahe:api] GET /api/agen-nama gagal tak terduga', err);
		return json({ message: 'Gagal memuat nama agen.' }, { status: 502 });
	}
	if (!nama) {
		return json({ message: 'Kode agen tidak dikenal.' }, { status: 404 });
	}

	return json(
		{ success: true, data: { nama } },
		{ headers: { 'cache-control': 'public, max-age=300' } }
	);
};
