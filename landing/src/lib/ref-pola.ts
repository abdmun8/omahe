/**
 * Pola & helper ref — modul TANPA DEPENDENSI apa pun (tanpa `$env/dynamic/*`)
 * supaya bisa di-import graf komponen BROWSER (mis. `lead-form-dialog.svelte`)
 * tanpa membuat vitest/jsdom gagal resolve `$env/dynamic/public`, dan tanpa
 * perlu mock `$lib/ref` di setiap test komponen (pelajaran KERJASAMA-03:
 * satu import `$lib/ref` di dialog merusak 2 suite komponen sekaligus).
 *
 * `src/lib/ref.ts` me-re-export semuanya — pemanggil server-side boleh
 * lanjut import dari `$lib/ref` seperti biasa.
 */

/**
 * KERJASAMA-03 — `ref` untuk QR kerjasama Omahe × PERUSAHAAN (bukan
 * perumahan): kode pendek `OP-` + 6 karakter alfabet backend tanpa ambigu
 * (tanpa 0/O/1/I/L). Dipakai di `?ref=` seperti ref lain — backend
 * `perumahan` yang memutuskan atribusinya (hanya perumahan ikut Program
 * Omahe; selain itu diabaikan diam-diam di sana).
 */
export const REF_OMAHE_PATTERN = /^OP-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

/**
 * KERJASAMA-03 — kolom "Kode referral (opsional)" di form minat: 6 karakter
 * alfabet yang sama dengan kode QR pendek (tanpa prefiks `OP-`).
 */
export const KODE_REFERRAL_PATTERN = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

/**
 * KERJASAMA-03 — nama mitra dari `?mitra=` di redirect `/q/:kode` adalah
 * LABEL TAMPILAN SAJA (banner "Rekomendasi dari …"); atribusi tetap dari
 * `ref` yang divalidasi backend. Nilai dari URL tidak dipercaya: tag HTML
 * dibuang, karakter berbahaya dilucuti, dipotong 120 karakter, kosong → null.
 */
export function bersihkanNamaMitra(raw: string | null): string | null {
	if (raw === null) return null;
	// Nama datang dari URL (`?mitra=`) — siapa pun bisa membuat link dengan
	// teks bebas yang lalu tampil di homepage Omahe. Batasi ke bentuk nama
	// perusahaan & tolak pola penipuan (nomor rekening/HP, link, ajakan
	// transfer). Ditolak → null: banner tanpa nama, atribusi ref tetap.
	const bersih = raw
		.replace(/<[^>]*>/g, '')
		.replace(/[^\p{L}\p{N} .,&()'\/-]/gu, '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 60)
		.trim();
	if (!bersih) return null;
	if (/\d{4,}/.test(bersih)) return null;
	if (/(https?|www|\.(com|id|net|org|co|me|ly)\b)/i.test(bersih)) return null;
	if (/\b(transfer|rekening|rek|bayar|dp|hubungi|whatsapp|wa|telp|telepon|klik|promo|gratis)\b/i.test(bersih)) return null;
	return bersih;
}
