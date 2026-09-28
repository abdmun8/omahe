<!--
	Kartu nama digital agen Omahe (AGEN-OMAHE-05, api-contract §26) — link
	yang dibagikan agen sendiri ke calon pembeli. Aktif: foto, nama, kode,
	kantor, WhatsApp, simpan kontak (vCard), perumahan yang dipasarkan (link
	membawa `?ref=` KODE AGEN supaya booking/lead tercatat untuk agen ini).
	Tidak aktif: identitas + status saja, tanpa kontak.
-->
<script lang="ts">
	import BadgeCheck from '@lucide/svelte/icons/badge-check';
	import Button from '$lib/components/ui/button.svelte';
	import { SITE } from '$lib/config';
	import { trackEvent } from '$lib/analytics';
	import { waUrl } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const k = $derived(data.kartu);
	const aktif = $derived(k.status === 'aktif');

	const inisial = $derived(
		k.nama
			.split(/\s+/)
			.filter((kata) => /[a-zA-Z]/.test(kata[0] ?? ''))
			.slice(0, 2)
			.map((kata) => kata[0]?.toUpperCase())
			.join('') || 'A'
	);
	const berlaku = $derived(
		k.berlakuSampai
			? new Date(k.berlakuSampai).toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'long',
					year: 'numeric',
					timeZone: 'Asia/Jakarta'
				})
			: null
	);
</script>

<svelte:head>
	<title>{k.nama} — Agen Omahe {k.kodeAgen}</title>
	<meta
		name="description"
		content={`Kartu nama digital ${k.nama}, agen resmi Omahe (${k.kantorNama}).`}
	/>
	<!-- Data personal agen — dibagikan lewat link, tidak untuk diindeks. -->
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-md px-4 py-10">
	<div class="border-line overflow-hidden rounded-2xl border bg-white">
		<div class="bg-primary px-6 py-5 text-white">
			<p class="font-display text-sm font-semibold tracking-wide uppercase">Agen Omahe</p>
			<p class="text-xs opacity-80">{SITE.tagline}</p>
		</div>
		<div class="flex flex-col items-center px-6 py-6 text-center">
			{#if k.fotoUrl}
				<img
					src={k.fotoUrl}
					alt={`Foto ${k.nama}`}
					class="h-28 w-28 rounded-full object-cover"
					width="112"
					height="112"
				/>
			{:else}
				<span
					class="bg-surface text-primary font-display flex h-28 w-28 items-center justify-center rounded-full text-3xl font-bold"
					aria-hidden="true">{inisial}</span
				>
			{/if}
			<h1 class="font-display text-ink mt-4 text-xl font-extrabold">{k.nama}</h1>
			<p class="text-accent-dark mt-1 font-mono text-sm font-semibold">{k.kodeAgen}</p>
			<p class="text-muted text-sm">{k.kantorNama}</p>

			{#if aktif}
				<a
					href={`/verifikasi/${encodeURIComponent(k.kodeAgen)}`}
					class="text-primary mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
				>
					<BadgeCheck class="h-3.5 w-3.5" aria-hidden="true" /> Agen terverifikasi{berlaku
						? ` · berlaku s/d ${berlaku}`
						: ''}
				</a>
				<div class="mt-5 flex w-full flex-col gap-2">
					{#if k.whatsapp}
						<Button
							variant="whatsapp"
							href={waUrl(k.whatsapp, `Halo ${k.nama}, saya dapat kartu nama Anda dari Omahe.`)}
							target="_blank"
							rel="noopener"
							onclick={() => trackEvent('kartu_nama_wa', { agen: k.kodeAgen })}
						>
							Chat WhatsApp
						</Button>
					{/if}
					<Button
						variant="outline"
						href={`/agen-omahe/${encodeURIComponent(k.kodeAgen)}/vcard`}
						onclick={() => trackEvent('kartu_nama_vcard', { agen: k.kodeAgen })}
					>
						Simpan Kontak
					</Button>
				</div>
			{:else}
				<p class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
					Agen ini sedang tidak aktif. Untuk bantuan mencari rumah, hubungi tim Omahe lewat
					<a href="/kontak" class="font-medium underline">halaman kontak</a>.
				</p>
			{/if}
		</div>

		{#if aktif && k.perumahan.length > 0}
			<div class="border-line border-t px-6 py-5">
				<h2 class="font-display text-ink text-sm font-bold">Perumahan yang saya pasarkan</h2>
				<ul class="mt-3 space-y-2">
					{#each k.perumahan as p (p.slug)}
						<li>
							<!-- `ref` = kode agen: booking/lead dari sini tercatat untuk agen ini. -->
							<a
								href={`/perumahan/${encodeURIComponent(p.slug)}?ref=${encodeURIComponent(p.kodeRef)}`}
								class="border-line hover:border-primary flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors"
							>
								<span class="text-ink font-medium">{p.nama}</span>
								<span class="text-primary" aria-hidden="true">&rarr;</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
