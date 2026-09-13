<!--
	Tombol dasar. Dipakai sebagai <button> maupun <a> (kirim `href`) supaya
	CTA navigasi tetap jadi link sungguhan — bisa dibuka di tab baru,
	terbaca screen reader sebagai link, dan `?ref=` di href-nya ikut tersalin
	kalau pengunjung copy-link.
-->
<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'whatsapp';
	type Size = 'sm' | 'md' | 'lg';

	let {
		variant = 'primary',
		size = 'md',
		href = undefined,
		class: className = '',
		children,
		...rest
	}: {
		variant?: Variant;
		size?: Size;
		href?: string;
		class?: string;
		children: Snippet;
	} & HTMLButtonAttributes &
		HTMLAnchorAttributes = $props();

	const variants: Record<Variant, string> = {
		primary: 'bg-primary text-white hover:bg-primary-light',
		accent: 'bg-accent text-white hover:bg-accent-dark',
		outline: 'border border-primary/25 text-primary bg-white hover:bg-surface',
		ghost: 'text-primary hover:bg-surface',
		whatsapp: 'bg-whatsapp text-white hover:brightness-95'
	};

	const sizes: Record<Size, string> = {
		// min-h 44px di semua ukuran — target sentuh mobile-first.
		sm: 'h-11 px-3 text-sm gap-1.5',
		md: 'h-11 px-4 text-sm gap-2',
		lg: 'h-12 px-6 text-base gap-2'
	};

	const classes = $derived(
		cn(
			'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
			variants[variant],
			sizes[size],
			className
		)
	);
</script>

{#if href}
	<a {href} class={classes} {...rest}>{@render children()}</a>
{:else}
	<button class={classes} {...rest}>{@render children()}</button>
{/if}
