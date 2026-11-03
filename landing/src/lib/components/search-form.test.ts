/**
 * Tes komponen `search-form.svelte` — mengunci kontrak form pencarian
 * setelah varian kompak mobile-first masuk (TASKS.md §Monetisasi —
 * "SearchForm kompak"). Yang paling kritis: passthrough `?ref=` TIDAK
 * boleh putus di jalur mana pun (CLAUDE.md — jalur komisi mitra), baik
 * lewat hidden input saat submit form maupun lewat href link
 * "Filter lanjutan" yang menuju /cari.
 *
 * Pola sama persis dengan `unit-card.test.ts`: dijalankan `bun run
 * test:component` (vitest + jsdom), `describe.skipIf` wajib karena file
 * ini juga dijemput `bun test` yang tidak punya DOM. `$lib/ref` di-mock
 * (specifier asli menarik modul virtual `$env/dynamic/public` yang tidak
 * ada di plugin svelte polos) — `withRef()` ditiru baris-per-baris
 * termasuk pemisahan `#hash`.
 *
 * Iterasi 1 GA4: submit form → event `search` (src/lib/analytics.ts).
 * Dikunci: shape param sesuai isian (kosong → ter-strip), varian form
 * benar (`home_kompak` vs `cari`), dan handler TIDAK preventDefault —
 * submit GET native tetap terjadi (no-JS tetap jalan).
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { RegionOption } from '$lib/api/types';
import SearchForm from './search-form.svelte';

vi.mock('$lib/ref', () => ({
	REF_PARAM: 'ref',
	withRef: (path: string, ref: string | null) => {
		if (!ref) return path;
		const [pathname, hash] = path.split('#');
		const sep = pathname.includes('?') ? '&' : '?';
		return `${pathname}${sep}ref=${encodeURIComponent(ref)}${hash ? `#${hash}` : ''}`;
	}
}));

// UNIT-10 — REGIONS test kini membawa `kecamatan` (opsional di tipe) —
// 31.71 sengaja TANPA kecamatan (`[]`) untuk jalur region kosong.
const REGIONS: RegionOption[] = [
	{
		kode: '32.01',
		nama: 'Kab. Bogor, Jawa Barat',
		kecamatan: [
			{ kode: '32.01.11', nama: 'Ciawi' },
			{ kode: '32.01.05', nama: 'Cibinong' }
		]
	},
	{ kode: '31.71', nama: 'Jakarta Selatan, DKI Jakarta', kecamatan: [] }
];

afterEach(() => {
	vi.unstubAllGlobals();
});

describe.skipIf(typeof document === 'undefined')('SearchForm', () => {
	test('form submit GET ke /cari — semantik routing tidak berubah', () => {
		const { container } = render(SearchForm, { regions: REGIONS });

		const form = container.querySelector('form');
		expect(form).not.toBeNull();
		expect(form!.getAttribute('action')).toBe('/cari');
		// Atribut HTML `method` tidak case-sensitive; Svelte merender persis
		// apa yang ditulis di template (`GET`).
		expect(form!.getAttribute('method')).toBe('GET');
	});

	test('ref diteruskan sebagai hidden input (varian default & kompak)', () => {
		for (const kompak of [false, true]) {
			const { container, unmount } = render(SearchForm, {
				regions: REGIONS,
				ref: 'abc123',
				kompak
			});

			const hidden = container.querySelector('input[type="hidden"][name="ref"]');
			expect(hidden).not.toBeNull();
			expect(hidden!.getAttribute('value')).toBe('abc123');
			unmount();
		}
	});

	test('tanpa ref → tidak ada hidden input sama sekali', () => {
		const { container } = render(SearchForm, { regions: REGIONS });

		expect(container.querySelector('input[type="hidden"]')).toBeNull();
	});

	test('label sr-only tetap ter-associate ke field-nya (a11y)', () => {
		render(SearchForm, { regions: REGIONS });

		expect(screen.getByLabelText('Lokasi')).not.toBeNull();
		expect(screen.getByLabelText('Harga minimum')).not.toBeNull();
		expect(screen.getByLabelText('Harga maksimal')).not.toBeNull();
		// UNIT-10 — kotak utama kini kata kunci `q` (bukan lagi "Tipe rumah").
		expect(screen.getByLabelText('Kata kunci')).not.toBeNull();
		expect(screen.getByLabelText('Kecamatan')).not.toBeNull();
		expect(screen.getByLabelText('Kamar tidur')).not.toBeNull();
		expect(screen.getByLabelText('Kamar mandi')).not.toBeNull();
	});

	test('kotak utama kirim name="q" dengan placeholder & seed q ?? tipe (UNIT-10)', () => {
		const { container, unmount } = render(SearchForm, {
			regions: REGIONS,
			nilai: { q: 'griya asri' }
		});
		const q = container.querySelector<HTMLInputElement>('#cari-kata-kunci');
		expect(q!.getAttribute('name')).toBe('q');
		expect(q!.value).toBe('griya asri');
		expect(q!.placeholder).toBe('Nama perumahan, lokasi, atau tipe');
		unmount();

		// URL lama yang masih membawa `?tipe=` tetap terisi ke kotak q —
		// submit berikutnya mengirim `q`, BUKAN mengulang `tipe`.
		const legacy = render(SearchForm, { regions: REGIONS, nilai: { tipe: '36' } });
		expect(legacy.container.querySelector<HTMLInputElement>('#cari-kata-kunci')!.value).toBe('36');
		expect(legacy.container.querySelector('input[name="tipe"]')).toBeNull();
	});

	test('UNIT-10 varian penuh: nilai awal kamar & kecamatan terisi', () => {
		const { container } = render(SearchForm, {
			regions: REGIONS,
			nilai: { regionKode: '32.01', kecamatanKode: '32.01.11', kamarTidurMin: 3, kamarMandiMin: 2 }
		});

		const kecamatan = container.querySelector<HTMLSelectElement>('#cari-kecamatan');
		const tidur = container.querySelector<HTMLSelectElement>('#cari-kamar-tidur');
		const mandi = container.querySelector<HTMLSelectElement>('#cari-kamar-mandi');
		expect(tidur!.value).toBe('3');
		expect(mandi!.value).toBe('2');
		// Opsi kecamatan sesuai kab/kota terpilih (32.01 → Ciawi/Cibinong).
		const opsi = [...kecamatan!.options].map((o) => o.value);
		expect(opsi).toEqual(['', '32.01.11', '32.01.05']);
		expect(kecamatan!.value).toBe('32.01.11');
	});

	test('UNIT-10: kecamatan disabled tanpa lokasi ("Pilih kab/kota dulu"), aktif + opsi setelah pilih lokasi', async () => {
		const { container } = render(SearchForm, { regions: REGIONS });
		const kecamatan = container.querySelector<HTMLSelectElement>('#cari-kecamatan');
		expect(kecamatan!.disabled).toBe(true);
		expect(kecamatan!.options[0].textContent).toBe('Pilih kab/kota dulu');

		await fireEvent.change(screen.getByLabelText('Lokasi'), { target: { value: '32.01' } });
		expect(kecamatan!.disabled).toBe(false);
		const opsi = [...kecamatan!.options].map((o) => ({ v: o.value, t: o.textContent }));
		expect(opsi[0]).toEqual({ v: '', t: 'Semua kecamatan' });
		expect(opsi.map((o) => o.v)).toContain('32.01.11');
	});

	test('UNIT-10: ganti lokasi mengosongkan kecamatan yang tidak ada di kab/kota baru', async () => {
		const { container } = render(SearchForm, {
			regions: REGIONS,
			nilai: { regionKode: '32.01', kecamatanKode: '32.01.11' }
		});
		const kecamatan = container.querySelector<HTMLSelectElement>('#cari-kecamatan');
		expect(kecamatan!.value).toBe('32.01.11');

		// Pindah ke kab/kota yang TIDAK punya kecamatan 32.01.11 → reset.
		await fireEvent.change(screen.getByLabelText('Lokasi'), { target: { value: '31.71' } });
		expect(kecamatan!.value).toBe('');
	});

	test('varian kompak: tanpa baris kecamatan/kamar (hanya varian penuh)', () => {
		const { container } = render(SearchForm, { regions: REGIONS, kompak: true });

		expect(container.querySelector('#cari-kecamatan')).toBeNull();
		expect(container.querySelector('#cari-kamar-tidur')).toBeNull();
		expect(container.querySelector('#cari-kamar-mandi')).toBeNull();
		// Kotak q kompak: placeholder pendek.
		expect(container.querySelector<HTMLInputElement>('#cari-kata-kunci')!.placeholder).toBe(
			'Cari perumahan / lokasi'
		);
	});

	test('varian default (/cari): harga min/maks INPUT + nilai terisi', () => {
		const { container } = render(SearchForm, {
			regions: REGIONS,
			nilai: { regionKode: '32.01', hargaMin: 300_000_000, hargaMaks: 500_000_000, q: '36' }
		});

		const lokasi = container.querySelector<HTMLSelectElement>('#cari-lokasi');
		const min = container.querySelector<HTMLInputElement>('#cari-harga-min');
		const maks = container.querySelector<HTMLInputElement>('#cari-harga-maks');
		const kataKunci = container.querySelector<HTMLInputElement>('#cari-kata-kunci');
		expect(lokasi!.value).toBe('32.01');
		// 2026-10-08 — harga ketik sendiri (type text + inputmode numeric).
		expect(min!.value).toBe('300000000');
		expect(maks!.value).toBe('500000000');
		expect(min!.inputMode).toBe('numeric');
		// Varian penuh TIDAK punya select preset lagi.
		expect(container.querySelector('#cari-harga')).toBeNull();
		expect(kataKunci!.value).toBe('36');
		// Opsi region tetap dirender dari prop `regions`.
		expect(container.querySelectorAll('#cari-lokasi option').length).toBe(REGIONS.length + 1);
	});

	test('varian kompak: select harga tetap di DOM (hanya disembunyikan CSS)', () => {
		// Field tersembunyi tetap ikut submit GET — jangan pernah di-render
		// kondisional, kalau tidak semantik query form berubah.
		const { container } = render(SearchForm, { regions: REGIONS, kompak: true });

		expect(container.querySelector('#cari-harga')).not.toBeNull();
		// Link "Filter lanjutan" jadi pengganti akses harga di mobile.
		expect(screen.getByRole('link', { name: 'Filter lanjutan (harga, dll.)' })).not.toBeNull();
	});

	test('varian kompak: link Filter lanjutan membawa ref ke /cari', () => {
		render(SearchForm, { regions: REGIONS, ref: 'abc123', kompak: true });

		const tautan = screen.getByRole('link', { name: 'Filter lanjutan (harga, dll.)' });
		expect(tautan.getAttribute('href')).toBe('/cari?ref=abc123');
	});

	test('varian kompak: pilihan lokasi & kata kunci ikut di href Filter lanjutan', async () => {
		render(SearchForm, { regions: REGIONS, ref: 'abc123', kompak: true });

		// `await` wajib: efek template (href dari $derived) baru di-flush
		// setelah microtask fireEvent selesai.
		await fireEvent.change(screen.getByLabelText('Lokasi'), {
			target: { value: '32.01' }
		});
		await fireEvent.input(screen.getByLabelText('Kata kunci'), {
			target: { value: '36' }
		});

		const tautan = screen.getByRole('link', { name: 'Filter lanjutan (harga, dll.)' });
		// UNIT-10 — href membawa `q` (bukan lagi `tipe`); ref disisipkan
		// withRef setelahnya (query sudah ada → pemisah `&`).
		expect(tautan.getAttribute('href')).toBe('/cari?regionKode=32.01&q=36&ref=abc123');
	});

	test('varian kompak tanpa isian & tanpa ref → link polos ke /cari', () => {
		render(SearchForm, { regions: REGIONS, kompak: true });

		const tautan = screen.getByRole('link', { name: 'Filter lanjutan (harga, dll.)' });
		expect(tautan.getAttribute('href')).toBe('/cari');
	});

	test('varian default tidak punya link Filter lanjutan (khusus kompak)', () => {
		render(SearchForm, { regions: REGIONS });

		expect(screen.queryByRole('link', { name: /Filter lanjutan/ })).toBeNull();
	});

	test('submit → event GA search dengan param sesuai isian (varian default = cari)', async () => {
		const gtag = vi.fn();
		vi.stubGlobal('gtag', gtag);
		const { container } = render(SearchForm, { regions: REGIONS });

		await fireEvent.change(screen.getByLabelText('Lokasi'), { target: { value: '31.71' } });
		await fireEvent.change(screen.getByLabelText('Harga maksimal'), {
			target: { value: '500000000' }
		});
		await fireEvent.input(screen.getByLabelText('Kata kunci'), { target: { value: ' 45 ' } });

		fireEvent.submit(container.querySelector('form')!);

		// `search_term` di-trim; harga_max jadi angka; harga_min tidak ada di
			// form → undefined → ter-strip total (tidak muncul sebagai key).
		expect(gtag).toHaveBeenCalledWith('event', 'search', {
			search_term: '45',
			region: '31.71',
			harga_max: 500_000_000,
			form: 'cari'
		});
	});

	test('UNIT-10: submit → GA membawa kecamatan & kamar_tidur_min bila terisi', async () => {
		const gtag = vi.fn();
		vi.stubGlobal('gtag', gtag);
		const { container } = render(SearchForm, {
			regions: REGIONS,
			nilai: { regionKode: '32.01', kecamatanKode: '32.01.11', kamarTidurMin: 2 }
		});

		fireEvent.submit(container.querySelector('form')!);

		expect(gtag).toHaveBeenCalledWith('event', 'search', {
			region: '32.01',
			kecamatan: '32.01.11',
			kamar_tidur_min: 2,
			form: 'cari'
		});
	});

	test('submit varian kompak → form: home_kompak; isian kosong ter-strip total', () => {
		const gtag = vi.fn();
		vi.stubGlobal('gtag', gtag);
		const { container } = render(SearchForm, { regions: REGIONS, kompak: true });

		fireEvent.submit(container.querySelector('form')!);

		// Semua param kosong → undefined → ter-strip; sisa cuma nama varian.
		expect(gtag).toHaveBeenCalledWith('event', 'search', { form: 'home_kompak' });
	});

	test('submit TIDAK dicegah — handler tanpa preventDefault, submit GET native tetap jalan', () => {
		// Passthrough ?ref= & bookmarkable URL tergantung submit native; event
		// GA tidak boleh mencegahnya (preventDefault = pencarian mati saat JS aktif).
		vi.stubGlobal('gtag', vi.fn());
		const { container } = render(SearchForm, { regions: REGIONS });

		const event = new Event('submit', { bubbles: true, cancelable: true });
		container.querySelector('form')!.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(false);
	});
});
