/**
 * Tes kartu "Baru di Omahe" / "Promo Pilihan" homepage — mengunci:
 *   1. Badge "Promo" HANYA saat prop `promo` aktif (bawaan tanpa badge —
 *      seksi "Baru di Omahe" tidak boleh ikut berbadge).
 *   2. Passthrough `?ref=` ke link detail perumahan (kewajiban wajib,
 *      `src/lib/ref.test.ts` — kartu ini satu-satunya pintu kedua seksi).
 *
 * Dijalankan `bun run test:component` (vitest + jsdom), BUKAN `bun test`
 * — guard skipIf sama pola file test komponen lain.
 */
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import type { PerumahanDirektori } from '$lib/api/types';
import PerumahanBaruCard from './perumahan-baru-card.svelte';

// Kartu ini meng-import `$lib/ref` → modul virtual `$env/dynamic/public`
// yang hanya di-resolve plugin sveltekit; vitest.config.ts sengaja plugin
// svelte pola — mock-kan dari file tes, pola persis `unit-card.test.ts`
// (salinan setia `withRef`, perilaku asli dikunci `src/lib/ref.test.ts`).
vi.mock('$lib/ref', () => ({
	withRef: (path: string, ref: string | null) => {
		if (!ref) return path;
		const [pathname, hash] = path.split('#');
		const sep = pathname.includes('?') ? '&' : '?';
		return `${pathname}${sep}ref=${encodeURIComponent(ref)}${hash ? `#${hash}` : ''}`;
	}
}));

const PERUMAHAN: PerumahanDirektori = {
	nama: 'Griya Asri Bogor',
	slug: 'griya-asri-bogor',
	fotoUrl: null,
	regionNama: 'Kab. Bogor, Jawa Barat',
	developer: null,
	jumlahTipeTersedia: 4,
	prioritas: 2
};

describe.skipIf(typeof document === 'undefined')('PerumahanBaruCard', () => {
	test('bawaan (Baru di Omahe): TANPA badge "Promo"; link detail tanpa query', () => {
		render(PerumahanBaruCard, { perumahan: PERUMAHAN });
		expect(screen.queryByText('Promo')).toBeNull();
		const link = screen.getByRole('link') as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/perumahan/griya-asri-bogor');
	});

	test('prop promo → badge "Promo" muncul, link tetap satu ke detail', () => {
		render(PerumahanBaruCard, { perumahan: PERUMAHAN, promo: true });
		expect(screen.getByText('Promo')).toBeInTheDocument();
		expect(screen.getAllByRole('link')).toHaveLength(1);
	});

	test('ref dipasang passthrough ke link detail (atribusi mitra)', () => {
		render(PerumahanBaruCard, { perumahan: PERUMAHAN, ref: 'abc123' });
		const link = screen.getByRole('link') as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/perumahan/griya-asri-bogor?ref=abc123');
	});
});
