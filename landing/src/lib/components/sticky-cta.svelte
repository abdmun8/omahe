<!--
	Sticky bottom bar di halaman detail perumahan (keputusan §Mobile-first) —
	CTA utama selalu terlihat tanpa menggulir balik ke atas. Hanya di layar
	kecil; di desktop CTA-nya sudah menempel di hero.

	Tombol "Ajukan" WAJIB lewat `ajukanUrl()` supaya `?ref=` ikut terbawa
	balik ke app `perumahan`.

	MONET-03 (api-contract.md §8): perumahan partner BERBAYAR
	(`prioritas > 0`) → CTA kontaknya "Minat" (emas). LEAD-02: perumahan
	gratis tetap bertombol "WhatsApp", tapi KEDUANYA membuka LeadFormDialog
	(sumber='detail') dulu, lalu WA ke nomor perumahan.
-->
<script lang="ts">
	import { ajukanUrl } from '$lib/ref';
	import { trackCtaAjukan, trackEvent } from '$lib/analytics';
	import LeadFormDialog from './lead-form-dialog.svelte';
	import Button from './ui/button.svelte';

	let {
		slug,
		nama,
		ref = null,
		prioritas = 0,
		formMinat,
		namaPerumahan = undefined,
		tipeMinatAwal = '',
		tipeAjukan = null
	}: {
		slug: string;
		nama: string;
		ref?: string | null;
		prioritas?: number;
		/** AGEN-PROPERTI-01 — paksa CTA form minat (mis. perumahan milik agen
		 *  properti); tidak diisi = aturan lama (`prioritas > 0`). */
		formMinat?: boolean;
		/** Nama perumahan untuk dialog bila `nama` berisi konteks lain
		 *  (mis. "Tipe 36 di Griya Asri" di halaman tipe). */
		namaPerumahan?: string;
		/** Prefill tipe di form (halaman tipe). */
		tipeMinatAwal?: string;
		/** UNIT-09 — tipe untuk `?tipe=` di tombol Ajukan (halaman tipe). */
		tipeAjukan?: string | null;
	} = $props();

	/** undefined (respons lama tanpa MONET-01) = gratis. */
	const partnerBerbayar = $derived(formMinat ?? prioritas > 0);
	let formMinatTerbuka = $state(false);

	// Iterasi 2 GA4: CTA "Ajukan" + klik WA dilaporkan tanpa PII — nama
	// perumahan + apakah kode referral masih menempel di URL. Tombol tetap
	// link sungguhan, tracking tidak mencegat navigasi.
	function lacakAjukan() {
		trackCtaAjukan(nama, Boolean(ref));
	}

	function lacakWhatsapp() {
		trackEvent('whatsapp_click', { perumahan: nama });
	}
</script>

<div
	class="border-line fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
>
	<div class="mx-auto flex max-w-6xl gap-2">
		{#if partnerBerbayar}
			<!-- Accent emas — kuat setara WA tapi bukan hijau WhatsApp, senada
			     badge "Promosi"; booking ("Ajukan") tetap primary. -->
			<Button variant="accent" size="lg" class="flex-1" onclick={() => (formMinatTerbuka = true)}
				>Minat</Button
			>
		{:else}
			<Button
				variant="whatsapp"
				size="lg"
				class="flex-1"
				onclick={() => {
					lacakWhatsapp();
					formMinatTerbuka = true;
				}}>WhatsApp</Button
			>
		{/if}
		<Button
			variant="primary"
			size="lg"
			class="flex-1"
			href={ajukanUrl(slug, ref, tipeAjukan)}
			onclick={lacakAjukan}>Ajukan</Button
		>
	</div>
</div>

<LeadFormDialog
	bind:open={formMinatTerbuka}
	perumahanSlug={slug}
	namaPerumahan={namaPerumahan ?? nama}
	sumber="detail"
	{tipeMinatAwal}
	{ref}
/>

<!-- Ruang kosong supaya konten terakhir halaman tidak tertutup bar di atas. -->
<div class="h-20 md:hidden" aria-hidden="true"></div>
