<!--
	PROFIL-01 — profil satu Mitra Profesional (`/mitra/:slug`,
	api-contract §29): sampul 3:2, logo, badge kategori (label master),
	wilayah layanan, tombol WhatsApp + Telepon (nomor MITRA sendiri, pola
	kartu direktori — tanpa `?ref=`), dan "Tentang" berisi deskripsi
	Markdown yang dirender `$lib/markdown` (subset aman, BUKAN `marked`).
	Indexable: canonical `SITE.url/mitra/:slug`, meta description dari
	cuplikan deskripsi (`cuplikanDeskripsi` — teks polos) fallback wilayah.
-->
<script lang="ts">
	import Badge from '$lib/components/ui/badge.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { SITE, TAMPILKAN_TELEPON } from '$lib/config';
	import { renderMarkdown, cuplikanDeskripsi } from '$lib/markdown';
	import { labelKategoriDari } from '$lib/mitra';
	import { waUrl, telUrl } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const m = $derived(data.detail);
	const labelKategori = $derived(labelKategoriDari(m));
	/** Markdown aman; kosong/null → bagian disembunyikan total. */
	const deskripsiHtml = $derived(m.deskripsi?.trim() ? renderMarkdown(m.deskripsi) : null);
	const pesanWa = $derived(`Halo, saya melihat profil ${m.nama} di Omahe dan ingin bertanya.`);
	const urlHalaman = $derived(`${SITE.url}/mitra/${m.slug}`);
	const judul = $derived(`${m.nama} — ${labelKategori}`);
	/** Cuplikan teks polos dari deskripsi; tanpa deskripsi → wilayah layanan. */
	const deskripsiMeta = $derived(
		m.deskripsi?.trim() ? cuplikanDeskripsi(m.deskripsi) : m.wilayahLayanan
	);
</script>

<svelte:head>
	<title>{judul} · Omahe</title>
	<meta name="description" content={deskripsiMeta} />
	<link rel="canonical" href={urlHalaman} />
	<meta property="og:title" content={judul} />
	<meta property="og:description" content={deskripsiMeta} />
	{#if m.fotoUrl}<meta property="og:image" content={m.fotoUrl} />{/if}
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-6">
	<nav aria-label="Breadcrumb" class="text-muted text-xs">
		<a href="/mitra" class="hover:text-primary">Mitra Profesional</a>
		<span aria-hidden="true"> / </span>
		<a href={`/mitra?kategori=${m.kategori}`} class="hover:text-primary">{labelKategori}</a>
		<span aria-hidden="true"> / </span>
		<span class="text-ink">{m.nama}</span>
	</nav>

	<!-- Sampul 3:2 (PROFIL-01); tanpa foto → placeholder gradien. -->
	<div class="mt-4 overflow-hidden rounded-2xl">
		{#if m.fotoUrl}
			<img
				src={m.fotoUrl}
				alt="Foto {m.nama}"
				width="1200"
				height="800"
				class="aspect-[3/2] w-full object-cover"
			/>
		{:else}
			<div
				class="from-primary-light to-primary-dark aspect-[3/2] w-full bg-gradient-to-br"
				aria-hidden="true"
			></div>
		{/if}
	</div>

	<header class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
		{#if m.logoUrl}
			<img
				src={m.logoUrl}
				alt="Logo {m.nama}"
				width="160"
				height="160"
				class="border-line h-20 w-20 shrink-0 rounded-full border object-cover"
			/>
		{:else}
			<span
				class="bg-primary/8 text-primary font-display flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-extrabold"
				aria-hidden="true"
			>
				{m.nama
					.split(/\s+/)
					.filter((k) => /[a-zA-Z]/.test(k[0] ?? ''))
					.slice(0, 2)
					.map((k) => k[0]?.toUpperCase())
					.join('') || 'M'}
			</span>
		{/if}
		<div class="min-w-0">
			<Badge variant="accent">{labelKategori}</Badge>
			<h1 class="font-display text-ink mt-1.5 text-2xl font-extrabold sm:text-3xl">{m.nama}</h1>
			<p class="text-muted mt-1 text-sm">Wilayah layanan: {m.wilayahLayanan}</p>
		</div>
	</header>

	<div class="mt-5 flex flex-wrap gap-2">
		<Button variant="whatsapp" href={waUrl(m.whatsapp, pesanWa)} target="_blank" rel="noopener">
			WhatsApp
		</Button>
		{#if TAMPILKAN_TELEPON && m.telepon}
			<Button variant="outline" href={telUrl(m.telepon)}>Telepon</Button>
		{/if}
	</div>

	{#if deskripsiHtml}
		<section class="mt-8 max-w-3xl">
			<h2 class="font-display text-ink text-xl font-bold">Tentang</h2>
			<!-- Aman: renderMarkdown meng-escape seluruh HTML mentah lebih dulu
			     dan hanya mengizinkan link http/https/mailto/tel. -->
			<div class="prose-artikel prose-ringkas mt-3">{@html deskripsiHtml}</div>
		</section>
	{/if}

	<div class="mt-10">
		<a
			href={`/mitra?kategori=${m.kategori}`}
			class="text-primary text-sm font-semibold hover:underline"
		>
			← Kembali ke direktori {labelKategori}
		</a>
	</div>
</div>
