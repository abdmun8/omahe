<!--
	Header mobile-first: nav penuh baru muncul di >=md; di bawah itu
	hamburger (keputusan 2026-09-13 §Mobile-first).
-->
<script lang="ts">
	import { page } from '$app/state';
	import { NAV } from '$lib/config';
	import { withRef } from '$lib/ref';
	import { cn } from '$lib/utils';

	let terbuka = $state(false);
	const ref = $derived(page.data.ref as string | null);

	// Tutup panel tiap kali rute berganti — tanpa ini panel menggantung
	// terbuka di halaman baru setelah klik link.
	$effect(() => {
		page.url.pathname;
		terbuka = false;
	});

	const aktif = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<header class="border-line sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
		<a href={withRef('/', ref)} class="flex items-center gap-2" aria-label="Omahe — beranda">
			<span class="font-display text-primary text-xl font-extrabold tracking-tight">
				Omahe<span class="text-accent">.</span>
			</span>
		</a>

		<nav class="ml-auto hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
			{#each NAV as item (item.href)}
				<a
					href={withRef(item.href, ref)}
					class={cn(
						'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
						aktif(item.href) ? 'bg-surface text-primary' : 'text-muted hover:text-primary'
					)}
					aria-current={aktif(item.href) ? 'page' : undefined}>{item.label}</a
				>
			{/each}
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

	{#if terbuka}
		<nav
			id="nav-mobile"
			class="border-line border-t bg-white md:hidden"
			aria-label="Navigasi utama"
		>
			<ul class="mx-auto max-w-6xl px-4 py-2">
				{#each NAV as item (item.href)}
					<li>
						<a
							href={withRef(item.href, ref)}
							class={cn(
								'block rounded-lg px-3 py-3 text-base font-medium',
								aktif(item.href) ? 'bg-surface text-primary' : 'text-ink'
							)}
							aria-current={aktif(item.href) ? 'page' : undefined}>{item.label}</a
						>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</header>
