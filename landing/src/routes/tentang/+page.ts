/**
 * Halaman murni statis — di-prerender build-time supaya TTFB-nya ~nol di
 * Vercel (edge cache) maupun Docker self-host (`build/prerendered/`).
 * Flag prerender harus di modul `+page.ts`, bukan di `+page.svelte`.
 */
export const prerender = true;
