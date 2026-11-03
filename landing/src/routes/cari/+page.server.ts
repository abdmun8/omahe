import { getRegions, getUnits } from '$lib/api';
import type { UnitQuery } from '$lib/api/types';
import { cacheKonten } from '$lib/cache';
import { parseUrutan } from '$lib/urutan-unit';
import type { PageServerLoad } from './$types';

/** Angka dari query string; nilai tidak valid diabaikan, bukan bikin error —
 *  URL pencarian sering diedit manual atau dipotong saat dibagikan. */
function angka(raw: string | null): number | undefined {
	if (raw === null || raw.trim() === '') return undefined;
	const n = Number(raw);
	return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Rupiah dari query — non-digit di-strip dulu ("500.000.000" → 500 jt penuh;
 *  tanda titik pemisah ribuan yang lumrah diketik/ditempel, tanpa ini
 *  Number() malah membaca 500). 2026-10-08 — harga min/maks ketik sendiri. */
function rupiah(raw: string | null): number | undefined {
	if (raw === null || raw.trim().startsWith('-')) return undefined;
	const digit = raw.replace(/\D/g, '');
	if (digit === '') return undefined;
	const n = Number(digit);
	return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** UNIT-10 — kata kunci: trim + maks 100 char (backend memotong juga di
 *  100/6 kata; sisi Omahe cukup trim & potong supaya URL rapi). */
function kataKunci(raw: string | null): string | undefined {
	const q = raw?.trim().slice(0, 100);
	return q ? q : undefined;
}

/** UNIT-10 — kamar minimal: integer 1–10, selain itu undefined (nilai aneh
 *  diabaikan, bukan error — pola `angka`/`rupiah`). */
function kamar(raw: string | null): number | undefined {
	if (raw === null || raw.trim() === '') return undefined;
	const n = Number(raw);
	return Number.isInteger(n) && n >= 1 && n <= 10 ? n : undefined;
}

export const load: PageServerLoad = async ({ url, fetch, setHeaders }) => {
	const regionKode = url.searchParams.get('regionKode') || undefined;
	const query: UnitQuery = {
		regionKode,
		tipe: url.searchParams.get('tipe') || undefined,
		developerSlug: url.searchParams.get('developerSlug') || undefined,
		hargaMin: rupiah(url.searchParams.get('hargaMin')),
		hargaMax: rupiah(url.searchParams.get('hargaMax')),
		// UNIT-10 — kata kunci & filter kamar/kecamatan. `kecamatanKode` hanya
		// bila `regionKode` ada: UI reset kecamatan saat lokasi berganti, jadi
		// kode kecamatan tanpa kabupaten induknya tidak bermakna (dan chip
		// kecamatan tidak dirender tanpa lokasi).
		q: kataKunci(url.searchParams.get('q')),
		kecamatanKode: regionKode ? url.searchParams.get('kecamatanKode') || undefined : undefined,
		kamarTidurMin: kamar(url.searchParams.get('kamarTidurMin')),
		kamarMandiMin: kamar(url.searchParams.get('kamarMandiMin')),
		// UNIT-07 — urutan (nilai aneh = rekomendasi).
		sort: parseUrutan(url.searchParams.get('sort')),
		page: angka(url.searchParams.get('page')) || 1
	};

	const [hasil, regions] = await Promise.all([getUnits(fetch, query), getRegions(fetch)]);

	cacheKonten(setHeaders);
	return { hasil, regions, query };
};
