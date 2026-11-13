<!--
	AGEN-OMAHE-15 keputusan 5 — agen Omahe yang login mengklik "Daftarkan
	Pembeli" (tombol abu-abu) di perumahan yang BUKAN pilihan aktifnya:
	alert "belum terdaftar" + tautan ke Panel Agen → Perumahan Saya untuk
	menambahkan perumahan. Backend tetap otoritatif (403
	BELUM_PILIH_PERUMAHAN) — dialog ini hanya mencegah form sia-sia.
-->
<script lang="ts">
	import { Dialog } from 'bits-ui';
	import X from '@lucide/svelte/icons/x';
	import { PESAN_BELUM_TERDAFTAR_AGEN, sesiAgen } from '$lib/sesi-agen.svelte';
	import Button from './ui/button.svelte';

	let {
		namaPerumahan,
		open = $bindable(false)
	}: {
		namaPerumahan: string;
		open?: boolean;
	} = $props();

	const linkTambah = $derived(
		sesiAgen.agen ? `${sesiAgen.agen.panelUrl}/perumahan#pilih-perumahan` : null
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/60" />
		<Dialog.Content
			role="alertdialog"
			class="fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl sm:p-6"
		>
			<div class="flex items-start justify-between gap-4">
				<Dialog.Title class="font-display text-ink text-lg font-extrabold">
					{namaPerumahan}
				</Dialog.Title>
				<Dialog.Close
					class="text-muted hover:text-ink hover:bg-surface -mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
					aria-label="Tutup"
				>
					<X class="h-5 w-5" aria-hidden="true" />
				</Dialog.Close>
			</div>
			<Dialog.Description class="text-ink text-sm leading-relaxed">
				{PESAN_BELUM_TERDAFTAR_AGEN}
			</Dialog.Description>
			<div class="flex flex-wrap justify-end gap-2">
				<Button variant="outline" onclick={() => (open = false)}>Tutup</Button>
				{#if linkTambah}
					<Button variant="primary" href={linkTambah} target="_blank" rel="noopener">
						Tambahkan perumahan
					</Button>
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
