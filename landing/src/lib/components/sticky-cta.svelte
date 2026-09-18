<!--
	Sticky bottom bar di halaman detail perumahan (keputusan §Mobile-first) —
	CTA utama selalu terlihat tanpa menggulir balik ke atas. Hanya di layar
	kecil; di desktop CTA-nya sudah menempel di hero.

	Tombol "Ajukan" WAJIB lewat `ajukanUrl()` supaya `?ref=` ikut terbawa
	balik ke app `perumahan`.

	MONET-03 (api-contract.md §8): perumahan partner BERBAYAR
	(`prioritas > 0`) → CTA kontaknya "Form Minat" (buka LeadFormDialog,
	sumber='detail'), bukan WA langsung. Partner gratis tetap WhatsApp.
-->
<script lang="ts">
	import { ajukanUrl } from '$lib/ref';
	import { SITE } from '$lib/config';
	import { waUrl } from '$lib/utils';
	import LeadFormDialog from './lead-form-dialog.svelte';
	import Button from './ui/button.svelte';

	let {
		slug,
		nama,
		ref = null,
		prioritas = 0
	}: { slug: string; nama: string; ref?: string | null; prioritas?: number } = $props();

	/** undefined (respons lama tanpa MONET-01) = gratis. */
	const partnerBerbayar = $derived(prioritas > 0);
	let formMinatTerbuka = $state(false);
</script>

<div
	class="border-line fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
>
	<div class="mx-auto flex max-w-6xl gap-2">
		{#if partnerBerbayar}
			<!-- Accent emas — kuat setara WA tapi bukan hijau WhatsApp, senada
			     badge "Promosi"; booking ("Ajukan") tetap primary. -->
			<Button variant="accent" size="lg" class="flex-1" onclick={() => (formMinatTerbuka = true)}
				>Form Minat</Button
			>
		{:else}
			<Button
				variant="whatsapp"
				size="lg"
				class="flex-1"
				href={waUrl(SITE.whatsapp, `Halo, saya tertarik dengan ${nama} yang saya lihat di Omahe.`)}
				target="_blank"
				rel="noopener">WhatsApp</Button
			>
		{/if}
		<Button variant="primary" size="lg" class="flex-1" href={ajukanUrl(slug, ref)}>Ajukan</Button>
	</div>
</div>

{#if partnerBerbayar}
	<LeadFormDialog
		bind:open={formMinatTerbuka}
		perumahanSlug={slug}
		namaPerumahan={nama}
		sumber="detail"
		{ref}
	/>
{/if}

<!-- Ruang kosong supaya konten terakhir halaman tidak tertutup bar di atas. -->
<div class="h-20 md:hidden" aria-hidden="true"></div>
