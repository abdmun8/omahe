<!--
	LELANG-01/03 — daftar rumah lelang (dipakai /lelang & /lelang/lokasi/:slug).
	Filter lokasi = kabupaten yang BENAR-BENAR punya rumah lelang (urut area
	prioritas superadmin). Form GET ke /lelang; server mengalihkan ?lokasi=
	ke URL ramah SEO /lelang/lokasi/:slug (bank & nilai limit tetap query).

	2026-10-08 — nilai limit bisa DIKETIK SENDIRI (min & maks, rupiah);
	non-digit di-strip di input supaya URL tetap angka polos (preset chip
	lama diganti penuh). Tanpa JS tetap jalan (form GET murni).
-->
<script lang="ts">
	import LelangCard from '$lib/components/lelang-card.svelte';
	import Pagination from '$lib/components/pagination.svelte';
	import { formatAngka } from '$lib/utils';
	import type { LokasiLelang, Paginated, RumahLelangKartu } from '$lib/api/types';

	let {
		hasil,
		lokasi,
		bank,
		query,
		lokasiAktif,
		ref,
		url,
		basePath
	}: {
		hasil: Paginated<RumahLelangKartu>;
		lokasi: LokasiLelang[];
		bank: { id: string; nama: string }[];
		query: { bankId?: string; limitMin?: number; limitMax?: number };
		lokasiAktif: { slug: string; nama: string } | null;
		ref: string | null;
		url: URL;
		basePath: string;
	} = $props();

	/** Rupiah ketik sendiri — hanya digit (titik/spasi di-strip live,
	 *  pola `angkaPositif` server juga toleran non-digit). */
	function maskDigit(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		input.value = input.value.replace(/\D/g, '').slice(0, 15);
	}
</script>

<form method="GET" action="/lelang" class="mt-6 grid gap-3 sm:grid-cols-5">
	{#if ref}<input type="hidden" name="ref" value={ref} />{/if}
	<select
		name="lokasi"
		aria-label="Lokasi"
		class="border-line h-11 rounded-lg border bg-white px-3 text-sm"
	>
		<option value="">Semua lokasi</option>
		{#each lokasi as l (l.slug)}
			<option value={l.slug} selected={lokasiAktif?.slug === l.slug}>{l.nama} ({l.jumlah})</option>
		{/each}
		{#if lokasiAktif && !lokasi.some((l) => l.slug === lokasiAktif.slug)}
			<option value={lokasiAktif.slug} selected>{lokasiAktif.nama}</option>
		{/if}
	</select>
	<select
		name="bankId"
		aria-label="Bank"
		class="border-line h-11 rounded-lg border bg-white px-3 text-sm"
	>
		<option value="">Semua bank</option>
		{#each bank as b (b.id)}
			<option value={b.id} selected={query.bankId === b.id}>{b.nama}</option>
		{/each}
	</select>
	<label for="lelang-limit-min" class="sr-only">Nilai limit minimum</label>
	<input
		id="lelang-limit-min"
		name="limitMin"
		type="text"
		inputmode="numeric"
		placeholder="Limit min. (Rp)"
		value={query.limitMin ?? ''}
		oninput={maskDigit}
		class="border-line h-11 rounded-lg border bg-white px-3 text-sm"
	/>
	<label for="lelang-limit-maks" class="sr-only">Nilai limit maksimum</label>
	<input
		id="lelang-limit-maks"
		name="limitMax"
		type="text"
		inputmode="numeric"
		placeholder="Limit maks. (Rp)"
		value={query.limitMax ?? ''}
		oninput={maskDigit}
		class="border-line h-11 rounded-lg border bg-white px-3 text-sm"
	/>
	<button type="submit" class="bg-primary h-11 rounded-lg px-4 text-sm font-semibold text-white"
		>Terapkan</button
	>
</form>

<p class="text-muted mt-6 text-sm">{formatAngka(hasil.meta.total)} rumah lelang</p>

{#if hasil.items.length === 0}
	<div class="border-line mt-4 rounded-xl border border-dashed p-10 text-center">
		<p class="font-display text-ink text-base font-bold">Belum ada rumah lelang yang cocok</p>
		<p class="text-muted mx-auto mt-2 max-w-sm text-sm">
			Coba longgarkan filter, atau kembali lagi nanti — jadwal lelang diperbarui berkala.
		</p>
	</div>
{:else}
	<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each hasil.items as rumah (rumah.slug)}
			<LelangCard {rumah} {ref} />
		{/each}
	</div>
	<div class="mt-8">
		<Pagination
			{url}
			page={hasil.meta.page}
			pageSize={hasil.meta.pageSize}
			total={hasil.meta.total}
			{basePath}
		/>
	</div>
{/if}

<p class="text-muted mt-10 text-xs leading-relaxed">
	Omahe bukan penyelenggara lelang. Informasi berasal dari bank/penyelenggara dan dapat berubah —
	selalu verifikasi & daftar di penyelenggara resmi.
</p>
