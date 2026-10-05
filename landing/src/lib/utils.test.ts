import { describe, expect, test } from 'bun:test';
import {
	formatLokasi,
	formatNomorTampil,
	formatPeriodePromo,
	isHttpUrl,
	isMapsEmbedUrl,
	nomorInternasional,
	pesanWaPeminat,
	telUrl,
	waUrl
} from './utils';

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

describe('formatPeriodePromo (PROMO-02)', () => {
	test('dengan dan tanpa tanggal berakhir, zona WIB', () => {
		// 31 Okt 16:59:59 UTC = 31 Okt 23:59:59 WIB — tetap "31 Okt".
		expect(formatPeriodePromo('2026-09-30T17:00:00.000Z', '2026-10-31T16:59:59.999Z')).toBe(
			'1 Okt 2026 – 31 Okt 2026'
		);
		expect(formatPeriodePromo('2026-09-30T17:00:00.000Z', null)).toBe('Mulai 1 Okt 2026');
	});
});

describe('pesan WA peminat (LEAD-02)', () => {
	test('nomorInternasional: 08…/62…/8… → +62…', () => {
		expect(nomorInternasional('0812-3456-7890')).toBe('+6281234567890');
		expect(nomorInternasional('6281234567890')).toBe('+6281234567890');
		expect(nomorInternasional('81234567890')).toBe('+6281234567890');
	});

	test('memuat nama, nomor +62 (bisa diklik admin), perumahan, tipe & pesan', () => {
		expect(
			pesanWaPeminat({
				nama: ' Budi ',
				telepon: '081234567890',
				namaPerumahan: 'Griya Asri',
				tipeMinat: 'Tipe 36',
				pesan: 'Masih ada unit?'
			})
		).toBe(
			'Halo, saya Budi (+6281234567890).\nSaya tertarik dengan Griya Asri (Tipe 36) yang saya lihat di Omahe.\n\nMasih ada unit?'
		);
	});

	test('tanpa tipe & pesan → dua baris saja', () => {
		expect(
			pesanWaPeminat({ nama: 'Ani', telepon: '0811111111', namaPerumahan: 'Griya Asri' })
		).toBe(
			'Halo, saya Ani (+62811111111).\nSaya tertarik dengan Griya Asri yang saya lihat di Omahe.'
		);
	});
});

describe('isMapsEmbedUrl — LELANG-02 bentuk koordinat', () => {
	test('maps?q=lat,lng&output=embed diterima; variasi lain ditolak', () => {
		expect(isMapsEmbedUrl('https://www.google.com/maps?q=-6.8688,107.5477&output=embed')).toBe(
			true
		);
		expect(isMapsEmbedUrl('https://www.google.com/maps?q=-6.8,107.5&output=embed&x=1')).toBe(false);
		expect(isMapsEmbedUrl('https://maps.google.com/maps?q=-6.8,107.5&output=embed')).toBe(false);
		expect(isMapsEmbedUrl('https://www.google.com/maps?q=95,107.5&output=embed')).toBe(false);
		expect(isMapsEmbedUrl('https://www.google.com/maps?q=Bandung&output=embed')).toBe(false);
	});
});
