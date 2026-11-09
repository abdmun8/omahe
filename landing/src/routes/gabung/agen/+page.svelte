<!--
	Gabung — Agen Omahe (omahe#3). AGEN-OMAHE-10: pendaftaran kini
	MANDIRI — CTA utama "Daftar Agen Sekarang — gratis" ke form
	`/daftar/agen` app panel (alur WA AUTH-08: cukup nomor WhatsApp, langsung
	aktif, Rp0). `?sponsor=OMHA-A…` (link referral agen, BUKAN `ref` pembeli)
	disimpan 90 hari (`src/lib/sponsor-tersimpan.ts`) — dibaca HANYA di
	browser via `$effect` supaya HTML SSR/cache edge tetap anonim (sponsor
	pengguna A tidak boleh membeku di cache lalu disajikan ke pengguna B);
	tautan SSR tanpa sponsor lalu diperbarui pasca-hidrasi. Punya perumahan
	sendiri → /gabung/perumahan (alur agen properti, AUTH-05).
-->
<script lang="ts">
	import { page } from '$app/state';
	import BadgeProfesional from '$lib/components/badge-profesional.svelte';
	import { SITE } from '$lib/config';
	import { trackGabungClick } from '$lib/analytics';
	import ContactButtons from '$lib/components/contact-buttons.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { daftarAgenUrl } from '$lib/app-url';
	import { sponsorEfektif } from '$lib/sponsor-tersimpan';

	// Sponsor efektif — `null` saat SSR/prerender (tautan anonim, lihat
	// komentar file atas); terisi di browser: `?sponsor=` URL (LAST-TOUCH,
	// sekaligus disimpan 90 hari) atau nilai tersimpan dari kunjungan lalu.
	let sponsor = $state<string | null>(null);

	$effect(() => {
		sponsor = sponsorEfektif(page.url.searchParams.get('sponsor'));
	});

	const hrefDaftar = $derived(daftarAgenUrl(sponsor));

	const KEUNTUNGAN = [
		{
			judul: 'Gratis & langsung aktif',
			isi: 'Tanpa biaya bergabung. Begitu daftar, Anda mendapat kode agen dan ID card ber-QR yang bisa diverifikasi publik — identitas Anda lebih dipercaya calon pembeli.'
		},
		{
			judul: 'Komisi penjualan',
			isi: 'Komisi dihitung dari harga jual saat pembeli yang Anda daftarkan akad — estimasinya tampil di panel agen Anda.'
		},
		{
			judul: 'Banyak perumahan sekaligus',
			isi: 'Pasarkan perumahan yang tampil di Omahe — tanpa perlu perjanjian terpisah dengan tiap pengembang.'
		},
		{
			judul: 'Calon pembeli jadi referral Anda',
			isi: 'Data nasabah yang Anda input dan tautan referral Anda tercatat sebagai atribusi — pembeli yang Anda bawa tetap milik Anda.'
		}
	] as const;
</script>

<svelte:head>
	<title>Jadi Agen Omahe — Gratis, Langsung Aktif, Banyak Perumahan</title>
	<meta
		name="description"
		content="Jual rumah dari banyak pengembang dalam satu jaringan: daftar gratis lewat WhatsApp, langsung aktif, ID card terverifikasi, komisi saat akad, dan calon pembeli Anda tercatat atas nama Anda."
	/>
	<meta property="og:title" content="Jadi Agen Omahe" />
	<meta
		property="og:description"
		content="Daftar gratis, langsung aktif, dan pasarkan banyak perumahan dalam satu jaringan Omahe."
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
	<a
		href={hrefDaftar}
		class="bg-primary hover:bg-primary-dark focus-visible:ring-primary/50 mt-5 inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
		onclick={() => trackGabungClick('agen-daftar')}
	>
		Daftar Agen Sekarang — gratis
	</a>

	<ul class="mt-8 list-none space-y-4">
		{#each KEUNTUNGAN as k (k.judul)}
			<li class="border-line rounded-2xl border bg-white p-5">
				<h2 class="font-display text-ink text-base font-bold">{k.judul}</h2>
				<p class="text-muted mt-2 text-sm leading-relaxed">{k.isi}</p>
			</li>
		{/each}
	</ul>

	<!-- AGEN-OMAHE-07 — penjelasan centang biru (tujuan tautan "Apa artinya?"). -->
	<section
		id="profesional"
		class="border-line mt-8 scroll-mt-24 rounded-2xl border bg-white p-6 sm:p-8"
	>
		<h2 class="font-display text-ink flex items-center gap-2 text-lg font-bold">
			Centang biru <BadgeProfesional /> Agen Profesional
		</h2>
		<p class="text-muted mt-2 text-sm leading-relaxed">
			Centang biru menandakan agen Omahe yang kompetensi &amp; pengalamannya sudah diverifikasi
			langsung oleh tim Omahe. Tanda ini hanya tampil selama keanggotaan agen aktif, dan bisa
			dicabut bila agen tidak lagi memenuhi standar kami. Setiap agen Omahe tetap merupakan
			<span class="text-ink font-medium">agen resmi</span> — keaslian ID card bisa dicek lewat kodenya.
		</p>
	</section>

	<section id="daftar" class="border-line mt-8 scroll-mt-24 rounded-2xl border bg-white p-6 sm:p-8">
		<h2 class="font-display text-ink text-lg font-bold">Cara bergabung</h2>
		<p class="text-muted mt-2 text-sm leading-relaxed">
			Daftar langsung dari HP Anda — <span class="text-ink font-medium">gratis Rp0</span>, tanpa
			mengumpulkan dokumen, dan akun Anda <span class="text-ink font-medium">langsung aktif</span>:
			cukup nomor WhatsApp yang bisa terima pesan. Setelah daftar Anda langsung masuk ke panel agen
			dan mendapat kode agen untuk mulai memasarkan perumahan Omahe.
		</p>
		<div class="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
			<a
				href={hrefDaftar}
				class="bg-primary hover:bg-primary-dark focus-visible:ring-primary/50 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
				onclick={() => trackGabungClick('agen-daftar')}
			>
				Daftar Agen Sekarang — gratis
			</a>
			{#if sponsor}
				<p class="text-muted text-sm">
					Kode sponsor: <span class="text-ink font-semibold tracking-wide">{sponsor}</span>
				</p>
			{/if}
		</div>
		<p class="text-muted mt-4 text-sm leading-relaxed">
			Masih ingin tanya dulu? Tim kami siap membantu:
		</p>
		<div class="mt-3">
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
		Program agen Omahe sedang disiapkan bertahap — rincian keanggotaan dan skema komisi akan
		dikonfirmasi tim Omahe seiring tersedianya data penjualan. Informasi di halaman ini belum
		mengikat sebagai penawaran.
	</p>

	<div class="mt-6">
		<Button variant="ghost" href="/gabung">&larr; Kembali ke pilihan peran</Button>
	</div>
</div>
