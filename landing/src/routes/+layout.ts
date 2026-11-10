import { browser } from '$app/environment';
import { readRef } from '$lib/ref';
import { hitungRefLayout } from '$lib/ref-tersimpan';
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
export const load: LayoutLoad = ({ data, url, params, route }) => {
	let refUrl: string | null = null;
	try {
		refUrl = readRef(url);
	} catch {
		// sedang prerender — HTML awal tanpa ref, diisi ulang pasca-hidrasi.
		refUrl = null;
	}

	// KERJASAMA-02/03 + REF-AGEN-01 — seluruh logika pemilihan & penyimpanan
	// ref (per-slug vs GLOBAL `OP-…`/kode agen pribadi, LAST-TOUCH, nama
	// `?mitra=`) diekstrak ke `hitungRefLayout()` di `src/lib/ref-tersimpan.ts`
	// supaya bisa diuji — shim natif `$app/environment` di bun test tidak bisa
	// di-mock dari file proyek. Di sini tinggal wiring tipis; URL bar tidak
	// diubah.
	const { ref, refGlobalNama, refGlobalAgen } = hitungRefLayout({
		browser,
		refUrl,
		slug: params.slug ?? null,
		diRutePerumahan: route.id?.startsWith('/perumahan/[slug]') === true && !!params.slug,
		url
	});

	// `data` = hasil `+layout.server.ts` (kontak Omahe, ADMIN-05) — WAJIB
	// diteruskan, kalau tidak `page.data.kontak` jadi undefined di seluruh
	// halaman dan semua komponen diam-diam mundur ke fallback `SITE.*`.
	// `refGlobalNama` = nama mitra (banner OP-…); `refGlobalAgen` = kode agen
	// pribadi (REF-AGEN-01 — banner homepage mengambil nama client-side).
	return { ...data, ref, refGlobalNama, refGlobalAgen };
};
