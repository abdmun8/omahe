<script lang="ts">
	import { page } from '$app/state';
	import FilterChips from '$lib/components/filter-chips.svelte';
	import Pagination from '$lib/components/pagination.svelte';
	import SearchForm from '$lib/components/search-form.svelte';
	import UnitCard from '$lib/components/unit-card.svelte';
	import { SITE } from '$lib/config';
	import { formatAngka } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const lokasiAktif = $derived(
		data.regions.find((r) => r.kode === data.query.regionKode)?.nama ?? null
	);
	const judul = $derived(
		lokasiAktif ? `Rumah Dijual di ${lokasiAktif}` : 'Rumah Dijual dari Pengembang'
	);
	const deskripsi = $derived(
		`${formatAngka(data.hasil.meta.total)} tipe unit tersedia${lokasiAktif ? ` di ${lokasiAktif}` : ''}. Bandingkan harga, luas, dan pengembangnya di Omahe.`
	);
</script>

<svelte:head>
	<title>{judul} · Omahe</title>
	<meta name="description" content={deskripsi} />
	<meta property="og:title" content={judul} />
	<meta property="og:description" content={deskripsi} />
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
	<!-- Halaman hasil berfilter jangan bersaing dengan dirinya sendiri di indeks. -->
	{#if data.hasil.meta.page > 1 || data.query.tipe}
		<meta name="robots" content="noindex,follow" />
	{/if}
</svelte:head>

<div class="border-line bg-surface border-b">
	<div class="mx-auto max-w-6xl px-4 py-6">
		<SearchForm
			regions={data.regions}
			ref={data.ref}
			nilai={{
				regionKode: data.query.regionKode,
				hargaMaks: data.query.hargaMax,
				tipe: data.query.tipe
			}}
		/>
	</div>
</div>

<div class="mx-auto max-w-6xl px-4 py-6">
	<FilterChips url={page.url} regions={data.regions} />

	<div class="mt-6 flex items-baseline justify-between gap-4">
		<h1 class="font-display text-ink text-xl font-bold sm:text-2xl">{judul}</h1>
		<p class="text-muted shrink-0 text-sm">{formatAngka(data.hasil.meta.total)} hasil</p>
	</div>

	{#if data.hasil.items.length === 0}
		<div class="border-line mt-8 rounded-xl border border-dashed p-10 text-center">
			<p class="font-display text-ink text-base font-bold">Belum ada yang cocok</p>
			<p class="text-muted mx-auto mt-2 max-w-sm text-sm">
				Coba longgarkan filternya — misalnya naikkan batas harga, atau pilih lokasi yang lebih luas.
			</p>
		</div>
	{:else}
		<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.hasil.items as unit (unit.id)}
				<UnitCard {unit} ref={data.ref} source="search" />
			{/each}
		</div>

		<div class="mt-8">
			<Pagination
				url={page.url}
				page={data.hasil.meta.page}
				pageSize={data.hasil.meta.pageSize}
				total={data.hasil.meta.total}
			/>
		</div>
	{/if}
</div>
