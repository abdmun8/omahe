import { describe, expect, test } from 'bun:test';
import { cuplikanDeskripsi, renderMarkdown } from './markdown';

describe('renderMarkdown (UNIT-05, subset aman)', () => {
	test('heading, list, bold', () => {
		const html = renderMarkdown('## Spesifikasi\n- **Pondasi**: batu kali\n- Dinding bata');
		expect(html).toContain('<h2>Spesifikasi</h2>');
		expect(html).toContain('<ul>');
		expect(html).toContain('<li><strong>Pondasi</strong>: batu kali</li>');
	});

	test('HTML mentah tenant di-escape, tidak pernah jadi tag', () => {
		const html = renderMarkdown('<script>alert(1)</script>\n<img src=x onerror=alert(1)>');
		expect(html).not.toContain('<script>');
		expect(html).not.toContain('<img');
		expect(html).toContain('&lt;script&gt;');
	});

	test('link javascript:/data: tidak jadi <a>', () => {
		expect(renderMarkdown('[klik](javascript:alert(1))')).not.toContain('<a');
		expect(renderMarkdown('[klik](data:text/html,x)')).not.toContain('<a');
	});

	test('link https jadi <a> aman, kutip tidak bisa keluar dari atribut', () => {
		const html = renderMarkdown('[situs](https://omahe.co.id/"onmouseover="x)');
		expect(html).toContain('<a href="https://omahe.co.id/&quot;onmouseover=&quot;x"');
	});
});

describe('cuplikanDeskripsi (PROFIL-01 — teks polos dari Markdown)', () => {
	test('heading, list, bold, link, code dibersihkan jadi teks polos', () => {
		const md =
			'## Tentang Kami\nKJPT yang **berpengalaman** sejak 2014.\n\n## Layanan\n- Penilaian `KPR`\n- [Situs kami](https://kjpt.test)\n\n1. Survei cepat\n2. Laporan 3 hari';
		const polos = cuplikanDeskripsi(md);
		expect(polos).toBe(
			'Tentang Kami KJPT yang berpengalaman sejak 2014. Layanan Penilaian KPR Situs kami Survei cepat Laporan 3 hari'
		);
		// Bukan markup: tidak ada sisa sintaks Markdown maupun URL link.
		expect(polos).not.toContain('##');
		expect(polos).not.toContain('-');
		expect(polos).not.toContain('*');
		expect(polos).not.toContain('https://');
		expect(polos).not.toContain('<');
	});

	test('HTML mentah dibuang (cuplikan polos, bukan markup) & HR tidak menyumbang teks', () => {
		const polos = cuplikanDeskripsi('<script>alert(1)</script> Penilai publik\n---\nJakarta');
		expect(polos).toBe('alert(1) Penilai publik Jakarta');
	});

	test('panjang dibatasi di batas kata + elipsis; pendek dikembalikan utuh', () => {
		const md = '- **Pondasi**: batu kali & footplat beton';
		expect(cuplikanDeskripsi(md)).toBe('Pondasi: batu kali & footplat beton');

		const panjang = `Kantor pertama di Bogor ${'x'.repeat(200)}`;
		const potong = cuplikanDeskripsi(panjang);
		expect(potong.length).toBeLessThanOrEqual(156); // 155 + elipsis
		expect(potong.endsWith('…')).toBe(true);
		expect(potong.startsWith('Kantor pertama di Bogor x')).toBe(true);
	});

	test('tanda hubung di tengah kata tidak dianggap penanda list', () => {
		expect(cuplikanDeskripsi('Melayani Jakarta-Bandung dan sekitarnya')).toBe(
			'Melayani Jakarta-Bandung dan sekitarnya'
		);
	});

	test('kosong / whitespace → string kosong (pemanggil pakai fallback)', () => {
		expect(cuplikanDeskripsi('')).toBe('');
		expect(cuplikanDeskripsi('\n \n')).toBe('');
	});
});
