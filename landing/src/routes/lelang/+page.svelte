<!--
	LELANG-01 — /lelang: rumah lelang (agunan bank) yang akan datang. Format
	kartu mirip perumahan; harga = "nilai limit". Filter GET form (wilayah,
	bank, nilai limit) — `ref` & filter lain ikut sebagai hidden input.
-->
<script lang="ts">
	import { page } from '$app/state';
	import LelangCard from '$lib/components/lelang-card.svelte';
	import Pagination from '$lib/components/pagination.svelte';
	import { FILTER_LIMIT } from '$lib/lelang';
	import { formatAngka } from '$lib/utils';
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

	<form method="GET" action="/lelang" class="mt-6 grid gap-3 sm:grid-cols-4">
		{#if ref}<input type="hidden" name="ref" value={ref} />{/if}
		<select
			name="regionKode"
			aria-label="Lokasi"
			class="border-line h-11 rounded-lg border bg-white px-3 text-sm"
		>
			<option value="">Semua lokasi</option>
			{#each data.regions as r (r.kode)}
				<option value={r.kode} selected={data.query.regionKode === r.kode}>{r.nama}</option>
			{/each}
		</select>
		<select
			name="bankId"
			aria-label="Bank"
			class="border-line h-11 rounded-lg border bg-white px-3 text-sm"
		>
			<option value="">Semua bank</option>
			{#each data.bank as b (b.id)}
				<option value={b.id} selected={data.query.bankId === b.id}>{b.nama}</option>
			{/each}
		</select>
		<select
			name="limitMax"
			aria-label="Nilai limit"
			class="border-line h-11 rounded-lg border bg-white px-3 text-sm"
		>
			<option value="">Semua nilai limit</option>
			{#each FILTER_LIMIT as f (f.nilai)}
				<option value={f.nilai} selected={data.query.limitMax === f.nilai}>{f.label}</option>
			{/each}
		</select>
		<button type="submit" class="bg-primary h-11 rounded-lg px-4 text-sm font-semibold text-white"
			>Terapkan</button
		>
	</form>

	<p class="text-muted mt-6 text-sm">{formatAngka(data.hasil.meta.total)} rumah lelang</p>

	{#if data.hasil.items.length === 0}
		<div class="border-line mt-4 rounded-xl border border-dashed p-10 text-center">
			<p class="font-display text-ink text-base font-bold">Belum ada rumah lelang yang cocok</p>
			<p class="text-muted mx-auto mt-2 max-w-sm text-sm">
				Coba longgarkan filter, atau kembali lagi nanti — jadwal lelang diperbarui berkala.
			</p>
		</div>
	{:else}
		<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.hasil.items as rumah (rumah.slug)}
				<LelangCard {rumah} {ref} />
			{/each}
		</div>
		<div class="mt-8">
			<Pagination
				url={page.url}
				page={data.hasil.meta.page}
				pageSize={data.hasil.meta.pageSize}
				total={data.hasil.meta.total}
				basePath="/lelang"
			/>
		</div>
	{/if}

	<p class="text-muted mt-10 text-xs leading-relaxed">
		Omahe bukan penyelenggara lelang. Informasi berasal dari bank/penyelenggara dan dapat berubah —
		selalu verifikasi & daftar di penyelenggara resmi.
	</p>
</div>
