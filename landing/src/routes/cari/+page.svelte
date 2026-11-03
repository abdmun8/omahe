<script lang="ts">
	import { page } from '$app/state';
	import FilterChips from '$lib/components/filter-chips.svelte';
	import Pagination from '$lib/components/pagination.svelte';
	import SearchForm from '$lib/components/search-form.svelte';
	import UnitCard from '$lib/components/unit-card.svelte';
	import { SITE } from '$lib/config';
	import { formatAngka } from '$lib/utils';
	import { PILIHAN_URUTAN, parseUrutan } from '$lib/urutan-unit';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const regionAktif = $derived(
		data.regions.find((r) => r.kode === data.query.regionKode) ?? null
	);
	/** UNIT-10 — kecamatan aktif ikut ke label lokasi ("Kec. Cidadap, Kab.
	 *  Bogor, Jawa Barat"); bila backend lama tidak mengirim `kecamatan` →
	 *  null → label lokasi polos seperti sebelumnya. */
	const kecamatanAktif = $derived(
		regionAktif?.kecamatan?.find((k) => k.kode === data.query.kecamatanKode)?.nama ?? null
	);
	const lokasiLabel = $derived(
		kecamatanAktif && regionAktif
			? `Kec. ${kecamatanAktif}, ${regionAktif.nama}`
			: (regionAktif?.nama ?? null)
	);
	/** UNIT-10 — bila ada kata kunci, judul jadi hasil pencarian (bukan
	 *  landing SEO "Rumah Dijual di …"). */
	const judul = $derived(
		data.query.q
			? `Hasil pencarian “${data.query.q}”${lokasiLabel ? ` di ${lokasiLabel}` : ''}`
			: lokasiLabel
				? `Rumah Dijual di ${lokasiLabel}`
				: 'Rumah Dijual dari Pengembang'
	);
	/** UNIT-07 — urutan aktif + parameter lain yang harus ikut terbawa
	 *  (filter & `ref` — kewajiban passthrough). `page` sengaja dibuang:
	 *  ganti urutan = kembali ke halaman 1. */
	const urutanAktif = $derived(parseUrutan(page.url.searchParams.get('sort')));
	const paramLain = $derived(
		[...page.url.searchParams.entries()].filter(([k]) => k !== 'sort' && k !== 'page')
	);

	const deskripsi = $derived(
		`${formatAngka(data.hasil.meta.total)} tipe unit tersedia${lokasiLabel ? ` di ${lokasiLabel}` : ''}. Bandingkan harga, luas, dan pengembangnya di Omahe.`
	);
</script>

<svelte:head>
	<title>{judul} · Omahe</title>
	<meta name="description" content={deskripsi} />
	<meta property="og:title" content={judul} />
	<meta property="og:description" content={deskripsi} />
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
	<!-- Halaman hasil berfilter jangan bersaing dengan dirinya sendiri di indeks.
	     UNIT-10 — kata kunci/kecamatan/kamar juga mengaktifkan noindex. -->
	{#if
		data.hasil.meta.page > 1 ||
		data.query.tipe ||
		data.query.q ||
		data.query.kecamatanKode ||
		data.query.kamarTidurMin ||
		data.query.kamarMandiMin}
		<meta name="robots" content="noindex,follow" />
	{/if}
</svelte:head>

<div class="border-line bg-surface border-b">
	<div class="mx-auto max-w-6xl px-4 py-6">
		<SearchForm
			regions={data.regions}
			ref={data.ref}
			nilai={{
				regionKode: data.query.regionKode,
				hargaMin: data.query.hargaMin,
				hargaMaks: data.query.hargaMax,
				tipe: data.query.tipe,
				q: data.query.q,
				kecamatanKode: data.query.kecamatanKode,
				kamarTidurMin: data.query.kamarTidurMin,
				kamarMandiMin: data.query.kamarMandiMin
			}}
		/>
	</div>
</div>

<div class="mx-auto max-w-6xl px-4 py-6">
	<FilterChips url={page.url} regions={data.regions} />

	<div class="mt-6 flex items-baseline justify-between gap-4">
		<h1 class="font-display text-ink text-xl font-bold sm:text-2xl">{judul}</h1>
		<p class="text-muted shrink-0 text-sm">{formatAngka(data.hasil.meta.total)} hasil</p>
	</div>

	<!-- UNIT-07 — urutan hasil. Form GET: tanpa JS tetap jalan (tombol
	     "Terapkan" di <noscript>); dengan JS langsung submit saat berubah.
	     `sort=rekomendasi` di URL tidak diteruskan ke backend (= default). -->
	<form method="GET" action="/cari" class="mt-3 flex items-center justify-end gap-2">
		{#each paramLain as [k, v], i (`${k}-${i}`)}
			<input type="hidden" name={k} value={v} />
		{/each}
		<label for="urutan-cari" class="text-muted text-sm">Urutkan</label>
		<select
			id="urutan-cari"
			name="sort"
			value={urutanAktif}
			onchange={(e) => e.currentTarget.form?.requestSubmit()}
			class="border-line text-ink h-11 rounded-lg border bg-white px-3 text-sm"
		>
			{#each PILIHAN_URUTAN as p (p.nilai)}
				<option value={p.nilai}>{p.label}</option>
			{/each}
		</select>
		<noscript>
			<button type="submit" class="border-line h-11 rounded-lg border px-3 text-sm">Terapkan</button
			>
		</noscript>
	</form>

	{#if data.hasil.items.length === 0}
		<div class="border-line mt-8 rounded-xl border border-dashed p-10 text-center">
			<p class="font-display text-ink text-base font-bold">Belum ada yang cocok</p>
			{#if data.query.q}
				<!-- UNIT-10 — kosong karena kata kunci: sarankan yang paling mungkin
				     salah (ejaan) atau filter yang mengekang hasil. -->
				<p class="text-muted mx-auto mt-2 max-w-sm text-sm">
					Periksa ejaan kata “{data.query.q}” atau hapus sebagian filter — misalnya
					naikkan batas harga, atau pilih lokasi yang lebih luas.
				</p>
			{:else}
				<p class="text-muted mx-auto mt-2 max-w-sm text-sm">
					Coba longgarkan filternya — misalnya naikkan batas harga, atau pilih lokasi
					yang lebih luas.
				</p>
			{/if}
		</div>
	{:else}
		<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.hasil.items as unit (unit.id)}
				<UnitCard {unit} ref={data.ref} source="search" />
			{/each}
		</div>

		<div class="mt-8">
			<Pagination
				url={page.url}
				page={data.hasil.meta.page}
				pageSize={data.hasil.meta.pageSize}
				total={data.hasil.meta.total}
			/>
		</div>
	{/if}
</div>
