/**
 * Unit test proxy `/api/agen-booking` & `/api/agen-unit` (AGEN-OMAHE-11
 * iterasi 3) — mock bersama `$lib/test/proxy-api-mock.ts` (WAJIB:
 * mock.module bocor antar file test).
 */
import { beforeEach, describe, expect, test } from 'bun:test';
import {
	ApiErrorTiruan,
	getUnitTersediaAgenMock,
	inputBookingAgenMock,
	pasangMockLibApi
} from '$lib/test/proxy-api-mock';

pasangMockLibApi();

const { POST } = await import('./+server');
const { GET } = await import('../agen-unit/+server');

const UNIT_ID = '00000000-0000-4000-8000-0000000000a1';

function eventPost(
	body: string,
	cookie: string | null = 'session=abc123'
): Parameters<typeof POST>[0] {
	const headers = new Headers({ 'content-type': 'application/json' });
	if (cookie !== null) headers.set('cookie', cookie);
	const request = new Request('http://omahe.test/api/agen-booking', {
		method: 'POST',
		headers,
		body
	});
	return { request, fetch: async () => new Response() } as unknown as Parameters<typeof POST>[0];
}

function eventGet(qs: string): Parameters<typeof GET>[0] {
	const url = new URL(`http://omahe.test/api/agen-unit${qs}`);
	const request = new Request(url, { headers: { cookie: 'session=abc123' } });
	return { url, request, fetch: async () => new Response() } as unknown as Parameters<
		typeof GET
	>[0];
}

const HASIL = {
	bookingId: 'b-1',
	leadId: 'l-1',
	leadBaru: true,
	perumahan: { slug: 'griya-asri', nama: 'Griya Asri' },
	unit: { blok: 'A', nomor: '12', tipe: 'Tipe 36/72' }
};
const bodyValid = {
	slug: 'griya-asri',
	unitId: UNIT_ID,
	namaPembeli: 'Budi Santoso',
	whatsappPembeli: '081234567890'
};

beforeEach(() => {
	inputBookingAgenMock.mockClear();
	inputBookingAgenMock.mockImplementation(async () => HASIL);
	getUnitTersediaAgenMock.mockClear();
	getUnitTersediaAgenMock.mockImplementation(async () => []);
});

describe('POST /api/agen-booking', () => {
	test('body invalid (JSON rusak / unitId bukan uuid / nama pendek) → 400 tanpa round-trip', async () => {
		for (const b of [
			'bukan-json{{',
			JSON.stringify({ ...bodyValid, unitId: 'A-12' }),
			JSON.stringify({ ...bodyValid, namaPembeli: 'B' }),
			JSON.stringify({ ...bodyValid, whatsappPembeli: '08' })
		]) {
			const res = await POST(eventPost(b));
			expect(res.status).toBe(400);
			expect(res.headers.get('cache-control')).toBe('private, no-store');
		}
		expect(inputBookingAgenMock).not.toHaveBeenCalled();
	});

	test('sukses → 200 data; cookie & body bersih diteruskan, tanpa ref', async () => {
		const res = await POST(
			eventPost(JSON.stringify({ ...bodyValid, namaPembeli: ' Budi Santoso ', ref: 'AO-X' }))
		);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ success: true, data: HASIL });
		const [, cookie, input] = inputBookingAgenMock.mock.calls[0]!;
		expect(cookie).toBe('session=abc123');
		expect(input).toEqual({ ...bodyValid, catatan: undefined });
	});

	test('ApiError backend (409 unit dipakai / 401) diteruskan apa adanya; error lain → 502 generik', async () => {
		inputBookingAgenMock.mockImplementation(async () => {
			throw new ApiErrorTiruan(409, 'Unit sudah tidak tersedia.');
		});
		let res = await POST(eventPost(JSON.stringify(bodyValid)));
		expect(res.status).toBe(409);
		expect(await res.json()).toEqual({ message: 'Unit sudah tidak tersedia.' });

		inputBookingAgenMock.mockImplementation(async () => {
			throw new Error('detail internal');
		});
		res = await POST(eventPost(JSON.stringify(bodyValid)));
		expect(res.status).toBe(502);
		expect(JSON.stringify(await res.json())).not.toContain('internal');
	});
});

describe('GET /api/agen-unit', () => {
	test('slug invalid → 400 tanpa round-trip', async () => {
		const res = await GET(eventGet('?slug=../x'));
		expect(res.status).toBe(400);
		expect(getUnitTersediaAgenMock).not.toHaveBeenCalled();
	});

	test('sukses → {unit}, private no-store + vary cookie', async () => {
		const unit = [{ id: UNIT_ID, blok: 'A', nomor: '12', tipe: 'Tipe 36/72', harga: 385_000_000 }];
		getUnitTersediaAgenMock.mockImplementation(async () => unit);
		const res = await GET(eventGet('?slug=griya-asri'));
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ unit });
		expect(res.headers.get('cache-control')).toBe('private, no-store');
		expect(res.headers.get('vary')).toBe('cookie');
	});

	test('401 sesi mati diteruskan', async () => {
		getUnitTersediaAgenMock.mockImplementation(async () => {
			throw new ApiErrorTiruan(401, 'Masuk sebagai agen terlebih dahulu.');
		});
		const res = await GET(eventGet('?slug=griya-asri'));
		expect(res.status).toBe(401);
	});
});
