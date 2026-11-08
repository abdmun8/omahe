<!--
	Banner tipis "Rekomendasi dari <nama>" (KERJASAMA-03, tahap 5) — di ATAS
	hero homepage, hanya bila ref GLOBAL aktif & ada nama perusahaan mitra
	(dari resolve `/q/:kode`, disimpan `ref-tersimpan.ts`). Nama ini LABEL
	TAMPILAN SAJA — atribusi tetap dari `ref` yang divalidasi backend;
	karena itu nama TIDAK pernah dibaca dari `?dari=` atau `?mitra=` bebas
	di URL halaman biasa (anti-spoof), hanya dari hasil redirect `/q`.
	Tutup = sembunyikan banner SAJA untuk kunjungan ini — ref global tetap
	tersimpan & tetap mengalir ke CTA/form minat.
-->
<script lang="ts">
	import X from '@lucide/svelte/icons/x';

	let { nama }: { nama: string } = $props();

	let tertutup = $state(false);
</script>

{#if !tertutup}
	<div
		class="bg-surface border-line border-b"
		role="region"
		aria-label="Rekomendasi dari mitra Omahe"
	>
		<div class="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2">
			<p class="text-ink text-center text-sm">
				Rekomendasi dari <span class="font-semibold">{nama}</span>
				<span class="text-muted"> — pilih perumahan favorit Anda</span>
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
