/**
 * Serialize objek JSON-LD jadi string yang aman di-inject lewat `{@html}`
 * di dalam <script type="application/ld+json">.
 *
 * Teks bebas seperti `deskripsi` datang dari input admin yang TIDAK
 * disanitasi di backend `perumahan` — kalau isinya mengandung `</script>`,
 * string itu bisa memutus tag <script> JSON-LD saat dirender (celah XSS).
 * Semua kemunculan `</` karena itu diganti `<\/`: escape solidus adalah
 * JSON yang valid dan ditulis ulang sebagai `/` biasa oleh JSON.parse,
 * jadi datanya tidak berubah — hanya markup HTML-nya yang tak bisa diputus.
 */
export function amankanJsonLd(obj: unknown): string {
	return JSON.stringify(obj).replace(/<\//g, '<\\/');
}
