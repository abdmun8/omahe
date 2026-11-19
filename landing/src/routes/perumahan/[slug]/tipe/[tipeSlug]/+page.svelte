<script lang="ts">
	import GaleriLightbox from '$lib/components/galeri-lightbox.svelte';
	import BeaconKunjungan from '$lib/components/beacon-kunjungan.svelte';
	import BlokAgenPemasar from '$lib/components/blok-agen-pemasar.svelte';
	import Maximize from '@lucide/svelte/icons/maximize';
	import ContactButtons from '$lib/components/contact-buttons.svelte';
	import MinatDialog from '$lib/components/minat-dialog.svelte';
	import PetaLokasi from '$lib/components/peta-lokasi.svelte';
	import PhotoPlaceholder from '$lib/components/photo-placeholder.svelte';
	import StickyCta from '$lib/components/sticky-cta.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { SITE } from '$lib/config';
	import { amankanJsonLd } from '$lib/jsonld';
	import { renderMarkdown } from '$lib/markdown';
	import { ogImageUrl, susunPratinjauPerumahan } from '$lib/pratinjau-perumahan';
	import { ajukanUrl, withRef } from '$lib/ref';
	import {
		formatAngka,
		formatLokasi,
		formatRentangHarga,
		formatRupiah,
		formatRupiahPenuh
	} from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const p = $derived(data.detail.perumahan);
	const t = $derived(data.detail.tipe);

	/** Foto yang bisa ditampilkan (presign gagal = dilewati), urutan admin. */
	const foto = $derived(t.photos.filter((f) => f.url !== null));
	let fotoAktif = $state(0);
	// Lightbox (2026-10-02) — klik foto utama → modal + layar penuh.
	let lightboxTerbuka = $state(false);
	const fotoUrls = $derived(foto.map((f) => f.url as string));
	const fotoUtama = $derived(foto[fotoAktif]?.url ?? foto[0]?.url ?? null);

	// LEAD-02 — WhatsApp = form dulu (tipe ini jadi prefill), lalu WA ke
	// nomor perumahan.
	let formMinatTerbuka = $state(false);

	const lokasi = $derived(formatLokasi(p));
	const habis = $derived(t.unitTersedia === 0);

	/** Deskripsi & spesifikasi — Markdown tenant, SELALU lewat renderer subset
	 *  aman (`$lib/markdown` meng-escape HTML mentah; bukan `marked`). */
	const deskripsiHtml = $derived(t.deskripsi ? renderMarkdown(t.deskripsi) : null);

	const spesifikasiRingkas = $derived(
		[
			t.luasTanah !== null
				? { label: 'Luas tanah', nilai: `${formatAngka(t.luasTanah)} m²` }
				: null,
			t.luasBangunan !== null
				? { label: 'Luas bangunan', nilai: `${formatAngka(t.luasBangunan)} m²` }
				: null,
			t.kamarTidur !== null ? { label: 'Kamar tidur', nilai: formatAngka(t.kamarTidur) } : null,
			t.kamarMandi !== null ? { label: 'Kamar mandi', nilai: formatAngka(t.kamarMandi) } : null,
			t.carport !== null ? { label: 'Carport', nilai: formatAngka(t.carport) } : null
		].filter((x): x is { label: string; nilai: string } => x !== null)
	);

	const urlPerumahan = $derived(`${SITE.url}/perumahan/${p.slug}`);
	const urlHalaman = $derived(`${urlPerumahan}/tipe/${t.slug}`);
	const judul = $derived(`${t.nama} — ${p.nama}`);

	/**
	 * SHARE-02 — pratinjau tautan halaman tipe: judul "<tipe> di <nama> ·
	 * mulai Rp…", harga/stok dari tipe. Keunggulan & promo perumahan tidak
	 * ada di respons `TipeDetail` (endpoint tipe belum membawanya) → badge
	 * kosong di meta; GAMBAR OG-nya tetap lengkap karena route og.jpg
	 * fetch detail perumahan sendiri. Deskripsi meta pakai deskripsi tipe.
	 */
	const pratinjau = $derived(
		susunPratinjauPerumahan({
			perumahan: p,
			tipeUnit: [],
			ref: data.ref,
			tipe: { nama: t.nama, hargaMin: t.hargaMin, unitTersedia: t.unitTersedia },
			deskripsi: t.deskripsi
		})
	);
	/** og:image varian tipe — `?tipe=` (+`?ref=` hanya bila ref agen). */
	const urlGambarOg = $derived(ogImageUrl({ slug: p.slug, tipeSlug: t.slug, ref: data.ref }));
	const deskripsiMeta = $derived(
		pratinjau.deskripsi ||
			[
				`${t.nama} di ${p.nama}`,
				lokasi,
				t.hargaMin !== null ? `mulai ${formatRupiah(t.hargaMin)}` : null,
				habis ? 'sedang habis' : `${formatAngka(t.unitTersedia)} unit tersedia`
			]
				.filter(Boolean)
				.join(' · ')
				.slice(0, 155)
	);

	// JSON-LD — nama/teks datang dari input admin tenant: WAJIB amankanJsonLd().
	const jsonLdAman = $derived(
		amankanJsonLd({
			'@context': 'https://schema.org',
			'@type': 'RealEstateListing',
			name: judul,
			url: urlHalaman,
			...(fotoUtama ? { image: fotoUtama } : {}),
			...(lokasi ? { address: lokasi } : {}),
			...(t.hargaMin !== null
				? {
						offers: {
							'@type': 'Offer',
							priceCurrency: 'IDR',
							price: t.hargaMin,
							availability: habis ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
							url: urlHalaman,
							...(p.developer
								? {
										seller: {
											'@type': 'Organization',
											name: p.developer.nama,
											url: `${SITE.url}/developer/${p.developer.slug}`
										}
									}
								: {})
						}
					}
				: {})
		})
	);

	const jsonLdBreadcrumbAman = $derived(
		amankanJsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Cari Rumah', item: `${SITE.url}/cari` },
				{ '@type': 'ListItem', position: 2, name: p.nama, item: urlPerumahan },
				{ '@type': 'ListItem', position: 3, name: t.nama, item: urlHalaman }
			]
		})
	);
