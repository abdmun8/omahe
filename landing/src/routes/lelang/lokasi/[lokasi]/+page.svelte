<!--
	LELANG-03 — /lelang/lokasi/:slug — rumah lelang per kabupaten/kota (judul,
	deskripsi & canonical sendiri; canonical dari layout = path tanpa query).
	Halaman kosong / terfilter bank-limit → noindex (konten tipis/duplikat).
-->
<script lang="ts">
	import { page } from '$app/state';
	import LelangDaftar from '$lib/components/lelang-daftar.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const ref = $derived(page.data.ref as string | null);
	const nama = $derived(data.lokasiAktif.nama);
	const terfilter = $derived(Boolean(data.query.bankId || data.query.limitMax));
</script>

<svelte:head>
	<title>Rumah Lelang di {nama} · Omahe</title>
	<meta
		name="description"
		content="{data.hasil.meta
			.total} rumah lelang (agunan bank) di {nama}: nilai limit, jadwal lelang, dan bank penjual. Cek detail sebelum ikut lelang resmi."
	/>
	{#if data.hasil.meta.total === 0 || terfilter}<meta
			name="robots"
			content="noindex, follow"
		/>{/if}
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<nav class="text-muted text-sm" aria-label="Breadcrumb">
		<a href="/lelang" class="hover:text-ink">Rumah Lelang</a> <span aria-hidden="true">›</span>
		{nama}
	</nav>
	<header class="mt-2 max-w-2xl">
		<h1 class="font-display text-ink text-2xl font-extrabold sm:text-3xl">
			Rumah Lelang di {nama}
		</h1>
		<p class="text-muted mt-2 text-sm leading-relaxed">
			Rumah agunan bank di {nama} yang akan dilelang. Harga yang tercantum adalah
			<strong>nilai limit</strong>
			(penawaran minimum). Pendaftaran & penawaran dilakukan di penyelenggara resmi (mis. lelang.go.id).
		</p>
	</header>

	<LelangDaftar
		hasil={data.hasil}
		lokasi={data.lokasi}
		bank={data.bank}
		query={data.query}
		lokasiAktif={data.lokasiAktif}
		{ref}
		url={page.url}
		basePath={`/lelang/lokasi/${data.lokasiAktif.slug}`}
	/>
</div>
