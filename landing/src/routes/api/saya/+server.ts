/**
 * Proxy internal SESI-OMAHE-01 — status sesi agen Omahe. Dipanggil TIAP
 * muat halaman penuh dari browser (root layout, setelah hydrate) — halaman
 * publik TETAP anonim & ter-cache; status sesi TIDAK PERNAH dibaca di
 * `load` halaman (epic §Desain teknis).
 *
 * Kontrak penting:
 *   - TANPA cookie `session` → langsung `{agen:null}` TANPA memanggil
 *     backend (mayoritas pengunjung anonim — backend tidak boleh dibanjiri).
 *   - Header respons `cache-control: private, no-store` + `vary: cookie` —
 *     respons per-user, tidak boleh ter-cache bersama (edge/browser).
 *   - Gagal backend apa pun → `{agen:null}` (fail-soft — sesi aksesoris UI,
 *     tidak pernah 500).
 */
import { getAgenSaya } from '$lib/api';
import { json, type RequestHandler } from '@sveltejs/kit';

const HEADER_NO_STORE = {
	'cache-control': 'private, no-store',
	vary: 'cookie'
} as const;

export const GET: RequestHandler = async ({ request, fetch }) => {
	// Ekstraksi cookie `session` ada di `client.ts` (server-only) — di sini
	// cukup teruskan ISI header `cookie` request apa adanya; tanpa header
	// cookie sama sekali jangan sentuh `getAgenSaya` (mock test mengunci ini).
	const cookieHeader = request.headers.get('cookie');
	if (!cookieHeader) return json({ agen: null }, { headers: HEADER_NO_STORE });

	let agen: Awaited<ReturnType<typeof getAgenSaya>> = null;
	try {
		agen = await getAgenSaya(fetch, cookieHeader);
	} catch (err) {
		// Fail-soft total — jangan pernah menjatuhkan status sesi jadi 500.
		console.error('[omahe:api] GET /api/saya gagal — fail-soft {agen:null}', err);
	}
	return json({ agen }, { headers: HEADER_NO_STORE });
};
