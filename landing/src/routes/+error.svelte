<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button.svelte';
</script>

<svelte:head>
	<title>{page.status} · Omahe</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-md px-4 py-20 text-center">
	<p class="font-display text-primary text-5xl font-extrabold">{page.status}</p>
	<h1 class="font-display text-ink mt-3 text-xl font-bold">
		{page.status === 404 ? 'Halaman tidak ditemukan' : 'Ada yang tidak beres'}
	</h1>
	<p class="text-muted mt-2 text-sm">
		{page.error?.message ?? 'Coba muat ulang halaman ini sebentar lagi.'}
	</p>
	<div class="mt-6 flex justify-center gap-2">
		<Button href="/">Kembali ke Beranda</Button>
		<Button variant="outline" href="/cari">Cari Rumah</Button>
	</div>
</div>
