import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Deploy sementara di Vercel (CLAUDE.md §Stack) — runtime produksi Node
			// function Vercel, BUKAN Bun; Bun cuma dipakai lokal (`bun run dev`).
			adapter: adapter({ runtime: 'nodejs22.x' }),

			alias: {
				$components: 'src/lib/components'
			}
		})
	]
});
