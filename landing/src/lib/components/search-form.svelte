<!--
	Form pencarian utama. Sengaja <form method="GET" action="/cari"> murni:
	hasilnya URL yang bisa di-bookmark/dibagikan dan tetap jalan tanpa JS —
	penting untuk halaman publik yang SEO-heavy.
-->
<script lang="ts">
	import type { RegionOption } from '$lib/api/types';
	import { REF_PARAM } from '$lib/ref';
	import Button from './ui/button.svelte';

	let {
		regions,
		ref = null,
		nilai = {}
	}: {
		regions: RegionOption[];
		ref?: string | null;
		nilai?: { regionKode?: string; hargaMaks?: number; tipe?: string };
	} = $props();

	const BATAS_HARGA = [
		{ nilai: 300_000_000, label: 'Di bawah Rp300 jt' },
		{ nilai: 500_000_000, label: 'Di bawah Rp500 jt' },
		{ nilai: 750_000_000, label: 'Di bawah Rp750 jt' },
		{ nilai: 1_000_000_000, label: 'Di bawah Rp1 M' },
		{ nilai: 2_000_000_000, label: 'Di bawah Rp2 M' }
	];

	const kelas =
		'h-12 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted';
</script>

<form
	action="/cari"
	method="GET"
	class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1.5fr_auto]"
>
	<!-- `ref` ikut dibawa sebagai hidden input: submit form membangun URL
	     baru dari nol, jadi tanpa ini atribusi referral putus di sini. -->
	{#if ref}
		<input type="hidden" name={REF_PARAM} value={ref} />
	{/if}

	<div>
		<label for="cari-lokasi" class="sr-only">Lokasi</label>
		<select id="cari-lokasi" name="regionKode" class={kelas}>
			<option value="">Semua lokasi</option>
			{#each regions as region (region.kode)}
				<option value={region.kode} selected={nilai.regionKode === region.kode}
					>{region.nama}</option
				>
			{/each}
		</select>
	</div>

	<div>
		<label for="cari-harga" class="sr-only">Harga maksimal</label>
		<select id="cari-harga" name="hargaMax" class={kelas}>
			<option value="">Semua harga</option>
			{#each BATAS_HARGA as batas (batas.nilai)}
				<option value={batas.nilai} selected={nilai.hargaMaks === batas.nilai}>{batas.label}</option
				>
			{/each}
		</select>
	</div>

	<div>
		<label for="cari-tipe" class="sr-only">Tipe rumah</label>
		<input
			id="cari-tipe"
			name="tipe"
			type="search"
			inputmode="search"
			placeholder="Tipe, mis. 36"
			value={nilai.tipe ?? ''}
			class={kelas}
		/>
	</div>

	<Button type="submit" size="lg" class="w-full lg:w-auto">Cari Rumah</Button>
</form>
