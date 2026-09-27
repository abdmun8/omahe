<!--
	Kartu agen di tab "Agen Omahe" halaman Mitra (AGEN-OMAHE-04): foto besar
	(inisial kalau belum ada), nama, kantor, tanda terverifikasi → halaman
	verifikasi ID card, dan "Hubungi" = form minat ke agen (lead tercatat
	untuk agen, WA ke agen). Nomor HP agen sengaja tidak ditampilkan.
-->
<script lang="ts">
	import BadgeCheck from '@lucide/svelte/icons/badge-check';
	import type { AgenDirektori } from '$lib/api/types';
	import { trackEvent } from '$lib/analytics';
	import LeadFormDialog from './lead-form-dialog.svelte';
	import Button from './ui/button.svelte';

	let { agen }: { agen: AgenDirektori } = $props();

	let terbuka = $state(false);

	const inisial = $derived(
		agen.nama
			.split(/\s+/)
			.filter((kata) => /[a-zA-Z]/.test(kata[0] ?? ''))
			.slice(0, 2)
			.map((kata) => kata[0]?.toUpperCase())
			.join('') || 'A'
	);

	function hubungi() {
		terbuka = true;
		// Non-PII: kode agen publik (tercetak di ID card).
		trackEvent('agen_direktori_hubungi', { agen: agen.kodeAgen });
	}
</script>

<article
	class="border-line flex h-full flex-col items-center rounded-2xl border bg-white p-5 text-center"
>
	{#if agen.fotoUrl}
		<img
			src={agen.fotoUrl}
			alt={`Foto ${agen.nama}`}
			class="h-24 w-24 rounded-full object-cover"
			loading="lazy"
			width="96"
			height="96"
		/>
	{:else}
		<span
			class="bg-surface text-primary font-display flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold"
			aria-hidden="true">{inisial}</span
		>
	{/if}
	<h2 class="font-display text-ink mt-3 text-base font-bold">{agen.nama}</h2>
	<p class="text-muted text-sm">{agen.kantorNama}</p>
	<a
		href={`/verifikasi/${encodeURIComponent(agen.kodeAgen)}`}
		class="text-primary mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline"
	>
		<BadgeCheck class="h-3.5 w-3.5" aria-hidden="true" /> Agen terverifikasi
	</a>
	<Button variant="outline" size="sm" class="mt-4 w-full" onclick={hubungi}>Hubungi Agen</Button>
</article>

<LeadFormDialog
	bind:open={terbuka}
	perumahanSlug=""
	namaPerumahan="Omahe"
	sumber="card"
	namaAgen={agen.nama}
	kodeAgen={agen.kodeAgen}
/>
