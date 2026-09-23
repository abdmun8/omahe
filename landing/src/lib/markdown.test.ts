import { describe, expect, test } from 'bun:test';
import { renderMarkdown } from './markdown';

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
