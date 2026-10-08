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
		const hasil: Array<{ slug: string | null; label: string; mitra: PublicMitra[] }> = [];
		const terpakai = new Set<string>();
		for (const c of chips) {
			const isi = perKategori.get(c.nilai!) ?? [];
			if (isi.length === 0) continue;
			hasil.push({ slug: c.nilai, label: c.label, mitra: isi });
			terpakai.add(c.nilai!);
		}
		const sisa = data.mitra.filter((m) => !terpakai.has(m.kategori));
		if (sisa.length > 0) hasil.push({ slug: null, label: 'Lainnya', mitra: sisa });
		return hasil;
	});
</script>

<svelte:head>
	<title>Mitra Profesional — KJPP &amp; Notaris · Omahe</title>
	<meta
		name="description"
		content="Direktori mitra profesional properti terverifikasi: Kantor Jasa Penilai Publik (KJPP) dan Notaris/PPAT — siap membantu penilaian hingga akad jual beli Anda."
	/>
	<meta property="og:title" content="Mitra Profesional · Omahe" />
	<meta
		property="og:description"
		content="Direktori KJPP & Notaris — mitra profesional untuk penilaian dan legalitas properti Anda."
	/>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<header class="max-w-2xl">
		<h1 class="font-display text-ink text-2xl font-extrabold sm:text-3xl">Mitra Profesional</h1>
		<p class="text-muted mt-2 leading-relaxed">
			Kantor Jasa Penilai Publik (KJPP) dan Notaris/PPAT dalam satu direktori — dari penilaian harga
			hingga akad jual beli, didampingi profesional yang tepat.
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
			Agen resmi Omahe dengan keanggotaan aktif — identitasnya bisa dicek lewat tautan verifikasi.
			Tinggalkan kontak Anda, agen akan membantu mencarikan rumah yang pas.
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
		{#if data.agen.items.length > 0}
			<section aria-labelledby="semua-agen-omahe" class="mt-8">
				<div class="flex items-baseline justify-between gap-4">
					<h2 id="semua-agen-omahe" class="font-display text-ink text-lg font-bold">Agen Omahe</h2>
					<a href="/mitra?tab=agen" class="text-primary shrink-0 text-sm font-medium hover:underline"
						>Lihat semua agen</a
					>
				</div>
				<ul class="mt-4 grid list-none grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{#each data.agen.items as a (a.kodeAgen)}
						<li><AgenOmaheCard agen={a} /></li>
					{/each}
				</ul>
			</section>
		{/if}
		{#each kelompokSemua as kelompok (kelompok.label)}
			<section aria-labelledby="semua-{kelompok.slug ?? 'lainnya'}" class="mt-8">
				<h2
					id="semua-{kelompok.slug ?? 'lainnya'}"
					class="font-display text-ink text-lg font-bold"
				>
					{kelompok.label}
					<span class="text-muted ml-1 text-sm font-medium"
						>({formatAngka(kelompok.mitra.length)})</span
					>
				</h2>
				<ul class="mt-4 grid list-none grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{#each kelompok.mitra as mitra (mitra.id)}
						<li><MitraCard {mitra} /></li>
					{/each}
				</ul>
			</section>
		{/each}
	{/if}
</div>