</script>

<svelte:head>
	<title>{judul} · Omahe</title>
	<meta name="description" content={deskripsiMeta} />
	<!-- SHARE-02 — pratinjau tautan lengkap; gambar = kartu OG varian tipe. -->
	<meta property="og:url" content={urlHalaman} />
	<meta property="og:title" content={pratinjau.judul} />
	<meta property="og:description" content={deskripsiMeta} />
	<meta property="og:image" content={urlGambarOg} />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={pratinjau.judul} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pratinjau.judul} />
	<meta name="twitter:description" content={deskripsiMeta} />
	<meta name="twitter:image" content={urlGambarOg} />
	{@html `<script type="application/ld+json">${jsonLdAman}</script>`}
	{@html `<script type="application/ld+json">${jsonLdBreadcrumbAman}</script>`}
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-6">
	<nav aria-label="Breadcrumb" class="text-muted text-xs">
		<a href={withRef('/cari', data.ref)} class="hover:text-primary">Cari Rumah</a>
		<span aria-hidden="true"> / </span>
		<a href={withRef(`/perumahan/${p.slug}`, data.ref)} class="hover:text-primary">{p.nama}</a>
		<span aria-hidden="true"> / </span>
		<span class="text-ink">{t.nama}</span>
	</nav>

	<div class="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
		<!-- Galeri khusus tipe -->
		<div>
			<div class="relative overflow-hidden rounded-2xl">
				{#if fotoUtama}
					<button
						type="button"
						class="block w-full cursor-zoom-in"
						aria-label="Perbesar foto"
						onclick={() => (lightboxTerbuka = true)}
					>
						<img
							src={fotoUtama}
							alt="Foto {t.nama} di {p.nama}"
							class="h-64 w-full object-cover sm:h-96"
						/>
					</button>
					<!-- Penanda yang terlihat: foto utama bisa dibuka penuh. -->
					<button
						type="button"
						class="bg-ink/70 hover:bg-ink/85 absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-white"
						onclick={() => (lightboxTerbuka = true)}
					>
						<Maximize class="h-4 w-4" aria-hidden="true" />
						Lihat foto penuh{foto.length > 1 ? ` (${foto.length})` : ''}
					</button>
					<GaleriLightbox
						urls={fotoUrls}
						bind:indeks={fotoAktif}
						bind:terbuka={lightboxTerbuka}
						judul="Foto {t.nama}"
					/>
				{:else}
					<PhotoPlaceholder class="h-64 w-full sm:h-96" />
				{/if}
				{#if habis}
					<span
						class="bg-ink/80 absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold text-white"
					>
						Sedang habis
					</span>
				{/if}
			</div>
			{#if foto.length > 1}
				<ul class="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6" aria-label="Galeri {t.nama}">
					{#each foto as f, i (f.key)}
						<li>
							<button
								type="button"
								onclick={() => (fotoAktif = i)}
								aria-label="Tampilkan foto {i + 1}"
								aria-current={i === fotoAktif}
								class="block w-full overflow-hidden rounded-lg ring-offset-2 {i === fotoAktif
									? 'ring-primary ring-2'
									: 'opacity-80 hover:opacity-100'}"
							>
								<img src={f.url} alt="" loading="lazy" class="h-16 w-full object-cover sm:h-20" />
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<!-- Ringkasan + CTA -->
		<aside class="border-line h-fit rounded-xl border bg-white p-5 lg:sticky lg:top-20">
			<Badge variant="accent">{t.nama}</Badge>
			<h1 class="font-display text-ink mt-2 text-2xl font-extrabold">{p.nama}</h1>
			{#if p.developer}
				<p class="text-muted mt-1 text-sm">
					Dikembangkan oleh
					<a
						href={withRef(`/developer/${p.developer.slug}`, data.ref)}
						class="text-primary font-semibold hover:underline">{p.developer.nama}</a
					>
				</p>
			{/if}
			{#if lokasi}
				<p class="text-muted mt-2 text-sm">{lokasi}</p>
			{/if}

			<p class="text-muted mt-4 text-xs">Harga</p>
			<p
				class="font-display text-primary text-2xl font-extrabold"
				title={formatRupiahPenuh(t.hargaMin)}
			>
				{t.hargaMin !== null ? formatRentangHarga(t.hargaMin, t.hargaMax) : 'Hubungi kami'}
			</p>
			<p class="text-muted mt-1 text-xs">
				{habis ? 'Unit tipe ini sedang habis' : `${formatAngka(t.unitTersedia)} unit tersedia`}
			</p>

			{#if spesifikasiRingkas.length > 0}
				<dl class="border-line mt-4 grid grid-cols-2 gap-3 border-t pt-4">
					{#each spesifikasiRingkas as s (s.label)}
						<div>
							<dt class="text-muted text-xs">{s.label}</dt>
							<dd class="text-ink text-sm font-semibold">{s.nilai}</dd>
						</div>
					{/each}
				</dl>
			{/if}

			<div class="mt-5 flex flex-col gap-2">
				{#if !habis}
					<Button
						variant="primary"
						size="lg"
						href={ajukanUrl(p.slug, data.ref, t.nama)}
						class="hidden md:inline-flex"
					>
						Ajukan Unit Ini
					</Button>
				{/if}
				<ContactButtons
					konteks="{t.nama} di {p.nama}"
					entitas={p.nama}
					size="md"
					perumahanSlug={p.slug}
					onFormMinat={() => (formMinatTerbuka = true)}
				/>
			</div>
		</aside>
	</div>

	<!-- Deskripsi desain & spesifikasi (Markdown tenant) -->
	<section class="mt-10 max-w-3xl">
		<h2 class="font-display text-ink text-xl font-bold">Desain & Spesifikasi</h2>
		{#if deskripsiHtml}
			<!-- Aman: renderMarkdown meng-escape seluruh HTML mentah lebih dulu
			     dan hanya mengizinkan link http/https/mailto/tel. -->
			<div class="prose-artikel mt-3">{@html deskripsiHtml}</div>
		{:else}
			<p class="text-muted mt-3 text-sm">
				Detail desain dan spesifikasi tipe ini belum diisi pengembang. Hubungi kami untuk informasi
				lengkap.
			</p>
		{/if}
	</section>

	<!-- AGEN-OMAHE-18 — agen Premium yang memasarkan perumahan ini (hanya bila
	     ada; tanpa blok umum "Agen Omahe" di halaman tipe). -->
	{#if data.agen.length > 0}
		<div class="mt-10 max-w-3xl">
			<BlokAgenPemasar
				agen={data.agen}
				ref={data.ref}
				perumahanSlug={p.slug}
				namaPerumahan={p.nama}
				opsiTipe={[t.nama]}
			/>
		</div>
	{/if}

	<!-- LOKASI-03 — peta dari data perumahan (tidak ada builder di halaman ini). -->
	{#if p.mapsEmbedUrl}
		<div class="mt-10 max-w-3xl">
			<PetaLokasi
				address={lokasi}
				mapsEmbedUrl={p.mapsEmbedUrl}
				directionsUrl={p.directionsUrl ?? null}
			/>
		</div>
	{/if}

	<div class="mt-10">
		<a
			href={withRef(`/perumahan/${p.slug}#tipe-unit`, data.ref)}
			class="text-primary text-sm font-semibold hover:underline"
		>
			← Lihat tipe lain di {p.nama}
		</a>
	</div>
</div>

{#if !habis}
	<StickyCta
		slug={p.slug}
		nama="{t.nama} di {p.nama}"
		namaPerumahan={p.nama}
		tipeMinatAwal={t.nama}
		tipeAjukan={t.nama}
		ref={data.ref}
	/>
{/if}

<!-- SESI-OMAHE-01 — MinatDialog memilih varian (agen aktif → dialog
     "Daftarkan Pembeli"; selain itu LeadFormDialog lama, tipe ini jadi
     prefill, ref dari URL ikut terkirim). -->
<MinatDialog
	bind:open={formMinatTerbuka}
	perumahanSlug={p.slug}
	namaPerumahan={p.nama}
	sumber="detail"
	tipeMinatAwal={t.nama}
	ref={data.ref}
/>

<!-- ANALITIK-01 — kunjungan tipe dihitung ke perumahannya. -->
<BeaconKunjungan slug={p.slug} />
