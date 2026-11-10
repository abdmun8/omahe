<!--
	Pemilih dialog minat SESI-OMAHE-01 — TITIK TUNGGAL varian tombol → dialog:

	  - `sesiAgen.agen` ada (agen Omahe aktif) → `agen-lead-dialog` dialog
	    "Daftarkan Pembeli" (input lead atas nama pembeli, AGEN-OMAHE-11);
	  - selain itu (anonim / sesi non-agen / belum selesai memuat) →
	    `lead-form-dialog` LAMA apa adanya — markup & perilaku tidak berubah.

	Dipakai semua titik CTA perumahan (kartu unit, kartu proyek, sticky CTA,
	detail perumahan/tipe). Cabang reaktif: saat sesi agen mati di tengah
	dialog (401 → `setSesiAgenNull`), dialog agen ter-ganti form minat
	biasa dengan status terbuka yang sama — "Lanjut lewat WhatsApp" di
	dialog agen memakai transisi ini.
-->
<script lang="ts">
	import type { LeadSumber } from '$lib/api/types';
	import { sesiAgen } from '$lib/sesi-agen.svelte';
	import AgenLeadDialog from './agen-lead-dialog.svelte';
	import LeadFormDialog from './lead-form-dialog.svelte';

	let {
		perumahanSlug,
		namaPerumahan,
		sumber,
		ref = null,
		tipeMinatAwal = '',
		opsiTipe = null,
		open = $bindable(false)
	}: {
		perumahanSlug: string;
		namaPerumahan: string;
		sumber: LeadSumber;
		ref?: string | null;
		tipeMinatAwal?: string;
		opsiTipe?: string[] | null;
		open?: boolean;
	} = $props();
</script>

{#if sesiAgen.agen}
	<!-- Varian agen — TANPA `ref` (atribusi dari sesi, epic §Desain teknis). -->
	<AgenLeadDialog bind:open {perumahanSlug} {namaPerumahan} tipeAwal={tipeMinatAwal} {opsiTipe} />
{:else}
	<LeadFormDialog
		bind:open
		{perumahanSlug}
		{namaPerumahan}
		{sumber}
		{ref}
		{tipeMinatAwal}
		{opsiTipe}
	/>
{/if}
