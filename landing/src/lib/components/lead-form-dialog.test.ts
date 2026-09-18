/**
 * Tes komponen `lead-form-dialog.svelte` — fitur "Form Minat" partner
 * berbayar (MONET-03, api-contract.md §8). Toolchain dan polanya sama
 * persis dengan `unit-card.test.ts`: dijalankan `bun run test:component`
 * (vitest + jsdom), `describe.skipIf` wajib karena file ini juga dijemput
 * `bun test` yang tidak punya DOM.
 *
 * Yang dikunci di sini (§8):
 *   - field wajib + honeypot tersembunyi + submit terkunci sampai privasi
 *     dicentang;
 *   - submit POST ke `/api/lead` (PROXY internal — `client.ts` itu
 *     server-only, komponen memang tidak bisa memanggil `createLead()`
 *     langsung) dengan body sesuai kontrak, termasuk `ref` passthrough dan
 *     honeypot `website` APA ADANYA (keputusan honeypot ada di server);
 *   - respons sukses → pesan "akan menghubungi" + tombol sekunder WA ke
 *     nomor umum Omahe (BUKAN redirect ke WA partner — inti fitur ini);
 *   - status error (mis. 429 rate limit) → pesan backend tampil apa adanya.
 *
 * Tidak perlu mock `$lib/ref` seperti di `unit-card.test.ts` — graf import
 * komponen ini (`bits-ui`, `$lib/config`, `$lib/utils`, `ui/button`) tidak
 * menyentuh `$env/dynamic/*` sama sekali. `fetch` global di-stub lewat
 * `vi.stubGlobal` — itu yang dipakai komponen (`fetch('/api/lead', ...)`),
 * dan responsnya cukup objek polos `{ok, status, json}` karena komponen
 * hanya membaca `res.ok` dan `res.json()`.
 *
 * Iterasi 1 GA4: dua event analitik dikunci juga — `lead_form_open` saat
 * dialog dibuka dan `lead_form_submit` saat submit SUKSES. Yang paling
 * kritis: TIDAK ada PII (nama/nomor telepon pengunjung) yang bocor ke
 * parameter event — aturan Google ToS (src/lib/analytics.ts).
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import { waitFor } from '@testing-library/dom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SITE } from '$lib/config';
import { waUrl } from '$lib/utils';
import LeadFormDialog from './lead-form-dialog.svelte';

/** Props dasar — dialog langsung TERBUKA (`open: true`) supaya isinya
 *  ter-render tanpa perlu klik pembuka dari komponen pemanggil. */
function propsDasar() {
	return {
		perumahanSlug: 'griya-asri',
		namaPerumahan: 'Griya Asri',
		sumber: 'card' as const,
		ref: 'ref-abc',
		tipeMinatAwal: 'Tipe 36/72',
		open: true
	};
}

/** Respons fetch polos — komponen hanya baca `ok` & `json()` (§8). */
type ResLike = { ok: boolean; status: number; json: () => Promise<unknown> };

function stubFetch(res: ResLike) {
	const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => res as Response);
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

/** Stub `window.gtag` (jsdom: globalThis === window) — dipulihkan oleh
 *  `vi.unstubAllGlobals()` di afterEach bawah. */
function stubGtag() {
	const gtagMock = vi.fn();
	vi.stubGlobal('gtag', gtagMock);
	return gtagMock;
}

/** Centang persetujuan privasi. `bind:checked` milik Svelte 5 mendengar
 *  event `change`, dan dispatchEvent jsdom TIDAK menjalankan activation
 *  behavior checkbox (klik mentah tidak men-toggle checked) — set properti
 *  `checked` manual lalu tembakkan `change`, persis kondisi akhir browser. */
function centangSetuju() {
	const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
	checkbox.checked = true;
	fireEvent.change(checkbox);
}

/** Isi field wajib + centang persetujuan, lalu submit form-nya.
 *  `fireEvent.submit` (bukan klik tombol) — jsdom tidak meng-implement
 *  implicit submission saat klik submit button; yang diuji handler
 *  `onsubmit` komponen, bukan mekanika browser. */
