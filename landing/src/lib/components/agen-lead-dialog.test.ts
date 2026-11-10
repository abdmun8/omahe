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
	panelUrl: 'https://app.perumahan.test/agen-omahe'
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
		expect(
			screen.getByText(/dilindungi 60 hari untuk Anda/i)
		).toBeInTheDocument();
		await waitFor(() =>
			expect(gtagMock).toHaveBeenCalledWith('event', 'agen_lead_open', {
				perumahan: 'Griya Asri'
			})
		);
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
				data: { id: 'lead-8', perumahan: { slug: 'griya-asri', nama: 'Griya Asri' }, kunciSampai: '2027-01-08T00:00:00.000Z' }
			})
		});
		render(AgenLeadDialog, { props: { perumahanSlug: 'griya-asri', namaPerumahan: 'Griya Asri', open: true } });
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
});
