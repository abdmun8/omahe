import { describe, expect, test } from 'bun:test';
import {
	artikelTayang,
	formatTanggalArtikel,
	parseFrontmatterArtikel,
	urutkanTerbaru
} from './artikel';

const FRONTMATTER_Lengkap = `---
judul: 'Judul Uji'
deskripsi: 'Deskripsi uji.'
tanggal: '2026-09-18'
tag: 'investasi'
cover: '/artikel/uji-cover.jpg'
penulis: 'Tim Uji'
---

Isi markdown.
`;

function buat(nama: string, tanggal: string) {
	return parseFrontmatterArtikel(
		`${nama}.md`,
		FRONTMATTER_Lengkap.replace("tanggal: '2026-09-18'", `tanggal: '${tanggal}'`)
	);
}

describe('parseFrontmatterArtikel', () => {
	test('frontmatter lengkap terparse utuh', () => {
		const a = parseFrontmatterArtikel('uji-satu.md', FRONTMATTER_Lengkap);
		expect(a.slug).toBe('uji-satu');
		expect(a.judul).toBe('Judul Uji');
		expect(a.tag).toBe('investasi');
		expect(a.cover).toBe('/artikel/uji-cover.jpg');
		expect(a.markdown).toBe('Isi markdown.');
	});

	test('field wajib hilang → throw menyebut nama file + field', () => {
		try {
			parseFrontmatterArtikel('uji.md', FRONTMATTER_Lengkap.replace("penulis: 'Tim Uji'\n", ''));
			throw new Error('seharusnya throw');
		} catch (e) {
			expect((e as Error).message).toContain('uji.md');
			expect((e as Error).message).toContain('penulis');
		}
	});

	test('deskripsi >160 char → throw (batas meta description)', () => {
		const panjang = FRONTMATTER_Lengkap.replace(
			'deskripsi: \'Deskripsi uji.\'',
			`deskripsi: '${'x'.repeat(161)}'`
		);
		expect(() => parseFrontmatterArtikel('uji.md', panjang)).toThrow('160');
	});

	test('tag di luar daftar → throw', () => {
		const salah = FRONTMATTER_Lengkap.replace("tag: 'investasi'", "tag: 'gossip'");
		expect(() => parseFrontmatterArtikel('uji.md', salah)).toThrow('tag');
	});

	test('tanggal bukan YYYY-MM-DD valid → throw', () => {
		const salah = FRONTMATTER_Lengkap.replace("tanggal: '2026-09-18'", "tanggal: '18/09/2026'");
		expect(() => parseFrontmatterArtikel('uji.md', salah)).toThrow('tanggal');
	});

	test('nama file bukan slug kebab-case → throw', () => {
		expect(() => parseFrontmatterArtikel('Uji_Snake.md', FRONTMATTER_Lengkap)).toThrow('slug');
	});

	test('cover di luar /artikel/ → throw', () => {
		const salah = FRONTMATTER_Lengkap.replace(
			"cover: '/artikel/uji-cover.jpg'",
			"cover: '/logo.jpeg'"
		);
		expect(() => parseFrontmatterArtikel('uji.md', salah)).toThrow('cover');
	});
});

describe('artikelTayang (helper tunggal jadwal tayang)', () => {
	test('hari yang sama = TAYANG; tanggal besok = tersembunyi', () => {
		const a = buat('a', '2026-09-18');
		const b = buat('b', '2026-09-19');
		const tayang = artikelTayang([a, b], '2026-09-18');
		expect(tayang.map((x) => x.slug)).toEqual(['a']);
	});

	test('string-compare aman lintas bulan/tahun', () => {
		const a = buat('a', '2025-12-31');
		const b = buat('b', '2026-01-01');
		expect(artikelTayang([a, b], '2026-01-01')).toHaveLength(2);
		expect(artikelTayang([a, b], '2025-12-31')).toHaveLength(1);
	});
});

describe('urutkanTerbaru', () => {
	test('terbaru dulu, tie-break slug deterministik', () => {
		const urut = urutkanTerbaru([buat('b', '2026-09-01'), buat('a', '2026-09-18'), buat('c', '2026-09-18')]);
		expect(urut.map((x) => x.slug)).toEqual(['a', 'c', 'b']);
	});
});

describe('formatTanggalArtikel', () => {
	test('format Indonesia, tidak bergeser zona', () => {
		expect(formatTanggalArtikel('2026-09-18')).toBe('18 September 2026');
		expect(formatTanggalArtikel('2026-01-01')).toBe('1 Januari 2026');
	});
});
