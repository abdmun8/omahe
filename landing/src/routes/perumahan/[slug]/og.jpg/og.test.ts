/**
 * Tes route `/perumahan/[slug]/og.jpg` (SHARE-02) — pola `../../q/[kode]/
 * redirect.test.ts`: `bun test` + handler di-import LANGSUNG setelah mock
 * `$lib/api` BERSAMA terpasang (`pasangMockLibApi`) — JANGAN pernah buat
 * `mock.module('$lib/api')` sendiri di sini (bocor antar file test,
 * pelajaran CI di CLAUDE.md).
 *
 * Yang dikunci: JPEG sah (SOI + SOF0 1200×630, ≤ 300 KB), content-type & header
 * cache OG, 404 slug asing (diteruskan, bukan 302), fail-soft 302 ke
 * `/og-default.jpg` saat backend error, validasi `?tipe=` (slug polos saja),
 * dan varian tipe tidak memanggil `getUnits`.
 */
import { beforeEach, describe, expect, test } from 'bun:test';
import { error } from '@sveltejs/kit';
import {
	getPerumahanMock,
	getTipeDetailMock,
	getUnitsMock,
	pasangMockLibApi
} from '$lib/test/proxy-api-mock';

pasangMockLibApi();

const { GET } = await import('./+server');

const SLUG = 'griya-asri-bogor';

const DETAIL = {
	nama: 'Griya Asri Bogor',
	slug: SLUG,
	regionNama: 'Kab. Bogor, Jawa Barat',
	kecamatanNama: 'Ciawi',
	photos: [],
	programOmahe: { dp0: true, cashback: 1_000_000, teksSyarat: 'S&K berlaku' },
	keunggulan: ['SHM', '5 menit ke tol'],
	promoAktif: [{ judul: 'Diskon Rp10 jt', sumber: 'omahe', slug: 'promo-1' }]
};

const TIPE = {
	perumahan: { nama: 'Griya Asri Bogor', slug: SLUG, regionNama: 'Kab. Bogor', developer: null },
	tipe: {
		nama: 'Tipe 36/72',
		slug: 'tipe-36-72',
		deskripsi: null,
		kamarTidur: 2,
		kamarMandi: 1,
		carport: 1,
		photos: [],
		hargaMin: 385_000_000,
		hargaMax: 385_000_000,
		luasTanah: 72,
		luasBangunan: 36,
		unitTersedia: 12
	}
};

/** PNG 1×1 piksel sah (untuk muatFotoDataUrl tanpa network). */
const PNG_1PX_DATA_URL =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/** RequestEvent palsu — handler memakai `params`, `fetch`, `url`. */
function event(slug: string, query = ''): Parameters<typeof GET>[0] {
	return {
		fetch: (() => {
			throw new Error('client di-mock — route tidak boleh fetch langsung');
		}) as unknown as typeof fetch,
		params: { slug },
		url: new URL(`https://www.omahe.co.id/perumahan/${slug}${query}`)
	} as unknown as Parameters<typeof GET>[0];
}

/** Klaim JPEG sah 1200×630 (SOI + ukuran di marker SOF0/SOF2) & ≤ batas WhatsApp. */
function assertJpeg1200x630(buf: Uint8Array): void {
	const b = Buffer.from(buf);
	expect(Array.from(b.subarray(0, 3))).toEqual([0xff, 0xd8, 0xff]);
	let i = 2;
	let ukuran: { w: number; h: number } | null = null;
	while (i < b.length - 9) {
		if (b[i] !== 0xff) break;
		const marker = b[i + 1];
		const len = b.readUInt16BE(i + 2);
		if (marker === 0xc0 || marker === 0xc2) {
			ukuran = { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
			break;
		}
		i += 2 + len;
	}
	expect(ukuran).toEqual({ w: 1200, h: 630 });
	expect(b.length).toBeLessThanOrEqual(300_000);
}

beforeEach(() => {
	getPerumahanMock.mockClear();
	getUnitsMock.mockClear();
	getTipeDetailMock.mockClear();
	getPerumahanMock.mockImplementation(async () => DETAIL);
	getUnitsMock.mockImplementation(async () => ({
		items: [
			{ hargaMin: 385_000_000, unitTersedia: 12 },
			{ hargaMin: 520_000_000, unitTersedia: 7 }
		],
		meta: { total: 2, page: 1, pageSize: 48 }
	}));
	getTipeDetailMock.mockImplementation(async () => TIPE);
});

describe('GET /perumahan/[slug]/og.jpg (SHARE-02)', () => {
	test('slug dikenal → 200 JPEG sah 1200×630 + header cache OG', async () => {
		const res = await GET(event(SLUG));
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('image/jpeg');
		expect(res.headers.get('cache-control')).toBe(
			'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
		);
		assertJpeg1200x630(new Uint8Array(await res.arrayBuffer()));
		expect(getPerumahanMock).toHaveBeenCalledWith(expect.anything(), SLUG);
		// Harga mulai perumahan dari agregat unit.
		expect(getUnitsMock).toHaveBeenCalledWith(expect.anything(), {
			perumahanSlug: SLUG,
			pageSize: 48
		});
	});

	test('varian ?tipe= → getTipeDetail dipanggil, getUnits TIDAK (harga dari tipe)', async () => {
		const res = await GET(event(SLUG, '?tipe=tipe-36-72'));
		expect(res.status).toBe(200);
		assertJpeg1200x630(new Uint8Array(await res.arrayBuffer()));
		expect(getTipeDetailMock).toHaveBeenCalledWith(expect.anything(), SLUG, 'tipe-36-72');
		expect(getUnitsMock).not.toHaveBeenCalled();
	});

	test('`?tipe=` bukan pola slug → dianggap tidak ada (teks URL tidak di-echo)', async () => {
		const res = await GET(event(SLUG, `?tipe=${encodeURIComponent('Teks Bebas <b>!</b>')}`));
		expect(res.status).toBe(200);
		expect(getTipeDetailMock).not.toHaveBeenCalled();
	});

	test('slug tidak dikenal → 404 (HttpError diteruskan, BUKAN 302 fallback)', async () => {
		getPerumahanMock.mockImplementation(async () => {
			error(404, 'Perumahan tidak ditemukan.');
		});
		expect(GET(event('slug-asing'))).rejects.toMatchObject({ status: 404 });
	});

	test('error backend/render selain 404 → 302 /og-default.jpg (fail-soft)', async () => {
		getPerumahanMock.mockImplementation(async () => {
			error(503, 'Backend down.');
		});
		const res = await GET(event(SLUG));
		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('https://www.omahe.co.id/og-default.jpg');
	});

	test('muatFotoDataUrl: data URL image lolos, bukan image/timeout → null', async () => {
		const { muatFotoDataUrl } = await import('$lib/server/og/kartu');
		expect(await muatFotoDataUrl(null)).toBeNull();
		expect(await muatFotoDataUrl(PNG_1PX_DATA_URL)).toBe(PNG_1PX_DATA_URL);
		expect(await muatFotoDataUrl('data:text/plain;base64,aGVsbG8=')).toBeNull();
	});
});
