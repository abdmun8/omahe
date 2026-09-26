<script lang="ts">
	import ProjectCard from '$lib/components/project-card.svelte';
	import { SITE } from '$lib/config';
	import { amankanJsonLd } from '$lib/jsonld';
	import { withRef } from '$lib/ref';
	import { formatAngka } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const deskripsi = $derived(
		data.agen.deskripsi ??
			`${data.agen.nama} memasarkan ${data.agen.jumlahPerumahan} kawasan perumahan di Omahe.`
	);

	// Nama agen dari input admin — WAJIB lewat amankanJsonLd() (src/lib/jsonld.ts).
	const jsonLdAman = $derived(
		amankanJsonLd({
			'@context': 'https://schema.org',
			'@type': 'RealEstateAgent',
			name: data.agen.nama,
			url: `${SITE.url}/agen/${data.agen.slug}`,
			...(data.agen.logoUrl ? { logo: data.agen.logoUrl } : {}),
			description: deskripsi
		})
	);
</script>

<svelte:head>
	<title>{data.agen.nama} — Agen Properti · Omahe</title>
	<meta name="description" content={deskripsi} />
	<meta property="og:title" content={`${data.agen.nama} — Agen Properti`} />
	<meta property="og:description" content={deskripsi} />
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
	{@html `<script type="application/ld+json">${jsonLdAman}</script>`}
</svelte:head>

<div class="border-line bg-surface border-b">
	<div class="mx-auto max-w-6xl px-4 py-8">
		<nav aria-label="Breadcrumb" class="text-muted text-xs">
			<a href={withRef('/agen', data.ref)} class="hover:text-primary">Agen Properti</a>
			<span aria-hidden="true"> / </span>
			<span class="text-ink">{data.agen.nama}</span>
		</nav>
		<div class="mt-4 flex items-start gap-4">
			{#if data.agen.logoUrl}
				<img
					src={data.agen.logoUrl}
					alt="Logo {data.agen.nama}"
					class="border-line h-16 w-16 shrink-0 rounded-xl border bg-white object-contain"
				/>
			{/if}
			<div class="min-w-0">
				<h1 class="font-display text-ink text-2xl font-extrabold sm:text-3xl">{data.agen.nama}</h1>
				<p class="text-muted mt-1 text-sm">
					Agen properti · {formatAngka(data.agen.jumlahPerumahan)} kawasan dipasarkan
				</p>
			</div>
		</div>
		{#if data.agen.deskripsi}
			<p class="text-muted mt-4 max-w-3xl text-sm leading-relaxed">{data.agen.deskripsi}</p>
		{/if}
	</div>
</div>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h2 class="font-display text-ink text-xl font-bold">Kawasan yang Dipasarkan</h2>
	{#if data.agen.perumahan.length === 0}
		<p class="border-line text-muted mt-4 rounded-xl border border-dashed p-8 text-center text-sm">
			Belum ada kawasan aktif dari agen ini.
		</p>
	{:else}
		<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.agen.perumahan as proyek (proyek.slug)}
				<ProjectCard {proyek} ref={data.ref} />
			{/each}
		</div>
	{/if}
</div>
