<!--
	LELANG-01 — kartu satu rumah lelang (pola kartu properti Omahe): foto,
	badge "Lelang", NILAI LIMIT (bukan "harga"), jadwal lelang, bank penjual.
-->
<script lang="ts">
	import type { RumahLelangKartu } from '$lib/api/types';
	import { formatTanggalRingkas } from '$lib/lelang';
	import { withRef } from '$lib/ref';
	import { formatRupiah, formatRupiahPenuh } from '$lib/utils';
	import PhotoPlaceholder from './photo-placeholder.svelte';
	import Badge from './ui/badge.svelte';

	let { rumah, ref = null }: { rumah: RumahLelangKartu; ref?: string | null } = $props();
	const href = $derived(withRef(`/lelang/${rumah.slug}`, ref));
	const lokasi = $derived([rumah.regionNama, rumah.provinsiNama].filter(Boolean).join(', '));
</script>

<article
	class="border-line flex min-w-0 flex-col overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md"
>
	<a {href} class="relative block">
		{#if rumah.fotoUrl}
			<img
				src={rumah.fotoUrl}
				alt="Foto {rumah.judul}"
				loading="lazy"
				class="h-44 w-full object-cover"
			/>
		{:else}
			<PhotoPlaceholder class="h-44 w-full" />
		{/if}
		<span class="absolute top-2 left-2"><Badge variant="accent">Lelang</Badge></span>
	</a>
	<div class="flex flex-1 flex-col p-4">
		<h3 class="font-display text-ink text-base leading-snug font-bold">
			<a {href} class="hover:text-primary">{rumah.judul}</a>
		</h3>
		{#if lokasi}<p class="text-muted mt-0.5 text-xs">{lokasi}</p>{/if}
		<p class="text-muted mt-3 text-xs">Nilai limit</p>
		<p
			class="font-display text-primary text-lg font-extrabold"
			title={formatRupiahPenuh(rumah.nilaiLimit)}
		>
			{formatRupiah(rumah.nilaiLimit)}
		</p>
		<dl class="text-muted mt-2 space-y-0.5 text-xs">
			<div class="flex gap-1">
				<dt>Lelang:</dt>
				<dd class="text-ink font-medium">{formatTanggalRingkas(rumah.tanggalLelang)}</dd>
			</div>
			<div class="flex gap-1">
				<dt>Bank:</dt>
				<dd class="text-ink font-medium">
					{rumah.bank.nama}{rumah.cabangBank ? ` · ${rumah.cabangBank}` : ''}
				</dd>
			</div>
			{#if rumah.luasTanah || rumah.luasBangunan}
				<div class="flex gap-1">
					<dt>LT/LB:</dt>
					<dd class="text-ink font-medium">
						{rumah.luasTanah ?? '-'} / {rumah.luasBangunan ?? '-'} m²
					</dd>
				</div>
			{/if}
		</dl>
	</div>
</article>
