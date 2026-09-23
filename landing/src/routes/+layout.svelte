<script lang="ts">
	import '../app.css';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { SITE } from '$lib/config';
	import { trackPageView } from '$lib/analytics';
	import { amankanJsonLd } from '$lib/jsonld';
	import { normalisasiNomor } from '$lib/utils';
	import SiteFooter from '$lib/components/site-footer.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';

	let { children } = $props();

	// Identitas situs untuk mesin pencari. Wajib lewat amankanJsonLd() sebelum
	// {@html} — satu jalur escape untuk SEMUA JSON-LD, supaya saat nanti ada
	// JSON-LD lain yang membawa teks admin, tidak ada yang lupa (src/lib/jsonld.ts).
	// ADMIN-05 — kontak dari API (layout server), fallback config.
	const telepon = $derived(page.data.kontak?.telepon ?? SITE.telepon);
	const email = $derived(page.data.kontak?.email ?? SITE.email);
	const jsonLdOrgAman = $derived(
		amankanJsonLd({
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
				telephone: `+${normalisasiNomor(telepon)}`,
				email
			}
		})
	);

	// Pageview manual di setiap navigasi — afterNavigate JUGA jalan di initial
	// load, makanya config GA di bawah sengaja `send_page_view: false` (anti
	// double-count). page_path = pathname SAJA (tanpa query): passthrough
	// ?ref= tetap utuh di page_location, tapi `ref` tidak dilaporkan sebagai
	// dimensi di sini — eksplisit hanya di event terkait (src/lib/analytics.ts).
	// Sumber pathname = `page` ($app/state): pasca-navigasi pasti sudah halaman
	// baru, dan tidak peduli varian Navigation mana yang datang.
	afterNavigate(() => {
		trackPageView(page.url.pathname, document.title);
	});
</script>

<svelte:head>
	<link rel="icon" href="/omahe-logo.jpeg" />
	<meta property="og:site_name" content={SITE.nama} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="id_ID" />
	<link rel="canonical" href={`${SITE.url}${page.url.pathname}`} />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="Artikel Omahe"
		href={`${SITE.url}/rss.xml`}
	/>
	<!--
		JSON-LD Organization. Tag <script>-nya ikut disuntik lewat {@html}
		karena Svelte 5 menganggap <script> apa pun jenisnya di level komponen
		sebagai script komponen (error `script_duplicate`) — isinya TETAP
		JSON yang sudah di-escape (`amankanJsonLd`, src/lib/jsonld.ts).
	-->
	{@html `<script type="application/ld+json">${jsonLdOrgAman}</script>`}
	{#if import.meta.env.PROD}
		<!--
			GA4 — dimuat HANYA di production: import.meta.env.PROD diganti statis
			saat build, jadi di dev kondisinya false dan localhost tidak pernah
			mengirim data. Pola {@html} satu tag penuh seperti JSON-LD di atas
			(bukan <script>{@html}</script> — error `script_duplicate` di Svelte 5).
		-->
		{@html `<script async src="https://www.googletagmanager.com/gtag/js?id=${SITE.gaMeasurementId}"></script>`}
		<!--
			Inisialisasi standar gtag.js; `send_page_view: false` karena pageview
			dikirim manual lewat afterNavigate di atas.
		-->
		{@html `<script>
			window.dataLayer = window.dataLayer || [];
			function gtag() { window.dataLayer.push(arguments); }
			gtag('js', new Date());
			gtag('config', '${SITE.gaMeasurementId}', { send_page_view: false });
		</script>`}
	{/if}
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
