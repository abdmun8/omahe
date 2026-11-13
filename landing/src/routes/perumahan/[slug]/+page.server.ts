import { getAgenPemasar, getPerumahan, getUnits } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import { adalahRefAgenPilihan, readRef } from '$lib/ref';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, setHeaders, url }) => {
	// Detail dulu — kalau slug-nya 404, tidak perlu menunggu query unit.
	const perumahan = await getPerumahan(fetch, params.slug);
	const ref = readRef(url);
	// AGEN-OMAHE-15 — agen kini memilih perumahan SENDIRI (tombol "Aktifkan
	// semua" dihapus), jadi daftar agen pemasar dikembalikan: backend hanya
	// membalas agen PREMIUM yang memilih perumahan ini (urut prioritas, maks
	// 6 tanpa ref; dengan `?ref=AO-…` pemilik ref saja). `ref` non-AO tidak
	// diteruskan. Fail-soft: gagal backend → `[]`, halaman tidak ikut jatuh.
	const [unit, agen] = await Promise.all([
		getUnits(fetch, { perumahanSlug: params.slug, pageSize: 48 }),
		getAgenPemasar(fetch, params.slug, adalahRefAgenPilihan(ref) ? ref : null)
	]);

	cacheKonten(setHeaders);
	return { perumahan, tipeUnit: unit.items, agen };
};
