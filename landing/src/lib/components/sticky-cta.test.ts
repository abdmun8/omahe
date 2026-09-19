/**
 * Tes komponen `sticky-cta.svelte` — sticky bottom bar CTA di halaman detail
 * perumahan (§Mobile-first). Toolchain dan polanya sama persis dengan
 * `unit-card.test.ts`: dijalankan `bun run test:component` (vitest + jsdom),
 * `describe.skipIf` wajib karena file ini juga dijemput `bun test` yang
 * tidak punya DOM.
 *
 * `$lib/ref` di-mock per-file dengan alasan yang sama seperti
 * `unit-card.test.ts`/`slider-carousel.test.ts`: graf komponen ini
 * menyentuh `$env/dynamic/public` (via `ajukanUrl`) yang tidak di-resolve
 * plugin svelte polos `vitest.config.ts`. `withRef()` ditiru baris-per-baris
 * dari `src/lib/ref.ts`; `ajukanUrl()` ditiru bentuk aslinya dengan base
 * kosong (`env.PUBLIC_BOOKING_BASE_URL` tidak ada di vitest) — yang dikunci
 * tetap passthrough `ref` SEBELUM diuji lebih jauh.
 *
 * Iterasi 2 GA4: klik "Ajukan" → `cta_ajukan` { perumahan, ada_ref }
 * (diagnostik putusnya rantai komisi — CLAUDE.md §Redirect `/p/:slug`),
 * klik WA partner gratis → `whatsapp_click`, dan partner berbayar
 * (MONET-03) → "Form Minat" membuka LeadFormDialog dengan sumber 'detail'
 * (event `lead_form_open`). Tracking tidak mencegat navigasi — tombol
 * tetap link sungguhan.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import { waitFor } from '@testing-library/dom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import StickyCta from './sticky-cta.svelte';

vi.mock('$lib/ref', () => ({
	withRef: (path: string, ref: string | null) => {
		if (!ref) return path;
		const [pathname, hash] = path.split('#');
		const sep = pathname.includes('?') ? '&' : '?';
		return `${pathname}${sep}ref=${encodeURIComponent(ref)}${hash ? `#${hash}` : ''}`;
	},
	ajukanUrl: (slug: string, ref: string | null) => {
		const withRef = (p: string, r: string | null) => {
			if (!r) return p;
			const [pathname, hash] = p.split('#');
			const sep = pathname.includes('?') ? '&' : '?';
			return `${pathname}${sep}ref=${encodeURIComponent(r)}${hash ? `#${hash}` : ''}`;
		};
		return withRef(`/ajukan/${encodeURIComponent(slug)}`, ref);
	}
}));

/** Stub `window.gtag` (jsdom: globalThis === window) — pulihkan di afterEach.
 *  Pola sama persis dengan `lead-form-dialog.test.ts`. */
function stubGtag() {
	const gtagMock = vi.fn();
	vi.stubGlobal('gtag', gtagMock);
	return gtagMock;
}

function propsDasar() {
	return { slug: 'griya-asri', nama: 'Griya Asri', prioritas: 0 };
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe.skipIf(typeof document === 'undefined')('StickyCta', () => {
	test('klik "Ajukan" dengan ref → cta_ajukan { perumahan, ada_ref: true }, href bawa ?ref=', async () => {
		const gtagMock = stubGtag();
		render(StickyCta, { ...propsDasar(), ref: 'abc123' });

		const ajukan = screen.getByRole('link', { name: 'Ajukan' });
		// ref passthrough ke app `perumahan` — rantai komisi wajib utuh.
		expect(ajukan.getAttribute('href')).toBe('/ajukan/griya-asri?ref=abc123');

		await fireEvent.click(ajukan);

		expect(gtagMock).toHaveBeenCalledWith('event', 'cta_ajukan', {
			perumahan: 'Griya Asri',
			ada_ref: true
		});
	});

	test('klik "Ajukan" tanpa ref → ada_ref: false (bukan undefined/true)', async () => {
		const gtagMock = stubGtag();
		render(StickyCta, propsDasar());

		const ajukan = screen.getByRole('link', { name: 'Ajukan' });
		expect(ajukan.getAttribute('href')).toBe('/ajukan/griya-asri');

		await fireEvent.click(ajukan);

		expect(gtagMock).toHaveBeenCalledWith('event', 'cta_ajukan', {
			perumahan: 'Griya Asri',
			ada_ref: false
		});
	});

	test('partner gratis (prioritas 0) → tombol WhatsApp; klik → whatsapp_click { perumahan }', async () => {
		const gtagMock = stubGtag();
		render(StickyCta, propsDasar());

		expect(screen.queryByRole('button', { name: 'Form Minat' })).toBeNull();

		const wa = screen.getByRole('link', { name: 'WhatsApp' });
		await fireEvent.click(wa);

		expect(gtagMock).toHaveBeenCalledWith('event', 'whatsapp_click', {
			perumahan: 'Griya Asri'
		});
		// CTA booking tetap ada di samping WA.
		expect(screen.getByRole('link', { name: 'Ajukan' })).toBeInTheDocument();
	});

	test('partner berbayar (prioritas > 0) → klik "Form Minat" membuka dialog + lead_form_open sumber "detail"', async () => {
		const gtagMock = stubGtag();
		render(StickyCta, { ...propsDasar(), prioritas: 50 });

		// Slot WA DIGANTI "Form Minat" — link WA tidak boleh ada.
		expect(screen.queryByRole('link', { name: 'WhatsApp' })).toBeNull();
		expect(screen.getByRole('button', { name: 'Form Minat' })).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Form Minat' }));

		// Isi dialog di-PORTAL ke document.body oleh bits-ui — screen query
		// mencari di seluruh body (pola lead-form-dialog.test.ts).
		expect(await screen.findByText('Form Minat — Griya Asri')).toBeInTheDocument();

		// $effect berjalan pasca-dialog-terbuka — jangan assert sinkron.
		await waitFor(() =>
			expect(gtagMock).toHaveBeenCalledWith('event', 'lead_form_open', {
				perumahan: 'Griya Asri',
				sumber: 'detail'
			})
		);
		// "Ajukan" tetap dirender — booking tidak digantikan form minat.
		expect(screen.getByRole('link', { name: 'Ajukan' })).toBeInTheDocument();
	});
});
