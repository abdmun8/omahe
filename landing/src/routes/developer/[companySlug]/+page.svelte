<script lang="ts">
	import ProjectCard from '$lib/components/project-card.svelte';
	import { withRef } from '$lib/ref';
	import { formatAngka } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const totalUnit = $derived(data.developer.proyek.reduce((sum, p) => sum + p.unitTersedia, 0));
</script>

<svelte:head>
	<title>{data.developer.nama} — Proyek Perumahan · Omahe</title>
	<meta
		name="description"
		content={data.developer.deskripsi ??
			`${data.developer.nama} memasarkan ${data.developer.jumlahProyek} proyek perumahan di Omahe.`}
	/>
</svelte:head>

<div class="border-line bg-surface border-b">
	<div class="mx-auto max-w-6xl px-4 py-8">
		<nav aria-label="Breadcrumb" class="text-muted text-xs">
			<a href={withRef('/developer', data.ref)} class="hover:text-primary">Direktori Pengembang</a>
			<span aria-hidden="true"> / </span>
			<span class="text-ink">{data.developer.nama}</span>
		</nav>

		<div class="mt-4 flex items-start gap-4">
			{#if data.developer.logoUrl}
				<img
					src={data.developer.logoUrl}
					alt="Logo {data.developer.nama}"
					class="border-line h-16 w-16 shrink-0 rounded-xl border bg-white object-contain"
				/>
			{/if}
			<div class="min-w-0">
				<h1 class="font-display text-ink text-2xl font-extrabold sm:text-3xl">
					{data.developer.nama}
				</h1>
				<p class="text-muted mt-1 text-sm">
					{formatAngka(data.developer.jumlahProyek)} proyek aktif · {formatAngka(totalUnit)} unit tersedia
				</p>
			</div>
		</div>

		{#if data.developer.deskripsi}
			<p class="text-muted mt-4 max-w-3xl text-sm leading-relaxed">{data.developer.deskripsi}</p>
		{/if}

		{#if data.developer.cakupanLokasi.length > 0}
			<p class="text-muted mt-3 text-sm">
				<span class="text-ink font-medium">Cakupan lokasi:</span>
				{data.developer.cakupanLokasi.join(' · ')}
			</p>
		{/if}
	</div>
</div>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h2 class="font-display text-ink text-xl font-bold">Proyek Perumahan</h2>

	{#if data.developer.proyek.length === 0}
		<p class="border-line text-muted mt-4 rounded-xl border border-dashed p-8 text-center text-sm">
			Belum ada proyek aktif dari pengembang ini.
		</p>
	{:else}
		<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.developer.proyek as proyek (proyek.slug)}
				<ProjectCard {proyek} ref={data.ref} />
			{/each}
		</div>
	{/if}
</div>
