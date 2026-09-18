<script lang="ts">
	import type { DeveloperSummary } from '$lib/api/types';
	import { withRef } from '$lib/ref';
	import ContactButtons from './contact-buttons.svelte';
	import PromosiBadge from './promosi-badge.svelte';
	import Badge from './ui/badge.svelte';

	let { developer, ref = null }: { developer: DeveloperSummary; ref?: string | null } = $props();
</script>

<article
	class="border-line flex flex-col rounded-xl border bg-white p-4 transition-shadow hover:shadow-md"
>
	<div class="flex items-start gap-3">
		{#if developer.logoUrl}
			<img
				src={developer.logoUrl}
				alt="Logo {developer.nama}"
				loading="lazy"
				class="border-line h-12 w-12 shrink-0 rounded-lg border object-contain"
			/>
		{:else}
			<div
				class="bg-primary/8 font-display text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-extrabold"
				aria-hidden="true"
			>
				{developer.nama.replace(/^PT\.?\s+/i, '').charAt(0)}
			</div>
		{/if}
		<div class="min-w-0 flex-1">
			<h3 class="font-display text-ink text-base font-bold">
				<a href={withRef(`/developer/${developer.slug}`, ref)} class="hover:text-primary">
					{developer.nama}
				</a>
			</h3>
			<!-- MONET-01: badge "Promosi" sebaris dengan badge jumlah proyek,
			     wrap ke bawah di layar sempit (mobile-first). -->
			<div class="mt-1 flex flex-wrap items-center gap-1.5">
				<Badge>{developer.jumlahProyek} proyek aktif</Badge>
				{#if developer.prioritas > 0}
					<PromosiBadge />
				{/if}
			</div>
		</div>
	</div>

	{#if developer.deskripsi}
		<p class="text-muted mt-3 line-clamp-3 text-sm leading-relaxed">{developer.deskripsi}</p>
	{/if}

	<ContactButtons konteks="proyek dari {developer.nama}" class="mt-4" />
</article>
