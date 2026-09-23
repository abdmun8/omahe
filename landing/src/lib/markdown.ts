/**
 * UNIT-05 — renderer Markdown untuk deskripsi/spesifikasi tipe rumah yang
 * ditulis ADMIN TENANT di app `perumahan` (konten pihak ketiga yang tampil
 * di domain Omahe).
 *
 * SALINAN PERSIS logika `perumahan/frontend/src/lib/markdown.ts` (ADMIN-02)
 * supaya preview di editor admin = tampilan publik Omahe. Kalau salah satu
 * diubah, ubah keduanya.
 *
 * Keamanan: HTML mentah di-ESCAPE dulu (termasuk `"`/`'`, jadi tidak ada
 * yang bisa keluar dari atribut) → tidak ada markup tenant yang pernah
 * dieksekusi; link hanya lewat `[teks](url)` dengan protokol http/https/
 * mailto/tel (no javascript:/data:). SENGAJA bukan `marked` (yang dipakai
 * artikel build-time tepercaya) karena `marked` meloloskan HTML mentah.
 */

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** Inline: bold, italic, code span, link. Input SUDAH di-escape. */
function renderInline(text: string): string {
	return text
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, url: string) => {
			if (!/^(https?:|mailto:|tel:)/i.test(url)) return match; // protokol asing → biarkan sebagai teks
			return `<a href="${url}" rel="noopener noreferrer" target="_blank">${label}</a>`;
		});
}

/** Render subset Markdown → string HTML aman (input di-escape dulu). */
export function renderMarkdown(source: string): string {
	const lines = escapeHtml(source).split(/\r?\n/);
	const out: string[] = [];

	let listType: 'ul' | 'ol' | null = null;
	const closeList = () => {
		if (listType) {
			out.push(`</${listType}>`);
			listType = null;
		}
	};

	for (const rawLine of lines) {
		const line = rawLine.trimEnd();

		if (line.trim() === '') {
			closeList();
			continue;
		}

		// Heading: `#` s/d `######`.
		const heading = line.match(/^(#{1,6})\s+(.*)$/);
		if (heading) {
			closeList();
			const level = heading[1].length;
			out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
			continue;
		}

		// Horizontal rule: `---` / `***`.
		if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
			closeList();
			out.push('<hr>');
			continue;
		}

		// Unordered list: `- item` / `* item`.
		const ul = line.match(/^\s*[-*]\s+(.*)$/);
		if (ul) {
			if (listType !== 'ul') {
				closeList();
				out.push('<ul>');
				listType = 'ul';
			}
			out.push(`<li>${renderInline(ul[1])}</li>`);
			continue;
		}

		// Ordered list: `1. item` (angka berurut tidak divalidasi ketat).
		const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
		if (ol) {
			if (listType !== 'ol') {
				closeList();
				out.push('<ol>');
				listType = 'ol';
			}
			out.push(`<li>${renderInline(ol[1])}</li>`);
			continue;
		}

		closeList();
		out.push(`<p>${renderInline(line)}</p>`);
	}

	closeList();
	return out.join('\n');
}
