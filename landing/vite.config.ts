import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
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
			//
			// `OMAHE_ADAPTER=node` (env saat build) memilih `adapter-node` untuk
			// Docker/self-host (`landing/Dockerfile`) — menghasilkan standalone
			// server `node build`. Default (tanpa env) tetap Vercel.
			//
			// `regions: ['sin1']` (Singapura) — default Vercel `iad1` (AS timur)
			// membuat setiap fetch SSR ke backend `perumahan-api` (Asia) menempuh
			// AS↔Asia; saat cold start + TLS baru, fetch kontak 1,5 dtk timeout
			// (log production 2026-09-23, header `x-vercel-id: sin1::iad1`).
			// Pengunjung (Indonesia) & backend sama-sama dekat Singapura.
			adapter:
				process.env.OMAHE_ADAPTER === 'node'
					? adapterNode()
					: adapterVercel({ runtime: 'nodejs22.x', regions: ['sin1'] }),

			alias: {
				$components: 'src/lib/components'
			}
		})
	]
});
