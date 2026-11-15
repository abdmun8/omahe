/**
 * Tes server load `routes/perumahan/[slug]/tipe/[tipeSlug]` — AGEN-OMAHE-18
 * (2026-11-15): blok "Agen yang memasarkan" juga di halaman tipe.
 * Mock `$lib/api` BERSAMA dari `$lib/test/proxy-api-mock.ts` (`mock.module`
 * bocor antar file test — JANGAN me-mock `$lib/api` sendiri di sini).
 */
import { beforeEach, describe, expect, test } from 'bun:test';
import { getAgenPemasarMock, getTipeDetailMock, pasangMockLibApi } from '$lib/test/proxy-api-mock';

pasangMockLibApi();

const { load } = await import('./+page.server');

const SLUG = 'griya-asri-bogor';
const TIPE = 'tipe-36';
const DETAIL = { perumahan: { nama: 'Griya Asri Bogor', slug: SLUG }, tipe: { nama: 'Tipe 36' } };
const AGEN = [{ nama: 'Widya Pratama', kodeRef: 'AO-K2269F4X' }];

function event(ref?: string): Parameters<typeof load>[0] {
	const dasar = `https://www.omahe.co.id/perumahan/${SLUG}/tipe/${TIPE}`;
	return {
		params: { slug: SLUG, tipeSlug: TIPE },
		fetch: (() => {
			throw new Error('client di-mock — load tidak boleh fetch langsung');
		}) as unknown as typeof fetch,
		setHeaders: () => {},
		url: new URL(ref ? `${dasar}?ref=${encodeURIComponent(ref)}` : dasar)
	} as unknown as Parameters<typeof load>[0];
}

async function muat(ref?: string): Promise<{ detail: unknown; agen: unknown[] }> {
	return (await load(event(ref))) as unknown as { detail: unknown; agen: unknown[] };
}

beforeEach(() => {
	getTipeDetailMock.mockClear();
	getAgenPemasarMock.mockClear();
	getTipeDetailMock.mockImplementation(async () => DETAIL);
	getAgenPemasarMock.mockImplementation(async () => AGEN);
});

describe('load halaman tipe — agen pemasar (AGEN-OMAHE-18)', () => {
	test('tanpa ref: detail & agen mengalir, ref agen null', async () => {
		const data = await muat();
		expect(data.detail).toEqual(DETAIL);
		expect(data.agen).toEqual(AGEN);
		expect(getTipeDetailMock.mock.calls[0]?.slice(1)).toEqual([SLUG, TIPE]);
		expect(getAgenPemasarMock.mock.calls[0]?.slice(1)).toEqual([SLUG, null]);
	});

	test('ref AO-… diteruskan', async () => {
		await muat('AO-K2269F4X');
		expect(getAgenPemasarMock.mock.calls[0]?.[2]).toBe('AO-K2269F4X');
	});

	test('ref non-AO (link pribadi / mitra) tidak diteruskan', async () => {
		await muat('OMHA-A0001');
		expect(getAgenPemasarMock.mock.calls[0]?.[2]).toBeNull();
	});
});
