import { readRef } from '$lib/ref';
import type { LayoutLoad } from './$types';

/**
 * `ref` dibaca SEKALI di layout root, lalu tersedia di `page.data.ref` untuk
 * seluruh halaman — supaya tidak ada halaman yang lupa membacanya sendiri
 * (kalau satu halaman lupa, komisi referral mitra hilang diam-diam; lihat
 * `src/lib/ref.ts`).
 */
export const load: LayoutLoad = ({ url }) => {
	return { ref: readRef(url) };
};
