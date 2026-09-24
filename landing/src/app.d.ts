// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { KontakOmahe, TeksOmahe } from '$lib/api/types';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			/**
			 * Kontak Omahe (ADMIN-05) — dimuat di layout root
			 * (`+layout.server.ts`), tersedia di semua halaman via
			 * `page.data.kontak`. Opsional: pemanggil wajib punya fallback
			 * `SITE.*` (mis. jalur prerender/hidrasi awal).
			 */
			kontak?: KontakOmahe;
			/** ADMIN-06 — teks hero homepage (layout server, fallback `SITE`). */
			teks?: TeksOmahe;
			/** Passthrough `?ref=` (layout universal, `src/lib/ref.ts`). */
			ref?: string | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
