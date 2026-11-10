/**
 * Unit test proxy `/api/agen-lead` (AGEN-OMAHE-11) — pola `api/lead/proxy.test.ts`
 * + mock bersama `$lib/test/proxy-api-mock.ts` (WAJIB — mock.module bocor
 * antar file test, lihat CLAUDE.md).
 *
 * Yang dikunci:
 *   - body sampah / field wajib invalid → 400 ramah TANPA menyentuh backend;
 *   - status + pesan `ApiError` backend (401/409/429) diteruskan APA ADANYA;
 *   - sukses → 200 `{success:true, data}` dari client;
 *   - error non-ApiError → 502 generik (internal tidak bocor);
 *   - header cookie request diteruskan ke `inputLeadAgen` (agen dari SESI);
 *   - semua respons `cache-control: private, no-store`.
 */
import { beforeEach, describe, expect, test } from 'bun:test';
import { ApiErrorTiruan, inputLeadAgenMock, pasangMockLibApi } from '$lib/test/proxy-api-mock';

pasangMockLibApi();

const { POST } = await import('./+server');

function event(body: string, cookie: string | null = 'session=abc123'): Parameters<typeof POST>[0] {
	const headers = new Headers({ 'content-type': 'application/json' });
	if (cookie !== null) headers.set('cookie', cookie);
	const request = new Request('http://omahe.test/api/agen-lead', { method: 'POST', headers, body });
	return { request, fetch: async () => new Response() } as unknown as Parameters<typeof POST>[0];
}

const HASIL = {
	id: 'lead-1',
	perumahan: { slug: 'griya-asri', nama: 'Griya Asri' },
	kunciSampai: '2027-01-08T00:00:00.000Z'
};

const bodyValid = JSON.stringify({
	slug: 'griya-asri',
	namaPembeli: 'Budi Santoso',
	whatsappPembeli: '081234567890'
});

beforeEach(() => {
	inputLeadAgenMock.mockClear();
	inputLeadAgenMock.mockImplementation(async () => HASIL);
});

describe('POST /api/agen-lead (proxy AGEN-OMAHE-11)', () => {
	test('body bukan JSON valid → 400, inputLeadAgen tidak menyentuh', async () => {
		const res = await POST(event('bukan-json{{{'));

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ message: 'Permintaan tidak valid.' });
		expect(inputLeadAgenMock).not.toHaveBeenCalled();
	});

	test('field wajib invalid (slug/nama/WA) → 400 ramah tanpa round-trip', async () => {
		for (const salah of [
			{ slug: '' },
			{ slug: 'griya-asri', namaPembeli: 'B' },
			{ slug: 'griya-asri', namaPembeli: 'Budi Santoso', whatsappPembeli: '08' }
		]) {
			const res = await POST(event(JSON.stringify(salah)));
			expect(res.status).toBe(400);
			const body = (await res.json()) as { message: string };
			expect(body.message.length).toBeGreaterThan(5);
		}
		expect(inputLeadAgenMock).not.toHaveBeenCalled();
	});

	test('sukses → 200 { success, data } + input ternormalisasi (trim) + cookie diteruskan', async () => {
		const res = await POST(
			event(
				JSON.stringify({
					slug: ' griya-asri ',
					namaPembeli: ' Budi Santoso ',
					whatsappPembeli: ' 081234567890 ',
					tipeSlug: '  ',
					catatan: '  '
				}),
				'session=xyz; lain=1'
			)
		);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ success: true, data: HASIL });
		expect(inputLeadAgenMock).toHaveBeenCalledTimes(1);
		expect(inputLeadAgenMock.mock.calls[0]?.[1]).toBe('session=xyz; lain=1');
		// Kosong/whitespace → undefined (JSON.stringify membuang key, tidak
		// sampai backend sebagai string kosong).
		expect(inputLeadAgenMock.mock.calls[0]?.[2]).toEqual({
			slug: 'griya-asri',
			namaPembeli: 'Budi Santoso',
			whatsappPembeli: '081234567890'
		});
	});

	test('401 (sesi bukan agen) → status + pesan backend diteruskan apa adanya', async () => {
		inputLeadAgenMock.mockImplementation(async () => {
			throw new ApiErrorTiruan(401, 'Masuk sebagai agen terlebih dahulu.');
		});
		const res = await POST(event(bodyValid));

		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({ message: 'Masuk sebagai agen terlebih dahulu.' });
	});

	test('409 (proteksi 60 hari) → status + pesan diteruskan', async () => {
		inputLeadAgenMock.mockImplementation(async () => {
			throw new ApiErrorTiruan(409, 'Pembeli ini sudah didaftarkan agen lain.');
		});
		const res = await POST(event(bodyValid));

		expect(res.status).toBe(409);
		expect(await res.json()).toEqual({ message: 'Pembeli ini sudah didaftarkan agen lain.' });
	});

	test('429 rate limit → status + pesan diteruskan (pola §8)', async () => {
		inputLeadAgenMock.mockImplementation(async () => {
			throw new ApiErrorTiruan(429, 'Terlalu banyak input. Coba lagi beberapa menit lagi.');
		});
		const res = await POST(event(bodyValid));

		expect(res.status).toBe(429);
	});

	test('error BUKAN ApiError → 502 generik, internal tidak bocor', async () => {
		inputLeadAgenMock.mockImplementation(async () => {
			throw new Error('stacktrace internal: postgres://user:pass@host');
		});
		const res = await POST(event(bodyValid));

		expect(res.status).toBe(502);
		const body = (await res.json()) as { message: string };
		expect(body.message).toBe('Pendaftaran gagal. Coba lagi sebentar lagi.');
		expect(body.message).not.toContain('postgres');
	});

	test('SEMUA jalur respons membawa cache-control private, no-store', async () => {
		for (const res of [
			await POST(event('bukan-json{{{')),
			await POST(event(bodyValid)),
			await POST(event(bodyValid, null))
		]) {
			expect(res.headers.get('cache-control')).toBe('private, no-store');
		}
	});
});
