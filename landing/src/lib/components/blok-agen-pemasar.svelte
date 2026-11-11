<!--
	Blok agen pemasar di detail perumahan (AGEN-OMAHE-13, 2026-11-11).

	Sejak backend "Aktifkan semua" (satu agen bisa memilih SEMUA perumahan
	sekaligus), daftar agen per perumahan bisa puluhan — daftar lengkap itu
	tidak dirender lagi di sini, melainkan tinggal di tab Agen `/mitra?tab=agen`:

	  - Pengunjung datang lewat `?ref=` kode pilihan agen (`AO-…`) DAN daftar
	    balikan benar-benar pemilik `ref` (`kodeRef` = `ref` — backend membalas
	    HANYA agen itu) → kartu `AgenPemasar` asli (satu agen + form minat).
	    Ref AO yang tidak dikenal perumahan ini dibalas daftar terpotong maks
	    6 agen LAIN (backend AGEN-OMAHE-13) — itu TIDAK boleh dirender kartu.
	  - Selain itu, dan perumahan BUKAN milik agen properti → blok ringkas
	    "Dipasarkan oleh semua agen Omahe" + link ke `/mitra?tab=agen`
	    (tanpa daftar agen).
	  - Perumahan milik agen properti ("Dipasarkan oleh …" di ringkasan atas)
	    → tidak ada blok sama sekali — pemasarnya bukan agen Omahe.

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
		/** Non-empty HANYA bila `ref` kode pilihan agen & backend membalikkannya. */
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
{:else if !agenProperti}
	<section aria-labelledby="agen-omahe-umum-judul">
		<h2 id="agen-omahe-umum-judul" class="font-display text-ink text-xl font-bold">
			Dipasarkan oleh semua agen Omahe
		</h2>
		<p class="text-muted mt-1 text-sm">Perumahan ini bisa Anda tanyakan ke agen Omahe mana pun.</p>
		<a
			href={withRef('/mitra?tab=agen', ref)}
			class="text-primary mt-2 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
		>
			Lihat agen Omahe <span aria-hidden="true">→</span>
		</a>
	</section>
{/if}
