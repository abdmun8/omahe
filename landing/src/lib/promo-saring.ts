/**
 * Saringan anti-dobel seksi homepage (MONET-01, keputusan user 2026-10-23):
 * perumahan yang sudah tampil di "Promo Pilihan" (partner berbayar) TIDAK
 * boleh muncul lagi di seksi organik — "Rekomendasi Hari Ini" (unit
 * unggulan) maupun "Baru di Omahe". Slot homepage terbatas; dobel untuk
 * perumahan yang sama memboroskan slot yang semestinya milik perumahan
 * lain dan membuat halaman terasa repetitif.
 *
 * Fungsi-fungsi di sini PURE (tanpa I/O, tanpa state) supaya bisa dites
 * `bun test` tanpa mock — pemanggilnya `src/routes/+page.server.ts` yang
 * mengurusi fetch. Karena sebagian kandidat bisa gugur saringan, pemanggil
 * WAJIB mengambil kandidat LEBIH BANYAK dari kebutuhan slot (mis. 12 unit
 * untuk 6 slot, 8 perumahan untuk 4 slot) supaya jumlah slot tetap penuh.
 */

/** Slug perumahan promo — set untuk lookup O(1) di saringan. */
export function kumpulkanSlugPromo(promo: ReadonlyArray<{ slug: string }>): Set<string> {
	return new Set(promo.map((p) => p.slug));
}

/**
 * Buang item milik perumahan promo (dicocokkan lewat `ambilSlug` —
 * `unit.perumahan.slug` untuk kartu unit, `slug` untuk direktori
 * perumahan), lalu potong `maks` — urutan asli kandidat dipertahankan.
 */
export function saringBukanPromo<T>(
	items: readonly T[],
	slugPromo: ReadonlySet<string>,
	ambilSlug: (item: T) => string,
	maks: number
): T[] {
	if (slugPromo.size === 0) return items.slice(0, maks);
	return items.filter((item) => !slugPromo.has(ambilSlug(item))).slice(0, maks);
}
