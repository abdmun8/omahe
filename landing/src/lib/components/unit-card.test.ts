/**
 * Tes komponen `unit-card.svelte` — iterasi (2/2) dari "Component test
 * dasar" (TASKS.md). Toolchain dan polanya sama persis dengan
 * `contact-buttons.test.ts`: dijalankan `bun run test:component`
 * (vitest + jsdom). `describe.skipIf` di bawah tetap wajib — file
 * `*.test.ts` ini juga dijemput `bun test`, dan di runner itu tidak ada
 * DOM (apalagi compiler .svelte) — tanpa guard, `bun test` yang harus
 * tetap 23 pass akan ikut gagal.
 *
 * Objek `UnitListing` dibuat LOKAL lewat `buatUnit()`, bukan di-import
 * dari `fixtures.ts` — fixture akan berganti sumber ke API asli begitu
 * UNIT-04 mendarat, dan ekspektasi tes ini tidak boleh ikut bergeser.
 * Yang dikunci adalah perilaku komponen terhadap field tertentu, bukan
 * isi fixture.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import type { UnitListing } from '$lib/api/types';
import UnitCard from './unit-card.svelte';

// Kartu ini mengimpor `$lib/ref`, yang mengimpor modul virtual `$env/dynamic/public` —
// modul itu hanya di-resolve plugin sveltekit, sedangkan `vitest.config.ts`
// sengaja pakai plugin svelte polos, jadi `ref.ts` asli gagal di-transform di sini
// (beda dari `contact-buttons.test.ts` yang grafnya tidak menyentuh `ref.ts`).
// Karena `vitest.config.ts` tidak boleh diubah, modulnya yang di-mock dari file
// tes ini: specifier `$lib/ref` bisa di-resolve lewat alias config, sehingga
// interceptor mock vitest sempat menggantikannya SEBELUM `ref.ts` asli dimuat.
// `withRef()` ditiru setia baris-per-baris dari `src/lib/ref.ts` (tanpa env):
// split `#` dulu, sisipkan `?ref=`/`&ref=` pada path-nya, BARU tempelkan hash
// kembali di belakang — ref harus berdiri SEBELUM hash, bukan sesudahnya.
// Ini bukan akademis: `hrefDetail` di kartu ini memang mengandung `#tipe-unit`,
// dan `?ref=x#hash` vs `#hash?ref=x` itu beda URL total untuk browser.
// Perilaku aslinya sudah dikunci `src/lib/ref.test.ts` di `bun test`.
// Bagian ini hanya berjalan di runner vitest: di `bun test` seluruh file ini
// ter-skip (`describe.skipIf` di bawah) dan stub env serupa sudah ada di
// `src/lib/test/setup.ts`.
vi.mock('$lib/ref', () => ({
	withRef: (path: string, ref: string | null) => {
		if (!ref) return path;
		const [pathname, hash] = path.split('#');
		const sep = pathname.includes('?') ? '&' : '?';
		return `${pathname}${sep}ref=${encodeURIComponent(ref)}${hash ? `#${hash}` : ''}`;
	}
}));

/**
 * Varian dasar: harga tunggal 385 jt, stok 10 (di atas ambang badge),
 * tanpa developer. Tiap tes menimpa field yang relevan lewat `override` —
 * satu factory, banyak kasus.
 */
function buatUnit(override: Partial<UnitListing> = {}): UnitListing {
	return {
		id: 'griya-asri-36',
		tipe: '36/72',
		luasTanah: 72,
		luasBangunan: 36,
		hargaMin: 385_000_000,
		hargaMax: 385_000_000,
		unitTersedia: 10,
		perumahan: {
			nama: 'Griya Asri',
			slug: 'griya-asri',
			regionKode: '32.01',
			regionNama: 'Kab. Bogor, Jawa Barat',
			prioritas: 0
		},
		developer: null,
		fotoUrl: null,
		...override
	};
}

