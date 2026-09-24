<!--
	PROMO-02 — detail Halaman Promo Omahe: banner, periode, konten Markdown
	(renderer subset aman — `$lib/markdown`, BUKAN `marked`), tombol CTA
	(internal `/…` lewat withRef di tab sama; eksternal tab baru), dan kartu
	perumahan terkait → `/perumahan/:slug` dengan `?ref=`.
-->
<script lang="ts">
	import PhotoPlaceholder from '$lib/components/photo-placeholder.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { SITE } from '$lib/config';
	import { amankanJsonLd } from '$lib/jsonld';
	import { renderMarkdown } from '$lib/markdown';
	import { withRef } from '$lib/ref';
	import { formatPeriodePromo } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const p = $derived(data.promo);
	const kontenHtml = $derived(p.konten ? renderMarkdown(p.konten) : null);

	/** CTA internal (`/kpr`) → tab sama + `?ref=`; `//…` diperlakukan eksternal. */
	const ctaInternal = $derived(
		!!p.ctaUrl && p.ctaUrl.startsWith('/') && !p.ctaUrl.startsWith('//')
	);

	const urlHalaman = $derived(`${SITE.url}/promo/${p.slug}`);
	const jsonLdAman = $derived(
		amankanJsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Promo', item: `${SITE.url}/promo` },
				{ '@type': 'ListItem', position: 2, name: p.judul, item: urlHalaman }
			]
		})
	);
</script>

<svelte:head>
	<title>{p.judul} · Promo Omahe</title>
	<meta name="description" content={(p.ringkasan ?? p.judul).slice(0, 155)} />
	<meta property="og:title" content={p.judul} />
	{#if p.bannerUrl}<meta property="og:image" content={p.bannerUrl} />{/if}
	{@html `<script type="application/ld+json">${jsonLdAman}</script>`}
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-6">
	<nav aria-label="Breadcrumb" class="text-muted text-xs">
		<a href={withRef('/promo', data.ref)} class="hover:text-primary">Promo</a>
		<span aria-hidden="true"> / </span>
		<span class="text-ink">{p.judul}</span>
	</nav>

	<div class="mt-4 overflow-hidden rounded-2xl">
		{#if p.bannerUrl}
			<img
				src={p.bannerUrl}
				alt={p.judul}
				width="1600"
				height="900"
				class="aspect-video w-full object-cover"
			/>
		{:else}
			<PhotoPlaceholder class="aspect-video w-full" />
		{/if}
	</div>

	<header class="mt-6">
		<p class="text-accent-dark text-sm font-semibold">
			{formatPeriodePromo(p.berlakuDari, p.berlakuSampai)}
		</p>
		<h1 class="font-display text-ink mt-1 text-2xl font-extrabold sm:text-3xl">{p.judul}</h1>
		{#if p.ringkasan}
			<p class="text-muted mt-2 leading-relaxed">{p.ringkasan}</p>
		{/if}
	</header>

	{#if kontenHtml}
		<!-- Aman: renderMarkdown meng-escape seluruh HTML mentah lebih dulu dan
		     hanya mengizinkan link http/https/mailto/tel. -->
		<div class="prose-artikel mt-6">{@html kontenHtml}</div>
	{/if}

	{#if p.ctaLabel && p.ctaUrl}
		<div class="mt-8">
			{#if ctaInternal}
				<Button variant="primary" size="lg" href={withRef(p.ctaUrl, data.ref)}>{p.ctaLabel}</Button>
			{:else}
				<Button variant="primary" size="lg" href={p.ctaUrl} target="_blank" rel="noopener"
					>{p.ctaLabel}</Button
				>
			{/if}
		</div>
	{/if}

	{#if p.perumahan.length > 0}
		<section class="mt-12">
			<h2 class="font-display text-ink text-xl font-bold">Perumahan yang ikut promo</h2>
			<ul class="mt-4 grid list-none gap-4 sm:grid-cols-2">
				{#each p.perumahan as r (r.slug)}
					<li>
						<a
							href={withRef(`/perumahan/${r.slug}`, data.ref)}
							class="border-line flex items-center gap-3 rounded-xl border bg-white p-3 transition-shadow hover:shadow-md"
						>
							{#if r.fotoUrl}
								<img
									src={r.fotoUrl}
									alt={r.nama}
									loading="lazy"
									class="h-16 w-24 shrink-0 rounded-lg object-cover"
								/>
							{:else}
								<PhotoPlaceholder class="h-16 w-24 shrink-0 rounded-lg" />
							{/if}
							<div class="min-w-0">
								<p class="text-ink truncate font-semibold">{r.nama}</p>
								{#if r.regionNama}
									<p class="text-muted truncate text-xs">{r.regionNama}</p>
								{/if}
								<p class="text-primary mt-1 text-xs font-semibold">Lihat perumahan →</p>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<div class="mt-10">
		<a
			href={withRef('/promo', data.ref)}
			class="text-primary text-sm font-semibold hover:underline"
		>
			← Promo lainnya
		</a>
	</div>
</div>
