/**
 * Tes store `sesi-agen.svelte.ts` (SESI-OMAHE-01) — runner vitest (runes di
 * `.svelte.ts` harus dikompilasi plugin svelte; `bun test` tidak punya
 * compiler itu). Store di-import DINAMIS di DALAM test yang ter-guard
 * `describe.skipIf` — pola file komponen lain: di `bun test` file ini juga
 * dijemput, dan import statis modul runes akan meledak di runner itu
 * (`$state is not defined`) walau test-nya di-skip (terverifikasi via
 * eksperimen bun 1.4.4 sebelum menulis file ini).
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { AgenSaya } from '$lib/api/types';

const AGEN: AgenSaya = {
	kodeAgen: 'OMHA-A0001',
	nama: 'Widya Pratama',
	fotoUrl: null,
	panelUrl: 'https://app.perumahan.test/agen-omahe',
	perumahanSlugs: null
};

const AGEN_BERPOTO: AgenSaya = { ...AGEN, fotoUrl: 'https://img.test/f.jpg' };

afterEach(() => {
	vi.unstubAllGlobals();
});

describe.skipIf(typeof document === 'undefined')('sesiAgen (store SESI-OMAHE-01)', () => {
	test('muatSesiAgen → fetch /api/saya sekali, agen terisi + status siap', async () => {
		const { sesiAgen, resetSesiAgenUntukTes } = await import('../sesi-agen.svelte');
		resetSesiAgenUntukTes();
		const fetchMock = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
			Response.json({ agen: AGEN_BERPOTO })
		);
		vi.stubGlobal('fetch', fetchMock);

		await (await import('../sesi-agen.svelte')).muatSesiAgen();

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/saya');
		expect(sesiAgen.status).toBe('siap');
		expect(sesiAgen.agen).toEqual(AGEN_BERPOTO);
		resetSesiAgenUntukTes();
	});

	test('respons {agen:null} (anonim) → agen null, bukan error', async () => {
		const mod = await import('../sesi-agen.svelte');
		mod.resetSesiAgenUntukTes();
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => Response.json({ agen: null }))
		);

		await mod.muatSesiAgen();

		expect(mod.sesiAgen.status).toBe('siap');
		expect(mod.sesiAgen.agen).toBeNull();
		mod.resetSesiAgenUntukTes();
	});

	test('proxy gagal (500 / body aneh / throw) → fail-soft agen null', async () => {
		const mod = await import('../sesi-agen.svelte');
		for (const res of [
			new Response('err', { status: 500 }),
			new Response('bukan-json', { status: 200 }),
			null // → fetch melempar
		]) {
			mod.resetSesiAgenUntukTes();
			vi.stubGlobal(
				'fetch',
				vi.fn(async () => {
					if (res === null) throw new Error('network down');
					return res;
				})
			);
			await mod.muatSesiAgen();
			expect(mod.sesiAgen.status).toBe('siap');
			expect(mod.sesiAgen.agen).toBeNull();
		}
		mod.resetSesiAgenUntukTes();
	});

	test('body aneh (agen setengah jadi) → null, bukan objek pincang', async () => {
		const mod = await import('../sesi-agen.svelte');
		mod.resetSesiAgenUntukTes();
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => Response.json({ agen: { kodeAgen: 'OMHA-A0001' } }))
		);

		await mod.muatSesiAgen();

		expect(mod.sesiAgen.agen).toBeNull();
		mod.resetSesiAgenUntukTes();
	});

	test('pemanggilan ganda (re-mount layout) dalam satu muatan → hanya 1 fetch', async () => {
		const mod = await import('../sesi-agen.svelte');
		mod.resetSesiAgenUntukTes();
		const fetchMock = vi.fn(async () => Response.json({ agen: AGEN }));
		vi.stubGlobal('fetch', fetchMock);

		// onMount layout root jalan sekali per muatan halaman — guard
		// idempoten melindungi pemanggil ganda yang tak sengaja.
		await Promise.all([mod.muatSesiAgen(), mod.muatSesiAgen()]);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		mod.resetSesiAgenUntukTes();
	});

	test('setSesiAgenNull (401 dari /api/agen-lead) → agen null + status siap', async () => {
		const mod = await import('../sesi-agen.svelte');
		mod.resetSesiAgenUntukTes();
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => Response.json({ agen: AGEN }))
		);
		await mod.muatSesiAgen();
		expect(mod.sesiAgen.agen).not.toBeNull();

		mod.setSesiAgenNull();

		expect(mod.sesiAgen.agen).toBeNull();
		expect(mod.sesiAgen.status).toBe('siap');
		mod.resetSesiAgenUntukTes();
	});
});