describe.skipIf(typeof document === 'undefined')('UnitCard', () => {
	test('harga tunggal 385 jt tampil sebagai harga ringkas', () => {
		// Diverifikasi dari src/lib/utils.ts sebelum menulis assert:
		// formatRentangHarga(385e6, 385e6) → min === max → formatRupiah(385e6)
		// → 385e6 < 1e9 → `Rp${Math.round(385e6 / 1e6)} jt` = 'Rp385 jt'.
		render(UnitCard, { unit: buatUnit() });

		// Hanya paragraf harga yang memuat angka harga di teksnya.
		const harga = screen.getByText(/385/);
		expect(harga.textContent).toBe('Rp385 jt');
	});

	test('baris developer muncul kalau unit.developer terisi', () => {
		render(UnitCard, {
			unit: buatUnit({ developer: { nama: 'Citra Land Nusantara', slug: 'citra-land' } })
		});

		expect(screen.getByText(/Dikembangkan oleh/)).toBeInTheDocument();
		const tautan = screen.getByRole('link', { name: 'Citra Land Nusantara' });
		// ref tidak dikirim → withRef mengembalikan path apa adanya.
		expect(tautan.getAttribute('href')).toBe('/developer/citra-land');
	});

	test('baris developer TIDAK muncul kalau unit.developer null', () => {
		render(UnitCard, { unit: buatUnit({ developer: null }) });

		expect(screen.queryByText(/Dikembangkan oleh/)).toBeNull();
		expect(screen.queryByRole('link', { name: 'Citra Land Nusantara' })).toBeNull();
	});

	test('link nama perumahan membawa ref, disisipkan SEBELUM hash', () => {
		// hrefDetail = withRef('/perumahan/griya-asri#tipe-unit', ref) —
		// satu-satunya link internal di kartu ini yang path-nya mengandung
		// hash. Test ini sekaligus membuktikan mock withRef di atas benar
		// menangani pemisahan hash (bug mock lama: ref menempel SETELAH hash).
		render(UnitCard, { unit: buatUnit(), ref: 'abc123' });

		const tautan = screen.getByRole('link', { name: 'Griya Asri' });
		expect(tautan.getAttribute('href')).toBe('/perumahan/griya-asri?ref=abc123#tipe-unit');
	});

	test('badge "unit tersisa" muncul kalau unitTersedia <= 3', () => {
		render(UnitCard, { unit: buatUnit({ unitTersedia: 2 }) });

		expect(screen.getByText('2 unit tersisa')).toBeInTheDocument();
		// Info jumlah di <dl> tetap dirender — badge urgensi bukan penggantinya.
		expect(screen.getByText('2 unit tersedia')).toBeInTheDocument();
	});

	test('badge "unit tersisa" tidak muncul kalau unitTersedia > 3', () => {
		render(UnitCard, { unit: buatUnit({ unitTersedia: 10 }) });

		expect(screen.queryByText(/unit tersisa/)).toBeNull();
		// ...sedangkan info utama "10 unit tersedia" tetap ada.
		expect(screen.getByText('10 unit tersedia')).toBeInTheDocument();
	});

	test('badge "Promosi" muncul kalau perumahan.prioritas > 0 (MONET-01)', () => {
		render(UnitCard, {
			unit: buatUnit({
				perumahan: {
					nama: 'Griya Asri',
					slug: 'griya-asri',
					regionKode: '32.01',
					regionNama: 'Kab. Bogor, Jawa Barat',
					prioritas: 50
				}
			})
		});

		expect(screen.getByText('Promosi')).toBeInTheDocument();
	});

	test('badge "Promosi" tidak muncul kalau perumahan.prioritas 0', () => {
		// Default buatUnit() sudah prioritas 0 (gratis) — tidak ada badge.
		render(UnitCard, { unit: buatUnit() });

		expect(screen.queryByText('Promosi')).toBeNull();
	});

	test('badge "Promosi" tidak muncul kalau prioritas undefined (data lama), tanpa crash', () => {
		// Response API sebelum MONET-01 tidak punya field ini — komponen
		// harus tetap render utuh, bukan error karena `undefined > 0`.
		const perumahanLama = {
			nama: 'Griya Asri',
			slug: 'griya-asri',
			regionKode: '32.01',
			regionNama: 'Kab. Bogor, Jawa Barat'
		} as UnitListing['perumahan'];
		render(UnitCard, { unit: buatUnit({ perumahan: perumahanLama }) });

		expect(screen.queryByText('Promosi')).toBeNull();
		// Kartu tetap render normal walau field barunya absen.
		expect(screen.getByText('Rp385 jt')).toBeInTheDocument();
	});

	// MONET-03: partner berbayar (prioritas > 0) — slot WA jadi "Form Minat".
	const perumahanBerbayar = {
		nama: 'Griya Asri',
		slug: 'griya-asri',
		regionKode: '32.01',
		regionNama: 'Kab. Bogor, Jawa Barat',
		prioritas: 50
	};

	test('prioritas > 0 → tombol "Form Minat" menggantikan WhatsApp, Telepon tetap (MONET-03)', () => {
		render(UnitCard, { unit: buatUnit({ perumahan: perumahanBerbayar }) });
		const konteks = '36/72 di Griya Asri'; // ${unit.tipe} di ${unit.perumahan.nama} (buatUnit default)

		expect(
			screen.getByRole('button', { name: `Isi form minat tentang ${konteks}` })
		).toBeInTheDocument();
		// Slot WA DIGANTI — link WA justru TIDAK boleh ada di kartu berbayar.
		expect(
			screen.queryByRole('link', { name: `Hubungi via WhatsApp tentang ${konteks}` })
		).toBeNull();
		// Telepon tidak ikut berganti.
		expect(screen.getByRole('link', { name: `Telepon tentang ${konteks}` })).toBeInTheDocument();
	});

	test('prioritas 0 → WhatsApp muncul, tanpa tombol Form Minat (perilaku gratis tidak berubah)', () => {
		// Default buatUnit() sudah prioritas 0 — kartu partner GRATIS.
		render(UnitCard, { unit: buatUnit() });
		const konteks = '36/72 di Griya Asri'; // ${unit.tipe} di ${unit.perumahan.nama} (buatUnit default)

		expect(
			screen.getByRole('link', { name: `Hubungi via WhatsApp tentang ${konteks}` })
		).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: `Isi form minat tentang ${konteks}` })).toBeNull();
	});

	test('prioritas undefined (data lama) → WhatsApp muncul, tanpa tombol Form Minat', () => {
		// Respons API sebelum MONET-01: `undefined > 0` = false → gratis,
		// TANPA crash — konsisten dengan gating badge "Promosi" di atas.
		const perumahanLama = {
			nama: 'Griya Asri',
			slug: 'griya-asri',
			regionKode: '32.01',
			regionNama: 'Kab. Bogor, Jawa Barat'
		} as UnitListing['perumahan'];
		render(UnitCard, { unit: buatUnit({ perumahan: perumahanLama }) });
		const konteks = '36/72 di Griya Asri'; // ${unit.tipe} di ${unit.perumahan.nama} (buatUnit default)

		expect(
			screen.getByRole('link', { name: `Hubungi via WhatsApp tentang ${konteks}` })
		).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: `Isi form minat tentang ${konteks}` })).toBeNull();
	});

	test('klik "Form Minat" → dialog lead terbuka (judul dialog terlihat)', async () => {
		render(UnitCard, { unit: buatUnit({ perumahan: perumahanBerbayar }) });

		fireEvent.click(screen.getByRole('button', { name: /Isi form minat/ }));

		// Judul Dialog.Title — teks lengkap supaya unik terhadap tombol
		// "Form Minat" yang juga memuat frasa itu.
		expect(await screen.findByText('Form Minat — Griya Asri')).toBeInTheDocument();
	});

	test('tombol WhatsApp & Telepon selalu ada di DOM, apa pun kondisi lainnya', () => {
		// Nama perumahan sengaja dibedakan antar varian: cleanup hanya jalan
		// per-test (afterEach), jadi kedua kartu sempat hidup bersamaan di
		// satu body — konteks (yang jadi bagian aria-label tombol) harus
		// unik supaya getByRole tidak ambigu.
		const varian: UnitListing[] = [
			buatUnit(), // developer null, tanpa badge
			buatUnit({
				unitTersedia: 1, // badge muncul
				developer: { nama: 'Citra Land Nusantara', slug: 'citra-land' },
				perumahan: {
					nama: 'Villa Puncak Asri',
					slug: 'villa-puncak-asri',
					regionKode: '32.03',
					regionNama: 'Kab. Cianjur, Jawa Barat',
					prioritas: 0
				}
			})
		];

		for (const unit of varian) {
			const konteks = `${unit.tipe} di ${unit.perumahan.nama}`;
			render(UnitCard, { unit });

			expect(
				screen.getByRole('link', { name: `Hubungi via WhatsApp tentang ${konteks}` })
			).toBeInTheDocument();
			expect(screen.getByRole('link', { name: `Telepon tentang ${konteks}` })).toBeInTheDocument();
		}
	});
});
