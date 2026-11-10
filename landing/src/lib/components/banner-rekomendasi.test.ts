/**
 * Tes komponen `banner-rekomendasi.svelte` (KERJASAMA-03, tahap 5) —
 * banner tipis "Rekomendasi dari <nama>" di atas hero homepage. Pola sama
 * dengan komponen lain: vitest + jsdom (`bun run test:component`),
 * `describe.skipIf` wajib karena file ini juga dijemput `bun test` tanpa DOM.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import { waitFor } from '@testing-library/dom';
import { describe, expect, test } from 'vitest';
import BannerRekomendasi from './banner-rekomendasi.svelte';

describe.skipIf(typeof document === 'undefined')('BannerRekomendasi', () => {
	test('nama mitra tampil; teks sesuai copy KERJASAMA-03', () => {
		render(BannerRekomendasi, { props: { nama: 'PT Contoh Mitra' } });
		expect(screen.getByText('PT Contoh Mitra')).toBeInTheDocument();
		expect(screen.getByText(/pilih perumahan favorit Anda/)).toBeInTheDocument();
	});

	test('tutup → banner hilang SAJA (ref tetap di luar tanggung jawab komponen)', async () => {
		render(BannerRekomendasi, { props: { nama: 'PT Contoh Mitra' } });
		fireEvent.click(screen.getByRole('button', { name: 'Tutup banner rekomendasi' }));
		// Update state Svelte 5 flush di microtask — jangan assert sinkron.
		await waitFor(() => expect(screen.queryByRole('region')).toBeNull());
		expect(screen.queryByText('PT Contoh Mitra')).toBeNull();
	});

	test('REF-AGEN-01 — varian agen: tautan "Mau jadi agen juga? Daftar gratis" → /gabung/agen', () => {
		render(BannerRekomendasi, { props: { nama: 'Widya Pratama', varian: 'agen' } });
		expect(screen.getByRole('region', { name: 'Rekomendasi dari agen Omahe' })).toBeInTheDocument();
		const link = screen.getByRole('link', { name: 'Mau jadi agen juga? Daftar gratis' });
		// Href polos tanpa param — halaman tujuan memakai kode agen pada ref
		// global sebagai sponsor (fallback REF-AGEN-01 di sponsor-tersimpan).
		expect(link).toHaveAttribute('href', '/gabung/agen');
	});

	test('varian mitra (bawaan) — tanpa tautan daftar agen (hanya varian agen)', () => {
		render(BannerRekomendasi, { props: { nama: 'PT Contoh Mitra', varian: 'mitra' } });
		expect(
			screen.getByRole('region', { name: 'Rekomendasi dari mitra Omahe' })
		).toBeInTheDocument();
		expect(screen.queryByRole('link')).toBeNull();
	});
});
