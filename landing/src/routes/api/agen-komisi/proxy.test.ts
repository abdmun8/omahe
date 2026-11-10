/**
 * Proxy `/api/agen-komisi` (KOMISI-AGEN-01) — mock BERSAMA
 * `$lib/test/proxy-api-mock.ts` (WAJIB; mock.module bocor antar file).
 * Dikunci: selalu 200 `{estimasi}`, header private/no-store + vary cookie,
 * param jahat → null tanpa backend, cookie diteruskan, error → null.
 */
import { beforeEach, describe, expect, test } from 'bun:test';
import { getEstimasiKomisiAgenMock, pasangMockLibApi } from '$lib/test/proxy-api-mock';

pasangMockLibApi();

const { GET } = await import('./+server');

function event(qs: string, cookie: string | null = 'session=abc'): Parameters<typeof GET>[0] {
	const headers = new Headers();
	if (cookie !== null) headers.set('cookie', cookie);
	const url = new URL(`http://omahe.test/api/agen-komisi${qs}`);
	return { url, request: new Request(url, { headers }), fetch: async () => new Response() } as unknown as Parameters<typeof GET>[0];
}

const EST = { status: 'estimasi', persen: 2.9, nominal: 8_700_000, dasar: 'tipe' };

beforeEach(() => {
	getEstimasiKomisiAgenMock.mockClear();
	getEstimasiKomisiAgenMock.mockImplementation(async () => EST);
});

describe('GET /api/agen-komisi', () => {
	test('sukses → estimasi + header privat', async () => {
		const res = await GET(event('?slug=griya-asri&tipeSlug=tipe-36'));
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ estimasi: EST });
		expect(res.headers.get('cache-control')).toBe('private, no-store');
		expect(res.headers.get('vary')).toBe('cookie');
		expect(getEstimasiKomisiAgenMock.mock.calls[0]?.slice(1)).toEqual(['session=abc', 'griya-asri', 'tipe-36']);
	});

	test('slug/tipe tidak sah → null tanpa backend', async () => {
		for (const qs of ['', '?slug=', '?slug=../x', '?slug=ok&tipeSlug=<b>']) {
			const res = await GET(event(qs));
			expect(await res.json()).toEqual({ estimasi: null });
		}
		expect(getEstimasiKomisiAgenMock).not.toHaveBeenCalled();
	});

	test('error tak terduga → null (bukan 500)', async () => {
		getEstimasiKomisiAgenMock.mockImplementation(async () => {
			throw new Error('meledak');
		});
		const res = await GET(event('?slug=griya-asri'));
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ estimasi: null });
	});
});
