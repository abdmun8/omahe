<!--
	Banner tipis "Rekomendasi dari <nama>" (KERJASAMA-03, tahap 5) — di ATAS
	hero homepage, hanya bila ref GLOBAL aktif. Dua varian:
	- `mitra` (bawaan, KERJASAMA-03): ref global `OP-…`, nama dari resolve
	  `/q/:kode` (`?mitra=`) — LABEL TAMPILAN SAJA, atribusi tetap dari `ref`
	  yang divalidasi backend; karena itu nama TIDAK pernah dibaca dari
	  `?dari=` atau `?mitra=` bebas di URL halaman biasa (anti-spoof).
	- `agen` (REF-AGEN-01): ref global kode agen pribadi (`OMHA-…`/`OMH-…`),
	  nama diambil client-side dari endpoint nama agen (bukan query string).
	  Varian ini menambah tautan kecil "Mau jadi agen juga? Daftar gratis" →
	  `/gabung/agen` (link pribadi agen dua fungsi — halaman tujuan akan
	  memakai kode itu sebagai sponsor bila pengunjung mendaftar).
	Tutup = sembunyikan banner SAJA untuk kunjungan ini — ref global tetap
	tersimpan & tetap mengalir ke CTA/form minat.
-->
<script lang="ts">
	import X from '@lucide/svelte/icons/x';

	let { nama, varian = 'mitra' }: { nama: string; varian?: 'mitra' | 'agen' } = $props();

	let tertutup = $state(false);
</script>

{#if !tertutup}
	<div
		class="bg-surface border-line border-b"
		role="region"
		aria-label={varian === 'agen' ? 'Rekomendasi dari agen Omahe' : 'Rekomendasi dari mitra Omahe'}
	>
		<div class="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2">
			<p class="text-ink text-center text-sm">
				Rekomendasi dari <span class="font-semibold">{nama}</span>
				<span class="text-muted"> — pilih perumahan favorit Anda</span>
				{#if varian === 'agen'}
					<!-- REF-AGEN-01 — tautan kecil khusus varian agen: link yang sama
					     juga jalan sebagai link sponsor calon agen (fallback ref global
					     di `/gabung/agen`), jadi href polos tanpa param. -->
					<a
						href="/gabung/agen"
						class="text-accent-dark hover:text-accent ml-1 underline underline-offset-2"
					>
						Mau jadi agen juga? Daftar gratis
					</a>
				{/if}
			</p>
			<button
				type="button"
				class="text-muted hover:bg-line hover:text-ink -mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors"
				aria-label="Tutup banner rekomendasi"
				onclick={() => (tertutup = true)}
			>
				<X class="h-4 w-4" aria-hidden="true" />
			</button>
		</div>
	</div>
{/if}
