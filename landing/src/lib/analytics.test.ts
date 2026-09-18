/**
 * Tes unit `src/lib/analytics.ts` — pelaporan GA4 (iterasi 1). Dijalankan
 * `bun test` (pola sama dengan `jsonld.test.ts`/`ref.test.ts`): murni
 * fungsi, tidak butuh DOM.
 *
 * Yang dikunci:
 *   - no-op AMAN tanpa `window` (SSR) maupun tanpa `window.gtag` (dev —
 *     gtag.js cuma dimuat saat PROD — dan ad-blocker);
 *   - param undefined/null DI-STRIP sebelum sampai gtag (GA tidak menerima
 *     `undefined` — berisiko masuk sebagai string "undefined" di laporan);
 *   - shape event benar: ('event', nama, params) untuk trackEvent,
 *     page_view + page_path/page_title/page_location untuk trackPageView.
 *
 * `window` di-stub manual lewat `globalThis` (bun test tidak punya helper
 * `vi.stubGlobal`) — disimpan/dipulihkan antar tes supaya tidak bocor.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { trackEvent, trackPageView } from './analytics';

function buatGtag() {
	return mock((..._args: unknown[]) => {});
}

/** Pasang `window` tiruan; `href` menggantikan `window.location.href`. */
function pasangWindow(gtag?: ReturnType<typeof buatGtag>, href = 'https://omahe.id/cari?ref=uji') {
	(globalThis as unknown as Record<string, unknown>).window = {
		gtag,
		location: { href }
	};
}

function hapusWindow() {
	delete (globalThis as unknown as Record<string, unknown>).window;
}

afterEach(hapusWindow);

describe('trackEvent', () => {
	test('no-op tanpa window (SSR) — tidak throw', () => {
		hapusWindow();
		expect(() => trackEvent('search', { region: '32.01' })).not.toThrow();
		expect(() => trackPageView('/cari')).not.toThrow();
	});

	test('no-op saat window ada tapi gtag belum termuat (dev/ad-blocker)', () => {
		pasangWindow(); // tanpa gtag
		expect(() => trackEvent('search', { region: '32.01' })).not.toThrow();
		expect(() => trackPageView('/cari', 'Cari')).not.toThrow();
	});

	test('kirim event + param; undefined/null DI-STRIP sebelum sampai gtag', () => {
		const gtag = buatGtag();
		pasangWindow(gtag);
		const params: Record<string, string | number | boolean | undefined> = {
			search_term: '36',
			region: undefined,
			harga_max: 500_000_000,
			ada_ref: true
		};
		// null tidak ada di tipe tapi bisa datang dari runtime — wajib ikut strip.
		(params as Record<string, unknown>).region = null;

		trackEvent('search', params);

		expect(gtag).toHaveBeenCalledTimes(1);
		expect(gtag).toHaveBeenCalledWith('event', 'search', {
			search_term: '36',
			harga_max: 500_000_000,
			ada_ref: true
		});
	});

	test('tanpa params → tetap kirim event dengan objek kosong', () => {
		const gtag = buatGtag();
		pasangWindow(gtag);

		trackEvent('whatsapp_click');

		expect(gtag).toHaveBeenCalledWith('event', 'whatsapp_click', {});
	});
});

describe('trackPageView', () => {
	test('kirim page_path + page_title + page_location (URL penuh dengan query)', () => {
		const gtag = buatGtag();
		pasangWindow(gtag);

		trackPageView('/cari', 'Cari Rumah — Omahe');

		expect(gtag).toHaveBeenCalledWith('event', 'page_view', {
			page_path: '/cari',
			page_title: 'Cari Rumah — Omahe',
			page_location: 'https://omahe.id/cari?ref=uji'
		});
	});

	test('tanpa title → page_title tidak ikut terkirim sama sekali', () => {
		const gtag = buatGtag();
		pasangWindow(gtag);

		trackPageView('/kpr');

		expect(gtag).toHaveBeenCalledTimes(1);
		const params = gtag.mock.calls[0][2] as Record<string, unknown>;
		expect('page_title' in params).toBe(false);
	});
});
