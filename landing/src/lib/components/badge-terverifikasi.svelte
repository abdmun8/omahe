<!--
	Lencana hijau muda "Terverifikasi" (AGEN-OMAHE-16, api-contract §42) —
	identitas (KTP) agen sudah diverifikasi tim Omahe. Independen dari
	centang biru Profesional (dua badge bisa tampil bersamaan). Hanya
	dirender pemanggil bila `terverifikasi === true` dari API.
-->
<script lang="ts">
	import BadgeLencana from './badge-lencana.svelte';

	let { class: kelas = '' }: { class?: string } = $props();
</script>

<BadgeLencana
	warna="#34C77B"
	judul="Agen Terverifikasi"
	label="Agen Terverifikasi — identitas (KTP) sudah dicek tim Omahe"
	isi="Identitas (KTP) agen ini sudah diverifikasi oleh tim Omahe."
	href="/gabung/agen#terverifikasi"
	class={kelas}
/>
