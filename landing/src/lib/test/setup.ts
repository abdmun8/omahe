/**
 * Preload `bun test` (lihat `bunfig.toml`). `$env/dynamic/*` adalah modul
 * virtual yang dibuat SvelteKit saat build — di luar Vite modul itu tidak
 * ada, jadi tanpa stub ini `bun test` gagal resolve begitu ada file yang
 * mengimpornya (mis. `src/lib/ref.ts`).
 */
import { mock } from 'bun:test';

mock.module('$env/dynamic/public', () => ({
	env: { PUBLIC_BOOKING_BASE_URL: 'https://app.perumahan.test' }
}));

mock.module('$env/dynamic/private', () => ({
	env: {}
}));
