import { readRef } from '$lib/ref';
import type { LayoutLoad } from './$types';

/**
 * `ref` dibaca SEKALI di layout root, lalu tersedia di `page.data.ref` untuk
 * seluruh halaman — supaya tidak ada halaman yang lupa membacanya sendiri
 * (kalau satu halaman lupa, komisi referral mitra hilang diam-diam; lihat
 * `src/lib/ref.ts`).
 *
 * Prerender build-time: `url.searchParams` TIDAK BISA diakses (SvelteKit
 * melempar error — saat build tidak ada query string). Guard try/catch ini
 * hanya aktif di jalur itu; di SSR/hidrasi/navigasi normal `readRef` tidak
 * pernah melempar, jadi perilaku passthrough `?ref=` tidak berubah. Halaman
 * prerender mendapat `ref` kembali saat universal load re-run di browser
 * (hidrasi) dengan URL lengkap — diverifikasi end-to-end via Playwright
 * (`?ref=` muncul di nav header/footer pasca-hidrasi), lihat TASKS.md item
 * "Prerender halaman statis".
 */
export const load: LayoutLoad = ({ data, url }) => {
	let ref: string | null = null;
	try {
		ref = readRef(url);
	} catch {
		// sedang prerender — HTML awal tanpa ref, diisi ulang pasca-hidrasi.
		ref = null;
	}
	// `data` = hasil `+layout.server.ts` (kontak Omahe, ADMIN-05) — WAJIB
	// diteruskan, kalau tidak `page.data.kontak` jadi undefined di seluruh
	// halaman dan semua komponen diam-diam mundur ke fallback `SITE.*`.
	return { ...data, ref };
};
