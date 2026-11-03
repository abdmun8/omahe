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
	 *  halaman 3 dari filter lama hampir pasti bukan halaman 3 filter baru.
	 *  UNIT-10 — ganti kab/kota juga menghapus `kecamatanKode`: kode kecamatan
	 *  milik kabupaten lain pasti tidak bermakna (UI form reset juga). */
	function hrefDengan(key: string, value: string | null): string {
		const params = new URLSearchParams(url.searchParams);
		if (value === null) params.delete(key);
		else params.set(key, value);
		if (key === 'regionKode') params.delete('kecamatanKode');
		params.delete('page');
		const qs = params.toString();
		return `/cari${qs ? `?${qs}` : ''}`;
	}

	function hrefTanpaFilter(): string {
		const params = new URLSearchParams(url.searchParams);
		for (const key of [
			'regionKode',
			'kecamatanKode',
			'hargaMin',
			'hargaMax',
			'tipe',
			'q',
			'kamarTidurMin',
			'kamarMandiMin',
			'developerSlug',
			'page'
		]) {
			params.delete(key);
		}
		const qs = params.toString();
		return `/cari${qs ? `?${qs}` : ''}`;
	}

	const regionAktif = $derived(url.searchParams.get('regionKode'));
	const hargaAktif = $derived(url.searchParams.get('hargaMax'));
	// UNIT-10 — kata kunci & filter kamar aktif (bila ada).
	const qAktif = $derived(url.searchParams.get('q'));
	const kamarAktif = $derived(url.searchParams.get('kamarTidurMin'));
	const adaFilter = $derived(
		[
			'regionKode',
			'kecamatanKode',
			'hargaMin',
			'hargaMax',
			'tipe',
			'q',
			'kamarTidurMin',
			'kamarMandiMin',
			'developerSlug'
		].some((k) => url.searchParams.has(k))
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
	{#if qAktif}
		<!-- UNIT-10 — chip kata kunci aktif: klik = hapus q (kembali ke semua
		     hasil, filter lain tetap). Baris sendiri supaya grup lokasi/harga
		     tetap murni satu semantik. -->
		<div class="-mx-4 overflow-x-auto px-4 pb-1">
			<div class="flex gap-2" role="group" aria-label="Kata kunci">
				<a href={hrefDengan('q', null)} class={chip(true)}>
					“{qAktif}”
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="ml-1 h-3.5 w-3.5"
						aria-hidden="true"
					>
						<path d="M18 6 6 18" /><path d="m6 6 12 12" />
					</svg>
					<span class="sr-only">Hapus kata kunci</span>
				</a>
			</div>
		</div>
	{/if}

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

	<!-- UNIT-10 — kamar tidur minimal (Semua/2+/3+/4+; 1+ identik dengan
	     Semua, tidak ditawarkan). -->
	<div class="-mx-4 overflow-x-auto px-4 pb-1">
		<div class="flex gap-2" role="group" aria-label="Filter kamar tidur">
			<a href={hrefDengan('kamarTidurMin', null)} class={chip(kamarAktif === null)}>Semua kamar</a>
			{#each ['2', '3', '4'] as n (n)}
				<a href={hrefDengan('kamarTidurMin', n)} class={chip(kamarAktif === n)}>{n}+ kamar</a>
			{/each}
		</div>
	</div>
</div>
