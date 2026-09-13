<!--
	Filter di `/cari`. Mobile: chip yang bisa di-scroll horizontal (BUKAN
	sidebar permanen — keputusan §Mobile-first). Tiap chip adalah <a> ke URL
	dengan query param yang sudah diubah, jadi filter tetap jalan tanpa JS,
	bisa di-bookmark, dan tombol back browser bekerja seperti yang diharapkan.
-->
<script lang="ts">
	import type { RegionOption } from '$lib/api/types';
	import { cn } from '$lib/utils';

	let {
		url,
		regions
	}: {
		url: URL;
		regions: RegionOption[];
	} = $props();

	const BATAS_HARGA = [
		{ nilai: '300000000', label: '< Rp300 jt' },
		{ nilai: '500000000', label: '< Rp500 jt' },
		{ nilai: '750000000', label: '< Rp750 jt' },
		{ nilai: '1000000000', label: '< Rp1 M' }
	];

	/** URL baru dengan satu param diubah; `page` selalu direset ke 1 karena
	 *  halaman 3 dari filter lama hampir pasti bukan halaman 3 filter baru. */
	function hrefDengan(key: string, value: string | null): string {
		const params = new URLSearchParams(url.searchParams);
		if (value === null) params.delete(key);
		else params.set(key, value);
		params.delete('page');
		const qs = params.toString();
		return `/cari${qs ? `?${qs}` : ''}`;
	}

	function hrefTanpaFilter(): string {
		const params = new URLSearchParams(url.searchParams);
		for (const key of ['regionKode', 'hargaMin', 'hargaMax', 'tipe', 'developerSlug', 'page']) {
			params.delete(key);
		}
		const qs = params.toString();
		return `/cari${qs ? `?${qs}` : ''}`;
	}

	const regionAktif = $derived(url.searchParams.get('regionKode'));
	const hargaAktif = $derived(url.searchParams.get('hargaMax'));
	const adaFilter = $derived(
		['regionKode', 'hargaMin', 'hargaMax', 'tipe', 'developerSlug'].some((k) =>
			url.searchParams.has(k)
		)
	);

	const chip = (aktif: boolean) =>
		cn(
			'inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors',
			aktif
				? 'border-primary bg-primary text-white'
				: 'border-line bg-white text-muted hover:border-primary/40 hover:text-primary'
		);
</script>

<div class="space-y-2">
	<div class="-mx-4 overflow-x-auto px-4 pb-1">
		<div class="flex gap-2" role="group" aria-label="Filter lokasi">
			<a href={hrefDengan('regionKode', null)} class={chip(regionAktif === null)}>Semua lokasi</a>
			{#each regions as region (region.kode)}
				<a href={hrefDengan('regionKode', region.kode)} class={chip(regionAktif === region.kode)}>
					{region.nama.split(',')[0]}
				</a>
			{/each}
		</div>
	</div>

	<div class="-mx-4 overflow-x-auto px-4 pb-1">
		<div class="flex gap-2" role="group" aria-label="Filter harga">
			<a href={hrefDengan('hargaMax', null)} class={chip(hargaAktif === null)}>Semua harga</a>
			{#each BATAS_HARGA as batas (batas.nilai)}
				<a href={hrefDengan('hargaMax', batas.nilai)} class={chip(hargaAktif === batas.nilai)}>
					{batas.label}
				</a>
			{/each}
			{#if adaFilter}
				<a href={hrefTanpaFilter()} class="{chip(false)} border-dashed">Reset filter</a>
			{/if}
		</div>
	</div>
</div>
