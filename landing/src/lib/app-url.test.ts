/**
 * Tes `daftarPerumahanUrl`/`daftarPerusahaanUrl` — arah lintas-app ke form
 * AUTH-05. Env `$env/dynamic/public` sudah di-stub preload `bun test`
 * (`src/lib/test/setup.ts`: `https://app.perumahan.test`), pola `ajukanUrl`.
 */
import { describe, expect, test } from 'bun:test';

describe('daftarPerumahanUrl', () => {
	test('mengarah ke form AUTH-05 di app perumahan, bukan route Omahe', async () => {
		const { daftarPerumahanUrl } = await import('./app-url');
		expect(daftarPerumahanUrl()).toBe('https://app.perumahan.test/daftar/perumahan');
	});
});

describe('daftarPerusahaanUrl', () => {
	test('mengarah ke form AUTH-05 di app perumahan, bukan route Omahe', async () => {
		const { daftarPerusahaanUrl } = await import('./app-url');
		expect(daftarPerusahaanUrl()).toBe('https://app.perumahan.test/daftar/perusahaan');
	});
});
