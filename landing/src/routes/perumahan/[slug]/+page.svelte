<script lang="ts">
	import LandingSections from '$lib/components/landing-sections.svelte';
	import LeadFormDialog from '$lib/components/lead-form-dialog.svelte';
	import PhotoPlaceholder from '$lib/components/photo-placeholder.svelte';
	import StickyCta from '$lib/components/sticky-cta.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import ContactButtons from '$lib/components/contact-buttons.svelte';
	import { SITE } from '$lib/config';
	import { amankanJsonLd } from '$lib/jsonld';
	import { ajukanUrl, withRef } from '$lib/ref';
	import { formatAngka, formatRentangHarga, formatRupiah, formatRupiahPenuh } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const p = $derived(data.perumahan);
	/** null = perumahan belum pakai section builder → render mode LEGACY. */
	const pakaiBuilder = $derived(p.sections !== null && p.sections.length > 0);
	const punyaHeroSection = $derived(p.sections?.some((s) => s.type === 'hero') ?? false);

	const hargaMulai = $derived(
		data.tipeUnit.length > 0
			? Math.min(...data.tipeUnit.map((u) => u.hargaMin ?? Infinity).filter(Number.isFinite))
			: null
	);
	const totalUnit = $derived(data.tipeUnit.reduce((sum, u) => sum + u.unitTersedia, 0));
	const fotoUtama = $derived(p.photos.find((f) => f.url !== null)?.url ?? null);

	const urlHalaman = $derived(`${SITE.url}/perumahan/${p.slug}`);

	/**
	 * Partner berbayar (MONET-03): CTA kontak (desktop + sticky) jadi
	 * "Form Minat" (lead masuk inbox perumahan via POST /public/leads,
	 * sumber='detail'), bukan WA langsung. Partner gratis tetap WA.
	 * `undefined` (respons lama tanpa MONET-01) = gratis.
	 */
	const partnerBerbayar = $derived(p.prioritas > 0);
	let formMinatTerbuka = $state(false);
	/** Opsi select tipe minat — dari daftar tipe unit di halaman ini. */
	const opsiTipe = $derived([...new Set(data.tipeUnit.map((u) => u.tipe))]);

	// JSON-LD listing — WAJIB lewat amankanJsonLd(): nama/deskripsi datang
	// dari input admin yang tidak disanitasi di backend; teks penutup tag
	// script di tengah nilai bisa memutus tag script JSON-LD saat dirender
	// (src/lib/jsonld.ts).
	const jsonLdListingAman = $derived(
		amankanJsonLd({
			'@context': 'https://schema.org',
			'@type': 'RealEstateListing',
			name: p.nama,
			url: urlHalaman,
			...(p.deskripsi ? { description: p.deskripsi } : {}),
			...(fotoUtama ? { image: fotoUtama } : {}),
			...(p.regionNama ? { address: p.regionNama } : {}),
			...(hargaMulai !== null
				? {
						offers: {
							'@type': 'AggregateOffer',
							priceCurrency: 'IDR',
							lowPrice: hargaMulai,
							offerCount: totalUnit,
							url: `${urlHalaman}#tipe-unit`,
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

	// Cermin breadcrumb visual di atas. URL-nya sengaja TANPA `?ref=` — itu
	// passthrough atribusi mitra untuk pengunjung, bukan untuk mesin pencari.
	const jsonLdBreadcrumbAman = $derived(
		amankanJsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Cari Rumah', item: `${SITE.url}/cari` },
				{ '@type': 'ListItem', position: 2, name: p.nama, item: urlHalaman }
			]
		})
	);
</script>

<svelte:head>
	<title>{p.nama}{p.regionNama ? ` — ${p.regionNama}` : ''} · Omahe</title>
	<meta
		name="description"
		content={p.deskripsi?.slice(0, 155) ??
			`${p.nama}: ${formatAngka(totalUnit)} unit tersedia mulai ${formatRupiah(hargaMulai)}.`}
	/>
	<meta property="og:title" content={p.nama} />
	{#if fotoUtama}<meta property="og:image" content={fotoUtama} />{/if}
	<!-- Tag <script> utuh lewat {@html} — Svelte 5 menolak <script> non-JS di
	     level komponen (`script_duplicate`); isinya tetap JSON yang sudah
	     di-escape (src/lib/jsonld.ts). -->
	{@html `<script type="application/ld+json">${jsonLdListingAman}</script>`}
	{@html `<script type="application/ld+json">${jsonLdBreadcrumbAman}</script>`}
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-6">
	<nav aria-label="Breadcrumb" class="text-muted text-xs">
		<a href={withRef('/cari', data.ref)} class="hover:text-primary">Cari Rumah</a>
		<span aria-hidden="true"> / </span>
		<span class="text-ink">{p.nama}</span>
	</nav>
</div>

{#if pakaiBuilder && punyaHeroSection}
	<!-- Hero datang dari section builder; jangan digandakan di sini. -->
	<div class="mx-auto max-w-6xl px-4">
		<LandingSections
			sections={p.sections!.filter((s) => s.type === 'hero')}
			slug={p.slug}
			nama={p.nama}
			ref={data.ref}
		/>
	</div>
{:else}
	<!-- Mode LEGACY / tanpa section hero — hero dibangun dari profil dasar. -->
	<div class="mx-auto max-w-6xl px-4">
		<div class="relative overflow-hidden rounded-2xl">
			{#if fotoUtama}
				<img src={fotoUtama} alt="Foto {p.nama}" class="h-64 w-full object-cover sm:h-80" />
			{:else}
				<PhotoPlaceholder class="h-64 w-full sm:h-80" />
			{/if}
			<div class="from-primary-dark/85 to-primary-dark/10 absolute inset-0 bg-gradient-to-t"></div>
			<div class="absolute inset-x-0 bottom-0 p-5 sm:p-8">
				<h1 class="font-display text-2xl font-extrabold text-white sm:text-4xl">{p.nama}</h1>
				{#if p.regionNama}
					<p class="mt-1 text-sm text-white/80">{p.regionNama}</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<div class="mx-auto max-w-6xl px-4 py-6">
	<!-- Ringkasan + CTA desktop -->
	<div
		class="border-line flex flex-col gap-4 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
	>
		<div>
			{#if p.developer}
				<p class="text-muted text-sm">
					Dikembangkan oleh
					<a
						href={withRef(`/developer/${p.developer.slug}`, data.ref)}
						class="text-primary font-semibold hover:underline">{p.developer.nama}</a
					>
				</p>
			{/if}
			<p class="text-muted mt-1 text-xs">Harga mulai</p>
			<p
				class="font-display text-primary text-2xl font-extrabold"
				title={formatRupiahPenuh(hargaMulai)}
			>
				{formatRupiah(hargaMulai)}
			</p>
			<p class="text-muted mt-1 text-xs">{formatAngka(totalUnit)} unit tersedia</p>
		</div>

		<div class="flex shrink-0 flex-col gap-2 sm:w-64">
			<Button
				variant="primary"
				size="lg"
				href={ajukanUrl(p.slug, data.ref)}
				class="hidden md:inline-flex"
			>
				Ajukan Unit Ini
			</Button>
			<ContactButtons
				konteks={p.nama}
				size="md"
				onFormMinat={partnerBerbayar ? () => (formMinatTerbuka = true) : null}
			/>
		</div>
	</div>

	<!-- Konten -->
	<div class="mt-8 space-y-10">
		{#if pakaiBuilder}
			<LandingSections
				sections={p.sections!.filter((s) => s.type !== 'hero')}
				slug={p.slug}
				nama={p.nama}
				ref={data.ref}
			/>
		{:else}
			{#if p.deskripsi}
				<section>
					<h2 class="font-display text-ink text-xl font-bold">Tentang {p.nama}</h2>
					<p class="text-muted mt-3 leading-relaxed whitespace-pre-line">{p.deskripsi}</p>
				</section>
			{/if}

			{#if p.photos.length > 0}
				<section>
					<h2 class="font-display text-ink text-xl font-bold">Galeri</h2>
					<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
						{#each p.photos as foto (foto.key)}
							{#if foto.url}
								<img
									src={foto.url}
									alt=""
									loading="lazy"
									class="h-32 w-full rounded-lg object-cover sm:h-40"
								/>
							{:else}
								<PhotoPlaceholder class="h-32 w-full rounded-lg sm:h-40" />
							{/if}
						{/each}
					</div>
				</section>
			{/if}
		{/if}

		<!--
			Daftar tipe unit. Anchor `#tipe-unit` adalah target link dari kartu
			hasil pencarian — halaman detail unit tersendiri (`/unit/:id`)
			sengaja DITUNDA (site map: foto & deskripsi cuma ada di level
			perumahan, jadi halaman unit sendiri isinya akan tipis).
		-->
		<section id="tipe-unit" class="scroll-mt-20">
			<h2 class="font-display text-ink text-xl font-bold">Tipe Unit Tersedia</h2>

			{#if data.tipeUnit.length === 0}
				<p
					class="border-line text-muted mt-3 rounded-xl border border-dashed p-8 text-center text-sm"
				>
					Tidak ada unit yang tersedia di proyek ini saat ini.
				</p>
			{:else}
				<ul class="mt-4 grid gap-3 sm:grid-cols-2">
					{#each data.tipeUnit as unit (unit.id)}
						<li
							class="border-line flex items-center justify-between gap-4 rounded-xl border bg-white p-4"
						>
							<div class="min-w-0">
								<Badge variant="accent">{unit.tipe}</Badge>
								<p
									class="font-display text-primary mt-2 text-lg font-extrabold"
									title={formatRupiahPenuh(unit.hargaMin)}
								>
									{formatRentangHarga(unit.hargaMin, unit.hargaMax)}
								</p>
								<p class="text-muted mt-1 text-xs">
									{#if unit.luasTanah !== null}LT {formatAngka(unit.luasTanah)} m²{/if}
									{#if unit.luasTanah !== null && unit.luasBangunan !== null}
										·
									{/if}
									{#if unit.luasBangunan !== null}LB {formatAngka(unit.luasBangunan)} m²{/if}
									· {formatAngka(unit.unitTersedia)} unit
								</p>
							</div>
							<Button variant="outline" href={ajukanUrl(p.slug, data.ref)} class="shrink-0">
								Ajukan
							</Button>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</div>

<StickyCta slug={p.slug} nama={p.nama} ref={data.ref} prioritas={p.prioritas} />

{#if partnerBerbayar}
	<!-- Dialog desktop/CTA kolom ringkasan — sticky-cta punya instance-nya
	     sendiri (state terpisah). Dua-duanya tak mungkin terbuka bersamaan:
	     overlay modal menutupi tombol yang satu saat yang lain terbuka. -->
	<LeadFormDialog
		bind:open={formMinatTerbuka}
		perumahanSlug={p.slug}
		namaPerumahan={p.nama}
		sumber="detail"
		ref={data.ref}
		{opsiTipe}
	/>
{/if}
