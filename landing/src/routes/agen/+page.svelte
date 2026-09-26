<script lang="ts">
	import { SITE } from '$lib/config';
	import { withRef } from '$lib/ref';
	import { formatAngka } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Agen Properti · Omahe</title>
	<meta
		name="description"
		content="Agen properti yang memasarkan perumahan di Omahe — lihat kawasan yang mereka pasarkan dan hubungi lewat form minat."
	/>
	<meta property="og:title" content="Agen Properti di Omahe" />
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="font-display text-ink text-2xl font-bold sm:text-3xl">Agen Properti</h1>
	<p class="text-muted mt-2 max-w-2xl text-sm">
		Agen properti mitra Omahe memasarkan kawasan perumahan hasil kerja sama langsung dengan
		pengembangnya. Pilih agen untuk melihat kawasan yang mereka pasarkan.
	</p>
	<p class="text-muted mt-4 text-sm">{formatAngka(data.agen.length)} agen terdaftar</p>

	{#if data.agen.length === 0}
		<p class="border-line text-muted mt-6 rounded-xl border border-dashed p-8 text-center text-sm">
			Belum ada agen properti yang tampil.
		</p>
	{:else}
		<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.agen as agen (agen.slug)}
				<a
					href={withRef(`/agen/${agen.slug}`, data.ref)}
					class="border-line hover:border-primary flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors"
				>
					{#if agen.logoUrl}
						<img
							src={agen.logoUrl}
							alt="Logo {agen.nama}"
							class="border-line h-14 w-14 shrink-0 rounded-lg border object-contain"
							loading="lazy"
						/>
					{:else}
						<div class="bg-surface h-14 w-14 shrink-0 rounded-lg"></div>
					{/if}
					<div class="min-w-0">
						<p class="text-ink font-semibold">{agen.nama}</p>
						<p class="text-muted mt-1 text-xs">
							{formatAngka(agen.jumlahPerumahan)} kawasan dipasarkan
						</p>
						{#if agen.deskripsi}
							<p class="text-muted mt-2 line-clamp-2 text-sm">{agen.deskripsi}</p>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
