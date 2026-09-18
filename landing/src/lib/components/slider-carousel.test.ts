/**
 * Tes komponen `slider-carousel.svelte` — item "Slider carousel homepage"
 * (TASKS.md §Monetisasi). Toolchain dan polanya sama persis dengan
 * `unit-card.test.ts`: dijalankan `bun run test:component` (vitest + jsdom),
 * `describe.skipIf` wajib karena file ini juga dijemput `bun test` yang
 * tidak punya DOM.
 *
 * Autoplay sengaja TIDAK dites (timer = flaky); yang dikunci: fail-soft
 * render null, slide pertama aktif + prioritas loading, jalur link internal
 * (bawa `?ref=` — jalur komisi mitra) vs eksternal (tab baru + noopener),
 * dan jumlah dot = jumlah slide.
 */
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import type { PublicSlider } from '$lib/api/types';
import SliderCarousel from './slider-carousel.svelte';

// Komponen ini mengimpor `$lib/ref` → `$env/dynamic/public` (modul virtual
// yang tidak resolve di plugin svelte polos vitest.config.ts) — di-mock
// per-file, `withRef()` ditiru baris-per-baris dari `src/lib/ref.ts` (split
// `#` dulu, `?ref=`/`&ref=` pada path, hash tempel kembali di belakang).
// Perilaku aslinya dikunci `src/lib/ref.test.ts` di `bun test`.
vi.mock('$lib/ref', () => ({
	withRef: (path: string, ref: string | null) => {
		if (!ref) return path;
		const [pathname, hash] = path.split('#');
		const sep = pathname.includes('?') ? '&' : '?';
		return `${pathname}${sep}ref=${encodeURIComponent(ref)}${hash ? `#${hash}` : ''}`;
	}
}));

/** Slide contoh — override per kasus, bentuk mengikuti api-contract.md §7. */
function buatSlider(override: Partial<PublicSlider> = {}): PublicSlider {
	return {
		id: 'slider-1',
		judul: 'Open House Griya Asri',
		subjudul: 'Sabtu–Minggu',
		gambarUrl: 'https://picsum.photos/seed/uji-1/1600/900',
		linkUrl: null,
		perumahan: { slug: 'griya-asri-bogor', nama: 'Griya Asri Bogor' },
		prioritas: 0,
		...override
	};
}

describe.skipIf(typeof document === 'undefined')('SliderCarousel', () => {
	test('data kosong → tidak ada elemen sama sekali (fail-soft, bukan skeleton)', () => {
		const { container } = render(SliderCarousel, { sliders: [] });

		// Satu-satunya yang tertinggal adalah komentar anchor hydration
		// Svelte (`<!-- -->`) — tanpa elemen, section benar-benar hilang.
		expect(container.querySelector('*')).toBeNull();
	});

	test('slide pertama aktif + judul ter-render; hanya slide pertama eager', () => {
		const { container } = render(SliderCarousel, {
			sliders: [
				buatSlider(),
				buatSlider({ id: 'slider-2', judul: 'Seminar KPR', subjudul: null }),
				buatSlider({ id: 'slider-3', judul: 'Groundbreaking', subjudul: null })
			]
		});

		expect(screen.getByText('Open House Griya Asri')).toBeInTheDocument();

		// Track masih di posisi awal → transform 0%.
		const track = container.querySelector<HTMLElement>('div[style]');
		expect(track?.style.transform).toBe('translateX(-0%)');

		// Lazy load semua KECUALI slide pertama (eager + fetchpriority high).
		const gambar = container.querySelectorAll('img');
		expect(gambar).toHaveLength(3);
		expect(gambar[0].getAttribute('loading')).toBe('eager');
		expect(gambar[0].getAttribute('fetchpriority')).toBe('high');
		expect(gambar[1].getAttribute('loading')).toBe('lazy');
		expect(gambar[1].getAttribute('fetchpriority')).toBeNull();

		// Alt gambar = judul slide (api-contract.md §7 / brief komponen).
		expect(gambar[0].getAttribute('alt')).toBe('Open House Griya Asri');

		// aria-live polite mengumumkan slide aktif.
		expect(screen.getByText(/Slide 1 dari 3/)).toBeInTheDocument();
	});

	test('link internal (linkUrl null) ke /perumahan/:slug bawa ?ref=', () => {
		const { container } = render(SliderCarousel, {
			sliders: [buatSlider()],
			ref: 'uji-ref'
		});

		const tautan = container.querySelector('a');
		expect(tautan?.getAttribute('href')).toBe('/perumahan/griya-asri-bogor?ref=uji-ref');
		// Internal → BUKAN tab baru.
		expect(tautan?.getAttribute('target')).toBeNull();
	});

	test('link eksternal (linkUrl terisi) → tab baru + rel noopener', () => {
		const { container } = render(SliderCarousel, {
			sliders: [buatSlider({ linkUrl: 'https://example.com/acara' })],
			ref: 'uji-ref'
		});

		const tautan = container.querySelector('a');
		expect(tautan?.getAttribute('href')).toBe('https://example.com/acara');
		expect(tautan?.getAttribute('target')).toBe('_blank');
		expect(tautan?.getAttribute('rel')).toContain('noopener');
		// ref TIDAK ditempel ke URL eksternal — itu domain mitra lain.
		expect(tautan?.getAttribute('href')).not.toContain('ref=');
	});

	test('jumlah dot = jumlah slide; slide tunggal tanpa kontrol navigasi', () => {
		const tiga = render(SliderCarousel, {
			sliders: [
				buatSlider(),
				buatSlider({ id: 'slider-2', judul: 'B' }),
				buatSlider({ id: 'slider-3', judul: 'C' })
			]
		});
		// Label dot "Ke slide N: ..." — tidak bisa tertukar dengan
		// prev/next ("Slide sebelumnya"/"Slide berikutnya").
		expect(screen.getAllByRole('button', { name: /Ke slide \d/ })).toHaveLength(3);
		tiga.unmount();

		// Satu slide: dot, prev/next, dan aria-live tidak perlu ada.
		render(SliderCarousel, { sliders: [buatSlider()] });
		expect(screen.queryByRole('button', { name: /Ke slide \d/ })).toBeNull();
		expect(screen.queryByRole('button', { name: 'Slide sebelumnya' })).toBeNull();
		expect(screen.queryByRole('button', { name: 'Slide berikutnya' })).toBeNull();
	});
});
