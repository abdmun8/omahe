/**
 * Tes komponen `banner-aplikasi.svelte` — vitest + jsdom
 * (`bun run test:component`); `describe.skipIf` wajib karena file ini juga
 * dijemput `bun test` tanpa DOM.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import { waitFor } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import BannerAplikasi from './banner-aplikasi.svelte';

const UA_ANDROID =
	'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36';
const UA_IPHONE =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';

function aturUa(ua: string) {
	Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true });
}
function aturTerpasang(fn?: () => Promise<{ id: string }[]>) {
	Object.defineProperty(window.navigator, 'getInstalledRelatedApps', {
		value: fn,
		configurable: true
	});
}

describe.skipIf(typeof document === 'undefined')('BannerAplikasi', () => {
	const uaAsli = navigator.userAgent;

	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
		aturTerpasang(undefined);
	});
	afterEach(() => {
		aturUa(uaAsli);
		aturTerpasang(undefined);
		vi.restoreAllMocks();
	});

	test('Android, aplikasi belum terpasang → banner + tautan Play Store ber-referrer', async () => {
		aturUa(UA_ANDROID);
		aturTerpasang(async () => []);
		render(BannerAplikasi);
		const pasang = await screen.findByRole('link', { name: 'Pasang' });
		expect(pasang.getAttribute('href')).toContain('id=id.co.omahe.app.twa');
		expect(pasang.getAttribute('href')).toContain('referrer=');
		expect(screen.getByText('Aplikasi Omahe')).toBeInTheDocument();
	});

	test('aplikasi sudah terpasang → tidak tampil', async () => {
		aturUa(UA_ANDROID);
		const cek = vi.fn(async () => [{ id: 'id.co.omahe.app.twa' }]);
		aturTerpasang(cek);
		render(BannerAplikasi);
		await waitFor(() => expect(cek).toHaveBeenCalled());
		await new Promise((r) => setTimeout(r, 0));
		expect(screen.queryByRole('region')).toBeNull();
	});

	test('iPhone → tidak tampil', async () => {
		aturUa(UA_IPHONE);
		render(BannerAplikasi);
		await new Promise((r) => setTimeout(r, 0));
		expect(screen.queryByRole('region')).toBeNull();
	});

	test('tutup → hilang & tidak tampil lagi pada kunjungan berikutnya', async () => {
		aturUa(UA_ANDROID);
		const { unmount } = render(BannerAplikasi);
		fireEvent.click(await screen.findByRole('button', { name: 'Tutup banner aplikasi' }));
		await waitFor(() => expect(screen.queryByRole('region')).toBeNull());
		unmount();

		render(BannerAplikasi);
		await new Promise((r) => setTimeout(r, 0));
		expect(screen.queryByRole('region')).toBeNull();
	});
});
