<!--
	Index artikel halaman 1 (omahe 2026-10-03: paginasi 12 per halaman —
	halaman berikutnya `/artikel/halaman/:n`). Isi daftar & filter tag di
	komponen bersama `DaftarArtikel`.
-->
<script lang="ts">
	import DaftarArtikel from '$lib/components/artikel/daftar-artikel.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Artikel &amp; Panduan Properti · Omahe</title>
	<meta
		name="description"
		content="Panduan membeli rumah, investasi properti, dan KPR dalam bahasa yang jelas — ditulis tim Omahe untuk calon pembeli rumah pertama."
	/>
	<meta property="og:title" content="Artikel & Panduan Properti · Omahe" />
	<meta
		property="og:description"
		content="Panduan membeli rumah, investasi properti, dan KPR dalam bahasa yang jelas."
	/>
</svelte:head>

<DaftarArtikel semua={data.daftar} halaman={1} />
