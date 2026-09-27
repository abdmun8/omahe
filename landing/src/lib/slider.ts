import type { PublicSlider } from '$lib/api/types';

/**
 * MONET-07 — lama tayang satu slide (ms): `durasiDetik` banner berbayar
 * (3–30, kelipatan 3) bila ada, selain itu jeda global (min 2 detik).
 */
export function jedaSlideMs(
	slide: Pick<PublicSlider, 'durasiDetik'> | undefined,
	jedaGlobalDetik: number
): number {
	const d = slide?.durasiDetik;
	if (typeof d === 'number' && Number.isInteger(d) && d >= 3 && d <= 30) return d * 1000;
	return Math.max(2, jedaGlobalDetik) * 1000;
}
