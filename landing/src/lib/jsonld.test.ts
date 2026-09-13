/**
 * Invariant yang dikunci: JSON-LD yang di-inject lewat `{@html}` TIDAK
 * BOLEH memuat `</` — teks admin (`deskripsi`, dst) tidak disanitasi di
 * backend, jadi `</script>` di tengah nilai bisa memutus tag <script>
 * (lihat `src/lib/jsonld.ts`). Kalau rusak, tidak ada error yang keluar —
 * markup halaman diam-diam rusak dan celah XSS terbuka.
 */
import { describe, expect, test } from 'bun:test';
import { amankanJsonLd } from './jsonld';

describe('amankanJsonLd', () => {
	test('meng-escape semua `</` menjadi `<\\/`', () => {
		const hasil = amankanJsonLd({ a: '</script>', b: 'x</span>y' });
		expect(hasil).not.toContain('</');
		expect(hasil).toContain('<\\/');
	});

	test('hasil tetap JSON valid dan nilai tidak berubah — solidus di-escape, bukan dibuang', () => {
		const hasil = amankanJsonLd({ deskripsi: 'awal </script> akhir' });
		expect(JSON.parse(hasil).deskripsi).toBe('awal </script> akhir');
	});

	test('data tanpa `</` tidak disentuh', () => {
		expect(amankanJsonLd({ nama: 'Omahe' })).toBe('{"nama":"Omahe"}');
	});
});
