/**
 * Tes komponen `agen-lead-dialog.svelte` — dialog "Daftarkan Pembeli"
 * (SESI-OMAHE-01 + AGEN-OMAHE-11). Pola `lead-form-dialog.test.ts` (vitest
 * + jsdom, `describe.skipIf` wajib untuk `bun test`).
 *
 * Yang dikunci:
 *   - field isian (nama/WA pembeli, tipe opsional preselect, catatan) +
 *     teks kecil proteksi 60 hari;
 *   - submit POST `/api/agen-lead` dengan body kontrak (`tipeSlug` =
 *     slugTipe dari nama tipe, TANPA `ref` sama sekali);
 *   - sukses → "Pembeli terdaftar ✓ — terlindungi s.d. …" + tombol
 *     "Lihat di Panel Agen" (panelUrl dari store) + "Daftarkan pembeli
 *     lain"; event GA `agen_lead_submit` TANPA PII pembeli;
 *   - 409 proteksi → pesan backend tampil, form dipertahankan;
 *   - 401 → pesan "Sesi berakhir…" + tombol "Lanjut lewat WhatsApp" yang
 *     MENIOLKAN store sesi (bukan saat respons tiba — dialog ini dirender
 *     di cabang `sesiAgen.agen`, menol lebih awal = dialog lenyap sebelum
 *     pesan terbaca).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { waitFor } from '@testing-library/dom';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import type { AgenSaya } from '$lib/api/types';
import AgenLeadDialog from './agen-lead-dialog.svelte';

// Store runes (`../sesi-agen.svelte`) TIDAK boleh di-import statis: `bun test`
// juga menjemput file ini dan `$state` meledak di runner itu walau test-nya
// di-skip (terverifikasi bun 1.4.4 — beda dari import `.svelte` yang di-skip
// anggun). Import dinamis di `beforeAll` DI DALAM describe yang ter-guard —
// hook level file tetap dieksekusi bun walau semua test di-skip, hook di
// dalam describe ter-skip ikut tidak jalan.
const AGEN: AgenSaya = {
	kodeAgen: 'OMHA-A0001',
	nama: 'Widya Pratama',
	fotoUrl: null,
	panelUrl: 'https://app.perumahan.test/agen-omahe',
	perumahanSlugs: null
};

type ResLike = { ok: boolean; status: number; json: () => Promise<unknown> };

function stubFetch(res: ResLike) {
	const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => res as Response);
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

function stubGtag() {
	const gtagMock = vi.fn();
	vi.stubGlobal('gtag', gtagMock);
	return gtagMock;
}

/** Isi field wajib lalu submit — pola `isiWajibDanSubmit` lead-form-dialog. */
function isiDanSubmit(nama = 'Budi Santoso', wa = '081234567890') {
	fireEvent.input(screen.getByLabelText('Nama pembeli'), { target: { value: `  ${nama}  ` } });
	fireEvent.input(screen.getByLabelText('Nomor WhatsApp pembeli'), { target: { value: wa } });
	fireEvent.submit(screen.getByRole('button', { name: 'Daftarkan Pembeli' }).closest('form')!);
}

afterEach(() => {
	vi.unstubAllGlobals();
	cleanup();
});

