/**
 * Font untuk kartu OG (SHARE-02) — dibundel Vite dari TTF OFL di folder
 * `fonts/` (import default = URL/data URL aset, tergantung build):
 *
 * - `vite build` (SSR/rolldown) → data URL base64 ter-inline di bundle
 *   server → di Vercel serverless TIDAK ada file terpisah yang perlu
 *   di-trace. Diverifikasi: `bun run build` lalu grep output — hasil
 *   `data:font/ttf;base64,...` (lihat komentar README modul kartu).
 * - `bun test` / dev → Bun me-resolve import aset jadi PATH file lokal →
 *   dibaca langsung dengan `readFileSync`.
 *
 * Bentuk lain (URL web, mis. `/_app/immutable/…`) ditolak dengan error —
 * route pemakainya sudah fail-soft 302 ke `/og-default.jpg`.
 *
 * Lisensi: semua font di bawah OFL (SIL Open Font License) — lihat
 * `fonts/CREDITS.md`. Versi statis (bukan variable) supaya satori memakai
 * bobot yang benar.
 */
import { readFileSync } from 'node:fs';

import fontJakarta700Src from './fonts/plus-jakarta-sans-700.ttf?url';
import fontJakarta800Src from './fonts/plus-jakarta-sans-800.ttf?url';
import fontInter500Src from './fonts/inter-500.ttf?url';

/** Data URL base64 → Buffer; path file lokal (bun test/dev) → readFileSync. */
function muatFont(sumber: string): Buffer {
	if (sumber.startsWith('data:')) {
		return Buffer.from(sumber.slice(sumber.indexOf(',') + 1), 'base64');
	}
	try {
		return readFileSync(new URL(sumber, import.meta.url));
	} catch {
		throw new Error(
			`Font OG tidak bisa dimuat (${sumber.slice(0, 60)}…) — build tidak meng-inline aset.`
		);
	}
}

export const fontJakarta700 = muatFont(fontJakarta700Src);
export const fontJakarta800 = muatFont(fontJakarta800Src);
export const fontInter500 = muatFont(fontInter500Src);
