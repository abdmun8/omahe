<!--
	Blok agen pemasar di detail perumahan (AGEN-OMAHE-15, 2026-11-13 —
	merevisi AGEN-OMAHE-13). Agen kini memilih perumahan SENDIRI (tombol
	"Aktifkan semua" dihapus), jadi daftar agen dikembalikan:

	  - Pengunjung lewat `?ref=AO-…` DAN daftar balikan benar-benar pemilik
	    `ref` → kartu `AgenPemasar` agen itu saja (+ form minat).
	  - Selain itu, daftar agen PREMIUM yang memilih perumahan ini (backend:
	    urut prioritas, maks 6) → kartu `AgenPemasar` + link "Lihat semua
	    agen" ke `/mitra?tab=agen`.
	  - Daftar kosong & perumahan BUKAN milik agen properti → blok ringkas
	    + link `/mitra?tab=agen`.
	  - Perumahan milik agen properti ("Dipasarkan oleh …" di ringkasan atas)
	    → tidak ada blok umum.

	`ref` diteruskan ke link via `withRef()` — passthrough `?ref=` WAJIB
	(CLAUDE.md §Redirect `/p/:slug`).
-->
<script lang="ts">
	import AgenPemasar from './agen-pemasar.svelte';
	import type { AgenPemasar as TipeAgenPemasar, AgenRef } from '$lib/api/types';
	import { withRef } from '$lib/ref';

	let {
		agen,
		ref,
		perumahanSlug,
		namaPerumahan,
		opsiTipe = null,
		agenProperti = null
	}: {
		/** Agen premium pemasar (pemilik `?ref=AO-…` saja bila cocok). */
		agen: TipeAgenPemasar[];
		ref: string | null;
		perumahanSlug: string;
		namaPerumahan: string;
		opsiTipe?: string[] | null;
		/** Agen properti pemilik perumahan (field `agen` detail) — blok umum disembunyikan. */
		agenProperti?: AgenRef | null;
	} = $props();

	/**
	 * Kartu agen hanya bila daftar balikan benar-benar pemilik `ref` —
	 * bandingkan case-insensitive (backend menormalisasi `ref` trim+uppercase;
	 * Omahe meneruskan `?ref=` apa adanya). Saat cocok backend membalas HANYA
	 * pemilik, jadi `some` pada praktiknya sama dengan cek `agen[0]`.
	 */
	const pemilikRef = $derived(
		agen.some((a) => a.kodeRef.toUpperCase() === ref?.trim().toUpperCase())
	);
</script>

{#if agen.length > 0 && pemilikRef}
	<!-- AGEN-OMAHE-02/03 — kartu agen pemilik `?ref=AO-…` (satu-satunya di daftar). -->
	<AgenPemasar {agen} {perumahanSlug} {namaPerumahan} {opsiTipe} />
{:else if agen.length > 0}
	<!-- AGEN-OMAHE-15 — daftar agen premium yang memasarkan perumahan ini. -->
	<div>
		<AgenPemasar {agen} {perumahanSlug} {namaPerumahan} {opsiTipe} />
		<a
			href={withRef('/mitra?tab=agen', ref)}
			class="text-primary mt-3 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
		>
			Lihat semua agen Omahe <span aria-hidden="true">→</span>
		</a>
	</div>
{:else if !agenProperti}
	<section aria-labelledby="agen-omahe-umum-judul">
		<h2 id="agen-omahe-umum-judul" class="font-display text-ink text-xl font-bold">Agen Omahe</h2>
		<p class="text-muted mt-1 text-sm">
			Butuh bantuan membeli perumahan ini? Hubungi agen Omahe pilihan Anda.
		</p>
		<a
			href={withRef('/mitra?tab=agen', ref)}
			class="text-primary mt-2 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
		>
			Lihat agen Omahe <span aria-hidden="true">→</span>
		</a>
	</section>
{/if}
