/**
 * Tes untuk jalur yang kalau rusak TIDAK menimbulkan error apa pun — cuma
 * komisi mitra yang hilang diam-diam (lihat `src/lib/ref.ts`). Justru
 * karena senyap, jalur ini yang paling perlu dikunci tes.
 */
import { describe, expect, test } from 'bun:test';
import { readRef, withRef } from './ref';

const url = (s: string) => new URL(s, 'https://www.omahe.co.id');

describe('readRef', () => {
	test('mengambil token hex 64 seperti yang dipakai kerjasama.qrCode', () => {
		const token = 'a'.repeat(64);
		expect(readRef(url(`/perumahan/griya-asri?ref=${token}`))).toBe(token);
	});

	test('null kalau tidak ada ref', () => {
		expect(readRef(url('/perumahan/griya-asri'))).toBeNull();
	});

	test('menolak nilai yang bisa menyelundupkan sesuatu ke URL tujuan', () => {
		expect(readRef(url('/?ref=' + encodeURIComponent('abc&utm=x')))).toBeNull();
		expect(readRef(url('/?ref=' + encodeURIComponent('../../etc')))).toBeNull();
		expect(readRef(url('/?ref=' + encodeURIComponent('https://jahat.example')))).toBeNull();
	});

	test('menolak token kepanjangan (kolom qr_code maks 64)', () => {
		expect(readRef(url(`/?ref=${'a'.repeat(65)}`))).toBeNull();
	});

	test('ref kosong dianggap tidak ada', () => {
		expect(readRef(url('/?ref='))).toBeNull();
	});
});

describe('withRef', () => {
	test('tanpa ref, path tidak disentuh', () => {
		expect(withRef('/cari', null)).toBe('/cari');
	});

	test('menambah query pertama', () => {
		expect(withRef('/cari', 'abc')).toBe('/cari?ref=abc');
	});

	test('menggabung ke query yang sudah ada', () => {
		expect(withRef('/cari?regionKode=32.01', 'abc')).toBe('/cari?regionKode=32.01&ref=abc');
	});

	test('hash tetap di paling belakang — kalau tidak, anchor jadi bagian dari nilai ref', () => {
		expect(withRef('/perumahan/x#tipe-unit', 'abc')).toBe('/perumahan/x?ref=abc#tipe-unit');
	});

	test('bekerja pada URL absolut ke app perumahan', () => {
		expect(withRef('https://app.example/ajukan/griya-asri', 'abc')).toBe(
			'https://app.example/ajukan/griya-asri?ref=abc'
		);
	});
});

describe('ajukanUrl', () => {
	test('mengarah ke app perumahan, bukan route Omahe, dan membawa ref', async () => {
		const { ajukanUrl } = await import('./ref');
		expect(ajukanUrl('griya-asri-bogor', 'abc')).toBe(
			'https://app.perumahan.test/ajukan/griya-asri-bogor?ref=abc'
		);
	});

	test('tanpa ref tetap valid — booking langsung tanpa mitra juga sah', async () => {
		const { ajukanUrl } = await import('./ref');
		expect(ajukanUrl('griya-asri-bogor', null)).toBe(
			'https://app.perumahan.test/ajukan/griya-asri-bogor'
		);
	});
});
