import { describe, expect, test } from 'bun:test';
import { formatNomorTampil, telUrl, waUrl } from './utils';

describe('formatNomorTampil (ADMIN-05)', () => {
	test('62xxx dari API jadi 0xxx berkelompok 4 digit', () => {
		expect(formatNomorTampil('6281112345678')).toBe('0811-1234-5678');
	});

	test('nomor lokal 08… tetap terbaca', () => {
		expect(formatNomorTampil('0811000000')).toBe('0811-0000-00');
	});

	test('telepon kantor 021', () => {
		expect(formatNomorTampil('62215551234')).toBe('0215551234');
	});

	test('link wa/tel tetap memakai format internasional', () => {
		expect(waUrl('6281112345678')).toBe('https://wa.me/6281112345678');
		expect(telUrl('6281112345678')).toBe('tel:+6281112345678');
	});
});
