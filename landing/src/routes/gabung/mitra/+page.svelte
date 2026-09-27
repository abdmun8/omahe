<!--
	Gabung — Mitra Profesional (omahe#3): KJPP, notaris/PPAT, asuransi,
	pemborong, arsitek, dan profesi pendukung properti lainnya. CTA utama =
	form pendaftaran mandiri AUTH-05 app `perumahan` (`/daftar/perusahaan`,
	SUDAH live — approval principal), BUKAN form baru di Omahe. Kategori
	direktori akan melebar menyusul (MITRA-02, repo `perumahan`).
-->
<script lang="ts">
	import { SITE } from '$lib/config';
	import { trackGabungClick } from '$lib/analytics';
	import { daftarPerusahaanUrl } from '$lib/app-url';
	import Button from '$lib/components/ui/button.svelte';

	const KEUNTUNGAN = [
		{
			judul: 'Terhubung dengan pembeli di tahap yang tepat',
			isi: 'Pembeli rumah Omahe membutuhkan penilai, notaris, asuransi, dan mitra konstruksi di titik yang berbeda — direktori mitra hadir tepat di situ.'
		},
		{
			judul: 'Akses ke perumahan dalam jaringan Omahe',
			isi: 'Kerja sama dengan perumahan yang sudah bekerja sama dengan Omahe, dari penilaian hingga akad dan pembangunan.'
		},
		{
			judul: 'Direktori yang tumbuh mengikuti profesi Anda',
			isi: 'Mulai dari KJPP dan notaris, kategori direktori terbuka untuk asuransi, pemborong, arsitek, dan profesi pendukung properti lainnya.'
		}
	] as const;
</script>

<svelte:head>
	<title>Gabung Mitra Profesional Omahe — KJPP, Notaris, &amp; Lainnya</title>
	<meta
		name="description"
		content="KJPP, notaris, asuransi, pemborong, arsitek, dan profesi properti lainnya: tampil di direktori mitra Omahe dan terhubung dengan pembeli rumah serta perumahan dalam jaringan Omahe."
	/>
	<meta property="og:title" content="Gabung Mitra Profesional Omahe" />
	<meta
		property="og:description"
		content="Tampil di direktori mitra Omahe — dari KJPP dan notaris hingga asuransi, pemborong, dan arsitek."
	/>
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<p class="font-display text-accent-dark text-sm font-semibold tracking-wide uppercase">Gabung</p>
	<h1 class="font-display text-ink mt-2 text-2xl font-bold sm:text-3xl">Mitra Profesional</h1>
	<p class="text-muted mt-3 text-sm leading-relaxed sm:text-base">
		Untuk KJPP, notaris/PPAT, asuransi, pemborong, arsitek, dan profesi pendukung properti lainnya
		yang ingin tumbuh bersama jaringan Omahe.
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
			<li>Isi formulir pendaftaran mitra — tim kami akan meninjau pengajuan Anda.</li>
			<li>Setelah disetujui, profil Anda ditautkan ke jaringan Omahe.</li>
		</ol>
		<div class="mt-4 flex flex-col gap-3 sm:flex-row">
			<Button
				variant="primary"
				href={daftarPerusahaanUrl()}
				target="_blank"
				rel="noopener"
				onclick={() => trackGabungClick('mitra')}
			>
				Daftar sebagai mitra
			</Button>
			<Button variant="outline" href="/mitra">Lihat direktori mitra</Button>
		</div>
		<p class="text-muted mt-4 text-sm">
			Ada pertanyaan dulu? Hubungi kami lewat
			<a href="/kontak" class="text-primary font-medium hover:underline">halaman kontak</a>.
		</p>
	</section>

	<div class="mt-6">
		<Button variant="ghost" href="/gabung">&larr; Kembali ke pilihan peran</Button>
	</div>
</div>
