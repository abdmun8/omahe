<!--
	LOKASI-03 — blok lokasi + peta, dipakai section Lokasi builder, detail
	perumahan (peta dari DATA perumahan) dan halaman tipe. URL peta berasal
	dari input admin tenant: iframe HANYA dirender untuk embed Google Maps
	yang lolos `isMapsEmbedUrl` (backend juga memvalidasi — lapis kedua).
	Tidak merender apa pun kalau alamat & peta sama-sama kosong.
-->
<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { isHttpUrl, isMapsEmbedUrl } from '$lib/utils';

	let {
		heading = 'Lokasi',
		address = null,
		mapsEmbedUrl = null,
		directionsUrl = null
	}: {
		heading?: string;
		address?: string | null;
		mapsEmbedUrl?: string | null;
		directionsUrl?: string | null;
	} = $props();

	const peta = $derived(isMapsEmbedUrl(mapsEmbedUrl) ? mapsEmbedUrl : null);
	const arah = $derived(isHttpUrl(directionsUrl) ? directionsUrl : null);
</script>

{#if address || peta}
	<section>
		<h2 class="font-display text-ink text-xl font-bold">{heading}</h2>
		{#if address}
			<p class="text-muted mt-2 text-sm">{address}</p>
		{/if}
		{#if peta}
			<iframe
				src={peta}
				title="Peta lokasi"
				loading="lazy"
				referrerpolicy="no-referrer-when-downgrade"
				class="border-line mt-3 h-64 w-full rounded-lg border sm:h-80"
			></iframe>
		{/if}
		{#if arah}
			<Button variant="outline" class="mt-3" href={arah} target="_blank" rel="noopener nofollow">
				Buka Petunjuk Arah
			</Button>
		{/if}
	</section>
{/if}
