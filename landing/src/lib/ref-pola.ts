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
 * REF-AGEN-01 — kode agen pribadi (`agen_anggota.kode_agen`, link pribadi
 * `https://www.omahe.co.id/?ref=<kode>`): baru berurutan `OMHA-{huruf}{4 digit}`
 * (mis. `OMHA-A0001`, AGEN-OMAHE-05) ATAU kode acak lama `OMH-XXXXXX`
 * (alias `kode_agen_lama`). Pola TEGAS UPPERCASE — input dari URL
 * dinormalisasi dulu lewat `normalisasiRefAgenPribadi` (trim + uppercase,
 * "simpan UPPERCASE"); `REF_PATTERN` memang membiarkan huruf kecil lewat
 * `readRef`, jadi normalisasi di sini yang menjaga bentuk tersimpan/terkirim.
 */
export const REF_AGEN_PRIBADI_PATTERN = /^(?:OMHA-[A-Z]\d{4}|OMH-[A-Z0-9]{6})$/;

/**
 * REF-AGEN-01 — normalisasi kode agen pribadi dari URL/input: trim +
 * uppercase, lalu HARUS lolos penuh `REF_AGEN_PRIBADI_PATTERN`. Selain itu
 * (spasi di tengah, karakter aneh, panjang meleset) → `null` / diabaikan —
 * nilai URL tidak pernah dipercaya dan tidak boleh menyelundupkan apa pun
 * ke tautan tujuan (`withRef`/`ajukanUrl`/body `/api/lead`).
 */
export function normalisasiRefAgenPribadi(raw: string | null | undefined): string | null {
	if (typeof raw !== 'string') return null;
	const rapi = raw.trim().toUpperCase();
	return REF_AGEN_PRIBADI_PATTERN.test(rapi) ? rapi : null;
}

/**
 * AGEN-OMAHE-13 (2026-11-11) — kode `?ref=` PILIHAN agen Omahe atas satu
 * perumahan (`agen_omahe_pilihan.kode_ref`, dibuat backend `buatKodeRef`):
 * `AO-` + 4–17 karakter alfanumerik backend. Pola & normalisasi mengikuti
 * `adalahKodeRefAgen` repo `perumahan` (trim + uppercase di sisi sana) —
 * jangan diketatkan tanpa koordinasi. Menandai pengunjung datang lewat
 * link pribadi agen → halaman detail perumahan menampilkan KARTU agen itu
 * (bukan blok umum "semua agen Omahe"), dan server load hanya dipanggil
 * `getAgenPemasar` bila ref berpola ini (hemat panggilan backend).
 */
export const REF_AGEN_PILIHAN_PATTERN = /^AO-[A-Z0-9]{4,17}$/;

/**
 * AGEN-OMAHE-13 — `ref` dari URL adalah kode pilihan agen (`AO-…`)?
 * Normalisasi trim + uppercase SAMA dengan backend (`adalahKodeRefAgen`),
 * karena `readRef` membiarkan huruf kecil lewat passthrough apa adanya.
 * Selain itu (null, hex kerjasama, `OP-…`, kode pribadi agen) → `false`.
 */
export function adalahRefAgenPilihan(raw: string | null | undefined): boolean {
	if (typeof raw !== 'string') return false;
	return REF_AGEN_PILIHAN_PATTERN.test(raw.trim().toUpperCase());
}

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
	if (
		/\b(transfer|rekening|rek|bayar|dp|hubungi|whatsapp|wa|telp|telepon|klik|promo|gratis)\b/i.test(
			bersih
		)
	)
		return null;
	return bersih;
}

/**
 * KOMISI-OMAHE-02 (2026-11-11) — cashback pembeli hanya untuk booking
 * LANGSUNG lewat Omahe. Pengunjung yang membawa ref agen (`AO-…`, link
 * pribadi `OMHA-…`/`OMH-…`) atau ref mitra perusahaan (`OP-…`) tidak
 * mendapat cashback (backend men-snapshot `cashback: 0` untuk sumber
 * `agen_omahe`/`kerjasama_omahe`) → blok program di detail perumahan
 * menyembunyikan baris cashback. DP 0% tetap tampil. Ref hex kerjasama
 * lama & tanpa ref → cashback tetap ditampilkan seperti biasa.
 */
export function refTanpaCashback(raw: string | null | undefined): boolean {
	if (typeof raw !== 'string') return false;
	const rapi = raw.trim().toUpperCase();
	return (
		REF_AGEN_PILIHAN_PATTERN.test(rapi) ||
		REF_AGEN_PRIBADI_PATTERN.test(rapi) ||
		REF_OMAHE_PATTERN.test(rapi)
	);
}
