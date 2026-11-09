<!--
	Header mobile-first: nav penuh baru muncul di >=md; di bawah itu
	hamburger yang membuka SIDEBAR dari kanan (2026-11-09: menu lipat di bawah
	header menyulitkan pengguna — daftar mendorong konten & sulit ditutup).
	Sidebar dirender DI LUAR <header>: `backdrop-blur` di header membuat elemen
	`fixed` di dalamnya terkurung setinggi header.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { NAV } from '$lib/config';
	import { withRef } from '$lib/ref';
	import { loginUrl } from '$lib/app-url';
	import { cn } from '$lib/utils';

	let terbuka = $state(false);
	const ref = $derived(page.data.ref as string | null);

	// Tutup panel tiap kali rute berganti — tanpa ini panel menggantung
	// terbuka di halaman baru setelah klik link.
	$effect(() => {
		page.url.pathname;
		terbuka = false;
	});

	// Esc menutup; body tidak ikut menggulir selama sidebar terbuka.
	$effect(() => {
		if (!terbuka) return;
		const tutupEsc = (e: KeyboardEvent) => e.key === 'Escape' && (terbuka = false);
		const semula = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		window.addEventListener('keydown', tutupEsc);
		return () => {
			document.body.style.overflow = semula;
			window.removeEventListener('keydown', tutupEsc);
		};
	});

	// Panel/akun di app `perumahan` (PUBLIC_BOOKING_BASE_URL); null → disembunyikan.
	const urlMasuk = loginUrl();

	const aktif = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<header class="border-line sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
		<a href={withRef('/', ref)} class="flex items-center gap-2" aria-label="Omahe — beranda">
			<!-- DASH — logo gambar menggantikan teks (omahe-logo.jpeg). -->
			<img
				src="/omahe-logo.jpeg"
				alt="Omahe"
				class="h-9 w-auto"
				width="36"
				height="36"
			/>
		</a>

		<nav class="ml-auto hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
			{#each NAV as item (item.href)}
				<a
					href={withRef(item.href, ref)}
					class={cn(
						'rounded-lg px-2 py-2 text-sm font-medium whitespace-nowrap transition-colors lg:px-3',
						aktif(item.href) ? 'bg-surface text-primary' : 'text-muted hover:text-primary'
					)}
					aria-current={aktif(item.href) ? 'page' : undefined}>{item.label}</a
				>
			{/each}
			{#if urlMasuk}
				<a
					href={urlMasuk}
					class="bg-primary hover:bg-primary-dark ml-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-colors"
					>Masuk</a
				>
			{/if}
		</nav>

		<button
			type="button"
			class="text-primary ml-auto inline-flex h-11 w-11 items-center justify-center rounded-lg md:hidden"
			aria-expanded={terbuka}
			aria-controls="nav-mobile"
			aria-label={terbuka ? 'Tutup menu' : 'Buka menu'}
			onclick={() => (terbuka = !terbuka)}
		>
			<svg viewBox="0 0 24 24" fill="none" class="h-6 w-6" aria-hidden="true">
				{#if terbuka}
					<path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" />
				{:else}
					<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" />
				{/if}
			</svg>
		</button>
	</div>

</header>

<!-- Sidebar mobile: selalu di DOM (transisi geser), inert saat tertutup. -->
<div class="md:hidden" inert={!terbuka}>
	<button
		type="button"
		tabindex="-1"
		aria-label="Tutup menu"
		class={cn(
			'fixed inset-0 z-50 bg-black/40 transition-opacity duration-200',
			terbuka ? 'opacity-100' : 'pointer-events-none opacity-0'
		)}
		onclick={() => (terbuka = false)}
	></button>
	<nav
		id="nav-mobile"
		aria-label="Navigasi utama"
		class={cn(
			'fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-200',
			terbuka ? 'translate-x-0' : 'translate-x-full'
		)}
	>
		<div class="border-line flex h-14 items-center justify-between border-b px-4">
			<img src="/omahe-logo.jpeg" alt="Omahe" class="h-8 w-auto" width="32" height="32" />
			<button
				type="button"
				class="text-primary inline-flex h-10 w-10 items-center justify-center rounded-lg"
				aria-label="Tutup menu"
				onclick={() => (terbuka = false)}
			>
				<svg viewBox="0 0 24 24" fill="none" class="h-6 w-6" aria-hidden="true">
					<path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" />
				</svg>
			</button>
		</div>
		<ul class="flex-1 overflow-y-auto px-3 py-2">
			{#each NAV as item (item.href)}
				<li>
					<a
						href={withRef(item.href, ref)}
						class={cn(
							'block rounded-lg px-3 py-2 text-[15px] font-medium',
							aktif(item.href) ? 'bg-surface text-primary' : 'text-ink hover:bg-surface'
						)}
						aria-current={aktif(item.href) ? 'page' : undefined}>{item.label}</a
					>
				</li>
			{/each}
		</ul>
		{#if urlMasuk}
			<div class="border-line border-t p-3">
				<a
					href={urlMasuk}
					class="bg-primary hover:bg-primary-dark block rounded-lg px-3 py-2.5 text-center text-[15px] font-semibold text-white"
					>Masuk</a
				>
			</div>
		{/if}
	</nav>
</div>
