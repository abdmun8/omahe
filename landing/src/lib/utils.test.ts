import { describe, expect, test } from 'bun:test';
import { formatLokasi, formatNomorTampil, isHttpUrl, isMapsEmbedUrl, telUrl, waUrl } from './utils';

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

describe('formatLokasi (LOKASI-01)', () => {
	test('lengkap', () => {
		expect(
			formatLokasi({
				alamat: 'Jl. Raya 1',
				kecamatanNama: 'Cibinong',
				regionNama: 'Kabupaten Bogor',
				provinsiNama: 'Jawa Barat'
			})
		).toBe('Jl. Raya 1, Kec. Cibinong, Kabupaten Bogor, Jawa Barat');
	});

	test('sebagian kosong dilewati, tidak dobel "Kec."', () => {
		expect(formatLokasi({ kecamatanNama: 'Kec. Cibinong', regionNama: 'Kabupaten Bogor' })).toBe(
			'Kec. Cibinong, Kabupaten Bogor'
		);
	});

	test('semua kosong → null', () => {
		expect(formatLokasi({ alamat: '  ', regionNama: null })).toBeNull();
	});
});

describe('isMapsEmbedUrl / isHttpUrl (LOKASI-03)', () => {
	test('hanya embed Google Maps https', () => {
		expect(isMapsEmbedUrl('https://www.google.com/maps/embed?pb=!1m18')).toBe(true);
		expect(isMapsEmbedUrl('https://www.google.com/maps/embed/v1/place?q=x')).toBe(true);
		expect(isMapsEmbedUrl('http://www.google.com/maps/embed?pb=1')).toBe(false);
		expect(isMapsEmbedUrl('https://www.google.com/maps/embed.evil.com')).toBe(false);
		expect(isMapsEmbedUrl('https://evil.com/maps/embed')).toBe(false);
		expect(isMapsEmbedUrl('javascript:alert(1)')).toBe(false);
		expect(isMapsEmbedUrl(null)).toBe(false);
	});

	test('petunjuk arah hanya http(s)', () => {
		expect(isHttpUrl('https://maps.app.goo.gl/abc')).toBe(true);
		expect(isHttpUrl('javascript:alert(1)')).toBe(false);
	});
});
