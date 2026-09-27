import { describe, expect, test } from 'bun:test';
import { bacaPreferensiMusik, musikValid, simpanPreferensiMusik } from './musik';

describe('ADMIN-07 musik latar', () => {
	test('preferensi: bawaan nyala, "mati" diingat, storage error tidak melempar', () => {
		const data = new Map<string, string>();
		const storage = {
			getItem: (k: string) => data.get(k) ?? null,
			setItem: (k: string, v: string) => void data.set(k, v)
		};
		expect(bacaPreferensiMusik(storage)).toBe('nyala');
		simpanPreferensiMusik(storage, 'mati');
		expect(bacaPreferensiMusik(storage)).toBe('mati');
		const rusak = {
			getItem: () => {
				throw new Error('diblokir');
			},
			setItem: () => {
				throw new Error('diblokir');
			}
		};
		expect(bacaPreferensiMusik(rusak)).toBe('nyala');
		expect(() => simpanPreferensiMusik(rusak, 'mati')).not.toThrow();
		expect(bacaPreferensiMusik(null)).toBe('nyala');
	});

	test('musikValid: hanya URL http(s)', () => {
		expect(musikValid({ url: 'https://cdn.test/a.mp3', judul: 'Senja' })).toEqual({
			url: 'https://cdn.test/a.mp3',
			judul: 'Senja'
		});
		expect(musikValid({ url: 'javascript:alert(1)' })).toBeNull();
		expect(musikValid(null)).toBeNull();
		expect(musikValid({ judul: 'x' })).toBeNull();
	});
});
