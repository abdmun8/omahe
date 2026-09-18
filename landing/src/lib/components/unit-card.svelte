<!--
	Satu kartu = satu TIPE unit di satu perumahan (granularitas per-unit,
	keputusan 2026-09-13) — bukan satu proyek, bukan satu baris `unit`.

	Layout mobile-first: horizontal ringkas di layar kecil, kartu vertikal
	mulai `sm` (§Mobile-first).
-->
<script lang="ts">
	import type { UnitListing } from '$lib/api/types';
	import { formatAngka, formatRentangHarga, formatRupiahPenuh } from '$lib/utils';
	import { withRef } from '$lib/ref';
	import ContactButtons from './contact-buttons.svelte';
	import PhotoPlaceholder from './photo-placeholder.svelte';
	import PromosiBadge from './promosi-badge.svelte';
	import Badge from './ui/badge.svelte';

	let { unit, ref = null }: { unit: UnitListing; ref?: string | null } = $props();

	const hrefDetail = $derived(withRef(`/perumahan/${unit.perumahan.slug}#tipe-unit`, ref));
	const hargaRingkas = $derived(formatRentangHarga(unit.hargaMin, unit.hargaMax));
	const hargaPenuh = $derived(
		unit.hargaMin === null ? 'Harga belum tersedia' : formatRupiahPenuh(unit.hargaMin)
	);
</script>

<article
	class="border-line flex gap-3 rounded-xl border bg-white p-3 transition-shadow hover:shadow-md sm:flex-col sm:gap-0 sm:overflow-hidden sm:p-0"
>
	<div class="relative h-28 w-28 shrink-0 sm:h-44 sm:w-full">
		{#if unit.fotoUrl}
			<img
				src={unit.fotoUrl}
				alt="Foto {unit.perumahan.nama}"
				loading="lazy"
				class="h-full w-full rounded-lg object-cover sm:rounded-none"
			/>
		{:else}
			<PhotoPlaceholder class="h-full w-full rounded-lg sm:rounded-none" />
		{/if}
		{#if unit.perumahan.prioritas > 0}
			<!-- MONET-01: prioritas milik perumahan induk. Dipasang di pojok
			     thumbnail — badge tipe/unit-tersisa ada di area konten, jadi
			     keduanya tidak mungkin bertabrakan. -->
			<PromosiBadge class="absolute top-1.5 left-1.5" />
		{/if}
	</div>

	<div class="flex min-w-0 flex-1 flex-col sm:p-4">
		<div class="flex items-start gap-2">
			<Badge variant="accent">{unit.tipe}</Badge>
			{#if unit.unitTersedia <= 3}
				<Badge variant="muted">{unit.unitTersedia} unit tersisa</Badge>
			{/if}
		</div>

		<p class="font-display text-primary mt-2 text-lg font-extrabold sm:text-xl" title={hargaPenuh}>
			{hargaRingkas}
		</p>

		<h3 class="text-ink mt-1 truncate text-sm font-semibold">
			<a href={hrefDetail} class="hover:text-primary-light">{unit.perumahan.nama}</a>
		</h3>

		{#if unit.perumahan.regionNama}
			<p class="text-muted mt-0.5 truncate text-xs">{unit.perumahan.regionNama}</p>
		{/if}

		<dl class="text-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
			{#if unit.luasTanah !== null}
				<div class="flex gap-1">
					<dt>LT</dt>
					<dd class="text-ink font-medium">{formatAngka(unit.luasTanah)} m²</dd>
				</div>
			{/if}
			{#if unit.luasBangunan !== null}
				<div class="flex gap-1">
					<dt>LB</dt>
					<dd class="text-ink font-medium">{formatAngka(unit.luasBangunan)} m²</dd>
				</div>
			{/if}
			<div class="flex gap-1">
				<dt class="sr-only">Unit tersedia</dt>
				<dd>{formatAngka(unit.unitTersedia)} unit tersedia</dd>
			</div>
		</dl>

		{#if unit.developer}
			<p class="text-muted mt-2 truncate text-xs">
				Dikembangkan oleh
				<a
					href={withRef(`/developer/${unit.developer.slug}`, ref)}
					class="text-primary font-medium hover:underline">{unit.developer.nama}</a
				>
			</p>
		{/if}

		<ContactButtons konteks="{unit.tipe} di {unit.perumahan.nama}" class="mt-3" />
	</div>
</article>
