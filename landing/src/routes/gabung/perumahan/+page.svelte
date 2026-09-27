<!--
	Gabung — Developer & Perumahan (omahe#3). CTA utama = form pendaftaran
	mandiri AUTH-05 app `perumahan` (`/daftar/perumahan`, SUDAH live —
	developer/agen satu alur, approval principal), BUKAN form baru di Omahe.
-->
<script lang="ts">
	import { SITE } from '$lib/config';
	import { trackGabungClick } from '$lib/analytics';
	import { daftarPerumahanUrl } from '$lib/app-url';
	import Button from '$lib/components/ui/button.svelte';

	const KEUNTUNGAN = [
		{
			judul: 'Jaringan marketing yang tersebar',
			isi: 'Proyek Anda dipasarkan oleh jaringan agen Omahe dan tampil di pencarian lintas-perumahan — tanpa membangun tim marketing sendiri dari nol.'
		},
		{
			judul: 'Halaman proyek & inventori terkelola',
			isi: 'Halaman perumahan, daftar tipe unit, harga, dan ketersediaan dikelola langsung oleh Anda — data yang tampil selalu data yang benar.'
		},
		{
			judul: 'Alur booking sampai akad',
			isi: 'Pengajuan pembeli masuk ke sistem Anda lengkap dengan status prosesnya — dari survei, KPR, hingga akad — plus alur komisi referral yang sudah jadi.'
		}
	] as const;
</script>

<svelte:head>
	<title>Pasarkan Perumahan Anda di Omahe — untuk Developer &amp; Agen Properti</title>
	<meta
		name="description"
		content="Daftarkan perumahan Anda di Omahe: jaringan marketing yang tersebar, halaman proyek dan inventori terkelola, serta alur booking lengkap sampai akad."
	/>
	<meta property="og:title" content="Pasarkan Perumahan Anda di Omahe" />
	<meta
		property="og:description"
		content="Jaringan marketing Omahe, halaman proyek terkelola, dan alur booking lengkap untuk perumahan Anda."
	/>
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<p class="font-display text-accent-dark text-sm font-semibold tracking-wide uppercase">Gabung</p>
	<h1 class="font-display text-ink mt-2 text-2xl font-bold sm:text-3xl">
		Developer &amp; Perumahan
	</h1>
	<p class="text-muted mt-3 text-sm leading-relaxed sm:text-base">
		Untuk pengembang perumahan dan agen properti pembawa proyek yang ingin memperluas jangkauan
		pemasarannya.
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
		<ol class="text-muted mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed">
			<li>Isi formulir pendaftaran — tim kami akan meninjau pengajuan Anda.</li>
			<li>Setelah disetujui, login dan lengkapi profil perumahan beserta unitnya.</li>
		</ol>
		<div class="mt-4">
			<Button
				variant="primary"
				href={daftarPerumahanUrl()}
				target="_blank"
				rel="noopener"
				onclick={() => trackGabungClick('perumahan')}
			>
				Daftarkan perumahan Anda
			</Button>
		</div>
		<p class="text-muted mt-4 text-sm">
			Ingin bicara dulu dengan tim kami? Hubungi kami lewat
			<a href="/kontak" class="text-primary font-medium hover:underline">halaman kontak</a>.
		</p>
	</section>

	<div class="mt-6">
		<Button variant="ghost" href="/gabung">&larr; Kembali ke pilihan peran</Button>
	</div>
</div>
