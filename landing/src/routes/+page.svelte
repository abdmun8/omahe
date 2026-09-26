<script lang="ts">
	import { SITE } from '$lib/config';
	import { withRef } from '$lib/ref';
	import DeveloperCard from '$lib/components/developer-card.svelte';
	import SearchForm from '$lib/components/search-form.svelte';
	import SliderCarousel from '$lib/components/slider-carousel.svelte';
	import UnitCard from '$lib/components/unit-card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// ADMIN-06 — teks hero dari admin (layout server), fallback bawaan `SITE`.
	const teks = $derived(
		data.teks ?? {
			tagline: SITE.tagline,
			heroJudul: SITE.heroJudul,
			heroSubjudul: SITE.heroSubjudul
		}
	);
</script>

<svelte:head>
	<title>Omahe — Temukan Rumah Baru dari Pengembang Terpercaya</title>
	<meta name="description" content={SITE.deskripsiSingkat} />
	<meta property="og:title" content="Omahe — {teks.tagline}" />
	<meta property="og:description" content={SITE.deskripsiSingkat} />
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
</svelte:head>

<!-- Slider event/kegiatan (MONET-02) — DI ATAS hero-search, container
     sama dengan hero. `getSliders` fail-soft ke [] (api-contract.md §7):
     kosong → section ini hilang total, bukan skeleton/spinner menetap. -->
{#if data.sliders.length > 0}
	<section
		aria-label="Event & kegiatan"
		class="mx-auto max-w-6xl px-0 pt-0 pb-0 sm:px-4 sm:pt-4 sm:pb-4 lg:pt-4 lg:pb-4"
	>
		<SliderCarousel sliders={data.sliders} ref={data.ref} delayDetik={data.sliderDelayDetik} />
	</section>
{/if}

<!-- Hero + pencarian. Padding vertikal lebih ramping di mobile (default)
     supaya hero+search tidak menggerus layar pertama — sm+ tetap seperti
     semula. -->
<section class="bg-primary">
	<div class="mx-auto max-w-6xl px-4 py-8 sm:py-20">
		<p class="font-display text-accent-light text-sm font-semibold tracking-wide uppercase">
			{teks.tagline}
		</p>
		<h1 class="font-display mt-3 max-w-2xl text-2xl font-extrabold text-white sm:text-3xl">
			{teks.heroJudul}
		</h1>
		<p class="mt-4 max-w-xl text-sm text-white/80 sm:text-base">
			{teks.heroSubjudul}
		</p>

		<!-- `kompak`: di mobile form cuma satu baris + link "Filter lanjutan";
		     filter lengkap tetap ada di /cari. -->
		<div class="mt-6 rounded-2xl bg-white p-4 shadow-lg sm:mt-8 sm:p-5">
			<SearchForm regions={data.regions} ref={data.ref} kompak />
		</div>
	</div>
</section>

<!-- Unit unggulan -->
<section class="mx-auto max-w-6xl px-4 py-12">
	<div class="flex items-end justify-between gap-4">
		<div>
			<h2 class="font-display text-ink text-2xl font-bold">Pilihan Terbaru</h2>
			<p class="text-muted mt-1 text-sm">Tipe unit yang tersedia dan siap diajukan.</p>
		</div>
		<Button variant="ghost" href={withRef('/cari', data.ref)} class="shrink-0">Lihat semua</Button>
	</div>

	{#if data.unitUnggulan.length === 0}
		<p class="border-line text-muted mt-6 rounded-xl border border-dashed p-8 text-center text-sm">
			Belum ada unit yang tersedia saat ini.
		</p>
	{:else}
		<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.unitUnggulan as unit (unit.id)}
				<UnitCard {unit} ref={data.ref} source="homepage" />
			{/each}
		</div>
	{/if}
</section>

<!-- Value prop -->
<section class="bg-surface">
	<div class="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3">
		{#each [{ judul: 'Langsung dari pengembang', isi: 'Semua unit di Omahe berasal dari proyek perumahan aktif yang dikelola pengembangnya sendiri — bukan listing perorangan.' }, { judul: 'Harga apa adanya', isi: 'Harga dan jumlah unit tersedia mengikuti data inventori pengembang, bukan angka pancingan.' }, { judul: 'Ajukan dalam satu alur', isi: 'Dari halaman proyek, pengajuan Anda langsung masuk ke sistem pengembang beserta status prosesnya.' }] as item (item.judul)}
			<div>
				<h3 class="font-display text-ink text-base font-bold">{item.judul}</h3>
				<p class="text-muted mt-2 text-sm leading-relaxed">{item.isi}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Developer -->
<section class="mx-auto max-w-6xl px-4 py-12">
	<div class="flex items-end justify-between gap-4">
		<div>
			<h2 class="font-display text-ink text-2xl font-bold">Pengembang di Omahe</h2>
			<p class="text-muted mt-1 text-sm">Telusuri proyek berdasarkan perusahaan pengembangnya.</p>
		</div>
		<Button variant="ghost" href={withRef('/developer', data.ref)} class="shrink-0">
			Lihat direktori
		</Button>
	</div>

	<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.developers as developer (developer.slug)}
			<DeveloperCard {developer} ref={data.ref} />
		{/each}
	</div>
</section>

<!-- KPR -->
<section class="mx-auto max-w-6xl px-4 pb-12">
	<div
		class="border-accent-light bg-accent-light/25 flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
	>
		<div>
			<h2 class="font-display text-ink text-xl font-bold">Berapa cicilan bulanan Anda?</h2>
			<p class="text-muted mt-1 max-w-lg text-sm">
				Hitung estimasi cicilan KPR dari harga rumah, uang muka, tenor, dan suku bunga — sebelum
				bicara ke bank.
			</p>
		</div>
		<Button variant="primary" size="lg" href="/kpr" class="shrink-0">Buka Simulasi KPR</Button>
	</div>
</section>
