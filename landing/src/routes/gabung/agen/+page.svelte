<!--
	Gabung — Agen Omahe (omahe#3). Keuntungan member sesuai model AGEN-00
	(repo `perumahan`, 2026-09-26): membership tahunan + token per
	perumahan + komisi flat per booking sukses. PENDAFTARAN MASIH MANUAL —
	kantor & anggota dibuat/disetujui superadmin (AGEN-OMAHE-01 `todo`),
	jadi CTA-nya hubungi tim Omahe, BUKAN form mandiri. Punya perumahan
	sendiri → arahkan ke /gabung/perumahan (alur agen properti, AUTH-05).
-->
<script lang="ts">
	import { SITE } from '$lib/config';
	import { trackGabungClick } from '$lib/analytics';
	import ContactButtons from '$lib/components/contact-buttons.svelte';
	import Button from '$lib/components/ui/button.svelte';

	const KEUNTUNGAN = [
		{
			judul: 'Membership Omahe',
			isi: 'Aktif tahunan dengan ID card ber-QR yang bisa diverifikasi publik — identitas agen Anda jadi lebih dipercaya calon pembeli.'
		},
		{
			judul: 'Komisi penjualan',
			isi: 'Komisi flat per perumahan, tercatat otomatis saat booking lewat referral Anda berstatus sukses.'
		},
		{
			judul: 'Banyak perumahan sekaligus',
			isi: 'Pilih perumahan Omahe yang ingin Anda pasarkan per periode — tanpa perlu perjanjian terpisah dengan tiap pengembang.'
		},
		{
			judul: 'Calon pembeli jadi referral Anda',
			isi: 'Data nasabah yang Anda input dan tautan referral Anda tercatat sebagai atribusi — pembeli yang Anda bawa tetap milik Anda.'
		}
	] as const;
</script>

<svelte:head>
	<title>Jadi Agen Omahe — Membership, Komisi, Banyak Perumahan</title>
	<meta
		name="description"
		content="Jual rumah dari banyak pengembang dalam satu jaringan: membership tahunan, ID card terverifikasi, komisi per booking sukses, dan calon pembeli Anda tercatat sebagai referral."
	/>
	<meta property="og:title" content="Jadi Agen Omahe" />
	<meta
		property="og:description"
		content="Membership, komisi penjualan, dan banyak perumahan untuk dipasarkan dalam satu jaringan Omahe."
	/>
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<p class="font-display text-accent-dark text-sm font-semibold tracking-wide uppercase">Gabung</p>
	<h1 class="font-display text-ink mt-2 text-2xl font-bold sm:text-3xl">Jadi Agen Omahe</h1>
	<p class="text-muted mt-3 text-sm leading-relaxed sm:text-base">
		Pasarkan rumah dari banyak pengembang sekaligus, dampingi calon pembeli sampai akad, dan panen
		komisinya — semua dalam satu jaringan Omahe.
	</p>

	<ul class="mt-8 list-none space-y-4">
		{#each KEUNTUNGAN as k (k.judul)}
			<li class="border-line rounded-2xl border bg-white p-5">
				<h2 class="font-display text-ink text-base font-bold">{k.judul}</h2>
				<p class="text-muted mt-2 text-sm leading-relaxed">{k.isi}</p>
			</li>
		{/each}
	</ul>

	<section class="bg-surface mt-8 rounded-2xl p-6 sm:p-8">
		<h2 class="font-display text-ink text-lg font-bold">Cara bergabung</h2>
		<p class="text-muted mt-2 text-sm leading-relaxed">
			Pendaftaran agen Omahe saat ini dibantu langsung tim kami: hubungi Omahe, kami siapkan
			kantor/keanggotaan Anda, lalu aktivasi membership dan token bisa Anda kelola sendiri.
		</p>
		<div class="mt-4">
			<ContactButtons konteks="gabung agen Omahe" size="md" />
		</div>
		<p class="text-muted mt-4 text-sm">
			Punya perumahan sendiri yang ingin dipasarkan?
			<a
				href="/gabung/perumahan"
				class="text-primary font-medium hover:underline"
				onclick={() => trackGabungClick('perumahan')}>Lihat halaman developer &amp; perumahan</a
			>.
		</p>
	</section>

	<p class="text-muted mt-6 text-xs leading-relaxed">
		Program agen Omahe sedang disiapkan bertahap — rincian keanggotaan, harga token, dan skema
		komisi akan dikonfirmasi tim Omahe saat pendaftaran. Informasi di halaman ini belum mengikat
		sebagai penawaran.
	</p>

	<div class="mt-6">
		<Button variant="ghost" href="/gabung">&larr; Kembali ke pilihan peran</Button>
	</div>
</div>
