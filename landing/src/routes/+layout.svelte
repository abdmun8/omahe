<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { SITE } from '$lib/config';
	import { amankanJsonLd } from '$lib/jsonld';
	import { normalisasiNomor } from '$lib/utils';
	import SiteFooter from '$lib/components/site-footer.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';

	let { children } = $props();

	// Identitas situs untuk mesin pencari. Wajib lewat amankanJsonLd() sebelum
	// {@html} — satu jalur escape untuk SEMUA JSON-LD, supaya saat nanti ada
	// JSON-LD lain yang membawa teks admin, tidak ada yang lupa (src/lib/jsonld.ts).
	const jsonLdOrgAman = amankanJsonLd({
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: SITE.nama,
		slogan: SITE.tagline,
		description: SITE.deskripsi,
		url: SITE.url,
		logo: `${SITE.url}/omahe-logo.jpeg`,
		contactPoint: {
			'@type': 'ContactPoint',
			contactType: 'customer service',
			telephone: `+${normalisasiNomor(SITE.telepon)}`,
			email: SITE.email
		}
	});
</script>

<svelte:head>
	<link rel="icon" href="/omahe-logo.jpeg" />
	<meta property="og:site_name" content={SITE.nama} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="id_ID" />
	<link rel="canonical" href={`${SITE.url}${page.url.pathname}`} />
	<link rel="alternate" type="application/rss+xml" title="Artikel Omahe" href={`${SITE.url}/rss.xml`} />
	<!--
		JSON-LD Organization. Tag <script>-nya ikut disuntik lewat {@html}
		karena Svelte 5 menganggap <script> apa pun jenisnya di level komponen
		sebagai script komponen (error `script_duplicate`) — isinya TETAP
		JSON yang sudah di-escape (`amankanJsonLd`, src/lib/jsonld.ts).
	-->
	{@html `<script type="application/ld+json">${jsonLdOrgAman}</script>`}
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
