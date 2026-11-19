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
	import Search from '@lucide/svelte/icons/search';
	import Calculator from '@lucide/svelte/icons/calculator';
	import BadgePercent from '@lucide/svelte/icons/badge-percent';
	import Gavel from '@lucide/svelte/icons/gavel';
	import FileText from '@lucide/svelte/icons/file-text';
	import Landmark from '@lucide/svelte/icons/landmark';
	import Hammer from '@lucide/svelte/icons/hammer';
	import Users from '@lucide/svelte/icons/users';
	import Building2 from '@lucide/svelte/icons/building-2';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import House from '@lucide/svelte/icons/house';
	import { withRef } from '$lib/ref';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const a = $derived(data.artikel);
	const ref = $derived(page.data.ref as string | null);
	const urlHalaman = $derived(`${SITE.url}/artikel/${a.slug}`);
	const coverAbsolut = $derived(`${SITE.url}${a.cover}`);
	const fiturTerkait = $derived(data.fitur);

	/** Peta `FiturArtikel.ikon` → komponen (lihat `$lib/artikel-fitur.ts`). */
	const IKON_FITUR: Record<string, typeof Search> = {
		search: Search,
		calculator: Calculator,
		'badge-percent': BadgePercent,
		gavel: Gavel,
		'file-text': FileText,
		landmark: Landmark,
		hammer: Hammer,
		users: Users,
		'building-2': Building2,
		'user-plus': UserPlus,
		house: House
	};

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
		<h1 class="font-display text-ink mt-2 text-2xl leading-tight font-extrabold sm:text-3xl">
			{a.judul}
		</h1>

		<!-- Body markdown — gaya di `.prose-artikel` (app.css). -->
		<div class="prose-artikel mt-6">
			{@html data.html}
		</div>

		<!-- "Fitur Omahe terkait" — pemilihan pure di `$lib/artikel-fitur.ts`
		     (deterministik, maks 3, tautan via withRef agar `?ref=` tetap jalan). -->
		{#if fiturTerkait.length > 0}
			<aside
				class="bg-primary/5 border-line mt-8 rounded-2xl border p-4 sm:p-5"
				aria-label="Fitur Omahe terkait"
			>
				<h2 class="font-display text-ink text-base font-bold">Fitur Omahe terkait</h2>
				<div class="mt-3 grid gap-3 sm:grid-cols-3">
					{#each fiturTerkait as f (f.href)}
						{@const Ikon = IKON_FITUR[f.ikon]}
						<a
							href={withRef(f.href, ref)}
							class="bg-surface hover:bg-primary/5 border-line rounded-xl border p-3 transition-colors"
						>
							<span
								class="bg-primary/10 text-primary inline-flex size-8 items-center justify-center rounded-lg"
							>
								{#if Ikon}<Ikon class="h-4 w-4" aria-hidden="true" />{/if}
							</span>
							<span class="font-display text-ink mt-2 block text-sm font-bold">{f.judul}</span>
							<span class="text-muted mt-0.5 block text-xs leading-snug">{f.deskripsi}</span>
						</a>
					{/each}
				</div>
			</aside>
		{/if}
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

	{#if data.terkait.length > 0}
		<aside class="mt-10" aria-label="Artikel terkait">
			<h2 class="font-display text-ink text-lg font-bold">Artikel terkait</h2>
			<ul class="mt-4 grid list-none gap-5 sm:grid-cols-3">
				{#each data.terkait as t (t.slug)}
					<li>
						<a href={withRef(`/artikel/${t.slug}`, ref)} class="group block">
							<img
								src={t.cover}
								alt={t.judul}
								width="1600"
								height="900"
								loading="lazy"
								decoding="async"
								class="aspect-video w-full rounded-xl object-cover"
							/>
							<div class="mt-2 flex items-center gap-2">
								<Badge variant="accent">{t.tag}</Badge>
								<time datetime={t.tanggal} class="text-muted text-xs"
									>{formatTanggalArtikel(t.tanggal)}</time
								>
							</div>
							<h3
								class="font-display text-ink group-hover:text-primary mt-1 text-sm leading-snug font-bold"
							>
								{t.judul}
							</h3>
						</a>
					</li>
				{/each}
			</ul>
		</aside>
	{/if}
</div>
