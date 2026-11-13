<!--
	Direktori Mitra Profesional — KJPP & Notaris (MITRA-01, issue omahe#1).
	Empty-state bukan skeleton: di mode API asli sebelum backend live,
	halaman ini jujur "belum ada mitra" (fixture hanya dev).

	2026-10-08: tab "Semua" dipisah PER KATEGORI (section berjudul per
	kategori, urut chip master; Agen Omahe tetap paling atas) — bukan lagi
	satu grid campur. Tab "Agen Omahe" mendapat pencarian (q: nama/kantor/
	kode) + paginasi server-side (GET form tanpa JS tetap jalan; `page`
	dipakai komponen Pagination).
-->
<script lang="ts">
	import { page } from '$app/state';
	import AgenOmaheCard from '$lib/components/agen-omahe-card.svelte';
	import MitraCard from '$lib/components/mitra-card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Pagination from '$lib/components/pagination.svelte';
	import { benihBagian, CUPLIKAN_PER_BAGIAN, cuplikanAcak } from '$lib/acak-harian';
	import { formatAngka } from '$lib/utils';
	import type { PublicMitra } from '$lib/api/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// MITRA-04 — label kategori terpilih untuk empty-state per-kategori.
	const labelKategoriTerpilih = $derived(
		data.chips.find((c) => c.nilai === data.kategori)?.label ?? ''
	);

	/** 2026-10-08 — tab "Semua": kelompokkan mitra per kategori mengikuti
	 *  urutan chip (= urutan master). Kategori tanpa mitra TIDAK jadi
	 *  section (tab kategorinya sendiri yang punya empty-state); mitra
	 *  berkategori di luar chip → section "Lainnya" di akhir. */
	const kelompokSemua = $derived.by(() => {
		const perKategori = new Map<string, PublicMitra[]>();
		for (const m of data.mitra) {
			const lama = perKategori.get(m.kategori) ?? [];
			lama.push(m);
			perKategori.set(m.kategori, lama);
		}
		const chips = data.chips.filter((c) => c.nilai !== null);
		// 2026-11-14 — tiap kategori hanya CUPLIKAN_PER_BAGIAN kartu, diacak
		// harian per pengunjung (benih dari server); sisanya via "Lihat semua".
		const potong = (slug: string, isi: PublicMitra[]) =>
			cuplikanAcak(isi, CUPLIKAN_PER_BAGIAN, benihBagian(data.benihSemua, slug));
		const hasil: Array<{
			slug: string | null;
			label: string;
			mitra: PublicMitra[];
			total: number;
		}> = [];
		const terpakai = new Set<string>();
		for (const c of chips) {
			const isi = perKategori.get(c.nilai!) ?? [];
			if (isi.length === 0) continue;
			hasil.push({
				slug: c.nilai,
				label: c.label,
				mitra: potong(c.nilai!, isi),
				total: isi.length
			});
			terpakai.add(c.nilai!);
		}
		const sisa = data.mitra.filter((m) => !terpakai.has(m.kategori));
		if (sisa.length > 0)
			hasil.push({
				slug: null,
				label: 'Lainnya',
				mitra: potong('lainnya', sisa),
				total: sisa.length
			});
		return hasil;
	});
</script>

<svelte:head>
	<title>Mitra Profesional — Agen, KJPP, Notaris &amp; lainnya · Omahe</title>
	<meta
		name="description"
		content="Direktori agen properti Omahe dan mitra profesional — KJPP, Notaris/PPAT, dan jasa properti lain — yang membantu dari mencari rumah, penilaian harga, hingga akad jual beli."
	/>
	<meta property="og:title" content="Mitra Profesional · Omahe" />
	<meta
		property="og:description"
		content="Agen properti & mitra profesional — dari mencari rumah hingga akad jual beli."
	/>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<header class="max-w-2xl">
		<h1 class="font-display text-ink text-2xl font-extrabold sm:text-3xl">Mitra Profesional</h1>
		<p class="text-muted mt-2 leading-relaxed">
			Agen properti Omahe dan mitra profesional — KJPP, Notaris/PPAT, hingga jasa properti lainnya —
			dalam satu direktori. Dari mencari rumah, penilaian harga, sampai akad jual beli, didampingi
			profesional yang tepat.
		</p>
	</header>

	<nav class="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Filter kategori mitra">
		<!-- Urutan tab (user 2026-10-01): Semua → Agen Omahe → kategori mitra (urut master). -->
		{#each data.chips as k, i (k.label)}
			<a
				href={k.nilai ? `/mitra?kategori=${k.nilai}` : '/mitra'}
				class={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors ${
					!data.tabAgen && (data.kategori ?? null) === k.nilai
						? 'bg-primary text-white'
						: 'bg-surface text-muted hover:text-primary'
				}`}>{k.label}</a
			>
			{#if i === 0}
				<!-- AGEN-OMAHE-04 — tab agen internal Omahe (bukan kategori mitra). -->
				<a
					href="/mitra?tab=agen"
					class={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors ${
						data.tabAgen ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-primary'
					}`}>Agen Omahe</a
				>
			{/if}
		{/each}
	</nav>

	{#if data.tabAgen}
		<p class="text-muted mt-4 max-w-2xl text-sm leading-relaxed">
			Agen Omahe Premium — lencana hijau berarti identitas (KTP) sudah diverifikasi, centang biru
			berarti agen profesional. Keaslian ID card bisa dicek di profil agen. Tinggalkan kontak Anda,
			agen akan membantu mencarikan rumah yang pas.
		</p>

		<!-- 2026-10-08 — pencarian direktori agen: GET form (tanpa JS tetap
		     jalan, URL bisa dibagikan); `page` reset otomatis karena form
		     tidak membawanya. -->
		<form method="GET" action="/mitra" class="mt-4 flex max-w-xl gap-2">
			<input type="hidden" name="tab" value="agen" />
			<label for="cari-agen" class="sr-only">Cari agen</label>
			<input
				id="cari-agen"
				name="q"
				type="search"
				value={data.qAgen}
				maxlength="100"
				placeholder="Cari nama, kantor, atau kode agen…"
				class="border-line text-ink placeholder:text-muted h-11 w-full rounded-lg border bg-white px-3 text-sm"
			/>
			<Button type="submit" size="md" class="shrink-0">Cari</Button>
		</form>

		{#if data.agen.items.length === 0}
			<div class="bg-surface mt-6 rounded-2xl p-8 text-center">
				<p class="text-ink font-semibold">
					{data.qAgen ? 'Tidak ada agen yang cocok' : 'Belum ada agen yang ditampilkan'}
				</p>
				<p class="text-muted mx-auto mt-1 max-w-md text-sm leading-relaxed">
					{#if data.qAgen}
						Coba kata kunci lain — misalnya nama depan agen, nama kantor, atau kode seperti
						“OMHA-A0001”.
					{:else}
						Ingin menjadi agen Omahe? Lihat caranya di
						<a href="/gabung/agen" class="text-primary font-medium hover:underline"
							>halaman gabung agen</a
						>.
					{/if}
				</p>
			</div>
		{:else}
			<p class="text-muted mt-4 text-sm">
				{formatAngka(data.agen.total)}
				{data.agen.total === 1 ? 'agen' : 'agen'}{data.qAgen ? ` untuk “${data.qAgen}”` : ''}
			</p>
			<ul class="mt-3 grid list-none grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
				{#each data.agen.items as a (a.kodeAgen)}
					<li><AgenOmaheCard agen={a} /></li>
				{/each}
			</ul>
			<div class="mt-8">
				<Pagination
					url={page.url}
					page={data.agen.halaman}
					pageSize={data.agen.perHalaman}
					total={data.agen.total}
					basePath="/mitra"
				/>
			</div>
		{/if}
	{:else if data.mitra.length === 0 && data.kategori}
		<!-- MITRA-04 — kategori master aktif tapi belum punya mitra: tab tetap
		     tampil, berisi ajakan bergabung (bukan "direktori disiapkan"). -->
		<div class="bg-surface mt-8 rounded-2xl p-8 text-center">
			<p class="text-ink font-semibold">Belum ada mitra di kategori ini</p>
			<p class="text-muted mx-auto mt-1 max-w-md text-sm leading-relaxed">
				{labelKategoriTerpilih
					? `Kategori “${labelKategoriTerpilih}” masih menunggu profesional pertamanya.`
					: 'Kategori ini masih menunggu profesional pertamanya.'}
				Kalau Anda profesional properti, isi formulirnya dan tim kami akan menghubungi Anda.
			</p>
			<Button href="/gabung/mitra" class="mt-5">Gabung sebagai mitra</Button>
		</div>
	{:else if data.mitra.length === 0 && data.agen.items.length === 0}
		<div class="bg-surface mt-8 rounded-2xl p-8 text-center">
			<p class="text-ink font-semibold">Belum ada mitra yang ditampilkan</p>
			<p class="text-muted mx-auto mt-1 max-w-md text-sm leading-relaxed">
				Direktori mitra profesional sedang disiapkan. Kalau Anda KJPP, notaris, asuransi, pemborong,
				atau profesional properti lain yang ingin bergabung, lihat caranya di
				<a href="/gabung/mitra" class="text-primary font-medium hover:underline"
					>halaman gabung mitra</a
				>.
			</p>
		</div>
	{:else}
		<!-- 2026-10-08 — tab "Semua" DIPISAH PER KATEGORI: tiap kategori punya
		     section berjudul sendiri (urut master), Agen Omahe tetap pertama. -->
		{#if data.cuplikanAgen.length > 0}
			<section aria-labelledby="semua-agen-omahe" class="mt-8">
				{@render judulBagian('semua-agen-omahe', 'Agen Omahe', data.agen.total, '/mitra?tab=agen')}
				<ul class="mt-4 grid list-none grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{#each data.cuplikanAgen as a (a.kodeAgen)}
						<li><AgenOmaheCard agen={a} /></li>
					{/each}
				</ul>
				{@render lihatSemua(
					data.agen.total,
					data.cuplikanAgen.length,
					'agen Omahe',
					'/mitra?tab=agen'
				)}
			</section>
		{/if}
		{#each kelompokSemua as kelompok (kelompok.label)}
			{@const id = `semua-${kelompok.slug ?? 'lainnya'}`}
			{@const href = kelompok.slug ? `/mitra?kategori=${kelompok.slug}` : null}
			<section aria-labelledby={id} class="mt-10">
				{@render judulBagian(id, kelompok.label, kelompok.total, href)}
				<ul class="mt-4 grid list-none grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{#each kelompok.mitra as mitra (mitra.id)}
						<li><MitraCard {mitra} /></li>
					{/each}
				</ul>
				{#if href}
					{@render lihatSemua(kelompok.total, kelompok.mitra.length, kelompok.label, href)}
				{/if}
			</section>
		{/each}
	{/if}
</div>

<!-- 2026-11-14 — judul bagian tab "Semua": label + jumlah total + tautan
     "Lihat semua" di kanan (selalu tampil bila ada tab tujuannya). -->
{#snippet judulBagian(id: string, label: string, total: number, href: string | null)}
	<div class="flex items-baseline justify-between gap-4">
		<h2 {id} class="font-display text-ink text-lg font-bold">
			{label}
			<span class="text-muted ml-1 text-sm font-medium">({formatAngka(total)})</span>
		</h2>
		{#if href}
			<a {href} class="text-primary shrink-0 text-sm font-semibold hover:underline">Lihat semua →</a
			>
		{/if}
	</div>
{/snippet}

<!-- Tombol lebar di bawah cuplikan — supaya pengunjung sadar masih ada
     N lainnya (hanya bila memang ada yang tersembunyi). -->
{#snippet lihatSemua(total: number, tampil: number, label: string, href: string)}
	{#if total > tampil}
		<a
			{href}
			class="border-line text-primary hover:border-primary/40 hover:bg-surface mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed bg-white px-4 py-3 text-sm font-semibold transition-colors"
		>
			Lihat semua {formatAngka(total)}
			{label}
			<span class="text-muted font-normal">(+{formatAngka(total - tampil)} lainnya)</span>
			<span aria-hidden="true">→</span>
		</a>
	{/if}
{/snippet}
