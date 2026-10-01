<!--
	Direktori Mitra Profesional — KJPP & Notaris (MITRA-01, issue omahe#1).
	Empty-state bukan skeleton: di mode API asli sebelum backend live,
	halaman ini jujur "belum ada mitra" (fixture hanya dev).
-->
<script lang="ts">
	import AgenOmaheCard from '$lib/components/agen-omahe-card.svelte';
	import MitraCard from '$lib/components/mitra-card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// MITRA-04 — label kategori terpilih untuk empty-state per-kategori.
	const labelKategoriTerpilih = $derived(
		data.chips.find((c) => c.nilai === data.kategori)?.label ?? ''
	);
</script>

<svelte:head>
	<title>Mitra Profesional — KJPP &amp; Notaris · Omahe</title>
	<meta
		name="description"
		content="Direktori mitra profesional properti terverifikasi: Kantor Jasa Penilai Publik (KJPP) dan Notaris/PPAT — siap membantu penilaian hingga akad jual beli Anda."
	/>
	<meta property="og:title" content="Mitra Profesional · Omahe" />
	<meta
		property="og:description"
		content="Direktori KJPP & Notaris — mitra profesional untuk penilaian dan legalitas properti Anda."
	/>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<header class="max-w-2xl">
		<h1 class="font-display text-ink text-2xl font-extrabold sm:text-3xl">Mitra Profesional</h1>
		<p class="text-muted mt-2 leading-relaxed">
			Kantor Jasa Penilai Publik (KJPP) dan Notaris/PPAT dalam satu direktori — dari penilaian harga
			hingga akad jual beli, didampingi profesional yang tepat.
		</p>
	</header>

	<nav class="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Filter kategori mitra">
		{#each data.chips as k (k.label)}
			<a
				href={k.nilai ? `/mitra?kategori=${k.nilai}` : '/mitra'}
				class={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors ${
					!data.tabAgen && (data.kategori ?? null) === k.nilai
						? 'bg-primary text-white'
						: 'bg-surface text-muted hover:text-primary'
				}`}>{k.label}</a
			>
		{/each}
		<!-- AGEN-OMAHE-04 — tab agen internal Omahe (bukan kategori mitra). -->
		<a
			href="/mitra?tab=agen"
			class={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors ${
				data.tabAgen ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-primary'
			}`}>Agen Omahe</a
		>
	</nav>

	{#if data.tabAgen}
		<p class="text-muted mt-4 max-w-2xl text-sm leading-relaxed">
			Agen resmi Omahe dengan keanggotaan aktif — identitasnya bisa dicek lewat tautan verifikasi.
			Tinggalkan kontak Anda, agen akan membantu mencarikan rumah yang pas.
		</p>
		{#if data.agen.length === 0}
			<div class="bg-surface mt-6 rounded-2xl p-8 text-center">
				<p class="text-ink font-semibold">Belum ada agen yang ditampilkan</p>
				<p class="text-muted mx-auto mt-1 max-w-md text-sm leading-relaxed">
					Ingin menjadi agen Omahe? Lihat caranya di
					<a href="/gabung/agen" class="text-primary font-medium hover:underline"
						>halaman gabung agen</a
					>.
				</p>
			</div>
		{:else}
			<ul class="mt-6 grid list-none grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
				{#each data.agen as a (a.kodeAgen)}
					<li><AgenOmaheCard agen={a} /></li>
				{/each}
			</ul>
		{/if}
	{:else if data.mitra.length === 0 && data.kategori}
		<!-- MITRA-04 — kategori master aktif tapi belum punya mitra: tab tetap
		     tampil, berisi ajakan bergabung (bukan "direktori disiapkan"). -->
		<div class="bg-surface mt-8 rounded-2xl p-8 text-center">
			<p class="text-ink font-semibold">Belum ada mitra di kategori ini</p>
			<p class="text-muted mx-auto mt-1 max-w-md text-sm leading-relaxed">
				{labelKategoriTerpilih
					? `Kategori “${labelKategoriTerpilih}” masih menunggu profesional pertamanya.`
					: 'Kategori ini masih menunggu profesional pertamanya.'}
				Kalau Anda profesional properti, isi formulirnya dan tim kami akan menghubungi Anda.
			</p>
			<Button href="/gabung/mitra" class="mt-5">Gabung sebagai mitra</Button>
		</div>
	{:else if data.mitra.length === 0 && data.agen.length === 0}
		<div class="bg-surface mt-8 rounded-2xl p-8 text-center">
			<p class="text-ink font-semibold">Belum ada mitra yang ditampilkan</p>
			<p class="text-muted mx-auto mt-1 max-w-md text-sm leading-relaxed">
				Direktori mitra profesional sedang disiapkan. Kalau Anda KJPP, notaris, asuransi, pemborong,
				atau profesional properti lain yang ingin bergabung, lihat caranya di
				<a href="/gabung/mitra" class="text-primary font-medium hover:underline"
					>halaman gabung mitra</a
				>.
			</p>
		</div>
	{:else}
		<ul class="mt-6 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<!-- Tab "Semua": Agen Omahe dulu (keputusan user 2026-10-01), lalu mitra
			     urut kategori master (diurutkan di load). Tab kategori → agen kosong. -->
			{#each data.agen as a (a.kodeAgen)}
				<li><AgenOmaheCard agen={a} /></li>
			{/each}
			{#each data.mitra as mitra (mitra.id)}
				<li><MitraCard {mitra} /></li>
			{/each}
		</ul>
	{/if}
</div>
