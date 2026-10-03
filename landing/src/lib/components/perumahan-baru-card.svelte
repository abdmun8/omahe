<!-- LANDING-07 — kartu ringkas seksi "Baru di Omahe" (satu perumahan). -->
<script lang="ts">
	import type { PerumahanDirektori } from '$lib/api/types';
	import { withRef } from '$lib/ref';
	import PhotoPlaceholder from './photo-placeholder.svelte';

	let { perumahan, ref = null }: { perumahan: PerumahanDirektori; ref?: string | null } = $props();
</script>

<a
	href={withRef(`/perumahan/${perumahan.slug}`, ref)}
	class="border-line group flex flex-col overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md"
>
	{#if perumahan.fotoUrl}
		<img
			src={perumahan.fotoUrl}
			alt="Foto {perumahan.nama}"
			loading="lazy"
			class="h-36 w-full object-cover"
		/>
	{:else}
		<PhotoPlaceholder class="h-36 w-full" />
	{/if}
	<div class="flex flex-1 flex-col p-3">
		<h3 class="font-display text-ink group-hover:text-primary text-base font-bold">
			{perumahan.nama}
		</h3>
		{#if perumahan.regionNama}
			<p class="text-muted mt-0.5 text-xs">{perumahan.regionNama}</p>
		{/if}
		<p class="text-muted mt-2 text-xs">{perumahan.jumlahTipeTersedia} tipe tersedia</p>
	</div>
</a>
