<!--
	Detail artikel — mobile-first, lebar teks max-w-prose supaya nyaman dibaca.
	Isi body dari markdown (server-rendered) di-inject via {@html}: konten
	in-repo, tepercaya; JSON-LD tetap WAJIB lewat amankanJsonLd().
-->
<script lang="ts">
	import { page } from '$app/state';
	import Badge from '$lib/components/ui/badge.svelte';
	import { formatTanggalArtikel } from '$lib/artikel';
	import { SITE } from '$lib/config';
	import { amankanJsonLd } from '$lib/jsonld';
	import { withRef } from '$lib/ref';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const a = $derived(data.artikel);
	const ref = $derived(page.data.ref as string | null);
	const urlHalaman = $derived(`${SITE.url}/artikel/${a.slug}`);
	const coverAbsolut = $derived(`${SITE.url}${a.cover}`);

	// JSON-LD — headline/deskripsi dari frontmatter in-repo; tetap lewat
	// amankanJsonLd() (satu jalur escape untuk SEMUA JSON-LD situs).
	const jsonLdArtikelAman = $derived(
		amankanJsonLd({
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: a.judul,
			description: a.deskripsi,
			image: [coverAbsolut],
			datePublished: a.tanggal,
			dateModified: a.tanggal,
			author: { '@type': 'Organization', name: a.penulis, url: SITE.url },
			publisher: {
				'@type': 'Organization',
				name: SITE.nama,
				logo: { '@type': 'ImageObject', url: `${SITE.url}/omahe-logo.jpeg` }
			},
			mainEntityOfPage: { '@type': 'WebPage', '@id': urlHalaman }
		})
	);
	const jsonLdBreadcrumbAman = $derived(
		amankanJsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Artikel', item: `${SITE.url}/artikel` },
				{ '@type': 'ListItem', position: 2, name: a.judul, item: urlHalaman }
			]
		})
	);

	/**
	 * Passthrough `?ref=` untuk link DI DALAM body markdown: link-markdown
	 * dirender build-time (prerender), jadi tidak bisa lewat `withRef()`
	 * saat render — suhupkan pasca-hidrasi di sini. Nav/header/footer sudah
	 * ditangani komponennya masing-masing lewat `page.data.ref`.
	 */
	$effect(() => {
		if (!ref) return;
		const el = document.querySelector('.prose-artikel');
		el?.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach((tautan) => {
			const url = new URL(tautan.href);
			if (!url.searchParams.has('ref')) url.searchParams.set('ref', ref);
			tautan.href = `${url.pathname}${url.search}${url.hash}`;
		});
	});
</script>

<svelte:head>
	<title>{a.judul} · Omahe</title>
	<meta name="description" content={a.deskripsi} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={a.judul} />
	<meta property="og:description" content={a.deskripsi} />
	<meta property="og:image" content={coverAbsolut} />
	<meta property="article:published_time" content={a.tanggal} />
	{@html `<script type="application/ld+json">${jsonLdArtikelAman}</script>`}
	{@html `<script type="application/ld+json">${jsonLdBreadcrumbAman}</script>`}
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-6">
	<nav aria-label="Breadcrumb" class="text-muted text-xs">
		<ol class="flex flex-wrap items-center gap-1">
			<li><a href={withRef('/artikel', ref)} class="hover:text-primary">Artikel</a></li>
			<li aria-hidden="true">/</li>
			<li class="text-ink font-medium" aria-current="page">{a.judul}</li>
		</ol>
	</nav>

	<article class="mt-4">
		<img
			src={a.cover}
			alt={a.judul}
			width="1600"
			height="900"
			decoding="async"
			class="aspect-video w-full rounded-2xl object-cover"
		/>
		<div class="mt-4 flex flex-wrap items-center gap-2">
			<Badge variant="accent">{a.tag}</Badge>
			<time datetime={a.tanggal} class="text-muted text-sm">{formatTanggalArtikel(a.tanggal)}</time>
			<span class="text-muted text-sm" aria-hidden="true">·</span>
			<span class="text-muted text-sm">Oleh {a.penulis}</span>
		</div>
		<h1 class="font-display text-ink mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
			{a.judul}
		</h1>

		<!-- Body markdown — gaya di `.prose-artikel` (app.css). -->
		<div class="prose-artikel mt-6">
			{@html data.html}
		</div>
	</article>

	<nav class="border-line mt-10 grid gap-3 border-t pt-6 sm:grid-cols-2" aria-label="Artikel lain">
		{#if data.sebelumnya}
			<a
				href={withRef(`/artikel/${data.sebelumnya.slug}`, ref)}
				class="bg-surface hover:bg-primary/5 rounded-xl p-4"
			>
				<span class="text-muted text-xs">← Artikel sebelumnya</span>
				<span class="font-display text-ink mt-1 block text-sm font-bold">
					{data.sebelumnya.judul}
				</span>
			</a>
		{:else}
			<span></span>
		{/if}
		{#if data.berikutnya}
			<a
				href={withRef(`/artikel/${data.berikutnya.slug}`, ref)}
				class="bg-surface hover:bg-primary/5 rounded-xl p-4 sm:text-right"
			>
				<span class="text-muted text-xs">Artikel berikutnya →</span>
				<span class="font-display text-ink mt-1 block text-sm font-bold">
					{data.berikutnya.judul}
				</span>
			</a>
		{/if}
	</nav>

	<p class="mt-6">
		<a href={withRef('/artikel', ref)} class="text-primary text-sm font-medium hover:underline">
			← Semua artikel
		</a>
	</p>
</div>
