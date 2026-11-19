/**
 * Deklarasi import aset `.ttf` (SHARE-02 — font kartu OG di
 * `src/lib/server/og/fonts/`). Vite & Bun me-resolve-nya jadi string
 * (data URL base64 setelah `vite build`, path file di bun test/dev) —
 * lihat `src/lib/server/og/fonts.ts`.
 */
declare module '*.ttf' {
	const src: string;
	export default src;
}
