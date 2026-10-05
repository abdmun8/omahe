/**
 * Tes helper link bayar publik (TAGIHAN-02, api-contract §27). Murni —
 * jalur API/fixture diuji lewat E2E manual (butuh Turnstile + backend).
 */
import { describe, expect, test } from 'bun:test';
import {
	TOKEN_BAYAR_PATTERN,
	LABEL_LAYANAN_BAYAR,
	labelLayananBayar,
	labelStatusBayar,
	MAKS_BUKTI_BYTES,
	validasiFileBukti,
	formatJatuhTempo,
	angkaSalin,
	rekeningSalin,
	pdfInvoiceContoh
} from './bayar';

describe('TOKEN_BAYAR_PATTERN', () => {
	test('menerima token panjang 20–64 karakter alfanumerik, "-", "_"', () => {
		expect(TOKEN_BAYAR_PATTERN.test('a'.repeat(20))).toBe(true);
		expect(TOKEN_BAYAR_PATTERN.test('A9-_z'.repeat(10) + 'abcd')).toBe(true); // 64
		expect(TOKEN_BAYAR_PATTERN.test('contohTokenBayarOmahe1234567890')).toBe(true);
	});

	test('menolak terlalu pendek / terlalu panjang', () => {
		expect(TOKEN_BAYAR_PATTERN.test('a'.repeat(19))).toBe(false);
		expect(TOKEN_BAYAR_PATTERN.test('a'.repeat(65))).toBe(false);
	});

	test('menolak karakter di luar pola — termasuk yang berbahaya di URL', () => {
		for (const t of [
			'panjang.titik.titik.titik.xx',
			'abc/def/ghi/jkl/mno',
			'spasi spasi spasi xx',
			'tanda+tanda+tanda+xx'
		]) {
			expect(TOKEN_BAYAR_PATTERN.test(t)).toBe(false);
		}
	});

	test('string kosong / undefined-ish tidak lolos', () => {
		expect(TOKEN_BAYAR_PATTERN.test('')).toBe(false);
	});
});

describe('labelLayananBayar', () => {
	test('semua layanan di kontrak punya label Indonesia', () => {
		for (const kunci of Object.keys(LABEL_LAYANAN_BAYAR)) {
			const label = labelLayananBayar(kunci);
			expect(label).toBeTruthy();
			expect(label).not.toEqual(kunci);
		}
	});

	test('layanan baru dari backend di-humanize, bukan dibuang', () => {
		expect(labelLayananBayar('konsultan_pajak')).toBe('Konsultan Pajak');
		expect(labelLayananBayar('sponsor-artikel')).toBe('Sponsor Artikel');
	});
});

describe('labelStatusBayar', () => {
	test('lima status kontrak punya label + nada warna', () => {
		expect(labelStatusBayar('belum_bayar')).toEqual({
			label: 'Menunggu pembayaran',
			nada: 'peringatan'
		});
		expect(labelStatusBayar('menunggu_verifikasi')).toEqual({
			label: 'Menunggu verifikasi',
			nada: 'info'
		});
		expect(labelStatusBayar('lunas')).toEqual({ label: 'Lunas', nada: 'sukses' });
		expect(labelStatusBayar('ditolak')).toEqual({ label: 'Ditolak', nada: 'bahaya' });
		expect(labelStatusBayar('batal')).toEqual({ label: 'Dibatalkan', nada: 'netral' });
	});

	test('status tak dikenal → netral, label apa adanya (tetap tampil)', () => {
		expect(labelStatusBayar('kadaluarsa')).toEqual({ label: 'kadaluarsa', nada: 'netral' });
	});
});

describe('validasiFileBukti', () => {
	const file = (type: string, size: number) => new File([new Uint8Array(size)], 'bukti', { type });

	test('JPG/PNG/WebP/PDF ≤ 4 MB lolos', () => {
		expect(validasiFileBukti(file('image/jpeg', 1024))).toEqual({ ok: true });
		expect(validasiFileBukti(file('image/png', 1024))).toEqual({ ok: true });
		expect(validasiFileBukti(file('image/webp', 1024))).toEqual({ ok: true });
		expect(validasiFileBukti(file('application/pdf', MAKS_BUKTI_BYTES))).toEqual({ ok: true });
	});

	test('MIME di luar JPG/PNG/WebP/PDF ditolak (mirror backend)', () => {
		expect(validasiFileBukti(file('image/gif', 1024)).ok).toBe(false);
		expect(validasiFileBukti(file('', 1024)).ok).toBe(false);
	});

	test('> 4 MB (batas body Vercel) ditolak SEBELUM diteruskan ke backend', () => {
		const hasil = validasiFileBukti(file('application/pdf', MAKS_BUKTI_BYTES + 1));
		expect(hasil.ok).toBe(false);
		if (!hasil.ok) expect(hasil.pesan).toContain('4 MB');
	});

	test('berkas kosong ditolak dengan pesan jelas', () => {
		const hasil = validasiFileBukti(file('application/pdf', 0));
		expect(hasil.ok).toBe(false);
		if (!hasil.ok) expect(hasil.pesan).toContain('kosong');
	});
});

describe('formatJatuhTempo', () => {
	test('ISO UTC diformat ke WIB dengan tanggal, jam, dan sufiks WIB', () => {
		// 16:59:59 UTC = 23:59:59 WIB.
		const hasil = formatJatuhTempo('2026-10-05T16:59:59.000Z');
		expect(hasil).toMatch(/^5 Okt 2026 pukul 23[.,]59 WIB$/);
	});

	test('ISO tak valid → em-dash, bukan "Invalid Date"', () => {
		expect(formatJatuhTempo('bukan-tanggal')).toBe('—');
	});
});

describe('angkaSalin & rekeningSalin', () => {
	test('nominal transfer disalin tanpa "Rp" dan tanpa titik', () => {
		expect(angkaSalin(1_665_321)).toBe('1665321');
	});

	test('desimal dibuang (transfer selalu rupiah utuh)', () => {
		expect(angkaSalin(1000.9)).toBe('1000');
	});

	test('spasi & garis pada nomor rekening dibuang saat disalin', () => {
		expect(rekeningSalin('1234 5678 90')).toBe('1234567890');
		expect(rekeningSalin('123-456-789')).toBe('123456789');
	});
});

describe('pdfInvoiceContoh', () => {
	test('menghasilkan PDF valid minimal (header, xref, trailer)', () => {
		const pdf = new TextDecoder().decode(pdfInvoiceContoh());
		expect(pdf.startsWith('%PDF-1.4')).toBe(true);
		expect(pdf).toContain('xref');
		expect(pdf).toContain('/Root 1 0 R');
		expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
		expect(pdf).toContain('Invoice Contoh');
	});
});
