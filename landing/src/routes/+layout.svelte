<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { SITE } from '$lib/config';
	import SiteFooter from '$lib/components/site-footer.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/omahe-logo.jpeg" />
	<meta property="og:site_name" content={SITE.nama} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="id_ID" />
	<link rel="canonical" href={`${SITE.url}${page.url.pathname}`} />
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<a
		href="#konten"
		class="focus:bg-primary sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2 focus:text-white"
	>
		Lewati ke konten
	</a>
	<SiteHeader />
	<main id="konten" class="flex-1">
		{@render children()}
	</main>
	<SiteFooter />
</div>
