<!--
	Sticky bottom bar di halaman detail perumahan (keputusan §Mobile-first) —
	CTA utama selalu terlihat tanpa menggulir balik ke atas. Hanya di layar
	kecil; di desktop CTA-nya sudah menempel di hero.

	Tombol "Ajukan" WAJIB lewat `ajukanUrl()` supaya `?ref=` ikut terbawa
	balik ke app `perumahan`.

	MONET-03 (api-contract.md §8): dulu partner berbayar (`prioritas > 0`)
	dibedakan dengan tombol "Minat" emas — DIHAPUS 2026-10-23 (keputusan
	user): SEMUA perumahan kini bertombol "WhatsApp" yang sama (hijau),
	yang membuka LeadFormDialog (sumber='detail') dulu, lalu WA ke nomor
	perumahan. Pembeda partner berbayar tinggal badge "Promosi" di kartu.
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
		namaPerumahan = undefined,
		tipeMinatAwal = '',
		tipeAjukan = null
	}: {
		slug: string;
		nama: string;
		ref?: string | null;
		/** Nama perumahan untuk dialog bila `nama` berisi konteks lain
		 *  (mis. "Tipe 36 di Griya Asri" di halaman tipe). */
		namaPerumahan?: string;
		/** Prefill tipe di form (halaman tipe). */
		tipeMinatAwal?: string;
		/** UNIT-09 — tipe untuk `?tipe=` di tombol Ajukan (halaman tipe). */
		tipeAjukan?: string | null;
	} = $props();

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
		<!-- LEAD-02 — tombol WhatsApp pembuka form, SATU untuk semua perumahan
		     (cabang "Minat" emas partner berbayar dihapus 2026-10-23). -->
		<Button
			variant="whatsapp"
			size="lg"
			class="flex-1"
			onclick={() => {
				lacakWhatsapp();
				formMinatTerbuka = true;
			}}>WhatsApp</Button
		>
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
