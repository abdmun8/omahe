<!--
	Centang biru "Agen Profesional Terverifikasi" (AGEN-OMAHE-07,
	api-contract §30). Ditempel tepat setelah nama agen. Hanya dirender
	pemanggil bila `profesional === true` dari API (backend sudah
	memperhitungkan membership aktif). Perilaku popover: `badge-lencana`.
-->
<script lang="ts">
	import BadgeLencana from './badge-lencana.svelte';

	let { class: kelas = '' }: { class?: string } = $props();
</script>

<BadgeLencana
	warna="#1D9BF0"
	judul="Agen Profesional Terverifikasi"
	label="Agen Profesional Terverifikasi — diverifikasi tim Omahe"
	isi="Kompetensi & pengalaman agen ini sudah diverifikasi langsung oleh tim Omahe."
	href="/gabung/agen#profesional"
	class={kelas}
/>
