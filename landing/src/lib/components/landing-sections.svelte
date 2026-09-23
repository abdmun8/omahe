<!--
	Renderer `sections` dari section builder LANDING-02 (10 preset). Ini
	duplikasi sadar dari renderer React di repo `perumahan` — trade-off yang
	sudah diputuskan supaya Omahe merender sendiri halaman detailnya
	(CLAUDE.md §Arsitektur).

	Aturan yang tidak boleh dilanggar:
	- `rich_text.body` adalah PLAIN TEXT, bukan HTML. Dirender dengan
	  `whitespace-pre-line`, TIDAK PERNAH dengan {@html} — isinya diketik
	  admin perumahan dan tidak disanitasi di backend.
	- Section `enabled:false` sudah difilter di server; jangan filter ulang.
	- Target CTA selalu `/ajukan/:slug` lewat `ajukanUrl()` (bawa `?ref=`).
-->
<script lang="ts">
	import PetaLokasi from './peta-lokasi.svelte';
	import type { LandingSection } from '$lib/api/types';
	import { trackCtaAjukan } from '$lib/analytics';
	import { ajukanUrl } from '$lib/ref';
	import Button from './ui/button.svelte';
	import PhotoPlaceholder from './photo-placeholder.svelte';

	let {
		sections,
		slug,
		nama,
		ref = null
	}: { sections: LandingSection[]; slug: string; nama: string; ref?: string | null } = $props();

	// Iterasi 2 GA4: SEMUA tombol CTA ke /ajukan/:slug yang dirender section
	// builder lewat helper yang sama dengan sticky-cta (taksonomi konsisten,
	// tanpa PII). `ref` cuma jadi boolean `ada_ref` — nilainya tidak dikirim.
	function lacakCta() {
		trackCtaAjukan(nama, Boolean(ref));
	}
</script>

