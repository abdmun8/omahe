/**
 * Tes kartu Mitra Profesional (MITRA-01) — mengunci keputusan §9
 * api-contract.md: nomor WA/Telepon = nomor MITRA sendiri (wa.me 62xxx,
 * pesan pembuka menyebut direktori), TANPA passthrough ?ref= (di luar
 * rantai komisi perumahan), fallback inisial saat logo null, dan badge
 * kategori berlabel manusiawi (KJPP/Notaris, bukan 'kjpp').
 *
 * Dijalankan `bun run test:component` (vitest + jsdom), BUKAN `bun test`
 * — guard skipIf sama pola file test komponen lain.
 */
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import type { PublicMitra } from '$lib/api/types';
import MitraCard from './mitra-card.svelte';

const MITRA_DASAR: PublicMitra = {
	id: '00000000-0000-4000-8000-000000000201',
	nama: 'KJPT Bumi Nilai',
	kategori: 'kjpp',
	wilayahLayanan: 'Jabodetabek & Bandung',
	whatsapp: '6281100000201',
	telepon: '62211234501',
	logoUrl: 'https://picsum.photos/seed/uji/400/400',
	urutan: 1
};

describe.skipIf(typeof document === 'undefined')('MitraCard', () => {
	test('badge kategori berlabel KJPP (bukan kode mentah) + nama & wilayah tampil', () => {
		render(MitraCard, { mitra: MITRA_DASAR });
		expect(screen.getByText('KJPP')).toBeTruthy();
		expect(screen.getByText('KJPT Bumi Nilai')).toBeTruthy();
		expect(screen.getByText('Jabodetabek & Bandung')).toBeTruthy();
	});

	test('tombol WA → wa.me nomor mitra + pesan menyebut nama mitra; tab baru noopener', () => {
		render(MitraCard, { mitra: MITRA_DASAR });
		const wa = screen.getByRole('link', { name: /whatsapp/i }) as HTMLAnchorElement;
		expect(wa.href.startsWith('https://wa.me/6281100000201?text=')).toBe(true);
		expect(decodeURIComponent(wa.href)).toContain('KJPT Bumi Nilai');
		expect(wa.target).toBe('_blank');
		expect(wa.rel).toContain('noopener');
		// Tanpa passthrough ref — mitra di luar rantai komisi.
		expect(wa.search).not.toContain('ref=');
	});

	test('telepon tersedia → tel:+62xxx; tidak tersedia → tombol tidak dirender', () => {
		const { unmount } = render(MitraCard, { mitra: MITRA_DASAR });
		expect((screen.getByRole('link', { name: /telepon/i }) as HTMLAnchorElement).href).toBe(
			'tel:+62211234501'
		);
		unmount();

		render(MitraCard, { mitra: { ...MITRA_DASAR, telepon: null } });
		expect(screen.queryByRole('link', { name: /telepon/i })).toBeNull();
	});

	test('logo null → fallback inisial dua kata pertama nama (aria-hidden)', () => {
		render(MitraCard, { mitra: { ...MITRA_DASAR, logoUrl: null } });
		expect(screen.queryByRole('img')).toBeNull();
		expect(screen.getByText('KB')).toBeTruthy(); // KJPT Bumi → "KB"
	});

	test('kategori notaris → badge "Notaris"', () => {
		render(MitraCard, { mitra: { ...MITRA_DASAR, kategori: 'notaris', nama: 'Notaris Ratna' } });
		expect(screen.getByText('Notaris')).toBeTruthy();
	});
});
