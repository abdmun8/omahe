/**
 * Stub `$app/state` untuk component test (vitest tanpa plugin sveltekit).
 * Komponen membaca `page.data.kontak` (ADMIN-05) — di tes, `data` kosong
 * sehingga komponen memakai fallback `SITE.*` (perilaku yang diuji tes lama).
 * Tes yang butuh kontak lain boleh mengisi `page.data` sebelum render.
 */
export const page: { data: Record<string, unknown>; url: URL } = {
	data: {},
	url: new URL('http://localhost/')
};
