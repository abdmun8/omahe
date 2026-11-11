import { getAgenPemasar, getPerumahan, getUnits } from '$lib/api';
import { cacheKonten } from '$lib/cache';
import { adalahRefAgenPilihan, readRef } from '$lib/ref';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, setHeaders, url }) => {
	// Detail dulu — kalau slug-nya 404, tidak perlu menunggu query unit.
	const perumahan = await getPerumahan(fetch, params.slug);
	const ref = readRef(url);
	// AGEN-OMAHE-13 — "Aktifkan semua" bisa membuat puluhan agen memilih satu
	// perumahan, jadi daftar lengkap tidak pernah diambil di sini lagi.
	// `getAgenPemasar` HANYA bila `ref` kode pilihan agen (`AO-…`) — backend
	// membalas agen pemilik ref itu saja → kartu agen tunggal di halaman.
	// Tanpa AO → `agen: []` (blok ringkas "semua agen Omahe" + link /mitra).
	// Fail-soft: gagal backend → `[]`, halaman tidak ikut jatuh.
	const [unit, agen] = await Promise.all([
		getUnits(fetch, { perumahanSlug: params.slug, pageSize: 48 }),
		adalahRefAgenPilihan(ref) ? getAgenPemasar(fetch, params.slug, ref) : Promise.resolve([])
	]);

	cacheKonten(setHeaders);
	return { perumahan, tipeUnit: unit.items, agen };
};
