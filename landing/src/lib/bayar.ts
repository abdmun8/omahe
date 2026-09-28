/**
 * Link bayar publik `/bayar/:token` (TAGIHAN-02, api-contract §27) —
 * helper MURNI (tanpa fetch/env, aman di browser maupun `bun test`).
 * Fungsi API-nya ada di `api/client.ts` (server-only), halaman tinggal
 * memanggil lewat proxy `/api/bayar/:token/*`.
 *
 * Tiga aturan keamanan yang dijaga helper di sini:
 *   1. Token URL = SATU-SATUNYA kunci tagihan — validasi polanya sebelum
 *      fetch apa pun (backend 404 seragam; Omahe tidak memanggil backend
 *      untuk token yang pasti salah format).
 *   2. Token Turnstile SEKALI PAKAI — dipakai untuk `lihat`, harus di-reset
 *      widget sebelum `bukti` (diurus komponen halaman).
 *   3. Validasi file bukti di Omahe = mirror backend (`image/jpeg`,
 *      `image/png`, `application/pdf`; ukuran ≤ 4 MB — lihat
 *      `MAKS_BUKTI_BYTES`) supaya file terlalu besar DITOLAK
 *      di proxy SEBELUM diteruskan (hemat bandwith + tidak memicu rate
 *      limit backend untuk upload yang pasti gagal).
 */
import type { DetailBayar } from './api/types';

/** Sama dengan backend (`bayar-publik.service.ts` TOKEN_POLA). */
export const TOKEN_BAYAR_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

// ---------------------------------------------------------------------------
// Label layanan & status
// ---------------------------------------------------------------------------

/**
 * Label Indonesia per `DetailBayar.layanan`. Map + fallback humanize (bukan
 * union yang ketat) supaya layanan BARU di backend tetap tampil manis di
 * Omahe tanpa redeploy — pola `labelKategoriMitra`.
 */
export const LABEL_LAYANAN_BAYAR: Record<string, string> = {
	banner: 'Iklan banner',
	direktori_mitra: 'Direktori mitra',
	agen_properti: 'Agen properti',
	keanggotaan_agen: 'Keanggotaan agen',
	lainnya: 'Layanan lainnya',
	token_agen: 'Token agen',
	prioritas_agen: 'Prioritas agen',
	prioritas_perumahan: 'Prioritas perumahan'
};

/** Layanan dikenal → label peta; layanan baru → humanize (`snake_case`). */
export function labelLayananBayar(layanan: string): string {
	return (
		LABEL_LAYANAN_BAYAR[layanan] ??
		layanan
			.split(/[_-]+/)
			.filter(Boolean)
			.map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
			.join(' ')
	);
}

/** Nada warna badge/panel status — komponen yang memetakan ke kelas CSS. */
export type NadaStatus = 'netral' | 'info' | 'sukses' | 'peringatan' | 'bahaya';

export interface LabelStatus {
	label: string;
	nada: NadaStatus;
}

const LABEL_STATUS_BAYAR: Record<string, LabelStatus> = {
	belum_bayar: { label: 'Menunggu pembayaran', nada: 'peringatan' },
	menunggu_verifikasi: { label: 'Menunggu verifikasi', nada: 'info' },
	lunas: { label: 'Lunas', nada: 'sukses' },
	ditolak: { label: 'Ditolak', nada: 'bahaya' },
	batal: { label: 'Dibatalkan', nada: 'netral' }
};

/** Status dikenal → label + nada; status baru → netral (tetap tampil). */
export function labelStatusBayar(status: string): LabelStatus {
	return LABEL_STATUS_BAYAR[status] ?? { label: status, nada: 'netral' };
}

// ---------------------------------------------------------------------------
// Validasi file bukti (mirror backend)
// ---------------------------------------------------------------------------

/** 4 MB — LEBIH ketat dari backend (5 MB) karena bukti lewat proxy
 *  Omahe di Vercel yang membatasi body request ±4,5 MB; file 4,5–5 MB akan
 *  gagal 413 di platform sebelum sampai ke kode kita. */
