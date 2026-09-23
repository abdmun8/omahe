/**
 * Kontak Omahe (ADMIN-05) dimuat SEKALI di layout root — semua halaman &
 * komponen mengambilnya dari `page.data.kontak` (contact-buttons, sticky-cta,
 * footer, JSON-LD, halaman legal), tidak ada yang fetch sendiri.
 *
 * `getKontak()` fail-soft ke `SITE.*` (lihat `$lib/api/client.ts`) — kegagalan
 * endpoint kontak tidak pernah menjatuhkan halaman mana pun. Cache in-memory
 * 60 detik milik `getKontak` membuat request berpaketaan tidak mengulang
 * fetch; perubahan nomor di admin tampil tanpa redeploy.
 */
import { getKontak } from '$lib/api';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch }) => {
	return { kontak: await getKontak(fetch) };
};
