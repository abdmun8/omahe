<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		variant = 'default',
		class: className = '',
		children
	}: { variant?: 'default' | 'accent' | 'muted'; class?: string; children: Snippet } = $props();

	const variants = {
		default: 'bg-primary/8 text-primary',
		accent: 'bg-accent-light/50 text-accent-dark',
		muted: 'bg-surface text-muted'
	};
</script>

<span
	class={cn(
		'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
		variants[variant],
		className
	)}>{@render children()}</span
>