export const MAKS_BUKTI_BYTES = 4 * 1024 * 1024;

/** MIME yang diterima backend — jangan lebih longgar di sini. */
export const MIME_BUKTI = ['image/jpeg', 'image/png', 'application/pdf'] as const;

export type HasilValidasiFile = { ok: true } | { ok: false; pesan: string };

/** Validasi klien + proxy (pesan sengaja meniru pesan backend). */
export function validasiFileBukti(file: File): HasilValidasiFile {
	if (!(MIME_BUKTI as readonly string[]).includes(file.type))
		return { ok: false, pesan: 'Bukti harus berupa berkas JPG, PNG, atau PDF.' };
	if (file.size > MAKS_BUKTI_BYTES) return { ok: false, pesan: 'Ukuran berkas maksimal 4 MB.' };
	if (file.size === 0)
		return { ok: false, pesan: 'Berkas kosong — pilih berkas bukti yang benar.' };
	return { ok: true };
}

// ---------------------------------------------------------------------------
// Format tampil
// ---------------------------------------------------------------------------

/**
 * "26 Sep 2026 pukul 23.59 WIB" — zona Asia/Jakarta eksplisit: pengirim
 * invoice (backend) menyimpan UTC, penerima hampir pasti di WIB.
 */
export function formatJatuhTempo(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '—';
	const tanggal = d.toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'Asia/Jakarta'
	});
	const jam = d.toLocaleTimeString('id-ID', {
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Asia/Jakarta'
	});
	return `${tanggal} pukul ${jam} WIB`;
}

/** Angka untuk TOMBOL SALIN nominal transfer — tanpa "Rp"/titik
 *  ("1665321"), supaya yang ditempel ke app bank tidak perlu dibersihkan. */
export function angkaSalin(nilai: number): string {
	return String(Math.trunc(nilai));
}

/** Nomor rekening untuk tombol salin — spasi/garis dibuang. */
export function rekeningSalin(nomor: string): string {
	return nomor.replace(/[\s-]/g, '');
}

// ---------------------------------------------------------------------------
// PDF invoice contoh (mode fixture, DEV saja)
// ---------------------------------------------------------------------------

/**
 * PDF 1 halaman MINIMAL untuk `unduhDokumenBayar` mode fixture (dev tanpa
 * backend) supaya tombol "Unduh Invoice" tetap bisa dicoba. Dibangun manual
 * lengkap dengan tabel xref (offset dihitung runtime) supaya pembuka PDF
 * tidak perlu "repair". Produksi tidak pernah memanggil ini — jalur API
 * asli mengembalikan PDF asli dari backend.
 *
 * Tipe kembalian `Uint8Array<ArrayBuffer>` (bukan `Uint8Array` generik)
 * supaya lolos `BodyInit` Response tanpa cast.
 */
export function pdfInvoiceContoh(): Uint8Array<ArrayBuffer> {
	const stream =
		'BT /F1 16 Tf 56 780 Td (Omahe - Invoice Contoh) Tj ET\n' +
		'BT /F1 11 Tf 56 758 Td (Mode fixture: ini bukan invoice asli.) Tj ET\n' +
		'BT /F1 11 Tf 56 744 Td (Set OMAHE_API_BASE_URL untuk invoice sungguhan.) Tj ET';
	const objects = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
		`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
	];
	let pdf = '%PDF-1.4\n';
	const offset: number[] = [];
	objects.forEach((isi, i) => {
		offset.push(pdf.length);
		pdf += `${i + 1} 0 obj\n${isi}\nendobj\n`;
	});
	const xref = pdf.length;
	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const off of offset) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
	pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
	return new TextEncoder().encode(pdf);
}
/** Tipe re-export supaya pemanggil halaman tak perlu path `api/types`. */
export type { DetailBayar };
