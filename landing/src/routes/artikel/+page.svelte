<!--
	Index artikel — mobile-first: chip filter tag horizontal, kartu artikel
	 satu kolom di mobile → 2 kolom (sm) → 3 kolom (lg).
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import Badge from '$lib/components/ui/badge.svelte';
	import { formatTanggalArtikel, TAG_ARTIKEL } from '$lib/artikel';
	import { withRef } from '$lib/ref';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const ref = $derived(page.data.ref as string | null);
	// Saat prerender (build) `url.searchParams` TIDAK BOLEH disentuh —
	// SvelteKit melempar error. HTML statis dirender tanpa filter; filter
	// `?tag=` baru aktif di browser pasca-hidrasi. Canonical tetap /artikel.
	const tagAktif = $derived(browser ? page.url.searchParams.get('tag') : null);
	/** Filter client-side — halaman tetap satu file prerender. */
	const daftar = $derived(
		tagAktif ? data.daftar.filter((a) => a.tag === tagAktif) : data.daftar
	);
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

<div class="mx-auto max-w-6xl px-4 py-8">
	<header class="max-w-2xl">
		<h1 class="font-display text-ink text-2xl font-extrabold sm:text-3xl">Artikel &amp; Panduan</h1>
		<p class="text-muted mt-2 leading-relaxed">
			Panduan membeli rumah, investasi properti, dan KPR — tanpa jargon, dengan angka yang bisa
			dicek ulang.
		</p>
	</header>

	<!-- Chip filter tag — <a> asli (focusable native), pola filter-chips /cari. -->
	<nav class="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Filter topik artikel">
		<a
			href={withRef('/artikel', ref)}
			class={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors ${
				tagAktif === null ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-primary'
			}`}>Semua</a
		>
		{#each TAG_ARTIKEL as tag (tag)}
			<a
				href={withRef(`/artikel?tag=${tag}`, ref)}
				class={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium capitalize transition-colors ${
					tagAktif === tag ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-primary'
				}`}>{tag}</a
			>
		{/each}
	</nav>

	{#if daftar.length === 0}
		<p class="text-muted mt-10">Belum ada artikel untuk topik ini.</p>
	{:else}
		<ul class="mt-6 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each daftar as a (a.slug)}
				<li>
					<a href={withRef(`/artikel/${a.slug}`, ref)} class="group block">
						<img
							src={a.cover}
							alt={a.judul}
							width="1600"
							height="900"
							loading="lazy"
							decoding="async"
							class="aspect-video w-full rounded-xl object-cover"
						/>
						<div class="mt-3 flex items-center gap-2">
							<Badge variant="accent">{a.tag}</Badge>
							<time datetime={a.tanggal} class="text-muted text-xs">{formatTanggalArtikel(a.tanggal)}</time>
						</div>
						<h2
							class="font-display text-ink group-hover:text-primary mt-2 text-lg font-bold leading-snug"
						>
							{a.judul}
						</h2>
						<p class="text-muted mt-1 line-clamp-3 text-sm leading-relaxed">{a.deskripsi}</p>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
