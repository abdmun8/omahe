/**
 * Tes komponen `blok-agen-pemasar.svelte` — pelengkung blok agen di detail
 * perumahan (AGEN-OMAHE-13, 2026-11-11). Daftar lengkap agen tidak dirender
 * lagi di `/perumahan/:slug` (backend "Aktifkan semua" bisa membalas puluhan
 * agen) — yang dikunci di sini TIGA cabang:
 *   - tanpa agen (tanpa `?ref=AO-…`) + bukan milik agen properti → blok
 *     ringkas "Dipasarkan oleh semua agen Omahe" + link "Lihat agen Omahe"
 *     yang MEMBAWA `?ref=` (passthrough wajib — CLAUDE.md);
 *   - dengan agen (pengunjung lewat kode pilihan agen `AO-…`, backend sudah
 *     menyaring daftar ke satu agen itu) → kartu `AgenPemasar` asli, blok
 *     umum TIDAK muncul;
 *   - perumahan milik agen properti (`agenProperti`) → tidak ada blok sama
 *     sekali (pemasarnya bukan agen Omahe).
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

describe.skipIf(typeof document === 'undefined')('BlokAgenPemasar (AGEN-OMAHE-13)', () => {
	test('tanpa agen + bukan milik agen properti → blok umum, link membawa ?ref=', () => {
		renderBlok([], 'AO-K2269F4X');
		expect(
			screen.getByRole('heading', { name: 'Dipasarkan oleh semua agen Omahe' })
		).toBeInTheDocument();
		expect(
			screen.getByText('Perumahan ini bisa Anda tanyakan ke agen Omahe mana pun.')
		).toBeInTheDocument();
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

	test('dengan agen (ref AO-… pemilik daftar) → kartu agen, blok umum disembunyikan', () => {
		renderBlok(AGEN, 'AO-K2269F4X');
		expect(screen.getByText('Widya Pratama')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Hubungi' })).toBeInTheDocument();
		expect(
			screen.queryByRole('heading', { name: 'Dipasarkan oleh semua agen Omahe' })
		).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /Lihat agen Omahe/ })).not.toBeInTheDocument();
	});

	test('ref AO-… TIDAK dikenal perumahan ini (balikan agen lain, maks 6 backend) → blok umum', () => {
		// Backend AGEN-OMAHE-13 memotong daftar maks 6 agen saat ref tidak cocok
		// — daftar agen lain itu TIDAK boleh dirender kartu di halaman ini.
		renderBlok(AGEN, 'AO-BU4NK4N2');
		expect(
			screen.getByRole('heading', { name: 'Dipasarkan oleh semua agen Omahe' })
		).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Hubungi' })).not.toBeInTheDocument();
	});

	test('perumahan milik agen properti → tidak ada blok apa pun', () => {
		renderBlok([], null, AGEN_PROPERTI);
		expect(
			screen.queryByRole('heading', { name: 'Dipasarkan oleh semua agen Omahe' })
		).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /Lihat agen Omahe/ })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Hubungi' })).not.toBeInTheDocument();
	});
});
