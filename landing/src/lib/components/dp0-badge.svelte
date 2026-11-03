<!--
	KOMISI-OMAHE-01 — badge "DP 0%" untuk perumahan yang ikut program Omahe
	(`programOmahe.dp0`, repo perumahan). Diletakkan di pojok KANAN atas
	thumbnail supaya tidak bertabrakan dengan badge "Promosi" (kiri atas).
	Tanda bintang + `title` = syarat & ketentuan (promo bekerja sama dengan
	bank, bukan janji tanpa syarat).
-->
<script lang="ts">
	import { cn } from '$lib/utils';

	let { syarat = '', class: className = '' }: { syarat?: string; class?: string } = $props();
</script>

<span
	class={cn(
		'bg-primary inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white',
		className
	)}
	title={syarat || 'Syarat & ketentuan berlaku'}
	data-testid="dp0-badge"
>
	DP 0%*
</span>
