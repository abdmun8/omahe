<!--
	Sticky bottom bar di halaman detail perumahan (keputusan §Mobile-first) —
	CTA utama selalu terlihat tanpa menggulir balik ke atas. Hanya di layar
	kecil; di desktop CTA-nya sudah menempel di hero.

	Tombol "Ajukan" WAJIB lewat `ajukanUrl()` supaya `?ref=` ikut terbawa
	balik ke app `perumahan`.
-->
<script lang="ts">
	import { ajukanUrl } from '$lib/ref';
	import { SITE } from '$lib/config';
	import { waUrl } from '$lib/utils';
	import Button from './ui/button.svelte';

	let { slug, nama, ref = null }: { slug: string; nama: string; ref?: string | null } = $props();
</script>

<div
	class="border-line fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
>
	<div class="mx-auto flex max-w-6xl gap-2">
		<Button
			variant="whatsapp"
			size="lg"
			class="flex-1"
			href={waUrl(SITE.whatsapp, `Halo, saya tertarik dengan ${nama} yang saya lihat di Omahe.`)}
			target="_blank"
			rel="noopener">WhatsApp</Button
		>
		<Button variant="primary" size="lg" class="flex-1" href={ajukanUrl(slug, ref)}>Ajukan</Button>
	</div>
</div>

<!-- Ruang kosong supaya konten terakhir halaman tidak tertutup bar di atas. -->
<div class="h-20 md:hidden" aria-hidden="true"></div>
