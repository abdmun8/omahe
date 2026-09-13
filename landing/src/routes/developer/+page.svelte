<script lang="ts">
	import DeveloperCard from '$lib/components/developer-card.svelte';
	import { SITE } from '$lib/config';
	import { formatAngka } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Direktori Pengembang Perumahan · Omahe</title>
	<meta
		name="description"
		content="Daftar perusahaan pengembang perumahan di Omahe beserta proyek aktif dan cakupan lokasinya."
	/>
	<meta property="og:title" content="Direktori Pengembang Perumahan" />
	<meta
		property="og:description"
		content="Daftar perusahaan pengembang perumahan di Omahe beserta proyek aktif dan cakupan lokasinya."
	/>
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="font-display text-ink text-2xl font-bold sm:text-3xl">Direktori Pengembang</h1>
	<p class="text-muted mt-2 max-w-2xl text-sm">
		Satu pengembang bisa menaungi beberapa proyek perumahan sekaligus. Pilih pengembangnya untuk
		melihat seluruh proyek yang sedang dipasarkan.
	</p>
	<p class="text-muted mt-4 text-sm">{formatAngka(data.developers.length)} pengembang terdaftar</p>

	<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.developers as developer (developer.slug)}
			<DeveloperCard {developer} ref={data.ref} />
		{/each}
	</div>
</div>
