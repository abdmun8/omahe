<!--
	Kartu nama digital agen Omahe (AGEN-OMAHE-05, api-contract §26) — link
	yang dibagikan agen sendiri ke calon pembeli. Aktif: hero foto lanskap
	3:2 (PROFIL-01; gradasi + inisial bila belum ada foto), nama, kode,
	kantor, WhatsApp, simpan kontak (vCard), "Tentang & Pengalaman"
	(Markdown aman), perumahan yang dipasarkan (link membawa `?ref=` KODE
	AGEN supaya booking/lead tercatat untuk agen ini). Tidak aktif:
	identitas + status saja, tanpa kontak.
-->
<script lang="ts">
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import BadgeProfesional from '$lib/components/badge-profesional.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { SITE } from '$lib/config';
	import { trackEvent } from '$lib/analytics';
	import { renderMarkdown } from '$lib/markdown';
	import { waUrl } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const k = $derived(data.kartu);
	const aktif = $derived(k.status === 'aktif');

	const inisial = $derived(
		k.nama
			.split(/\s+/)
			.filter((kata) => /[a-zA-Z]/.test(kata[0] ?? ''))
			.slice(0, 2)
			.map((kata) => kata[0]?.toUpperCase())
			.join('') || 'A'
	);
	// AGEN-OMAHE-07 — "sejak <bulan tahun>" untuk centang biru.
	const profesionalSejak = $derived(
		k.profesional && k.profesionalSejak
			? new Date(k.profesionalSejak).toLocaleDateString('id-ID', {
					month: 'long',
					year: 'numeric',
					timeZone: 'Asia/Jakarta'
				})
			: null
	);
	const berlaku = $derived(
		k.berlakuSampai
			? new Date(k.berlakuSampai).toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'long',
					year: 'numeric',
					timeZone: 'Asia/Jakarta'
				})
			: null
	);
	/** PROFIL-01 — “Tentang & Pengalaman”, Markdown aman (`$lib/markdown`,
	 *  bukan `marked`); kosong/null → bagian disembunyikan total. */
	const deskripsiHtml = $derived(k.deskripsi?.trim() ? renderMarkdown(k.deskripsi) : null);
</script>

<svelte:head>
	<title>{k.nama} — Agen Omahe {k.kodeAgen}</title>
	<meta
		name="description"
		content={`Kartu nama digital ${k.nama}, agen resmi Omahe (${k.kantorNama}).`}
	/>
	<!-- Data personal agen — dibagikan lewat link, tidak untuk diindeks. -->
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-md px-4 py-10">
	<div class="border-line overflow-hidden rounded-2xl border bg-white">
		<div class="bg-primary px-6 py-5 text-white">
			<p class="font-display text-sm font-semibold tracking-wide uppercase">Agen Omahe</p>
			<p class="text-xs opacity-80">{SITE.tagline}</p>
		</div>
		<!-- PROFIL-01 — hero foto lanskap 3:2 (menggantikan avatar bulat lama);
		     tanpa foto → gradasi hijau + inisial. `width/height` pas rasio (CLS). -->
		{#if k.fotoUrl}
			<img
				src={k.fotoUrl}
				alt={`Foto ${k.nama}`}
				width="1200"
				height="800"
				class="aspect-[3/2] w-full object-cover"
			/>
		{:else}
			<div
				class="from-primary-light to-primary-dark flex aspect-[3/2] w-full items-center justify-center bg-gradient-to-br"
				aria-hidden="true"
			>
				<span class="font-display text-5xl font-bold text-white/90">{inisial}</span>
			</div>
		{/if}
		<div class="flex flex-col items-center px-6 py-6 text-center">
			<h1 class="font-display text-ink mt-2 text-xl font-extrabold">
				{k.nama}{#if k.profesional}<BadgeProfesional class="ml-1" />{/if}
			</h1>
			{#if k.profesional}
				<p class="mt-1 text-xs font-medium text-[#1D9BF0]">
					Agen Profesional Terverifikasi Omahe{profesionalSejak
						? ` · sejak ${profesionalSejak}`
						: ''}
				</p>
			{/if}
			<p class="text-accent-dark mt-1 font-mono text-sm font-semibold">{k.kodeAgen}</p>
			<p class="text-muted text-sm">{k.kantorNama}</p>

			{#if aktif}
				<a
					href={`/verifikasi/${encodeURIComponent(k.kodeAgen)}`}
					class="text-primary mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
				>
					<ShieldCheck class="h-3.5 w-3.5" aria-hidden="true" /> Agen resmi Omahe{berlaku
						? ` · berlaku s/d ${berlaku}`
						: ''}
				</a>
				<div class="mt-5 flex w-full flex-col gap-2">
					{#if k.whatsapp}
						<Button
							variant="whatsapp"
							href={waUrl(k.whatsapp, `Halo ${k.nama}, saya dapat kartu nama Anda dari Omahe.`)}
							target="_blank"
							rel="noopener"
							onclick={() => trackEvent('kartu_nama_wa', { agen: k.kodeAgen })}
						>
							Chat WhatsApp
						</Button>
					{/if}
					<Button
						variant="outline"
						href={`/agen-omahe/${encodeURIComponent(k.kodeAgen)}/vcard`}
						onclick={() => trackEvent('kartu_nama_vcard', { agen: k.kodeAgen })}
					>
						Simpan Kontak
					</Button>
				</div>
			{:else}
				<p class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
					Agen ini sedang tidak aktif. Untuk bantuan mencari rumah, hubungi tim Omahe lewat
					<a href="/kontak" class="font-medium underline">halaman kontak</a>.
				</p>
			{/if}
		</div>

		<!-- PROFIL-01 — Tentang & Pengalaman; hanya saat deskripsi terisi
		     (profil profesional publik — tampil juga saat agen nonaktif). -->
		{#if deskripsiHtml}
			<div class="border-line border-t px-6 py-5 text-left">
				<h2 class="font-display text-ink text-sm font-bold">Tentang &amp; Pengalaman</h2>
				<!-- Aman: renderMarkdown meng-escape seluruh HTML mentah lebih dulu
				     dan hanya mengizinkan link http/https/mailto/tel. -->
				<div class="prose-artikel prose-ringkas mt-3 text-sm">{@html deskripsiHtml}</div>
			</div>
		{/if}

		{#if aktif && k.perumahan.length > 0}
			<div class="border-line border-t px-6 py-5">
				<h2 class="font-display text-ink text-sm font-bold">Perumahan yang saya pasarkan</h2>
				<ul class="mt-3 space-y-2">
					{#each k.perumahan as p (p.slug)}
						<li>
							<!-- `ref` = kode agen: booking/lead dari sini tercatat untuk agen ini. -->
							<a
								href={`/perumahan/${encodeURIComponent(p.slug)}?ref=${encodeURIComponent(p.kodeRef)}`}
								class="border-line hover:border-primary flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors"
							>
								<span class="text-ink font-medium">{p.nama}</span>
								<span class="text-primary" aria-hidden="true">&rarr;</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
