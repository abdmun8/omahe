<!-- Daftar artikel halaman ke-n (≥ 2) — lihat `DaftarArtikel`. -->
<script lang="ts">
	import DaftarArtikel from '$lib/components/artikel/daftar-artikel.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Artikel &amp; Panduan Properti — Halaman {data.halaman} · Omahe</title>
	<meta
		name="description"
		content="Panduan membeli rumah, investasi properti, dan KPR dalam bahasa yang jelas — halaman {data.halaman}."
	/>
</svelte:head>

<DaftarArtikel semua={data.daftar} halaman={data.halaman} />
