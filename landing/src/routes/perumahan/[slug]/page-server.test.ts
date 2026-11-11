/**
 * Tes server load `routes/perumahan/[slug]` — AGEN-OMAHE-13 (2026-11-11).
 * Pola `../../q/[kode]/redirect.test.ts`: `bun test` + mock `$lib/api`
 * BERSAMA dari `$lib/test/proxy-api-mock.ts` (`mock.module` bocor antar
 * file test — JANGAN pernah me-mock `$lib/api` sendiri di sini).
 *
 * Yang dikunci: `getAgenPemasar` HANYA dipanggil bila `ref` berpola kode
 * pilihan agen `AO-…` (backend "Aktifkan semua" bisa membalas puluhan agen
 * — daftar itu tidak diambil lagi per view); selain itu `agen: []` tanpa
 * panggilan. `getPerumahan`/`getUnits` selalu dipanggil & datanya mengalir.
 */
import { beforeEach, describe, expect, test } from 'bun:test';
import {
	getAgenPemasarMock,
	getPerumahanMock,
	getUnitsMock,
	pasangMockLibApi
} from '$lib/test/proxy-api-mock';

pasangMockLibApi();

const { load } = await import('./+page.server');

const SLUG = 'griya-asri-bogor';
const DETAIL = { nama: 'Griya Asri Bogor', slug: SLUG };
const UNIT = { items: [], total: 0 };
const AGEN = [{ nama: 'Widya Pratama', kodeRef: 'AO-K2269F4X' }];

/** RequestEvent palsu — load hanya memakai `params`, `fetch`, `setHeaders`, `url`. */
function event(ref?: string): Parameters<typeof load>[0] {
	const u = new URL(
		ref
			? `https://www.omahe.co.id/perumahan/${SLUG}?ref=${encodeURIComponent(ref)}`
			: `https://www.omahe.co.id/perumahan/${SLUG}`
	);
	return {
		params: { slug: SLUG },
		fetch: (() => {
			throw new Error('client di-mock — load tidak boleh fetch langsung');
		}) as unknown as typeof fetch,
		setHeaders: () => {},
		url: u
	} as unknown as Parameters<typeof load>[0];
}

/**
 * Muat dengan `ref` opsional. Return-type Kit (`MaybePromise`, bisa `void`)
 * dilewati — shape data di-sini DISENGAJA longgar karena `getPerumahan`/
 * `getUnits`/`getAgenPemasar` adalah mock (shape asli dikunci client.test.ts).
 */
async function muat(ref?: string): Promise<{
	perumahan: unknown;
	tipeUnit: unknown;
	agen: unknown[];
}> {
	return (await load(event(ref))) as unknown as {
		perumahan: unknown;
		tipeUnit: unknown;
		agen: unknown[];
	};
}

beforeEach(() => {
	// `mockImplementation` saja tidak menghapus hitungan panggilan — test
	// "dipanggil/dipanggil sekali" saling bocor (pola redirect.test.ts).
	getPerumahanMock.mockClear();
	getUnitsMock.mockClear();
	getAgenPemasarMock.mockClear();
	getPerumahanMock.mockImplementation(async () => DETAIL);
	getUnitsMock.mockImplementation(async () => UNIT);
	getAgenPemasarMock.mockImplementation(async () => AGEN);
});

describe('load /perumahan/[slug] (AGEN-OMAHE-13)', () => {
	test('tanpa ?ref → getAgenPemasar TIDAK dipanggil, agen []', async () => {
		const data = await muat();
		expect(getPerumahanMock).toHaveBeenCalledTimes(1);
		expect(getUnitsMock).toHaveBeenCalledWith(expect.anything(), {
			perumahanSlug: SLUG,
			pageSize: 48
		});
		expect(getAgenPemasarMock).not.toHaveBeenCalled();
		expect(data.agen).toEqual([]);
		expect(data.perumahan).toEqual(DETAIL);
		expect(data.tipeUnit).toEqual([]);
	});

	test('ref hex kerjasama (bukan AO) → getAgenPemasar TIDAK dipanggil, agen []', async () => {
		const data = await muat('a1b2c3d4e5f60718a9b0c1d2e3f40516a7b8c9d0e1f20314a5b6c7d8e9f0a1b2');
		expect(getAgenPemasarMock).not.toHaveBeenCalled();
		expect(data.agen).toEqual([]);
	});

	test('ref OP-… kerjasama perusahaan → getAgenPemasar TIDAK dipanggil', async () => {
		await muat('OP-QA7MPN');
		expect(getAgenPemasarMock).not.toHaveBeenCalled();
	});

	test('ref kode pribadi agen OMHA-… → getAgenPemasar TIDAK dipanggil', async () => {
		await muat('OMHA-A0001');
		expect(getAgenPemasarMock).not.toHaveBeenCalled();
	});

	test('ref AO-… → getAgenPemasar dipanggil dengan ref apa adanya, datanya mengalir', async () => {
		const data = await muat('AO-K2269F4X');
		expect(getAgenPemasarMock).toHaveBeenCalledTimes(1);
		expect(getAgenPemasarMock).toHaveBeenCalledWith(expect.anything(), SLUG, 'AO-K2269F4X');
		expect(data.agen).toEqual(AGEN);
	});

	test('ref AO-… huruf kecil tetap dihitung kode pilihan (normalisasi backend sama)', async () => {
		await muat('ao-k2269f4x');
		expect(getAgenPemasarMock).toHaveBeenCalledTimes(1);
		// Passthrough `?ref=` apa adanya — normalisasi TIDAK mengubah nilai terkirim.
		expect(getAgenPemasarMock).toHaveBeenCalledWith(expect.anything(), SLUG, 'ao-k2269f4x');
	});
	// Fail-soft `getAgenPemasar` (gagal backend → []) dikunci di client.test.ts
	// — di sini client utuh di-mock, jadi tidak relevan diulang.
});
