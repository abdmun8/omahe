/**
 * Pelaporan Google Analytics 4 — satu titik untuk SEMUA event di lintas
 * komponen (taksonomi, iterasi 1):
 *   - page_view        — otomatis di root layout (`afterNavigate`)
 *   - search           — search-form.svelte (submit form pencarian)
 *   - whatsapp_click   — contact-buttons.svelte
 *   - phone_click      — contact-buttons.svelte
 *   - lead_form_open   — lead-form-dialog.svelte (dialog dibuka)
 *   - lead_form_submit — lead-form-dialog.svelte (submit sukses)
 * (iterasi 2: kartu/slider/CTA lain menyusul dengan pola yang sama)
 *
 * ATURAN KERAS (Google ToS — PII dilarang di GA): JANGAN pernah mengirim
 * nama pengunjung, nomor telepon, isi pesan, atau pengenal pribadi lain ke
 * GA. Yang boleh: nama perumahan/developer, tipe, judul, dan param
 * non-identitas (mis. `ada_ref: boolean`). Kalau ragu, jangan kirim.
 *
 * Semua fungsi no-op yang AMAN kalau `window.gtag` tidak ada — SSR (window
 * tidak ada), dev (gtag.js hanya dimuat saat PROD), atau ad-blocker. Event
 * yang tiba sebelum gtag.js termuat dibuang (tidak dibuffer) — cukup untuk
 * event inti di atas.
 */

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
		dataLayer?: unknown[][];
	}
}

type ParamGA = string | number | boolean | undefined;

/**
 * Kirim event custom ke GA4. Param undefined/null DI-STRIP sebelum kirim —
 * GA tidak menerima nilai `undefined` (berisiko masuk sebagai string
 * "undefined" di laporan), jadi key tanpa nilai dibuang total.
 */
export function trackEvent(nama: string, params?: Record<string, ParamGA>): void {
	if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
	const bersih: Record<string, string | number | boolean> = {};
	if (params) {
		for (const [kunci, nilai] of Object.entries(params)) {
			// `null` tidak ada di tipe tapi bisa datang dari runtime — ikut strip.
			if (nilai !== undefined && nilai !== null) bersih[kunci] = nilai;
		}
	}
	window.gtag('event', nama, bersih);
}

/**
 * Event CTA "Ajukan" — SEMUA titik yang menaut ke `/ajukan/:slug` (sticky
 * bar, tombol hero/cta dari section builder, tombol "Ajukan" per-tipe di
 * halaman detail) dipasang lewat helper ini supaya taksonomi param konsisten:
 * `perumahan` = nama proyek (bukan slug/URL), `ada_ref` = apakah kode
 * referral mitra masih menempel di URL saat CTA diklik (diagnostik putusnya
 * rantai komisi — CLAUDE.md §Redirect `/p/:slug`). Tidak ada PII di sini.
 */
export function trackCtaAjukan(perumahan: string, adaRef: boolean): void {
	trackEvent('cta_ajukan', { perumahan, ada_ref: adaRef });
}

/**
 * Pageview manual — dipanggil root layout di `afterNavigate` (termasuk
 * initial load; `send_page_view` dimatikan di config gtag supaya tidak
 * terhitung dua kali). `page_path` = pathname saja (tanpa query) — query
 * tetap terbawa penuh di `page_location`, dan pelaporan `?ref=` eksplisit
 * hanya lewat param di event terkait.
 */
export function trackPageView(path: string, title?: string): void {
	if (typeof window === 'undefined') return;
	trackEvent('page_view', {
		page_path: path,
		page_location: window.location?.href,
		page_title: title
	});
}
