<!--
	Form pencarian utama. Sengaja <form method="GET" action="/cari"> murni:
	hasilnya URL yang bisa di-bookmark/dibagikan dan tetap jalan tanpa JS —
	penting untuk halaman publik yang SEO-heavy.

	Dua varian layout (prop `kompak`):
	- default (dipakai /cari): semua field, bertumpuk di mobile lalu grid di
	  sm+/lg+ — perilaku lama, tidak berubah.
	- `kompak` (homepage): mobile cuma SATU baris (lokasi + kata kunci +
	  tombol) + link "Filter lanjutan" ke /cari; select harga tetap di DOM
	  tapi disembunyikan CSS di mobile — field tersembunyi tetap ikut submit
	  GET, jadi semantik query form identik di semua varian. Di sm+ varian
	  kompak memakai grid penuh yang sama seperti default.
-->
<script lang="ts">
	import type { RegionOption } from '$lib/api/types';
	import { REF_PARAM, withRef } from '$lib/ref';
	import { cn } from '$lib/utils';
	import Button from './ui/button.svelte';

	let {
		regions,
		ref = null,
		nilai = {},
		kompak = false
	}: {
		regions: RegionOption[];
		ref?: string | null;
		nilai?: { regionKode?: string; hargaMaks?: number; tipe?: string };
		kompak?: boolean;
	} = $props();

	const BATAS_HARGA = [
		{ nilai: 300_000_000, label: 'Di bawah Rp300 jt' },
		{ nilai: 500_000_000, label: 'Di bawah Rp500 jt' },
		{ nilai: 750_000_000, label: 'Di bawah Rp750 jt' },
		{ nilai: 1_000_000_000, label: 'Di bawah Rp1 M' },
		{ nilai: 2_000_000_000, label: 'Di bawah Rp2 M' }
	];

	// Nilai live dari field utama — dipakai menyusun href "Filter lanjutan"
	// supaya lokasi/kata kunci yang sudah diisi pengunjung ikut terbawa ke
	// /cari, bukan hilang di tengah jalan. `ref` menyusul lewat `withRef()`.
	// Nilai awal sengaja dipetik SEKALI dari prop `nilai` (seed state, bukan
	// reaktivitas) — prop ini statis per-page-load, tidak berubah di tengah
	// jalan, jadi ignore warning-nya di sini.
	// svelte-ignore state_referenced_locally
	let lokasi = $state(nilai.regionKode ?? '');
	// svelte-ignore state_referenced_locally
	let kataKunci = $state(nilai.tipe ?? '');

	const filterLainnyaHref = $derived.by(() => {
		const params = new URLSearchParams();
		if (lokasi) params.set('regionKode', lokasi);
		if (kataKunci.trim()) params.set('tipe', kataKunci.trim());
		const qs = params.toString();
		return withRef(`/cari${qs ? `?${qs}` : ''}`, ref);
	});

	// Kelas dasar field TANPA tinggi — tingginya dipisah supaya varian kompak
	// tidak mengirim h-11 dan h-12 sekaligus (arbitrase CSS order terlalu
	// rapuh; lihat `cn()` = twMerge yang menyelesaikan konflik per-breakpoint).
	const kelas =
		'w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted';
	// Varian kompak: 44px di mobile (target sentuh minimum) lalu 48px lagi di sm+.
	const tinggi = $derived(kompak ? 'h-11 sm:h-12' : 'h-12');
</script>

<form
	action="/cari"
	method="GET"
	class={cn(
		'gap-3',
		kompak
			? 'flex flex-wrap items-center gap-2 sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-[2fr_1.5fr_1.5fr_auto]'
			: 'grid sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1.5fr_auto]'
	)}
>
	<!-- `ref` ikut dibawa sebagai hidden input: submit form membangun URL
	     baru dari nol, jadi tanpa ini atribusi referral putus di sini. -->
	{#if ref}
		<input type="hidden" name={REF_PARAM} value={ref} />
	{/if}

	<div class={cn(kompak && 'w-[42%] max-w-44 shrink-0 sm:w-auto sm:max-w-none')}>
		<label for="cari-lokasi" class="sr-only">Lokasi</label>
		<select id="cari-lokasi" name="regionKode" bind:value={lokasi} class={cn(kelas, tinggi)}>
			<option value="">Semua lokasi</option>
			{#each regions as region (region.kode)}
				<option value={region.kode}>{region.nama}</option>
			{/each}
		</select>
	</div>

	<!-- Harga = filter lanjutan: di mobile kompak disembunyikan (tetap di DOM
	     supaya submit form tidak berubah), muncul lagi di sm+. -->
	<div class={cn(kompak && 'hidden sm:block')}>
		<label for="cari-harga" class="sr-only">Harga maksimal</label>
		<select id="cari-harga" name="hargaMax" class={cn(kelas, tinggi)}>
			<option value="">Semua harga</option>
			{#each BATAS_HARGA as batas (batas.nilai)}
				<option value={batas.nilai} selected={nilai.hargaMaks === batas.nilai}>{batas.label}</option
				>
			{/each}
		</select>
	</div>

	<div class={cn(kompak && 'min-w-0 flex-1')}>
		<label for="cari-tipe" class="sr-only">Tipe rumah</label>
		<input
			id="cari-tipe"
			name="tipe"
			type="search"
			inputmode="search"
			placeholder={kompak ? 'mis. 36' : 'Tipe, mis. 36'}
			bind:value={kataKunci}
			class={cn(kelas, tinggi)}
		/>
	</div>

	<Button
		type="submit"
		size={kompak ? 'md' : 'lg'}
		class={kompak ? 'shrink-0 sm:h-12 sm:px-6 sm:text-base' : 'w-full lg:w-auto'}
	>
		{#if kompak}
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-4 w-4"
				aria-hidden="true"
			>
				<circle cx="11" cy="11" r="8" />
				<path d="m21 21-4.3-4.3" />
			</svg>
			<!-- Teks pendek di mobile, label penuh di desktop — keduanya teks
			     nyata, bukan cuma aria-label, supaya nama tombol selalu terbaca. -->
			<span class="sm:hidden">Cari</span>
			<span class="hidden sm:inline">Cari Rumah</span>
		{:else}
			Cari Rumah
		{/if}
	</Button>

	{#if kompak}
		<!-- Pintasan ke filter lengkap di /cari — query yang sudah diisi
		     (lokasi/kata kunci/ref) ikut di href-nya. Baris sendiri di mobile
		     (w-full pada flex-wrap), hilang di sm+ karena grid penuh sudah
		     menampilkan semua field. -->
		<div class="w-full sm:hidden">
			<a
				href={filterLainnyaHref}
				class="text-primary inline-flex items-center gap-1.5 pt-0.5 text-sm font-medium hover:underline"
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-4 w-4"
					aria-hidden="true"
				>
					<line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" />
					<line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" />
					<line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" />
					<line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" />
					<line x1="16" x2="16" y1="18" y2="22" />
				</svg>
				Filter lanjutan (harga, dll.)
			</a>
		</div>
	{/if}
</form>
