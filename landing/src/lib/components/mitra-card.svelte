<!--
	Kartu Mitra Profesional (MITRA-01) — KJPP & Notaris berbayar.
	Nomor kontak = nomor MITRA sendiri (api-contract.md §9): tombol WA
	memakai wa.me/62xxx + pesan pembuka menyebut direktori Omahe; Telepon
	`tel:` bila tersedia. TIDAK ada passthrough `?ref=` — mitra di luar
	rantai komisi perumahan (beda kartu properti). Logo nullable →
	fallback inisial dari nama (dua kata pertama).

	PROFIL-01 — kartu vertikal seragam: sampul 3:2 (foto, atau gradasi
	hijau bila belum ada) + logo/inisial bulat menumpang di sudut, tautan
	"Lihat profil" → `/mitra/:slug`. Kartu tetap ringkas — deskripsi
	lengkap hanya di halaman profil.
-->
<script lang="ts">
	import Badge from './ui/badge.svelte';
	import type { PublicMitra } from '$lib/api/types';
	import { labelKategoriDari } from '$lib/mitra';

	let { mitra }: { mitra: PublicMitra } = $props();

	// omahe#3 — label kategori dinamis: kategori baru dari backend (MITRA-02)
	// otomatis dapat label manis, bukan hardcode KJPP/Notaris.
	const labelKategori = $derived(labelKategoriDari(mitra));
	/** Inisial fallback: huruf pertama dua kata pertama nama (kapital). */
	const inisial = $derived(
		mitra.nama
			.split(/\s+/)
			.filter((k) => /[a-zA-Z]/.test(k[0] ?? ''))
			.slice(0, 2)
			.map((k) => k[0]?.toUpperCase())
			.join('') || 'M'
	);
	const pesanWa = $derived(
		`Halo, saya melihat ${mitra.nama} di direktori Mitra Profesional Omahe dan ingin bertanya.`
	);
	const urlProfil = $derived(`/mitra/${mitra.slug}`);
</script>

<!--
	Tombol WA + Telepon (pola kartu lama). `penuh` = tombol membagi lebar
	baris di SEMUA ukuran (kartu bersampul, vertikal); false = menyusut ke
	isi sendiri di `sm:` ke atas (kartu lama, horizontal).
-->
{#snippet kontak(penuh: boolean)}
	<a
		href="https://wa.me/{mitra.whatsapp}?text={encodeURIComponent(pesanWa)}"
		target="_blank"
		rel="noopener"
		class="bg-whatsapp text-ink inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-[filter] hover:brightness-95 {penuh
			? 'flex-1'
			: 'flex-1 sm:flex-none'}"
	>
		<svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4" aria-hidden="true">
			<path
				d="M12.04 2a9.9 9.9 0 0 0-8.42 15.13L2 22l4.98-1.55A9.9 9.9 0 1 0 12.04 2Zm5.77 14.06c-.24.68-1.4 1.3-1.93 1.35-.53.05-1.02.24-3.45-.72-2.93-1.16-4.75-4.2-4.9-4.4-.14-.2-1.15-1.54-1.15-2.94 0-1.4.72-2.08.98-2.36.26-.29.56-.36.75-.36h.53c.17 0 .4-.06.62.48.24.58.8 1.98.87 2.13.07.14.12.31.02.5-.1.2-.15.32-.29.5l-.44.48c-.15.14-.3.3-.13.6.17.29.75 1.24 1.6 2 1.1.98 2.02 1.29 2.31 1.44.29.14.46.12.63-.07.17-.2.73-.85.93-1.14.19-.29.39-.24.65-.15.27.1 1.67.79 1.96.93.29.15.48.22.55.34.07.12.07.7-.17 1.38Z"
			/>
		</svg>
		WhatsApp
	</a>
	{#if mitra.telepon}
		<a
			href="tel:+{mitra.telepon}"
			class="bg-surface text-primary inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors hover:brightness-95 {penuh
				? 'flex-1'
				: 'flex-1 sm:flex-none'}"
		>
			<svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" aria-hidden="true">
				<path
					d="M4 5c0-1.1.9-2 2-2h2.2c.9 0 1.7.6 1.9 1.5l.7 2.6c.2.7 0 1.5-.6 2l-1.1 1a13.5 13.5 0 0 0 5.8 5.7l1-1.1c.5-.6 1.3-.8 2-.6l2.6.7c.9.2 1.5 1 1.5 1.9V19c0 1.1-.9 2-2 2h-1C10.6 21 3 13.4 3 6V5Z"
					stroke="currentColor"
					stroke-width="1.7"
				/>
			</svg>
			Telepon
		</a>
	{/if}
{/snippet}

<!--
	PROFIL-01 — SATU tata letak vertikal untuk semua mitra (grid rapi,
	tinggi kartu seragam): sampul 3:2 = foto bila ada, selain itu blok
	gradasi hijau (pola kartu agen); logo/inisial bulat menumpang di sudut.
-->
<article
	class="border-line flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-white"
>
	<div class="relative">
		{#if mitra.fotoUrl}
			<img
				src={mitra.fotoUrl}
				alt="Foto {mitra.nama}"
				width="1200"
				height="800"
				loading="lazy"
				decoding="async"
				class="aspect-[3/2] w-full object-cover"
			/>
		{:else}
			<div
				class="from-primary-light to-primary-dark aspect-[3/2] w-full bg-gradient-to-br"
				aria-hidden="true"
			></div>
		{/if}
		{#if mitra.logoUrl}
			<img
				src={mitra.logoUrl}
				alt="Logo {mitra.nama}"
				width="112"
				height="112"
				loading="lazy"
				decoding="async"
				class="absolute bottom-0 left-4 h-14 w-14 translate-y-1/2 rounded-full border-2 border-white bg-white object-cover shadow-sm"
			/>
		{:else}
			<span
				class="text-primary font-display absolute bottom-0 left-4 flex h-14 w-14 translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-white text-lg font-extrabold shadow-sm"
				aria-hidden="true">{inisial}</span
			>
		{/if}
	</div>

	<div class="flex flex-1 flex-col p-4 pt-10">
		<div class="flex flex-wrap items-center gap-2">
			<Badge variant="accent">{labelKategori}</Badge>
		</div>
		<h2 class="text-ink mt-1 text-sm font-semibold" title={mitra.nama}>{mitra.nama}</h2>
		<p class="text-muted mt-0.5 text-xs" title={mitra.wilayahLayanan}>{mitra.wilayahLayanan}</p>
		<a href={urlProfil} class="text-primary mt-1.5 text-xs font-semibold hover:underline">
			Lihat profil →
		</a>
		<div class="mt-auto flex flex-wrap gap-2 pt-4">
			{@render kontak(true)}
		</div>
	</div>
</article>
