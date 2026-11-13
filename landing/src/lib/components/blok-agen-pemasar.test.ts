/**
 * Tes komponen `blok-agen-pemasar.svelte` — blok agen di detail perumahan
 * (AGEN-OMAHE-15, 2026-11-13, merevisi AGEN-OMAHE-13). Cabang yang dikunci:
 *   - pengunjung lewat `?ref=AO-…` pemilik daftar → kartu agen itu saja;
 *   - daftar agen premium (tanpa ref / ref AO tak dikenal) → kartu agen +
 *     link "Lihat semua agen Omahe" yang MEMBAWA `?ref=`;
 *   - daftar kosong + bukan milik agen properti → blok ringkas "Agen Omahe"
 *     + link "Lihat agen Omahe" (passthrough `?ref=` wajib — CLAUDE.md);
 *   - perumahan milik agen properti tanpa agen → tidak ada blok.
 *
 * Toolchain dan polanya sama persis dengan `unit-card.test.ts`: dijalankan
 * `bun run test:component` (vitest + jsdom), `describe.skipIf` wajib karena
 * file ini juga dijemput `bun test` yang tidak punya DOM. `$lib/ref` di-mock
 * per-file dengan alasan yang sama seperti unit-card (modul virtual
 * `$env/dynamic/public` tidak di-resolve plugin svelte polos); `withRef()`
 * ditiru baris-per-baris dari `src/lib/ref.ts`.
 */
import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { AgenPemasar as TipeAgenPemasar, AgenRef } from '$lib/api/types';

vi.mock('$lib/ref', () => ({
	withRef: (path: string, ref: string | null) => {
		if (!ref) return path;
		const [pathname, hash] = path.split('#');
		const sep = pathname.includes('?') ? '&' : '?';
		return `${pathname}${sep}ref=${encodeURIComponent(ref)}${hash ? `#${hash}` : ''}`;
	}
}));

import BlokAgenPemasar from './blok-agen-pemasar.svelte';

const AGEN: TipeAgenPemasar[] = [
	{
		nama: 'Widya Pratama',
		kantorNama: 'Omahe Bogor',
		fotoUrl: null,
		kodeAgen: 'OMH-7KQ2MX',
		kodeRef: 'AO-K2269F4X'
	}
];
const AGEN_PROPERTI: AgenRef = { nama: 'Widya Property', slug: 'widya-property', logoUrl: null };

function renderBlok(agen: TipeAgenPemasar[], ref: string | null, agenProperti?: AgenRef | null) {
	return render(BlokAgenPemasar, {
		agen,
		ref,
		perumahanSlug: 'griya-asri-bogor',
		namaPerumahan: 'Griya Asri Bogor',
		opsiTipe: ['36/72'],
		agenProperti: agenProperti ?? null
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe.skipIf(typeof document === 'undefined')('BlokAgenPemasar (AGEN-OMAHE-15)', () => {
	test('tanpa agen + bukan milik agen properti → blok umum, link membawa ?ref=', () => {
		renderBlok([], 'AO-K2269F4X');
		expect(screen.getByRole('heading', { name: 'Agen Omahe' })).toBeInTheDocument();
		// `/mitra?tab=agen` sudah punya query → withRef menyambung dengan `&ref=`.
		expect(screen.getByRole('link', { name: /Lihat agen Omahe/ })).toHaveAttribute(
			'href',
			'/mitra?tab=agen&ref=AO-K2269F4X'
		);
	});

	test('tanpa ref sama sekali → blok umum tanpa ref (href bersih)', () => {
		renderBlok([], null);
		expect(screen.getByRole('link', { name: /Lihat agen Omahe/ })).toHaveAttribute(
			'href',
			'/mitra?tab=agen'
		);
	});

	test('ref AO-… pemilik daftar → kartu agen saja, tanpa link direktori', () => {
		renderBlok(AGEN, 'AO-K2269F4X');
		expect(screen.getByText('Widya Pratama')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Hubungi' })).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'Agen Omahe' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /Lihat semua agen/ })).not.toBeInTheDocument();
	});

	test('daftar agen premium tanpa ref → kartu agen + link "Lihat semua agen Omahe"', () => {
		renderBlok(AGEN, null);
		expect(screen.getByText('Widya Pratama')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Lihat semua agen Omahe/ })).toHaveAttribute(
			'href',
			'/mitra?tab=agen'
		);
	});

	test('ref AO-… tak dikenal (balikan agen lain) → daftar agen, ref ikut link', () => {
		renderBlok(AGEN, 'AO-BU4NK4N2');
		expect(screen.getByText('Widya Pratama')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Lihat semua agen Omahe/ })).toHaveAttribute(
			'href',
			'/mitra?tab=agen&ref=AO-BU4NK4N2'
		);
	});

	test('perumahan milik agen properti tanpa agen → tidak ada blok apa pun', () => {
		renderBlok([], null, AGEN_PROPERTI);
		expect(screen.queryByRole('heading', { name: 'Agen Omahe' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /agen Omahe/ })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Hubungi' })).not.toBeInTheDocument();
	});
});