{#each sections as section (section.id)}
	{#if section.type === 'hero'}
		<section class="relative overflow-hidden rounded-2xl">
			{#if section.props.imageUrl}
				<img src={section.props.imageUrl} alt="" class="h-64 w-full object-cover sm:h-80" />
			{:else}
				<PhotoPlaceholder class="h-64 w-full sm:h-80" />
			{/if}
			<div class="from-primary-dark/85 to-primary-dark/10 absolute inset-0 bg-gradient-to-t"></div>
			<div class="absolute inset-x-0 bottom-0 p-5 sm:p-8">
				<h1 class="font-display text-2xl font-extrabold text-white sm:text-4xl">
					{section.props.headline}
				</h1>
				{#if section.props.subheadline}
					<p class="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
						{section.props.subheadline}
					</p>
				{/if}
				<Button
					variant="accent"
					size="lg"
					class="mt-4 hidden md:inline-flex"
					href={ajukanUrl(slug, ref)}
					onclick={lacakCta}
				>
					{section.props.ctaLabel}
				</Button>
			</div>
		</section>
	{:else if section.type === 'rich_text'}
		<section>
			{#if section.props.heading}
				<h2 class="font-display text-ink text-xl font-bold">{section.props.heading}</h2>
			{/if}
			<p class="text-muted mt-3 leading-relaxed whitespace-pre-line">{section.props.body}</p>
		</section>
	{:else if section.type === 'gallery'}
		<section>
			{#if section.props.heading}
				<h2 class="font-display text-ink text-xl font-bold">{section.props.heading}</h2>
			{/if}
			<div
				class="mt-3 {section.props.layout === 'carousel'
					? '-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2'
					: 'grid grid-cols-2 gap-3 sm:grid-cols-3'}"
			>
				{#each section.props.imageKeys as key, i (key)}
					{@const url = section.props.imageUrls[i]}
					{#if url}
						<img
							src={url}
							alt=""
							loading="lazy"
							class="h-32 rounded-lg object-cover sm:h-40 {section.props.layout === 'carousel'
								? 'w-56 shrink-0 snap-start'
								: 'w-full'}"
						/>
					{:else}
						<PhotoPlaceholder
							class="h-32 rounded-lg sm:h-40 {section.props.layout === 'carousel'
								? 'w-56 shrink-0 snap-start'
								: 'w-full'}"
						/>
					{/if}
				{/each}
			</div>
		</section>
	{:else if section.type === 'pricing'}
		<section>
			<h2 class="font-display text-ink text-xl font-bold">
				{section.props.heading ?? 'Daftar Harga'}
			</h2>
			<div class="mt-3 overflow-x-auto">
				<table class="w-full min-w-[32rem] text-left text-sm">
					<thead class="border-line text-muted border-b text-xs">
						<tr
							><th class="py-2 pr-4">Tipe</th><th class="py-2 pr-4">Luas</th><th class="py-2 pr-4"
								>Harga</th
							><th class="py-2">Catatan</th></tr
						>
					</thead>
					<tbody>
						{#each section.props.items as item (item.tipe)}
							<tr class="border-line/60 border-b">
								<td class="text-ink py-2.5 pr-4 font-medium">{item.tipe}</td>
								<td class="text-muted py-2.5 pr-4">{item.luas ?? '—'}</td>
								<td class="text-primary py-2.5 pr-4 font-semibold">{item.harga ?? '—'}</td>
								<td class="text-muted py-2.5">{item.catatan ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{:else if section.type === 'facilities'}
		<section>
			<h2 class="font-display text-ink text-xl font-bold">
				{section.props.heading ?? 'Fasilitas'}
			</h2>
			<ul class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each section.props.items as item (item.label)}
					<li class="bg-surface text-ink flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							class="text-accent-dark h-4 w-4 shrink-0"
							aria-hidden="true"
						>
							<path
								d="m5 13 4 4 10-10"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						{item.label}
					</li>
				{/each}
			</ul>
		</section>
	{:else if section.type === 'location'}
		<!-- LOKASI-03 — field kosong sudah diisi server dari data perumahan. -->
		<PetaLokasi
			heading={section.props.heading ?? 'Lokasi'}
			address={section.props.address ?? null}
			mapsEmbedUrl={section.props.mapsEmbedUrl ?? null}
			directionsUrl={section.props.directionsUrl ?? null}
		/>
	{:else if section.type === 'testimonials'}
		<section>
			<h2 class="font-display text-ink text-xl font-bold">
				{section.props.heading ?? 'Testimoni'}
			</h2>
			<div class="mt-3 grid gap-3 sm:grid-cols-2">
				{#each section.props.items as item (item.name + item.quote)}
					<figure class="border-line rounded-xl border bg-white p-4">
						<blockquote class="text-ink text-sm leading-relaxed">“{item.quote}”</blockquote>
						<figcaption class="mt-3 flex items-center gap-3">
							{#if item.imageUrl}
								<img
									src={item.imageUrl}
									alt=""
									loading="lazy"
									class="h-9 w-9 rounded-full object-cover"
								/>
							{/if}
							<div>
								<p class="text-ink text-sm font-semibold">{item.name}</p>
								{#if item.role}<p class="text-muted text-xs">{item.role}</p>{/if}
							</div>
						</figcaption>
					</figure>
				{/each}
			</div>
		</section>
	{:else if section.type === 'faq'}
		<section>
			<h2 class="font-display text-ink text-xl font-bold">
				{section.props.heading ?? 'Pertanyaan yang Sering Diajukan'}
			</h2>
			<div class="divide-line border-line mt-3 divide-y rounded-xl border bg-white">
				{#each section.props.items as item (item.q)}
					<details class="group px-4 py-3">
						<summary
							class="text-ink flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium"
						>
							{item.q}
							<svg
								viewBox="0 0 24 24"
								fill="none"
								class="text-muted h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
								aria-hidden="true"
							>
								<path
									d="m6 9 6 6 6-6"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
								/>
							</svg>
						</summary>
						<p class="text-muted mt-2 text-sm leading-relaxed whitespace-pre-line">{item.a}</p>
					</details>
				{/each}
			</div>
		</section>
	{:else if section.type === 'cta'}
		<section class="bg-primary rounded-2xl p-6 text-center sm:p-10">
			<h2 class="font-display text-xl font-extrabold text-white sm:text-2xl">
				{section.props.headline}
			</h2>
			{#if section.props.body}
				<p class="mx-auto mt-2 max-w-xl text-sm text-white/80">{section.props.body}</p>
			{/if}
			<Button
				variant="accent"
				size="lg"
				class="mt-5"
				href={ajukanUrl(slug, ref)}
				onclick={lacakCta}
			>
				{section.props.ctaLabel}
			</Button>
		</section>
	{:else if section.type === 'contact'}
		<section class="border-line bg-surface rounded-xl border p-4">
			<h2 class="font-display text-ink text-xl font-bold">{section.props.heading ?? 'Kontak'}</h2>
			<dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
				{#if section.props.whatsapp}
					<div class="flex gap-2">
						<dt class="text-muted">WhatsApp</dt>
						<dd class="text-ink font-medium">{section.props.whatsapp}</dd>
					</div>
				{/if}
				{#if section.props.phone}
					<div class="flex gap-2">
						<dt class="text-muted">Telepon</dt>
						<dd class="text-ink font-medium">{section.props.phone}</dd>
					</div>
				{/if}
				{#if section.props.email}
					<div class="flex gap-2">
						<dt class="text-muted">Email</dt>
						<dd class="text-ink font-medium">{section.props.email}</dd>
					</div>
				{/if}
				{#if section.props.hours}
					<div class="flex gap-2">
						<dt class="text-muted">Jam layanan</dt>
						<dd class="text-ink font-medium">{section.props.hours}</dd>
					</div>
				{/if}
			</dl>
		</section>
	{/if}
{/each}
