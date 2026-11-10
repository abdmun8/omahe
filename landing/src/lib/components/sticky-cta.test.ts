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
 * klik WhatsApp → `whatsapp_click` + LeadFormDialog sumber 'detail'
 * (event `lead_form_open`) — tombol WhatsApp-aja SATU untuk semua
 * perumahan sejak 2026-10-23 (tombol "Minat" emas MONET-03 dihapus;
 * prop `prioritas`/`formMinat` ikut dihapus dari komponen). Tracking
 * tidak mencegat navigasi — tombol tetap link sungguhan.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import { waitFor } from '@testing-library/dom';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
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
	return { slug: 'griya-asri', nama: 'Griya Asri' };
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe.skipIf(typeof document === 'undefined')('StickyCta', () => {
	// SESI-OMAHE-01 — store sesi agen dinamis dalam describe ter-guard
	// (pola `unit-card.test.ts`: `bun test` tidak boleh mengeksekusi runes).
	let store: typeof import('../sesi-agen.svelte');
	beforeAll(async () => {
		store = await import('../sesi-agen.svelte');
	});
	afterEach(() => {
		store?.resetSesiAgenUntukTes();
	});

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

	test('tombol WhatsApp SATU untuk semua (eks partner berbayar pun tanpa "Minat") — klik → whatsapp_click + lead_form_open sumber "detail"', async () => {
		const gtagMock = stubGtag();
		render(StickyCta, propsDasar());

		// Cabang "Minat" (variant accent, MONET-03) sudah dihapus — meski
		// komponen tidak lagi menerima `prioritas`, tombol WhatsApp wajib
		// tetap dirender dan membuka dialog dengan sumber 'detail'.
		expect(screen.queryByRole('button', { name: 'Minat' })).toBeNull();

		// LEAD-02 — WhatsApp = tombol pembuka form (bukan link wa.me langsung).
		const wa = screen.getByRole('button', { name: 'WhatsApp' });
		await fireEvent.click(wa);

		expect(gtagMock).toHaveBeenCalledWith('event', 'whatsapp_click', {
			perumahan: 'Griya Asri'
		});
		expect(await screen.findByText('Minat — Griya Asri')).toBeInTheDocument();

		// $effect berjalan pasca-dialog-terbuka — jangan assert sinkron.
		await waitFor(() =>
			expect(gtagMock).toHaveBeenCalledWith('event', 'lead_form_open', {
				perumahan: 'Griya Asri',
				sumber: 'detail'
			})
		);
		// CTA booking tetap ada di samping WA.
		expect(screen.getByRole('link', { name: 'Ajukan' })).toBeInTheDocument();
	});

	// SESI-OMAHE-01 — varian agen Omahe aktif di sticky bar.
	test('sesi agen aktif → tombol "Daftarkan Pembeli" + dialog agen, TANPA whatsapp_click', async () => {
		const gtagMock = stubGtag();
		store.sesiAgen.agen = {
			kodeAgen: 'OMHA-A0001',
			nama: 'Widya Pratama',
			fotoUrl: null,
			panelUrl: 'https://app.perumahan.test/agen-omahe'
		};
		store.sesiAgen.status = 'siap';
		render(StickyCta, propsDasar());

		// Varian lama tidak dirender; CTA "Ajukan" tetap utuh.
		expect(screen.queryByRole('button', { name: 'WhatsApp' })).toBeNull();
		expect(screen.getByRole('link', { name: 'Ajukan' })).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Daftarkan Pembeli' }));

		// Dialog agen yang terbuka (bukan form minat lama).
		expect(await screen.findByText('Daftarkan Pembeli — Griya Asri')).toBeInTheDocument();
		expect(screen.queryByText('Minat — Griya Asri')).toBeNull();
		// Varian agen BUKAN klik WA — tidak ada whatsapp_click.
		expect(gtagMock).not.toHaveBeenCalledWith('event', 'whatsapp_click', expect.anything());
		await waitFor(() =>
			expect(gtagMock).toHaveBeenCalledWith('event', 'agen_lead_open', {
				perumahan: 'Griya Asri'
			})
		);
	});
});