describe.skipIf(typeof document === 'undefined')('AgenLeadDialog', () => {
	let store: typeof import('../sesi-agen.svelte');
	beforeAll(async () => {
		store = await import('../sesi-agen.svelte');
	});
	afterEach(() => {
		store.resetSesiAgenUntukTes();
	});

	test('dibuka → judul + nama agen + teks proteksi 60 hari + event agen_lead_open', async () => {
		store.sesiAgen.agen = AGEN;
		store.sesiAgen.status = 'siap';
		const gtagMock = stubGtag();
		render(AgenLeadDialog, {
			props: { perumahanSlug: 'griya-asri', namaPerumahan: 'Griya Asri', open: true }
		});

		expect(screen.getByText('Daftarkan Pembeli — Griya Asri')).toBeInTheDocument();
		expect(screen.getByText(/Widya Pratama/)).toBeInTheDocument();
		expect(screen.getByText(/dilindungi 60 hari untuk Anda/i)).toBeInTheDocument();
		await waitFor(() =>
			expect(gtagMock).toHaveBeenCalledWith('event', 'agen_lead_open', {
				perumahan: 'Griya Asri'
			})
		);
	});

	test('KOMISI-AGEN-01: sukses → ambil /api/agen-komisi (tipeSlug) & tampilkan estimasi', async () => {
		store.sesiAgen.agen = AGEN;
		store.sesiAgen.status = 'siap';
		stubGtag();
		const fetchMock = vi.fn(async (url: string) => {
			if (String(url).startsWith('/api/agen-komisi')) {
				return {
					ok: true,
					status: 200,
					json: async () => ({
						estimasi: { status: 'estimasi', persen: 2.9, nominal: 8_700_000, dasar: 'tipe' }
					})
				} as Response;
			}
			return {
				ok: true,
				status: 201,
				json: async () => ({
					success: true,
					data: {
						id: 'lead-k',
						perumahan: { slug: 'griya-asri', nama: 'Griya Asri' },
						kunciSampai: '2027-01-08T00:00:00.000Z'
					}
				})
			} as Response;
		});
		vi.stubGlobal('fetch', fetchMock);
		render(AgenLeadDialog, {
			props: {
				perumahanSlug: 'griya-asri',
				namaPerumahan: 'Griya Asri',
				opsiTipe: ['Tipe 36/72'],
				open: true
			}
		});
		fireEvent.change(screen.getByLabelText(/Tipe diminati/), { target: { value: 'Tipe 36/72' } });
		isiDanSubmit();
		const blok = await screen.findByTestId('estimasi-komisi');
		expect(blok.textContent).toMatch(/8\.700\.000/);
		expect(blok.textContent).toContain('2,9%');
		expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
			'/api/agen-komisi?slug=griya-asri&tipeSlug=tipe-36-72'
		);
	});

	test('KOMISI-AGEN-01: estimasi null/gagal → blok tidak tampil, sukses tetap', async () => {
		store.sesiAgen.agen = AGEN;
		store.sesiAgen.status = 'siap';
		stubGtag();
		stubFetch({
			ok: true,
			status: 201,
			json: async () => ({
				success: true,
				data: {
					id: 'lead-n',
					perumahan: { slug: 'griya-asri', nama: 'Griya Asri' },
					kunciSampai: '2027-01-08T00:00:00.000Z'
				}
			})
		});
		render(AgenLeadDialog, {
			props: { perumahanSlug: 'griya-asri', namaPerumahan: 'Griya Asri', open: true }
		});
		isiDanSubmit();
		await screen.findByText(/Pembeli terdaftar ✓/);
		expect(screen.queryByTestId('estimasi-komisi')).toBeNull();
	});

	test('tipe ketik bebas (tidak dikenal) → masuk catatan, bukan tipeSlug', async () => {
		store.sesiAgen.agen = AGEN;
		store.sesiAgen.status = 'siap';
		stubGtag();
		const fetchMock = stubFetch({
			ok: true,
			status: 201,
			json: async () => ({
				success: true,
				data: {
					id: 'lead-8',
					perumahan: { slug: 'griya-asri', nama: 'Griya Asri' },
					kunciSampai: '2027-01-08T00:00:00.000Z'
				}
			})
		});
		render(AgenLeadDialog, {
			props: { perumahanSlug: 'griya-asri', namaPerumahan: 'Griya Asri', open: true }
		});
		fireEvent.input(screen.getByLabelText(/Tipe diminati/), { target: { value: 'tipe 45 hook' } });
		isiDanSubmit();
		await screen.findByText(/Pembeli terdaftar ✓/);
		const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
		expect(body.tipeSlug).toBeUndefined();
		expect(body.catatan).toBe('Tipe diminati: tipe 45 hook');
	});

	test('submit sukses → body kontrak (slugTipe, TANPA ref) + pesan terlindungi + tombol panel', async () => {
		store.sesiAgen.agen = AGEN;
		store.sesiAgen.status = 'siap';
		const gtagMock = stubGtag();
		const fetchMock = stubFetch({
			ok: true,
			status: 201,
			json: async () => ({
				success: true,
				data: {
					id: 'lead-9',
					perumahan: { slug: 'griya-asri', nama: 'Griya Asri' },
					kunciSampai: '2027-01-08T00:00:00.000Z'
				}
			})
		});
		render(AgenLeadDialog, {
			props: {
				perumahanSlug: 'griya-asri',
				namaPerumahan: 'Griya Asri',
				tipeAwal: 'Tipe 36/72',
				open: true
			}
		});

		fireEvent.input(screen.getByLabelText(/Tipe diminati/), { target: { value: 'Tipe 36/72' } });
		isiDanSubmit();
		await screen.findByText(/Pembeli terdaftar ✓/);

		// Body kontrak AGEN-OMAHE-11 — `ref` TIDAK ADA di jalur ini.
		const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
		expect(body).toEqual({
			slug: 'griya-asri',
			namaPembeli: 'Budi Santoso',
			whatsappPembeli: '081234567890',
			tipeSlug: 'tipe-36-72' // slugTipe('Tipe 36/72') — aturan slugifyTipe backend.
		});
		expect(JSON.stringify(body)).not.toContain('ref');

		expect(screen.getByText(/terlindungi s\.d\./)).toBeInTheDocument();
		const panel = screen.getByRole('link', { name: 'Lihat di Panel Agen' });
		expect(panel.getAttribute('href')).toBe(AGEN.panelUrl);
		expect(screen.getByRole('button', { name: 'Daftarkan pembeli lain' })).toBeInTheDocument();

		// GA — tanpa PII pembeli (nama/nomor WA pembeli tidak boleh bocor).
		const submitCall = gtagMock.mock.calls.find(
			(call) => call[0] === 'event' && call[1] === 'agen_lead_submit'
		);
		expect(submitCall).toBeDefined();
		const params = JSON.stringify(submitCall![2]);
		expect(params).toContain('Griya Asri');
		expect(params).not.toContain('Budi Santoso');
		expect(params).not.toContain('081234567890');
	});

	test('opsiTipe → select tipe dengan prefill tipeAwal', () => {
		store.sesiAgen.agen = AGEN;
		render(AgenLeadDialog, {
			props: {
				perumahanSlug: 'griya-asri',
				namaPerumahan: 'Griya Asri',
				tipeAwal: 'Tipe 45/60',
				opsiTipe: ['Tipe 36/72', 'Tipe 45/60'],
				open: true
			}
		});

		const select = screen.getByLabelText(/Tipe diminati/) as HTMLSelectElement;
		expect(select.tagName).toBe('SELECT');
		expect(select.value).toBe('Tipe 45/60');
	});

	test('409 proteksi → pesan backend tampil, isian dipertahankan', async () => {
		store.sesiAgen.agen = AGEN;
		stubFetch({
			ok: false,
			status: 409,
			json: async () => ({ message: 'Pembeli ini sudah didaftarkan agen lain.' })
		});
		render(AgenLeadDialog, {
			props: { perumahanSlug: 'griya-asri', namaPerumahan: 'Griya Asri', open: true }
		});

		isiDanSubmit();
		await screen.findByText('Pembeli ini sudah didaftarkan agen lain.');

		// Isian tidak dibuang — agen cukup koreksi nomor, bukan isi ulang.
		expect((screen.getByLabelText('Nama pembeli') as HTMLInputElement).value.trim()).toBe(
			'Budi Santoso'
		);
		expect(screen.queryByRole('button', { name: /Lanjut lewat WhatsApp/ })).toBeNull();
	});

	test('401 → pesan "Sesi berakhir" + tombol WA; store baru dinolkan saat tombol diklik', async () => {
		store.sesiAgen.agen = AGEN;
		store.sesiAgen.status = 'siap';
		stubFetch({
			ok: false,
			status: 401,
			json: async () => ({ message: 'Masuk sebagai agen terlebih dahulu.' })
		});
		render(AgenLeadDialog, {
			props: { perumahanSlug: 'griya-asri', namaPerumahan: 'Griya Asri', open: true }
		});

		isiDanSubmit();
		await screen.findByText('Sesi berakhir, silakan masuk lagi.');

		// Store BELUM dinolkan — dialog ini hidup di cabang `sesiAgen.agen`
		// (minat-dialog); menol sekarang = dialog lenyap sebelum pesan terbaca.
		expect(store.sesiAgen.agen).not.toBeNull();

		await fireEvent.click(screen.getByRole('button', { name: /Lanjut lewat WhatsApp/ }));
		expect(store.sesiAgen.agen).toBeNull();
		expect(store.sesiAgen.status).toBe('siap');
	});

	test('sukses lalu "Daftarkan pembeli lain" → form kosong terbuka lagi', async () => {
		store.sesiAgen.agen = AGEN;
		stubFetch({
			ok: true,
			status: 201,
			json: async () => ({
				success: true,
				data: {
					id: 'lead-9',
					perumahan: { slug: 'griya-asri', nama: 'Griya Asri' },
					kunciSampai: '2027-01-08T00:00:00.000Z'
				}
			})
		});
		render(AgenLeadDialog, {
			props: { perumahanSlug: 'griya-asri', namaPerumahan: 'Griya Asri', open: true }
		});

		isiDanSubmit();
		await screen.findByText(/Pembeli terdaftar ✓/);
		await fireEvent.click(screen.getByRole('button', { name: 'Daftarkan pembeli lain' }));

		expect((screen.getByLabelText('Nama pembeli') as HTMLInputElement).value).toBe('');
		expect(screen.getByRole('button', { name: 'Daftarkan Pembeli' })).toBeInTheDocument();
		expect(screen.queryByText(/Pembeli terdaftar ✓/)).toBeNull();
	});

	test('catatan opsional ikut terkirim (trim); kosong → undefined', async () => {
		store.sesiAgen.agen = AGEN;
		const fetchMock = stubFetch({
			ok: true,
			status: 201,
			json: async () => ({
				success: true,
				data: {
					id: 'l',
					perumahan: { slug: 'griya-asri', nama: 'Griya Asri' },
					kunciSampai: '2027-01-08T00:00:00.000Z'
				}
			})
		});
		render(AgenLeadDialog, {
			props: { perumahanSlug: 'griya-asri', namaPerumahan: 'Griya Asri', open: true }
		});

		fireEvent.input(screen.getByLabelText(/Catatan/), { target: { value: '  Survey Sabtu  ' } });
		isiDanSubmit();
		await screen.findByText(/Pembeli terdaftar ✓/);

		const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
		expect(body.catatan).toBe('Survey Sabtu');
		// Tipe dibiarkan kosong → key tidak dikirim (bukan string kosong).
		expect(body.tipeSlug).toBeUndefined();
	});

	describe('mode Booking unit (AGEN-OMAHE-11 iterasi 3)', () => {
		const UNIT = [
			{
				id: '00000000-0000-4000-8000-0000000000b1',
				blok: 'B',
				nomor: '3',
				tipe: 'Tipe 45/90',
				harga: null
			},
			{
				id: '00000000-0000-4000-8000-0000000000a1',
				blok: 'A',
				nomor: '12',
				tipe: 'Tipe 36/72',
				harga: 385_000_000
			}
		];

		/** fetch berbeda per URL: unit, booking, komisi. */
		function stubRute(booking: ResLike, unit: unknown[] = UNIT) {
			const f = vi.fn(async (url: string, _init?: RequestInit) => {
				if (url.startsWith('/api/agen-unit'))
					return { ok: true, status: 200, json: async () => ({ unit }) } as Response;
				if (url.startsWith('/api/agen-komisi'))
					return { ok: true, status: 200, json: async () => ({ estimasi: null }) } as Response;
				return booking as Response;
			});
			vi.stubGlobal('fetch', f);
			return f;
		}

		// fireEvent dari @testing-library/svelte ASYNC — resolve setelah
		// Svelte.tick(), jadi WAJIB di-await sebelum asersi DOM sinkron
		// (tanpa await, asersi membaca DOM belum diperbarui).
		async function bukaBooking(tipeAwal = '') {
			store.sesiAgen.agen = AGEN;
			store.sesiAgen.status = 'siap';
			render(AgenLeadDialog, {
				props: { perumahanSlug: 'griya-asri', namaPerumahan: 'Griya Asri', tipeAwal, open: true }
			});
			await fireEvent.click(screen.getByRole('button', { name: 'Booking unit' }));
		}

		test('pilih Booking → unit dimuat per tipe (tipe kartu di atas), submit kirim unitId tanpa ref → sukses', async () => {
			const gtagMock = stubGtag();
			const f = stubRute({
				ok: true,
				status: 200,
				json: async () => ({
					success: true,
					data: {
						bookingId: 'b-1',
						leadId: 'l-1',
						leadBaru: true,
						perumahan: { slug: 'griya-asri', nama: 'Griya Asri' },
						unit: { blok: 'A', nomor: '12', tipe: 'Tipe 36/72' }
					}
				})
			});
			await bukaBooking('Tipe 36/72');
			expect(screen.getByRole('button', { name: 'Booking unit' })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
			const select = (await screen.findByLabelText('Unit')) as HTMLSelectElement;
			expect(f.mock.calls[0]![0]).toBe('/api/agen-unit?slug=griya-asri');
			const grup = [...select.querySelectorAll('optgroup')].map((g) => g.label);
			expect(grup).toEqual(['Tipe 36/72', 'Tipe 45/90']);
			expect(screen.getByRole('option', { name: /Blok A No\. 12 · Rp/ })).toBeInTheDocument();
			expect(screen.queryByLabelText(/Tipe diminati/)).toBeNull();

			fireEvent.input(screen.getByLabelText('Nama pembeli'), { target: { value: 'Budi Santoso' } });
			fireEvent.input(screen.getByLabelText('Nomor WhatsApp pembeli'), {
				target: { value: '081234567890' }
			});
			fireEvent.change(select, { target: { value: UNIT[1]!.id } });
			fireEvent.submit(select.closest('form')!);

			expect(await screen.findByText(/Booking tercatat ✓/)).toBeInTheDocument();
			expect(screen.getByText('Blok A No. 12')).toBeInTheDocument();
			const panggilBooking = f.mock.calls.find(([u]) => u === '/api/agen-booking')!;
			const body = JSON.parse(String(panggilBooking[1]!.body));
			expect(body).toEqual({
				slug: 'griya-asri',
				unitId: UNIT[1]!.id,
				namaPembeli: 'Budi Santoso',
				whatsappPembeli: '081234567890'
			});
			expect(JSON.stringify(gtagMock.mock.calls)).not.toContain('081234567890');
			expect(gtagMock).toHaveBeenCalledWith('event', 'agen_booking_submit', {
				perumahan: 'Griya Asri',
				tipe_minat: 'Tipe 36/72'
			});
			// Estimasi komisi diminta dengan slug tipe unit yang dibooking.
			await waitFor(() =>
				expect(
					f.mock.calls.some(([u]) => u === '/api/agen-komisi?slug=griya-asri&tipeSlug=tipe-36-72')
				).toBe(true)
			);
		});

		test('409 → pesan backend tampil & daftar unit dimuat ulang', async () => {
			const f = stubRute({
				ok: false,
				status: 409,
				json: async () => ({ message: 'Unit sudah tidak tersedia.' })
			});
			await bukaBooking();
			const select = await screen.findByLabelText('Unit');
			fireEvent.input(screen.getByLabelText('Nama pembeli'), { target: { value: 'Budi Santoso' } });
			fireEvent.input(screen.getByLabelText('Nomor WhatsApp pembeli'), {
				target: { value: '081234567890' }
			});
			fireEvent.change(select, { target: { value: UNIT[0]!.id } });
			fireEvent.submit(select.closest('form')!);
			expect(await screen.findByText('Unit sudah tidak tersedia.')).toBeInTheDocument();
			await waitFor(() =>
				expect(f.mock.calls.filter(([u]) => String(u).startsWith('/api/agen-unit'))).toHaveLength(2)
			);
		});

		test('tanpa unit tersedia → arahan daftarkan sebagai lead, tombol Booking nonaktif', async () => {
			stubRute({ ok: true, status: 200, json: async () => ({}) }, []);
			await bukaBooking();
			expect(await screen.findByText(/Belum ada unit tersedia/)).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Booking Unit' })).toBeDisabled();
			await fireEvent.click(screen.getByRole('button', { name: 'Daftarkan sebagai lead' }));
			expect(screen.getByRole('button', { name: 'Lead' })).toHaveAttribute('aria-pressed', 'true');
		});
	});
});
