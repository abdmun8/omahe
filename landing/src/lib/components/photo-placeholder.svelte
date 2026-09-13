<!--
	Placeholder foto — dipakai saat `fotoUrl` null (presign gagal, atau data
	fixture). Gradien + ikon rumah, pola yang sama dengan mockup visual.
	Bukan <img> kosong: `alt` yang menggantung lebih buruk buat screen reader
	daripada blok dekoratif yang jujur.
-->
<script lang="ts">
	import { cn } from '$lib/utils';
	let { class: className = '' }: { class?: string } = $props();
</script>

<div
	class={cn(
		'from-primary-light/20 via-surface to-accent-light/30 flex items-center justify-center bg-gradient-to-br',
		className
	)}
	aria-hidden="true"
>
	<svg viewBox="0 0 24 24" fill="none" class="text-primary/25 h-10 w-10">
		<path
			d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1V10.5z"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linejoin="round"
		/>
	</svg>
</div>
