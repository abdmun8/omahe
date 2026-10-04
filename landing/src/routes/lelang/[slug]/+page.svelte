<!--
	LELANG-01 — detail rumah lelang: galeri, nilai limit & uang jaminan,
	jadwal (lelang + batas setor jaminan), bank & cabang, penyelenggara, kode
	lot/link resmi, kotak info pembeli + disclaimer. CTA "Tanya via WhatsApp"
	= form minat dulu, lalu WA ke kontak Omahe. Lewat tanggal → "Lelang
	selesai" (CTA dimatikan).
-->
<script lang="ts">
	import { page } from '$app/state';
	import GaleriLightbox from '$lib/components/galeri-lightbox.svelte';
	import LelangMinatDialog from '$lib/components/lelang-minat-dialog.svelte';
	import PetaLokasi from '$lib/components/peta-lokasi.svelte';
	import PhotoPlaceholder from '$lib/components/photo-placeholder.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { formatJadwalLelang, LABEL_HUNIAN } from '$lib/lelang';
	import { renderMarkdown } from '$lib/markdown';
	import { withRef } from '$lib/ref';
	import { formatRupiahPenuh } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const r = $derived(data.rumah);
	const ref = $derived(page.data.ref as string | null);
	const fotoUrls = $derived(r.foto.map((f) => f.url).filter((u): u is string => u !== null));
	let indeks = $state(0);
	let terbuka = $state(false);
	let minatTerbuka = $state(false);
	const lokasi = $derived(
		[r.alamat, r.kecamatanNama, r.regionNama, r.provinsiNama].filter(Boolean).join(', ')
	);
	const deskripsiHtml = $derived(r.deskripsi ? renderMarkdown(r.deskripsi) : null);
	const fakta = $derived(
		[
			['Luas tanah', r.luasTanah ? `${r.luasTanah} m²` : null],
			['Luas bangunan', r.luasBangunan ? `${r.luasBangunan} m²` : null],
			['Kamar tidur', r.kamarTidur],
			['Kamar mandi', r.kamarMandi],
			['Sertifikat', r.sertifikat],
			['Status hunian', LABEL_HUNIAN[r.statusHunian]]
		].filter(([, v]) => v !== null && v !== undefined && v !== '') as [string, string | number][]
	);
</script>

