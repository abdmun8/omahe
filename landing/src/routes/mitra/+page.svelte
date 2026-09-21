<!--
	Direktori Mitra Profesional — KJPP & Notaris (MITRA-01, issue omahe#1).
	Empty-state bukan skeleton: di mode API asli sebelum backend live,
	halaman ini jujur "belum ada mitra" (fixture hanya dev).
-->
<script lang="ts">
	import MitraCard from '$lib/components/mitra-card.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const KATEGORI = [
		{ nilai: null, label: 'Semua' },
		{ nilai: 'kjpp', label: 'KJPP' },
		{ nilai: 'notaris', label: 'Notaris' }
	] as const;
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
			Kantor Jasa Penilai Publik (KJPP) dan Notaris/PPAT dalam satu direktori — dari penilaian
			harga hingga akad jual beli, didampingi profesional yang tepat.
		</p>
	</header>

	<nav class="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Filter kategori mitra">
		{#each KATEGORI as k (k.label)}
			<a
				href={k.nilai ? `/mitra?kategori=${k.nilai}` : '/mitra'}
				class={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors ${
					(data.kategori ?? null) === k.nilai
						? 'bg-primary text-white'
						: 'bg-surface text-muted hover:text-primary'
				}`}>{k.label}</a
			>
		{/each}
	</nav>

	{#if data.mitra.length === 0}
		<div class="bg-surface mt-8 rounded-2xl p-8 text-center">
			<p class="text-ink font-semibold">Belum ada mitra yang ditampilkan</p>
			<p class="text-muted mx-auto mt-1 max-w-md text-sm leading-relaxed">
				Direktori mitra profesional sedang disiapkan. Kalau Anda KJPP atau Notaris yang ingin
				bergabung, hubungi kami di
				<a href="mailto:halo@omahe.co.id" class="text-primary font-medium hover:underline"
					>halo@omahe.co.id</a
				>.
			</p>
		</div>
	{:else}
		<ul class="mt-6 grid list-none gap-4 sm:grid-cols-2">
			{#each data.mitra as mitra (mitra.id)}
				<li><MitraCard {mitra} /></li>
			{/each}
		</ul>
	{/if}
</div>
