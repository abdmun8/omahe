<!--
	Header mobile-first: nav penuh baru muncul di >=md; di bawah itu
	hamburger yang membuka SIDEBAR dari kanan (2026-11-09: menu lipat di bawah
	header menyulitkan pengguna — daftar mendorong konten & sulit ditutup).
	Sidebar dirender DI LUAR <header>: `backdrop-blur` di header membuat elemen
	`fixed` di dalamnya terkurung setinggi header.
-->
<script lang="ts">
	import { page } from '$app/state';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { NAV } from '$lib/config';
	import { withRef } from '$lib/ref';
	import { loginUrl, logoutUrl } from '$lib/app-url';
	import { sesiAgen } from '$lib/sesi-agen.svelte';
	import { cn } from '$lib/utils';

	let terbuka = $state(false);
	/** SESI-OMAHE-01 — menu dropdown chip agen (desktop). */
	let menuAgen = $state(false);
	const ref = $derived(page.data.ref as string | null);

	const urlMasuk = loginUrl();
	const agen = $derived(sesiAgen.agen);
	/** Nama pendek = kata pertama nama agen (chip header tidak muat nama panjang). */
	const namaPendek = $derived(agen ? (agen.nama.trim().split(/\s+/)[0] || agen.nama) : '');
	/** Inisial avatar: 2 huruf pertama kata-kata pertama (fallback kata pertama). */
	const inisial = $derived(
		agen
		? agen.nama
				.trim()
				.split(/\s+/)
				.slice(0, 2)
				.map((k) => k[0]?.toUpperCase() ?? '')
				.join('') || '?'
			: ''
	);
	const urlKeluar = $derived(logoutUrl(page.url.href));

	const aktif = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);

	// Tutup panel tiap kali rute berganti — tanpa ini panel menggantung
	// terbuka di halaman baru setelah klik link (menu agen ikut — URL
	// keluar panel-nya dihitung dari halaman AKTIF saat dibuka).
	$effect(() => {
		page.url.pathname;
		terbuka = false;
		menuAgen = false;
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

	// SESI-OMAHE-01 — menu agen desktop: Esc + klik di luar chip menutup.
	$effect(() => {
		if (!menuAgen) return;
		const tutupEsc = (e: KeyboardEvent) => e.key === 'Escape' && (menuAgen = false);
		const tutupKlik = (e: MouseEvent) => {
			const target = e.target instanceof Element ? e.target : null;
			if (!target || !target.closest('[data-menu-agen]')) menuAgen = false;
		};
		window.addEventListener('keydown', tutupEsc);
		window.addEventListener('click', tutupKlik);
		return () => {
			window.removeEventListener('keydown', tutupEsc);
			window.removeEventListener('click', tutupKlik);
		};
	});

	// Panel/akun di app `perumahan` (PUBLIC_BOOKING_BASE_URL); null → disembunyikan.
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
			{#if agen}
				<!-- SESI-OMAHE-01 — chip agen menggantikan tombol "Masuk": avatar
			     (foto presign / inisial) + nama pendek → menu Panel Agen &
			     Keluar (logout AUTH-11, kembali ke halaman ini). -->
				<div class="relative ml-2" data-menu-agen>
					<button
						type="button"
						class="border-line hover:border-primary/40 flex items-center gap-2 rounded-full border bg-white py-1 pr-2.5 pl-1 transition-colors"
						aria-expanded={menuAgen}
						aria-haspopup="menu"
						aria-label="Menu agen {agen.nama}"
						onclick={() => (menuAgen = !menuAgen)}
					>
						{#if agen.fotoUrl}
							<img
								src={agen.fotoUrl}
								alt=""
								class="bg-primary h-7 w-7 rounded-full object-cover"
								loading="lazy"
							/>
						{:else}
							<span
								class="bg-primary flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
								>{inisial}</span
							>
						{/if}
						<span class="text-ink max-w-[8rem] truncate text-sm font-semibold">{namaPendek}</span>
						<ChevronDown class="text-muted h-4 w-4" aria-hidden="true" />
					</button>
					{#if menuAgen}
						<div
							role="menu"
							aria-label="Menu agen"
							class="border-line absolute right-0 z-50 mt-2 w-52 rounded-xl border bg-white p-1 shadow-lg"
						>
							<a
								role="menuitem"
								href={agen.panelUrl}
								class="text-ink hover:bg-surface block rounded-lg px-3 py-2 text-sm font-medium"
								>Panel Agen</a
							>
							{#if urlKeluar}
								<a
									role="menuitem"
									href={urlKeluar}
									class="text-muted hover:bg-surface block rounded-lg px-3 py-2 text-sm font-medium"
									>Keluar</a
								>
							{/if}
						</div>
					{/if}
				</div>
			{:else if urlMasuk}
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
		{#if agen}
			<!-- SESI-OMAHE-01 — drawer mobile: blok agen menggantikan "Masuk". -->
			<div class="border-line border-t p-3">
				<div class="mb-2 flex items-center gap-2 px-1">
					{#if agen.fotoUrl}
						<img
							src={agen.fotoUrl}
							alt=""
							class="bg-primary h-8 w-8 rounded-full object-cover"
							loading="lazy"
						/>
					{:else}
						<span
							class="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
							>{inisial}</span
						>
					{/if}
					<div class="min-w-0">
						<p class="text-ink truncate text-sm font-semibold">{namaPendek}</p>
						<p class="text-muted truncate text-xs">{agen.kodeAgen}</p>
					</div>
				</div>
				<a
					href={agen.panelUrl}
					class="bg-primary hover:bg-primary-dark mb-2 block rounded-lg px-3 py-2.5 text-center text-[15px] font-semibold text-white"
					>Panel Agen</a
				>
				{#if urlKeluar}
					<a
						href={urlKeluar}
						class="border-line text-muted hover:bg-surface block rounded-lg border px-3 py-2.5 text-center text-[15px] font-medium"
						>Keluar</a
					>
				{/if}
			</div>
		{:else if urlMasuk}
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
