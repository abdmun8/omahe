<!--
	Badge "Promosi" — penanda perumahan/developer partner berbayar
	(MONET-01: `prioritas > 0` di response list). Dipakai di kartu
	`unit-card` (di atas thumbnail, via `unit.perumahan.prioritas`) dan
	`developer-card` (via `developer.prioritas`). `project-card` TIDAK
	memakainya — `DeveloperProject` tidak membawa field `prioritas`
	(api-contract.md §3/§MONET-01).

	Gaya sengaja BEDA dari `ui/badge.svelte` (variant default/accent/muted)
	supaya tidak tertukar dengan badge tipe/status unit: pill emas SOLID
	+ ikon sparkles. Warna `bg-accent text-ink` = kombinasi yang sama dengan
	variant accent `ui/button.svelte` pasca-audit kontras 2026-09-13 —
	5.19:1, lolos AA untuk teks normal. Latar solid (opaque) juga menjamin
	kontras itu tetap terjaga saat badge mengambang di atas foto thumbnail.
-->
<script lang="ts">
	import { cn } from '$lib/utils';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	let { size = 'sm', class: className = '' }: { size?: 'sm' | 'md'; class?: string } = $props();

	// `sm` untuk pojok thumbnail & baris badge kartu; `md` mengikuti ukuran
	// pill `ui/badge.svelte` (px-2.5 py-1 text-xs) kalau butuh lebih menonjol.
	const sizes = {
		sm: 'gap-1 px-2 py-0.5',
		md: 'gap-1.5 px-2.5 py-1'
	};
	const iconSizes = { sm: 12, md: 14 };
</script>

<span
	class={cn(
		'bg-accent text-ink inline-flex shrink-0 items-center rounded-full text-xs font-semibold whitespace-nowrap',
		sizes[size],
		className
	)}
>
	<!-- Ikon dekoratif — makna sudah disampaikan teks "Promosi". -->
	<Sparkles size={iconSizes[size]} aria-hidden="true" />
	Promosi
</span>
