<!--
	Hub Gabung Jaringan Omahe (omahe#3) — pintu masuk rekrutmen tiga audiens:
	agen Omahe (member), mitra profesional, dan developer/perumahan. Murni
	statis + prerender; CTA detail ada di sub-halaman per audiens. Link di
	sini TIDAK memakai withRef() — halaman gabung di luar rantai komisi
	perumahan (pola kontak mitra, api-contract.md §9).
-->
<script lang="ts">
	import { SITE } from '$lib/config';
	import { trackGabungClick } from '$lib/analytics';
	import Button from '$lib/components/ui/button.svelte';

	// Keuntungan per audiens — ringkasan dari sub-halaman masing-masing.
	const AUDIENS = [
		{
			slug: 'agen',
			ikon: 'users',
			judul: 'Agen Omahe',
			ringkas: 'Jual rumah dari banyak pengembang, panen komisinya.',
			keuntungan: [
				'Membership tahunan dengan ID card terverifikasi',
				'Komisi penjualan tiap booking sukses',
				'Pasarkan banyak perumahan sekaligus',
				'Calon pembeli yang Anda bawa tercatat sebagai referral Anda'
			]
		},
		{
			slug: 'mitra',
			ikon: 'briefcase',
			judul: 'Mitra Profesional',
			ringkas: 'KJPP, notaris, asuransi, pemborong, arsitek, dan lainnya.',
			keuntungan: [
				'Tampil di direktori mitra Omahe',
				'Terhubung dengan pembeli di tahap yang tepat',
				'Akses ke perumahan yang bekerja sama dengan Omahe'
			]
		},
		{
			slug: 'perumahan',
			ikon: 'building',
			judul: 'Developer & Perumahan',
			ringkas: 'Pasarkan proyek Anda lewat jaringan Omahe.',
			keuntungan: [
				'Jaringan marketing Omahe yang tersebar',
				'Halaman proyek, inventori unit, dan alur booking terkelola',
				'Pengajuan pembeli masuk lengkap dengan status prosesnya'
			]
		}
	] as const;
</script>

<svelte:head>
	<title>Gabung Jaringan Omahe — Agen, Mitra, Developer</title>
	<meta
		name="description"
		content="Tiga cara bergabung dengan Omahe: jadi agen Omahe dengan membership dan komisi, mitra profesional properti, atau daftarkan perumahan Anda."
	/>
	<meta property="og:title" content="Gabung Jaringan Omahe" />
	<meta
		property="og:description"
		content="Tiga cara bergabung dengan Omahe: agen, mitra profesional, atau developer/perumahan."
	/>
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-10">
	<header class="max-w-2xl">
		<p class="font-display text-accent-dark text-sm font-semibold tracking-wide uppercase">
			{SITE.tagline}
		</p>
		<h1 class="font-display text-ink mt-2 text-2xl font-bold sm:text-3xl">Gabung Jaringan Omahe</h1>
		<p class="text-muted mt-3 text-sm leading-relaxed sm:text-base">
			Omahe menghubungkan pencari rumah dengan pengembangnya — dan membuka tempat bagi mereka yang
			membantu prosesnya. Pilih peran Anda di bawah ini.
		</p>
	</header>

	<ul class="mt-8 grid list-none gap-4 sm:grid-cols-3">
		{#each AUDIENS as a (a.slug)}
			<li
				class="border-line flex flex-col rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md"
			>
				<span
					class="bg-primary/8 text-primary flex h-12 w-12 items-center justify-center rounded-xl"
					aria-hidden="true"
				>
					{#if a.ikon === 'users'}
						<svg viewBox="0 0 24 24" fill="none" class="h-6 w-6">
							<path
								d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 9v-1a4 4 0 0 0-3-3.85M16 2.15a4 4 0 0 1 0 7.7"
								stroke="currentColor"
								stroke-width="1.7"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{:else if a.ikon === 'briefcase'}
						<svg viewBox="0 0 24 24" fill="none" class="h-6 w-6">
							<path
								d="M20 7h-3V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM9 6h6v1H9V6ZM4 12h16M10 16h4"
								stroke="currentColor"
								stroke-width="1.7"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{:else}
						<svg viewBox="0 0 24 24" fill="none" class="h-6 w-6">
							<path
								d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"
								stroke="currentColor"
								stroke-width="1.7"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{/if}
				</span>
				<h2 class="font-display text-ink mt-4 text-lg font-bold">{a.judul}</h2>
				<p class="text-muted mt-1 text-sm leading-relaxed">{a.ringkas}</p>
				<ul class="text-muted mt-4 list-disc space-y-1.5 pl-4 text-sm leading-relaxed">
					{#each a.keuntungan as k (k)}
						<li>{k}</li>
					{/each}
				</ul>
				<div class="mt-auto pt-5">
					<Button
						variant="outline"
						href="/gabung/{a.slug}"
						class="w-full"
						onclick={() => trackGabungClick(a.slug)}
					>
						Lihat detail &amp; cara gabung
					</Button>
				</div>
			</li>
		{/each}
	</ul>

	<p class="text-muted mt-8 text-sm">
		Masih ragu peran mana yang cocok? Hubungi kami lewat
		<a href="/kontak" class="text-primary font-medium hover:underline">halaman kontak</a>.
	</p>
</div>