function isiWajibDanSubmit() {
	fireEvent.input(screen.getByLabelText('Nama'), { target: { value: '  Budi Santoso  ' } });
	fireEvent.input(screen.getByLabelText('Nomor WhatsApp'), {
		target: { value: '081234567890' }
	});
	centangSetuju();
	fireEvent.submit(screen.getByRole('button', { name: 'Kirim' }).closest('form')!);
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe.skipIf(typeof document === 'undefined')('LeadFormDialog', () => {
	test('dialog dibuka (mount open=true) → event GA lead_form_open tanpa isi form', async () => {
		const gtagMock = stubGtag();
		render(LeadFormDialog, { props: propsDasar() });

		// $effect berjalan pasca-mount — jangan assert sinkron.
		await waitFor(() =>
			expect(gtagMock).toHaveBeenCalledWith('event', 'lead_form_open', {
				perumahan: 'Griya Asri',
				sumber: 'card'
			})
		);
	});

	test('submit sukses → event GA lead_form_submit TANPA PII (nama/telepon tidak bocor)', async () => {
		const gtagMock = stubGtag();
		stubFetch({ ok: true, status: 200, json: async () => ({ ok: true }) });
		render(LeadFormDialog, { props: propsDasar() });

		isiWajibDanSubmit(); // isi nama '  Budi Santoso  ' + telepon '081234567890'
		await screen.findByText('Terima kasih, tim Griya Asri akan menghubungi Anda.');

		// Mount (open=true) juga memicu lead_form_open — cari yang lead_form_submit.
		const submitCall = gtagMock.mock.calls.find(
			(call) => call[0] === 'event' && call[1] === 'lead_form_submit'
		);
		expect(submitCall).toBeDefined();
		const params = submitCall![2] as Record<string, unknown>;
		expect(params).toEqual({
			perumahan: 'Griya Asri',
			sumber: 'card',
			tipe_minat: 'Tipe 36/72',
			ada_ref: true
		});
		// ATURAN ToS: nilai nama/telepon pengunjung TIDAK boleh ada di params
		// event GA — dicek sebagai string penuh, bukan cuma nama properti.
		const serial = JSON.stringify(params);
		expect(serial).not.toContain('Budi Santoso');
		expect(serial).not.toContain('081234567890');
	});
	test('field nama/telepon/checkbox privasi ada, honeypot tersembunyi, submit disabled awal', () => {
		const { container } = render(LeadFormDialog, { props: propsDasar() });

		expect(screen.getByLabelText('Nama')).toBeInTheDocument();
		expect(screen.getByLabelText('Nomor WhatsApp')).toBeInTheDocument();
		// Persetujuan privasi — satu-satunya checkbox di dialog.
		expect(screen.getByRole('checkbox')).not.toBeChecked();
		// Prefill tipe minat dari prop (mis. `unit.tipe` dari kartu pencarian).
		expect(screen.getByLabelText(/Tipe yang diminati/)).toHaveValue('Tipe 36/72');

		// HONEYPOT: ada di DOM (untuk bot) tapi di luar aksesibilitas —
		// dibungkus div `aria-hidden` + `tabindex=-1`, tanpa label apa pun.
		// Perhatikan: isi dialog di-PORTAL ke document.body oleh bits-ui,
		// BUKAN ke container render — query lewat document.body.
		const honeypot = document.body.querySelector<HTMLInputElement>('input[name="website"]');
		expect(honeypot).not.toBeNull();
		expect(honeypot?.closest('div[aria-hidden="true"]')).not.toBeNull();
		expect(honeypot?.getAttribute('tabindex')).toBe('-1');
		expect(screen.queryByRole('textbox', { name: /website/i })).toBeNull();

		// §8: submit terkunci sampai persetujuan dicentang.
		expect(screen.getByRole('button', { name: 'Kirim' })).toBeDisabled();
	});

	test('isi valid + centang privasi → enabled; submit POST /api/lead dengan body sesuai §8', async () => {
		const fetchMock = stubFetch({ ok: true, status: 200, json: async () => ({ ok: true }) });
		render(LeadFormDialog, { props: propsDasar() });

		fireEvent.input(screen.getByLabelText('Nama'), { target: { value: '  Budi Santoso  ' } });
		fireEvent.input(screen.getByLabelText('Nomor WhatsApp'), {
			target: { value: '081234567890' }
		});
		const kirim = screen.getByRole('button', { name: 'Kirim' });
		expect(kirim).toBeDisabled(); // belum dicentang → tetap terkunci
		centangSetuju();
		// Flush update DOM-nya microtask (Svelte 5) — jangan assert sinkron.
		await waitFor(() => expect(kirim).toBeEnabled());

		fireEvent.submit(kirim.closest('form')!);
		await screen.findByText('Terima kasih, tim Griya Asri akan menghubungi Anda.');

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/lead');
		expect(init?.method).toBe('POST');
		expect(init?.headers).toEqual({ 'content-type': 'application/json' });
		// JSON.stringify menghapus key `undefined` — `pesan` kosong tidak ikut.
		expect(JSON.parse(init?.body as string)).toEqual({
			perumahanSlug: 'griya-asri',
			nama: 'Budi Santoso', // di-trim sebelum dikirim
			telepon: '081234567890',
			tipeMinat: 'Tipe 36/72', // prefill dari prop
			sumber: 'card', // diset PEMANGGIL (§8), bukan server
			ref: 'ref-abc', // passthrough atribusi mitra — wajib ikut (CLAUDE.md)
			website: '' // honeypot kosong oleh manusia, tetap terkirim
		});
	});

	test('honeypot terisi (bot) → tetap dikirim APA ADANYA, UI tetap sukses', async () => {
		// Keputusan §8: keputusan honeypot ada di SERVER, respons sukses & honeypot
		// SAMA sehingga tidak ada yang bisa dibedakan bot — komponen hanya
		// meneruskan isinya tanpa filter.
		const fetchMock = stubFetch({ ok: true, status: 200, json: async () => ({ ok: true }) });
		render(LeadFormDialog, { props: propsDasar() });

		const honeypot = document.body.querySelector<HTMLInputElement>('input[name="website"]');
		fireEvent.input(honeypot!, { target: { value: 'https://spam.example' } });
		isiWajibDanSubmit();
		await screen.findByText('Terima kasih, tim Griya Asri akan menghubungi Anda.');

		expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string).website).toBe(
			'https://spam.example'
		);
	});

	test('respons sukses → pesan "akan menghubungi" + tombol sekunder WA ke nomor umum Omahe', async () => {
		stubFetch({ ok: true, status: 200, json: async () => ({ ok: true }) });
		render(LeadFormDialog, { props: propsDasar() });

		isiWajibDanSubmit();

		// Pesan sukses (bukan description dialog yang juga memuat frasa ini —
		// match "Terima kasih" supaya unik).
		expect(
			await screen.findByText('Terima kasih, tim Griya Asri akan menghubungi Anda.')
		).toBeInTheDocument();

		// Tombol sekunder WA → nomor UMUM Omahe (SITE.whatsapp), TIDAK ada
		// redirect ke WA partner — seluruh inti MONET-03 (§8).
		const wa = screen.getByRole('link', { name: 'WhatsApp' });
		expect(wa.getAttribute('href')).toBe(
			waUrl(SITE.whatsapp, 'Halo, saya ingin tanya tentang Griya Asri yang saya lihat di Omahe.')
		);
		expect(wa.getAttribute('target')).toBe('_blank');
		expect(wa.getAttribute('rel')).toContain('noopener');
	});

	test('respons 429 dengan pesan → pesan backend tampil APA ADANYA, form tidak hilang', async () => {
		stubFetch({
			ok: false,
			status: 429,
			json: async () => ({ message: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' })
		});
		render(LeadFormDialog, { props: propsDasar() });

		isiWajibDanSubmit();

		// role="alert" — pesan 429 backend diteruskan apa adanya oleh proxy
		// dan komponen menampilkannya tanpa modifikasi (§8).
		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Terlalu banyak permintaan. Coba lagi dalam 1 menit.'
		);
		// Gagal → BUKAN layar sukses; form tetap ada supaya isian bisa
		// diperbaiki tanpa mengetik ulang.
		expect(screen.queryByText(/Terima kasih/)).toBeNull();
		expect(screen.getByRole('button', { name: 'Kirim' })).toBeInTheDocument();
	});

	test('respons error tanpa pesan → fallback generik, bukan error internal', async () => {
		stubFetch({ ok: false, status: 500, json: async () => ({}) });
		render(LeadFormDialog, { props: propsDasar() });

		isiWajibDanSubmit();

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Pengiriman gagal. Coba lagi sebentar lagi.'
		);
	});

	test('enforcement panjang maksimal di sisi klien lewat atribut maxlength (nama 100)', () => {
		// Validasi panjang server-side ada di backend (§8: nama 1–100); di
		// klien, pencegahannya adalah atribut `maxlength` yang membuat browser
		// memotong input sebelum nilai menyentuh state komponen.
		render(LeadFormDialog, { props: propsDasar() });

		expect(screen.getByLabelText('Nama')).toHaveAttribute('maxlength', '100');
		expect(screen.getByLabelText('Nomor WhatsApp')).toHaveAttribute('maxlength', '20');
		expect(screen.getByLabelText(/Tipe yang diminati/)).toHaveAttribute('maxlength', '50');
		expect(screen.getByLabelText(/^Pesan/)).toHaveAttribute('maxlength', '500');
	});
});
