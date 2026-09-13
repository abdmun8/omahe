<!--
	Tombol WhatsApp + Telepon yang WAJIB ada di setiap kartu properti
	(keputusan 2026-09-13 §Kontak langsung di card).

	Hijau WhatsApp `#25D366` dipertahankan apa adanya — itu pengenal, bukan
	pelanggaran brand Omahe. Telepon pakai outline warna primary.

	Keputusan (2026-09-13): untuk tahap awal, nomor SELALU nomor kontak
	umum Omahe (bukan per-perumahan/developer/marketing) — `nomor` default
	ke `SITE.whatsapp`/`SITE.telepon`, dan `konteks` disisipkan ke pesan
	pembuka supaya lead tetap bisa ditelusuri ke properti mana. Field
	kontak per-entitas boleh menyusul nanti kalau dibutuhkan; yang berubah
	cuma prop `nomorWhatsapp`/`nomorTelepon` dari pemanggil, bukan komponen
	ini.
-->
<script lang="ts">
	import { SITE } from '$lib/config';
	import { telUrl, waUrl } from '$lib/utils';
	import Button from './ui/button.svelte';

	let {
		konteks,
		nomorWhatsapp = SITE.whatsapp,
		nomorTelepon = SITE.telepon,
		size = 'sm',
		class: className = ''
	}: {
		/** Nama properti/developer yang ditanyakan — masuk ke pesan pembuka WA. */
		konteks: string;
		nomorWhatsapp?: string;
		nomorTelepon?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	} = $props();

	const pesan = $derived(`Halo, saya ingin tanya tentang ${konteks} yang saya lihat di Omahe.`);
</script>

<div class="flex gap-2 {className}">
	<Button
		variant="whatsapp"
		{size}
		href={waUrl(nomorWhatsapp, pesan)}
		target="_blank"
		rel="noopener"
		class="flex-1"
		aria-label="Hubungi via WhatsApp tentang {konteks}"
	>
		<svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4" aria-hidden="true">
			<path
				d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.86 9.86 0 0 0 4.74 1.21c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm5.72 14.03c-.24.67-1.4 1.28-1.93 1.32-.5.04-.96.22-3.24-.67-2.73-1.07-4.46-3.85-4.6-4.03-.13-.18-1.1-1.46-1.1-2.78 0-1.32.7-1.97.94-2.24.25-.27.54-.34.72-.34h.52c.17 0 .4-.06.62.48.24.57.8 1.98.87 2.12.07.14.12.3.02.49-.1.18-.15.29-.29.45-.14.16-.3.36-.43.48-.14.14-.29.29-.13.57.17.27.74 1.22 1.58 1.97 1.09.97 2 1.27 2.29 1.41.28.14.45.12.61-.07.17-.2.7-.82.89-1.1.18-.28.37-.23.62-.14.25.09 1.6.76 1.87.9.28.13.46.2.53.31.07.11.07.65-.17 1.32z"
			/>
		</svg>
		WhatsApp
	</Button>
	<Button
		variant="outline"
		{size}
		href={telUrl(nomorTelepon)}
		class="flex-1"
		aria-label="Telepon tentang {konteks}"
	>
		<svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" aria-hidden="true">
			<path
				d="M5 4h3.5l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L15 13l4 1.5V18a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4 7.2 2 2 0 0 1 6 5z"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linejoin="round"
			/>
		</svg>
		Telepon
	</Button>
</div>
