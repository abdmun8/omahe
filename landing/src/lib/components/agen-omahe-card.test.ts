/**
 * Tes komponen `agen-omahe-card.svelte` — kartu agen di tab "Agen Omahe"
 * halaman Mitra (AGEN-OMAHE-04). Fokus AGEN-OMAHE-08: badge "Promosi" di
 * pojok foto bila `prioritas > 0` (pola unit-card/perumahan-baru-card) —
 * tombol "Hubungi Agen" TIDAK dibedakan (keputusan 2026-10-23, sama dengan
 * tombol perumahan). Toolchain dan polanya sama persis dengan
 * `unit-card.test.ts`: dijalankan `bun run test:component` (vitest + jsdom),
 * `describe.skipIf` wajib karena file ini juga dijemput `bun test` yang
 * tidak punya DOM.
 *
 * Tidak perlu mock `$lib/ref` (beda dari unit-card) — graf komponen ini
 * tidak menyentuh modul itu. Klik "Hubungi Agen" memicu `trackEvent` —
 * `window.gtag` di-stub supaya bisa di-assert (pola lead-form-dialog.test.ts).
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import { waitFor } from '@testing-library/dom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { AgenDirektori } from '$lib/api/types';
import AgenOmaheCard from './agen-omahe-card.svelte';

function buatAgen(override: Partial<AgenDirektori> = {}): AgenDirektori {
	return {
		nama: 'Widya Pratama',
		kantorNama: 'Omahe Bogor',
		fotoUrl: null,
		kodeAgen: 'OMHA-A0001',
		prioritas: 0,
		...override
	};
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe.skipIf(typeof document === 'undefined')('AgenOmaheCard', () => {
	test('badge "Promosi" muncul bila prioritas > 0 (AGEN-OMAHE-08)', () => {
		render(AgenOmaheCard, { agen: buatAgen({ prioritas: 80 }) });

		expect(screen.getByText('Promosi')).toBeInTheDocument();
	});

	test('badge "Promosi" TIDAK muncul bila prioritas 0', () => {
		render(AgenOmaheCard, { agen: buatAgen({ prioritas: 0 }) });

		expect(screen.queryByText('Promosi')).toBeNull();
		// Kartu tetap utuh — nama + kode + CTA tidak bergantung pada badge.
		expect(screen.getByText('Widya Pratama')).toBeInTheDocument();
		expect(screen.getByText('OMHA-A0001')).toBeInTheDocument();
	});

	test('tombol "Hubungi Agen" tidak dibedakan — satu tombol utama untuk semua agen', () => {
		render(AgenOmaheCard, { agen: buatAgen({ prioritas: 80 }) });

		// Tidak ada tombol sekunder varian promosi; CTA hubungi tetap satu.
		expect(screen.getByRole('button', { name: 'Hubungi Agen' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Minat/i })).toBeNull();
	});

	test('klik "Hubungi Agen" → dialog mode agen (judul "Hubungi <nama>") + event analitik', async () => {
		const gtagMock = vi.fn();
		vi.stubGlobal('gtag', gtagMock);
		render(AgenOmaheCard, { agen: buatAgen() });

		await fireEvent.click(screen.getByRole('button', { name: 'Hubungi Agen' }));

		// Isi dialog di-PORTAL ke document.body oleh bits-ui — judul mode
		// agen (`kodeAgen` + `namaAgen`) berbeda dari judul perumahan.
		expect(await screen.findByText('Hubungi Widya Pratama')).toBeInTheDocument();

		// Non-PII: kode agen publik sebagai param event (bukan nama).
		await waitFor(() =>
			expect(gtagMock).toHaveBeenCalledWith('event', 'agen_direktori_hubungi', {
				agen: 'OMHA-A0001'
			})
		);
	});
});
