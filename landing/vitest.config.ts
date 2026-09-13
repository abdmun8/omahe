/**
 * Konfigurasi khusus runner component test (vitest) — SENGAJA terpisah dari
 * `vite.config.ts`. `bun test` tetap memegang unit test murni
 * (`src/lib/*.test.ts`, lihat `bunfig.toml`), vitest hanya menangani tes
 * yang merender komponen `.svelte` di DOM. Dua runner jalan berdampingan,
 * bukan saling menggantikan (TASKS.md §"Component test dasar").
 */
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		// Plugin svelte polos (bukan `sveltekit()`) supaya vitest tidak ikut
		// memuat adapter/SSR Kit. `vitePreprocess()` wajib untuk
		// `<script lang="ts">` — di app utama otomatis ditambahkan plugin
		// sveltekit, di konfigurasi terpisah ini harus eksplisit.
		svelte({
			preprocess: vitePreprocess(),
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			}
		})
	],
	resolve: {
		// Vitest memproses file lewat pipeline server (SSR), jadi paket `svelte`
		// resolve ke `index-server` dan `mount()` gagal. Kondisi `browser`
		// memaksa runtime client — rekomendasi resmi vite-plugin-svelte untuk
		// vitest (https://svelte.dev/docs/svelte/vite-plugin-svelte#testing).
		conditions: ['browser'],
		alias: {
			// `$lib` & `$components` biasanya disediakan plugin sveltekit; dipasang
			// manual di sini supaya specifier di file tes identik dengan yang
			// dipakai komponen (jangan pakai path relatif menembus direktori).
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
			$components: fileURLToPath(new URL('./src/lib/components', import.meta.url))
		}
	},
	test: {
		environment: 'jsdom',
		// Hanya file tes di `src/lib/components/` — `src/lib/*.test.ts` milik
		// `bun test` (mereka meng-import `bun:test`, tidak bisa jalan di sini).
		include: ['src/lib/components/**/*.test.ts'],
		setupFiles: ['./src/lib/test/setup-component.ts']
	}
});
