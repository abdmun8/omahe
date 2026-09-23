/**
 * LOKASI-03 — `peta-lokasi` adalah gerbang iframe untuk URL peta dari data
 * tenant: iframe HANYA untuk embed Google Maps https; blok tidak dirender
 * kalau alamat & peta kosong. Dijalankan vitest (`bun run test:component`).
 */
import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import PetaLokasi from './peta-lokasi.svelte';

const EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12';

describe.skipIf(typeof document === 'undefined')('peta-lokasi', () => {
	test('embed valid → iframe dengan src persis', () => {
		const { container } = render(PetaLokasi, { address: 'Jl. Raya 1', mapsEmbedUrl: EMBED });
		expect(container.querySelector('iframe')?.getAttribute('src')).toBe(EMBED);
		expect(container.textContent).toContain('Jl. Raya 1');
	});

	test('URL bukan embed Google Maps → tidak ada iframe (alamat tetap tampil)', () => {
		const { container } = render(PetaLokasi, {
			address: 'Jl. Raya 1',
			mapsEmbedUrl: 'https://evil.com/maps/embed'
		});
		expect(container.querySelector('iframe')).toBeNull();
		expect(container.textContent).toContain('Jl. Raya 1');
	});

	test('alamat & peta kosong → tidak merender apa pun', () => {
		const { container } = render(PetaLokasi, { address: null, mapsEmbedUrl: null });
		expect(container.querySelector('section')).toBeNull();
	});

	test('petunjuk arah javascript: tidak jadi link', () => {
		const { container } = render(PetaLokasi, {
			mapsEmbedUrl: EMBED,
			directionsUrl: 'javascript:alert(1)'
		});
		expect(container.querySelector('a')).toBeNull();
	});
});
