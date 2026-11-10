<!--
	Banner "Pasang aplikasi Omahe" di atas header — Android saja, aplikasi
	belum terpasang, bukan di dalam aplikasi (TWA), belum ditutup 30 hari.
	Logika: `$lib/banner-aplikasi.ts`. Diputuskan SETELAH hydrate (onMount),
	jadi HTML server tetap sama untuk semua pengunjung (cache & SEO aman).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import X from '@lucide/svelte/icons/x';
	import { SITE } from '$lib/config';
	import { trackEvent } from '$lib/analytics';
	import {
		apakahAndroid,
		cekTerpasang,
		diDalamAplikasi,
		halamanTanpaBanner,
		hrefVarian,
		masihDitutup,
		pilihVarian,
		simpanDitutup,
		type VarianBanner
	} from '$lib/banner-aplikasi';

	let tampil = $state(false);
	// Varian dipilih sekali per muat (acak per sesi, lihat `pilihVarian`).
	let varian = $state<VarianBanner | null>(null);
	const href = $derived(varian ? hrefVarian(varian, SITE.playStoreUrl) : '#');
	const keluar = $derived(varian?.tujuan === 'play');

	function storageAman(jenis: 'local' | 'session'): Storage | null {
		try {
			return jenis === 'local' ? window.localStorage : window.sessionStorage;
		} catch {
			return null;
		}
	}

	onMount(() => {
		// Chrome bisa menawarkan pemasangan sendiri (mini-infobar) — banner ini
		// sudah menggantikannya, jangan tampil dobel.
		const tahanPromptBawaan = (e: Event) => e.preventDefault();
		window.addEventListener('beforeinstallprompt', tahanPromptBawaan);

		void (async () => {
			if (!apakahAndroid(navigator.userAgent)) return;
			const standalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
			if (
				diDalamAplikasi({
					referrer: document.referrer,
					standalone,
					storage: storageAman('session')
				})
			)
				return;
			if (masihDitutup(storageAman('local'), Date.now())) return;
			if ((await cekTerpasang(navigator as never)) === true) return;
			varian = pilihVarian(page.url.pathname, Math.random, storageAman('session'));
			tampil = true;
			trackEvent('app_banner_view', { varian: varian.id });
		})();

		return () => window.removeEventListener('beforeinstallprompt', tahanPromptBawaan);
	});

	function tutup() {
		tampil = false;
		simpanDitutup(storageAman('local'), Date.now());
		trackEvent('app_banner_dismiss', { varian: varian?.id ?? '' });
	}
</script>

{#if tampil && varian && !halamanTanpaBanner(page.url.pathname)}
	<div class="bg-surface border-line border-b" role="region" aria-label="Pasang aplikasi Omahe">
		<div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
			<button
				type="button"
				class="text-muted hover:bg-line hover:text-ink -ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors"
				aria-label="Tutup banner aplikasi"
				onclick={tutup}
			>
				<X class="h-4 w-4" aria-hidden="true" />
			</button>
			<img
				src="/pwa/icon-192.png"
				alt=""
				width="40"
				height="40"
				class="h-10 w-10 shrink-0 rounded-xl"
			/>
			<div class="min-w-0 flex-1">
				<p class="text-ink line-clamp-2 text-sm leading-snug font-semibold">{varian.judul}</p>
				<p class="text-muted truncate text-xs">{varian.sub}</p>
			</div>
			<a
				{href}
				target={keluar ? '_blank' : undefined}
				rel={keluar ? 'noopener noreferrer' : undefined}
				class="bg-primary hover:bg-primary-dark shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-colors"
				onclick={() => trackEvent('app_banner_click', { varian: varian?.id ?? '' })}
			>
				{varian.tombol}
			</a>
		</div>
	</div>
{/if}
