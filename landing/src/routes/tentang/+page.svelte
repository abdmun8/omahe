<script lang="ts">
	import { SITE } from '$lib/config';
	import Button from '$lib/components/ui/button.svelte';
</script>

<svelte:head>
	<title>Tentang Omahe</title>
	<meta
		name="description"
		content="Omahe adalah portal properti yang menghubungkan pencari rumah dengan pengembang perumahan secara langsung."
	/>
	<meta property="og:title" content="Tentang Omahe" />
	<meta
		property="og:description"
		content="Omahe adalah portal properti yang menghubungkan pencari rumah dengan pengembang perumahan secara langsung."
	/>
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<p class="font-display text-accent-dark text-sm font-semibold tracking-wide uppercase">
		{SITE.tagline}
	</p>
	<h1 class="font-display text-ink mt-2 text-2xl font-bold sm:text-3xl">Tentang Omahe</h1>

	<div class="text-muted mt-6 space-y-6 text-sm leading-relaxed">
		<p>
			Omahe adalah portal properti yang mempertemukan pencari rumah dengan pengembang perumahan
			secara langsung. Setiap unit yang tampil di sini berasal dari proyek perumahan aktif yang
			datanya dikelola pengembangnya sendiri — bukan listing perorangan dan bukan iklan yang sudah
			kedaluwarsa.
		</p>
		<div>
			<h2 class="font-display text-ink text-lg font-bold">Yang membedakan</h2>
			<ul class="mt-3 space-y-3">
				<li>
					<span class="text-ink font-medium">Data dari sumbernya.</span> Harga dan jumlah unit tersedia
					mengikuti inventori pengembang, jadi yang Anda lihat adalah yang benar-benar masih ada.
				</li>
				<li>
					<span class="text-ink font-medium">Satu alur sampai selesai.</span> Pengajuan Anda masuk langsung
					ke sistem pengembang, lengkap dengan status prosesnya — dari survei sampai akad.
				</li>
				<li>
					<span class="text-ink font-medium">Tanpa perantara tambahan.</span> Tidak ada biaya jasa dari
					sisi Omahe untuk pembeli.
				</li>
			</ul>
		</div>
		<div>
			<h2 class="font-display text-ink text-lg font-bold">Cakupan saat ini</h2>
			<p class="mt-3">
				Omahe fokus pada <span class="text-ink font-medium">rumah baru dari pengembang</span>. Rumah
				bekas (second) belum termasuk — alur verifikasi dan kepemilikannya berbeda, dan kami memilih
				mengerjakannya dengan benar ketimbang menambahkannya setengah jalan.
			</p>
		</div>
	</div>

	<div class="mt-8 flex flex-wrap gap-2">
		<Button href="/cari">Mulai Cari Rumah</Button>
		<Button variant="outline" href="/kontak">Hubungi Kami</Button>
	</div>
</div>
