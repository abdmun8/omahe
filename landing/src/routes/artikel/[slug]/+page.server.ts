import { error } from '@sveltejs/kit';
import { amankanTautanArtikel, artikelTayang } from '$lib/artikel';
import { bacaArtikel, hariIniWib, metaArtikel, renderArtikelHtml } from '$lib/server/artikel';
import type { EntryGenerator, PageServerLoad } from './$types';

/**
 * Detail artikel — prerender. `entries` wajib untuk route dinamis
 * prerender; HANYA artikel yang sudah tayang pada saat build (artikel
 * future-dated masuk otomatis di build berikutnya — mekanisme rilis
 * harian, lihat TASKS.md item "Artikel (4/7)").
 */
export const prerender = true;

export const entries: EntryGenerator = async () => {
	const tayang = artikelTayang(bacaArtikel(), hariIniWib());
	return tayang.map((a) => ({ slug: a.slug }));
};

export const load: PageServerLoad = ({ params }) => {
	const daftar = artikelTayang(bacaArtikel(), hariIniWib());
	const i = daftar.findIndex((a) => a.slug === params.slug);
	if (i === -1) error(404, 'Artikel tidak ditemukan.');

	// HTML dirender di sini (server/build-time) supaya isi markdown tidak
	// pernah masuk bundle JS client — halaman menerima HTML jadi.
	// Tautan ke artikel yang belum tayang dinonaktifkan dulu (ke /artikel) —
	// crawler prerender menolak link 404; rebuild harian memulihkannya.
	const slugTayang = new Set(daftar.map((a) => a.slug));
	const html = amankanTautanArtikel(renderArtikelHtml(daftar[i].markdown), slugTayang);
	// Artikel terkait: 3 terbaru SE-TAG dulu (fallback lintas tag bila
	// kurang) — dirender build-time, bukan runtime.
	const lain = daftar.filter((x) => x.slug !== params.slug);
	const terkait = [...lain.filter((x) => x.tag === daftar[i].tag), ...lain.filter((x) => x.tag !== daftar[i].tag)]
		.slice(0, 3)
		.map(metaArtikel);

	return {
		artikel: metaArtikel(daftar[i]),
		html,
		terkait,
		// Daftar terurut terbaru dulu: indeks lebih besar = lebih lama.
		sebelumnya: i + 1 < daftar.length ? metaArtikel(daftar[i + 1]) : null,
		berikutnya: i > 0 ? metaArtikel(daftar[i - 1]) : null
	};
};
