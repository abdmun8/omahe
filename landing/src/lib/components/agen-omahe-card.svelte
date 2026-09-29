<!--
	Kartu agen di tab "Agen Omahe" halaman Mitra (AGEN-OMAHE-04): foto
	LANSKAP 3:2 di atas kartu (PROFIL-01 — tanpa foto → blok gradasi hijau
	dengan inisial besar), lalu nama, kode, kantor, tanda terverifikasi →
	halaman verifikasi ID card, "Lihat Profil" → kartu nama digital
	`/agen-omahe/:kode`, dan "Hubungi" = form minat ke agen (lead tercatat
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

<article class="border-line flex h-full flex-col overflow-hidden rounded-2xl border bg-white">
	<!-- PROFIL-01 — foto lanskap 3:2; `width/height` pas rasio untuk CLS. -->
	{#if agen.fotoUrl}
		<img
			src={agen.fotoUrl}
			alt={`Foto ${agen.nama}`}
			width="1200"
			height="800"
			loading="lazy"
			decoding="async"
			class="aspect-[3/2] w-full object-cover"
		/>
	{:else}
		<div
			class="from-primary-light to-primary-dark flex aspect-[3/2] w-full items-center justify-center bg-gradient-to-br"
			aria-hidden="true"
		>
			<span class="font-display text-4xl font-bold text-white/90">{inisial}</span>
		</div>
	{/if}

	<div class="flex flex-1 flex-col items-center p-5 text-center">
		<h2 class="font-display text-ink text-base font-bold">{agen.nama}</h2>
		<!-- AGEN-OMAHE-05 — kode agen publik (sama dengan ID card). -->
		<p class="text-accent-dark font-mono text-xs font-semibold">{agen.kodeAgen}</p>
		<p class="text-muted text-sm">{agen.kantorNama}</p>
		<a
			href={`/verifikasi/${encodeURIComponent(agen.kodeAgen)}`}
			class="text-primary mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline"
		>
			<BadgeCheck class="h-3.5 w-3.5" aria-hidden="true" /> Agen terverifikasi
		</a>

		<div class="mt-auto flex w-full flex-col gap-2 pt-4">
			<Button variant="primary" size="sm" class="w-full" onclick={hubungi}>Hubungi Agen</Button>
			<Button
				variant="outline"
				size="sm"
				class="w-full"
				href={`/agen-omahe/${encodeURIComponent(agen.kodeAgen)}`}
				onclick={() => trackEvent('agen_direktori_profil', { agen: agen.kodeAgen })}
			>
				Lihat Profil
			</Button>
		</div>
	</div>
</article>

<LeadFormDialog
	bind:open={terbuka}
	perumahanSlug=""
	namaPerumahan="Omahe"
	sumber="card"
	namaAgen={agen.nama}
	kodeAgen={agen.kodeAgen}
/>
