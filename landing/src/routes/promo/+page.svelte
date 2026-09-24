<!--
	PROMO-02 — daftar Halaman Promo Omahe yang sedang tayang (dikelola
	superadmin di admin `perumahan`, tanpa deploy). Mobile-first: satu kolom
	→ 2 (sm) → 3 (lg), pola kartu /artikel.
-->
<script lang="ts">
	import { page } from '$app/state';
	import PhotoPlaceholder from '$lib/components/photo-placeholder.svelte';
	import { SITE } from '$lib/config';
	import { withRef } from '$lib/ref';
	import { formatPeriodePromo } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const ref = $derived(page.data.ref as string | null);
</script>

<svelte:head>
	<title>Promo Rumah &amp; KPR · Omahe</title>
	<meta
		name="description"
		content="Promo terbaru dari Omahe dan proyek perumahan pilihan — DP ringan, cicilan KPR, dan penawaran terbatas."
	/>
	<meta property="og:title" content="Promo Rumah & KPR · Omahe" />
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<header class="max-w-2xl">
		<h1 class="font-display text-ink text-2xl font-extrabold sm:text-3xl">Promo</h1>
		<p class="text-muted mt-2 leading-relaxed">
			Penawaran terbaru dari Omahe dan proyek perumahan pilihan. Setiap promo berlaku terbatas — cek
			periodenya sebelum mengajukan.
		</p>
	</header>

	{#if data.daftar.length === 0}
		<div class="border-line mt-8 rounded-xl border border-dashed p-10 text-center">
			<p class="text-muted">Belum ada promo yang sedang berlangsung.</p>
			<a
				href={withRef('/cari', ref)}
				class="text-primary mt-3 inline-block text-sm font-semibold hover:underline"
			>
				Lihat semua rumah →
			</a>
		</div>
	{:else}
		<ul class="mt-6 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.daftar as promo (promo.slug)}
				<li>
					<a href={withRef(`/promo/${promo.slug}`, ref)} class="group block">
						{#if promo.bannerUrl}
							<img
								src={promo.bannerUrl}
								alt={promo.judul}
								width="1600"
								height="900"
								loading="lazy"
								decoding="async"
								class="aspect-video w-full rounded-xl object-cover"
							/>
						{:else}
							<PhotoPlaceholder class="aspect-video w-full rounded-xl" />
						{/if}
						<p class="text-accent-dark mt-3 text-xs font-semibold">
							{formatPeriodePromo(promo.berlakuDari, promo.berlakuSampai)}
						</p>
						<h2
							class="font-display text-ink group-hover:text-primary mt-1 text-lg leading-snug font-bold"
						>
							{promo.judul}
						</h2>
						{#if promo.ringkasan}
							<p class="text-muted mt-1 line-clamp-3 text-sm leading-relaxed">{promo.ringkasan}</p>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
