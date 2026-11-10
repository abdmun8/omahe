<script lang="ts">
	import '../app.css';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { SITE } from '$lib/config';
	import { trackPageView } from '$lib/analytics';
	import { amankanJsonLd } from '$lib/jsonld';
	import { normalisasiNomor } from '$lib/utils';
	import { muatSesiAgen } from '$lib/sesi-agen.svelte';
	import SiteFooter from '$lib/components/site-footer.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import MusikLatar from '$lib/components/musik-latar.svelte';
	import BannerAplikasi from '$lib/components/banner-aplikasi.svelte';

	let { children } = $props();

	// SESI-OMAHE-01 — cek sesi agen Omahe DI BROWSER setelah hydrate, SEKALI
	// per muat halaman penuh (onMount layout root; layout persisten antar
	// navigasi klien — bukan tiap navigasi). Proxy /api/saya meneruskan cookie
	// ke backend; TANPA cookie session proxy tidak menyentuh backend sama
	// sekali, jadi pengunjung anonim tidak menambah beban. Cookie TIDAK
	// PERNAH dibaca di `load` halaman — halaman publik tetap anonim &
	// ter-cache (epic §Desain teknis); logika `ref` di +layout.ts tak tersentuh.
	onMount(() => {
		void muatSesiAgen();
	});

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
			slogan: page.data.teks?.tagline ?? SITE.tagline,
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
	<!-- PWA (PLAY-01): manifest dibaca Bubblewrap untuk aplikasi Play Store (TWA). -->
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
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
	<!-- Banner pasang aplikasi Android (tampil setelah hydrate saja). -->
	<BannerAplikasi />
	<SiteHeader />
	<main id="konten" class="flex-1">
		{@render children()}
	</main>
	<SiteFooter />
	<!-- ADMIN-07 — musik latar: komponen sendiri yang cek /api/musik
	     (tidak tampil apa pun bila superadmin tidak mengaktifkan). -->
	<MusikLatar />
</div>
