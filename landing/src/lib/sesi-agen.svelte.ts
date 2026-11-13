/**
 * SESI-OMAHE-01 — store sesi agen Omahe (rune state, `.svelte.ts`).
 *
 * Status sesi dicek DI BROWSER setelah hydrate: root layout (`+layout.svelte`)
 * memanggil `muatSesiAgen()` SEKALI per muat halaman penuh lewat `onMount`
 * (layout persisten antar navigasi klien — bukan tiap navigasi). Halaman
 * publik TETAP anonim & ter-cache: cookie TIDAK PERNAH dibaca di `load`
 * halaman; hanya proxy `/api/saya` (no-store) yang menyentuhnya.
 *
 * Tanpa sesi / sesi non-agen / proxy gagal → `agen: null` = perilaku lama
 * (tombol WhatsApp biasa). Nilai default `status:'memuat'` + `agen:null`
 * berarti SSR & pra-hidrasi SELALU merender varian anonim.
 */
import type { AgenSaya } from '$lib/api/types';

export interface SesiAgenState {
	/** `memuat` = belum ada jawaban `/api/saya` (awal muat); `siap` = sudah. */
	status: 'memuat' | 'siap';
	agen: AgenSaya | null;
}

export const sesiAgen: SesiAgenState = $state({ status: 'memuat', agen: null });

/** Penjaga anti pemanggilan ganda (re-mount layout dsb.). */
let sedangMuat = false;

/** Bentuk `agen` dari `/api/saya` — field inti wajib valid, selain itu null. */
function normalisasiAgen(raw: unknown): AgenSaya | null {
	if (!raw || typeof raw !== 'object') return null;
	const a = raw as Record<string, unknown>;
	if (typeof a.kodeAgen !== 'string' || !a.kodeAgen) return null;
	if (typeof a.nama !== 'string' || !a.nama) return null;
	if (typeof a.panelUrl !== 'string' || !a.panelUrl) return null;
	return {
		kodeAgen: a.kodeAgen,
		nama: a.nama,
		fotoUrl: typeof a.fotoUrl === 'string' && a.fotoUrl ? a.fotoUrl : null,
		panelUrl: a.panelUrl,
		perumahanSlugs: Array.isArray(a.perumahanSlugs)
			? a.perumahanSlugs.filter((s): s is string => typeof s === 'string')
			: null
	};
}

/**
 * AGEN-OMAHE-15 — agen sesi ini memasarkan perumahan `slug`? `true` bila
 * tidak ada sesi agen / backend lama (tanpa daftar) — gerbang hanya
 * tampilan; backend tetap otoritatif.
 */
export function agenTerdaftarDi(slug: string | null | undefined): boolean {
	const daftar = sesiAgen.agen?.perumahanSlugs;
	if (!sesiAgen.agen || !daftar || !slug) return true;
	return daftar.includes(slug);
}

/** Pesan seragam keputusan 5 epic AGEN-OMAHE-15 (sama dengan backend). */
export const PESAN_BELUM_TERDAFTAR_AGEN =
	'Anda belum terdaftar sebagai agen perumahan ini. Silakan tambahkan perumahan terlebih dahulu.';

/**
 * Ambil status sesi dari `/api/saya` — idempoten (pemanggil ganda dalam
 * satu muatan halaman hanya men-fetch sekali; `paksa` untuk uji/refresh).
 * SELALU resolve: kegagalan apa pun = anonim (`agen:null`), tidak pernah
 * menampilkan pesan error ke pengunjung.
 */
export async function muatSesiAgen(paksa = false): Promise<void> {
	if (typeof window === 'undefined') return; // SSR — halaman anonim.
	if (sedangMuat && !paksa) return;
	sedangMuat = true;
	try {
		const res = await fetch('/api/saya', { headers: { accept: 'application/json' } });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const body = (await res.json()) as { agen?: unknown };
		sesiAgen.agen = normalisasiAgen(body?.agen);
	} catch {
		sesiAgen.agen = null;
	} finally {
		sesiAgen.status = 'siap';
		sedangMuat = false;
	}
}

/**
 * 401 dari `/api/agen-lead` — sesi sudah mati: kembalikan UI ke varian
 * anonim (tombol WhatsApp biasa + tombol "Masuk" di header muncul lagi).
 */
export function setSesiAgenNull(): void {
	sesiAgen.agen = null;
	sesiAgen.status = 'siap';
}

/** Reset penuh untuk test (kembali ke kondisi awal muat halaman). */
export function resetSesiAgenUntukTes(): void {
	sesiAgen.agen = null;
	sesiAgen.status = 'memuat';
}
