<!--
	LELANG-01 — /lelang: rumah lelang (agunan bank) yang akan datang. Daftar &
	filter di komponen bersama `lelang-daftar` (juga /lelang/lokasi/:slug).
-->
<script lang="ts">
	import { page } from '$app/state';
	import LelangDaftar from '$lib/components/lelang-daftar.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const ref = $derived(page.data.ref as string | null);
</script>

<svelte:head>
	<title>Rumah Lelang Bank · Omahe</title>
	<meta
		name="description"
		content="Daftar rumah lelang (agunan bank) dengan nilai limit, jadwal lelang, dan bank penjual. Cek detail sebelum ikut lelang resmi."
	/>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<header class="max-w-2xl">
		<h1 class="font-display text-ink text-2xl font-extrabold sm:text-3xl">Rumah Lelang</h1>
		<p class="text-muted mt-2 text-sm leading-relaxed">
			Rumah agunan bank yang akan dilelang. Harga yang tercantum adalah <strong>nilai limit</strong> (penawaran
			minimum). Pendaftaran & penawaran dilakukan di penyelenggara resmi (mis. lelang.go.id).
		</p>
	</header>

	<LelangDaftar
		hasil={data.hasil}
		lokasi={data.lokasi}
		bank={data.bank}
		query={data.query}
		lokasiAktif={null}
		{ref}
		url={page.url}
		basePath="/lelang"
	/>
</div>
