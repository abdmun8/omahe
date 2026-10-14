<!--
	LANDING-07 — kartu ringkas seksi "Baru di Omahe" (satu perumahan).
	Dipakai juga seksi "Promo Pilihan" homepage (MONET-01) lewat prop `promo`
	— badge "Promo" HANYA saat prop aktif; seksi "Baru di Omahe" tidak
	berubah (bawaan tanpa badge).
-->
<script lang="ts">
	import type { PerumahanDirektori } from '$lib/api/types';
	import { withRef } from '$lib/ref';
	import PhotoPlaceholder from './photo-placeholder.svelte';
	import PromosiBadge from './promosi-badge.svelte';

	let {
		perumahan,
		ref = null,
		promo = false
	}: { perumahan: PerumahanDirektori; ref?: string | null; promo?: boolean } = $props();
</script>

<a
	href={withRef(`/perumahan/${perumahan.slug}`, ref)}
	class="border-line group flex flex-col overflow-hidden rounded-xl border bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
>
	<div class="relative">
		{#if perumahan.fotoUrl}
			<img
				src={perumahan.fotoUrl}
				alt="Foto {perumahan.nama}"
				loading="lazy"
				class="aspect-[16/10] w-full object-cover transition-opacity group-hover:opacity-90"
			/>
		{:else}
			<PhotoPlaceholder class="aspect-[16/10] w-full" />
		{/if}
		{#if promo}
			<!-- Badge di pojok thumbnail, pola unit-card — tidak menutupi nama. -->
			<PromosiBadge label="Promo" class="pointer-events-none absolute top-1.5 left-1.5" />
		{/if}
	</div>
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
