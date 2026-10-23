/**
 * Tes komponen pertama untuk toolchain vitest + @testing-library/svelte —
 * membuktikan toolchain-nya jalan sebelum dipakai lebih luas (TASKS.md
 * §"Component test dasar (1/2)").
 *
 * Yang dikunci di sini (README §"Yang wajib dijaga di setiap PR" &
 * keputusan 2026-09-13 §Kontak langsung di card): tombol WhatsApp
 * SELALU ada (Telepon disembunyikan sejak LEAD-02, 2026-10-03), nomor fallback
 * diambil dari `SITE.whatsapp`/`SITE.telepon` dengan normalisasi 62xxx,
 * dan `konteks` masuk ke pesan pembuka WA supaya lead tetap bisa
 * ditelusuri ke properti mana.
 *
 * File ini dijalankan `bun run test:component` (vitest + jsdom), BUKAN
 * `bun test`. `describe.skipIf` di bawah cuma pengaman: pola file
 * `*.test.ts`-nya sama-sama dijemput `bun test`, dan di runner itu tidak
 * ada DOM (apalagi compiler .svelte) — tanpa guard, file ini akan
 * menggagalkan `bun test` yang tetap harus 23 pass.
 *
 * Iterasi 1 GA4: klik WA/Telepon juga memicu event `whatsapp_click`/
 * `phone_click` (src/lib/analytics.ts) — dikunci di sini bahwa perilaku/
 * render TIDAK berubah, dan nilai param memakai `entitas` kalau diberikan,
 * fallback `konteks` apa adanya kalau tidak (tanpa PII).
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SITE } from '$lib/config';
import { normalisasiNomor } from '$lib/utils';
import ContactButtons from './contact-buttons.svelte';

const KONTEKS = 'Tipe 36 di Griya Asri';

// Nomor di config ditulis format lokal 08xx; link yang dihasilkan wajib
// bentuk internasional tanpa tanda baca — sama dengan aturan backend
// `perumahan` (lihat komentar `normalisasiNomor`).
const wa = normalisasiNomor(SITE.whatsapp);
const telepon = normalisasiNomor(SITE.telepon);

afterEach(() => {
	vi.unstubAllGlobals();
});

describe.skipIf(typeof document === 'undefined')('ContactButtons', () => {
	test('nomor default dari SITE ternormalisasi ke 62xxx', () => {
		expect(wa).toMatch(/^62\d+$/);
		expect(telepon).toMatch(/^62\d+$/);
	});

	test('link WhatsApp: wa.me + nomor default, konteks masuk ke pesan pembuka', () => {
		render(ContactButtons, { konteks: KONTEKS });

		const tautan = screen.getByRole('link', {
			name: `Hubungi via WhatsApp tentang ${KONTEKS}`
		});
		expect(tautan.getAttribute('href')).toContain(`https://wa.me/${wa}`);
		// `konteks` ter-embed di tengah pesan pembuka, bukan tepat setelah `text=`.
		expect(tautan.getAttribute('href')).toContain('text=');
		expect(tautan.getAttribute('href')).toContain(encodeURIComponent(KONTEKS));
	});

	test('Telepon DISEMBUNYIKAN (TAMPILKAN_TELEPON=false, LEAD-02) — hanya WA', () => {
		const { container } = render(ContactButtons, { konteks: KONTEKS });

		expect(container.querySelectorAll('a')).toHaveLength(1);
		expect(screen.queryByRole('link', { name: `Telepon tentang ${KONTEKS}` })).toBeNull();
		expect(container.querySelector('a[href^="tel:"]')).toBeNull();
	});

	test('klik WhatsApp → event GA, tanpa entitas → konteks apa adanya', async () => {
		const gtag = vi.fn();
		vi.stubGlobal('gtag', gtag);
		render(ContactButtons, { konteks: KONTEKS });

		await fireEvent.click(
			screen.getByRole('link', { name: `Hubungi via WhatsApp tentang ${KONTEKS}` })
		);

		expect(gtag).toHaveBeenCalledWith('event', 'whatsapp_click', { perumahan: KONTEKS });
	});

	test('onFormMinat → tombol WhatsApp membuka form (bukan link wa.me)', async () => {
		const gtag = vi.fn();
		vi.stubGlobal('gtag', gtag);
		const onFormMinat = vi.fn();
		const { container } = render(ContactButtons, {
			konteks: KONTEKS,
			entitas: 'Griya Asri',
			onFormMinat
		});

		expect(container.querySelector('a[href*="wa.me"]')).toBeNull();
		await fireEvent.click(
			screen.getByRole('button', { name: `Hubungi via WhatsApp tentang ${KONTEKS}` })
		);
		expect(onFormMinat).toHaveBeenCalledTimes(1);
		expect(gtag).toHaveBeenCalledWith('event', 'whatsapp_click', { perumahan: 'Griya Asri' });
	});

	test('onFormMinat tanpa prop lain → tetap WhatsApp, BUKAN "Minat" emas (varian accent dihapus 2026-10-23)', async () => {
		const onFormMinat = vi.fn();
		const { container } = render(ContactButtons, { konteks: KONTEKS, onFormMinat });

		// Cabang "Minat" (variant accent, MONET-03) sudah dihapus — tombol
		// pembuka form kini SELALU hijau WhatsApp, apa pun status partner.
		expect(screen.queryByRole('button', { name: `Minat tentang ${KONTEKS}` })).toBeNull();
		const tombol = screen.getByRole('button', {
			name: `Hubungi via WhatsApp tentang ${KONTEKS}`
		});
		expect(container.querySelector('a[href*="wa.me"]')).toBeNull();
		await fireEvent.click(tombol);
		expect(onFormMinat).toHaveBeenCalledTimes(1);
	});

	test('prop entitas → jadi nilai param event; pesan WA tetap pakai konteks penuh', async () => {
		const gtag = vi.fn();
		vi.stubGlobal('gtag', gtag);
		render(ContactButtons, { konteks: KONTEKS, entitas: 'Griya Asri' });

		await fireEvent.click(
			screen.getByRole('link', { name: `Hubungi via WhatsApp tentang ${KONTEKS}` })
		);

		expect(gtag).toHaveBeenCalledWith('event', 'whatsapp_click', { perumahan: 'Griya Asri' });
		// Perilaku lama TIDAK berubah — pesan pembuka WA tetap memuat konteks.
		const wa = screen.getByRole('link', { name: `Hubungi via WhatsApp tentang ${KONTEKS}` });
		expect(wa.getAttribute('href')).toContain(encodeURIComponent(KONTEKS));
	});
});