<svelte:head>
	<title>{r.judul} — Rumah Lelang · Omahe</title>
	<meta
		name="description"
		content="Rumah lelang {r.bank.nama}: nilai limit {formatRupiahPenuh(
			r.nilaiLimit
		)}, lelang {formatJadwalLelang(r.tanggalLelang)}. {lokasi}"
	/>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-6 pb-28 md:pb-10">
	<nav class="text-muted text-xs">
		<a href={withRef('/lelang', ref)} class="hover:text-primary">Rumah Lelang</a> /
		<span class="text-ink">{r.judul}</span>
	</nav>

	{#if r.selesai}
		<div
			class="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
			role="status"
		>
			<strong>Lelang selesai.</strong> Jadwal lelang rumah ini sudah lewat. Lihat
			<a href={withRef('/lelang', ref)} class="font-semibold underline">rumah lelang lain</a>.
		</div>
	{/if}

	<div class="mt-4 grid gap-6 lg:grid-cols-[1fr_22rem]">
		<div>
			{#if fotoUrls.length > 0}
				<button
					type="button"
					class="block w-full"
					onclick={() => ((indeks = 0), (terbuka = true))}
					aria-label="Lihat foto penuh"
				>
					<img
						src={fotoUrls[0]}
						alt="Foto {r.judul}"
						class="aspect-[4/3] w-full rounded-xl object-cover"
					/>
				</button>
				{#if fotoUrls.length > 1}
					<div class="mt-2 grid grid-cols-4 gap-2">
						{#each fotoUrls.slice(1, 5) as url, i (url)}
							<button
								type="button"
								onclick={() => ((indeks = i + 1), (terbuka = true))}
								aria-label="Foto {i + 2}"
							>
								<img
									src={url}
									alt=""
									loading="lazy"
									class="aspect-[4/3] w-full rounded-lg object-cover"
								/>
							</button>
						{/each}
					</div>
				{/if}
			{:else}
				<PhotoPlaceholder class="aspect-[4/3] w-full rounded-xl" />
			{/if}

			<div class="mt-5 flex items-center gap-2"><Badge variant="accent">Lelang</Badge></div>
			<h1 class="font-display text-ink mt-2 text-2xl font-extrabold">{r.judul}</h1>
			{#if lokasi}<p class="text-muted mt-1 text-sm">{lokasi}</p>{/if}

			<!-- Ringkasan angka utama di HP (kolom samping baru muncul di bawah). -->
			<div class="bg-surface mt-4 rounded-xl p-4 lg:hidden">
				<p class="text-muted text-xs">Nilai limit</p>
				<p class="font-display text-primary text-2xl font-extrabold">
					{formatRupiahPenuh(r.nilaiLimit)}
				</p>
				<p class="text-muted mt-1 text-xs">
					Uang jaminan <span class="text-ink font-semibold">{formatRupiahPenuh(r.uangJaminan)}</span
					>
				</p>
				<p class="text-ink mt-2 text-sm font-medium">{formatJadwalLelang(r.tanggalLelang)}</p>
			</div>

			{#if fakta.length > 0}
				<dl class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
					{#each fakta as [label, nilai] (label)}
						<div class="bg-surface rounded-lg p-3">
							<dt class="text-muted text-xs">{label}</dt>
							<dd class="text-ink text-sm font-semibold">{nilai}</dd>
						</div>
					{/each}
				</dl>
			{/if}

			{#if deskripsiHtml}
				<!-- Aman: renderMarkdown meng-escape HTML mentah (subset). -->
				<div class="prose-artikel mt-6">{@html deskripsiHtml}</div>
			{/if}

			<!-- Peta lokasi (embed Google Maps tervalidasi + tombol petunjuk arah). -->
			<div class="mt-8">
				<PetaLokasi
					address={lokasi || null}
					mapsEmbedUrl={r.mapsEmbedUrl ?? null}
					directionsUrl={r.directionsUrl ?? null}
				/>
			</div>

			<section class="border-line mt-8 rounded-xl border p-4 text-sm leading-relaxed">
				<h2 class="font-display text-ink text-base font-bold">Sebelum ikut lelang</h2>
				<ul class="text-muted mt-2 list-disc space-y-1 pl-5">
					<li>
						Rumah dijual <strong>apa adanya</strong>; kunjungan lokasi belum tentu bisa dilakukan.
					</li>
					<li>Rumah bisa <strong>masih dihuni</strong> — pengosongan bisa butuh waktu.</li>
					<li>
						Penawaran minimal sebesar <strong>nilai limit</strong>; peserta wajib menyetor
						<strong>uang jaminan</strong> sebelum batas waktu (dikembalikan bila tidak menang).
					</li>
					<li>
						Biaya pembeli umumnya: bea lelang ±2% dan BPHTB 5%. Pelunasan umumnya paling lambat 5
						hari kerja setelah menang, biasanya tunai.
					</li>
				</ul>
			</section>
		</div>

		<aside class="border-line h-fit rounded-xl border bg-white p-5 lg:sticky lg:top-20">
			<p class="text-muted text-xs">Nilai limit</p>
			<p class="font-display text-primary text-2xl font-extrabold">
				{formatRupiahPenuh(r.nilaiLimit)}
			</p>
			<p class="text-muted mt-1 text-xs">
				Uang jaminan <span class="text-ink font-semibold">{formatRupiahPenuh(r.uangJaminan)}</span>
			</p>

			<dl class="mt-4 space-y-2 text-sm">
				<div>
					<dt class="text-muted text-xs">Jadwal lelang</dt>
					<dd class="text-ink font-medium">{formatJadwalLelang(r.tanggalLelang)}</dd>
				</div>
				{#if r.batasJaminan}
					<div>
						<dt class="text-muted text-xs">Batas setor jaminan</dt>
						<dd class="text-ink font-medium">{formatJadwalLelang(r.batasJaminan)}</dd>
					</div>
				{/if}
				<div>
					<dt class="text-muted text-xs">Bank penjual</dt>
					<dd class="text-ink font-medium">
						{r.bank.nama}{r.cabangBank ? ` · ${r.cabangBank}` : ''}
					</dd>
				</div>
				{#if r.penyelenggara}
					<div>
						<dt class="text-muted text-xs">Penyelenggara</dt>
						<dd class="text-ink font-medium">{r.penyelenggara}</dd>
					</div>
				{/if}
				{#if r.kodeLot}
					<div>
						<dt class="text-muted text-xs">Kode lot</dt>
						<dd class="text-ink font-medium">{r.kodeLot}</dd>
					</div>
				{/if}
			</dl>

			<div class="mt-5 hidden flex-col gap-2 md:flex">
				<Button
					variant="whatsapp"
					size="lg"
					disabled={r.selesai}
					onclick={() => (minatTerbuka = true)}
				>
					Tanya via WhatsApp
				</Button>
				{#if r.linkLelang}
					<Button variant="outline" href={r.linkLelang} target="_blank" rel="noopener noreferrer"
						>Lihat di situs lelang resmi</Button
					>
				{/if}
			</div>
			<p class="text-muted mt-4 text-xs leading-relaxed">
				Omahe bukan penyelenggara lelang. Verifikasi & daftar di penyelenggara resmi (mis.
				lelang.go.id).
			</p>
		</aside>
	</div>
</div>

<!-- CTA bawah (HP) -->
<div
	class="border-line fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
>
	<div class="mx-auto flex max-w-6xl gap-2">
		<Button
			variant="whatsapp"
			size="lg"
			class="flex-1"
			disabled={r.selesai}
			onclick={() => (minatTerbuka = true)}
		>
			Tanya via WA
		</Button>
		{#if r.linkLelang}
			<Button
				variant="outline"
				size="lg"
				class="flex-1"
				href={r.linkLelang}
				target="_blank"
				rel="noopener noreferrer">Situs lelang</Button
			>
		{/if}
	</div>
</div>

<GaleriLightbox urls={fotoUrls} bind:indeks bind:terbuka />
<LelangMinatDialog bind:open={minatTerbuka} slug={r.slug} judul={r.judul} kodeLot={r.kodeLot} />
