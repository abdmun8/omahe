<!--
	Lightbox galeri foto (2026-10-02): modal gambar besar dengan navigasi
	sebelumnya/berikutnya (tombol, panah keyboard, geser di HP), penghitung,
	tutup (tombol/Esc/klik latar), dan tombol LAYAR PENUH (Fullscreen API pada
	kontainer modal; disembunyikan bila browser tidak mendukung — mis. Safari
	iPhone, yang modalnya sudah memenuhi layar).

	Pemakaian: `<GaleriLightbox urls={…} bind:indeks bind:terbuka />`; buka
	dengan set `indeks` lalu `terbuka = true` dari tombol thumbnail.
-->
<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Maximize from '@lucide/svelte/icons/maximize';
	import Minimize from '@lucide/svelte/icons/minimize';
	import X from '@lucide/svelte/icons/x';

	let {
		urls,
		indeks = $bindable(0),
		terbuka = $bindable(false),
		judul = 'Foto'
	}: { urls: string[]; indeks?: number; terbuka?: boolean; judul?: string } = $props();

	let kotak: HTMLDivElement | undefined = $state();

	/** Pindahkan modal ke <body> — leluhur ber-transform/filter membuat
	 *  `position: fixed` tidak lagi relatif ke layar (modal tidak penuh). */
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}
	let layarPenuh = $state(false);
	const bisaLayarPenuh = $derived(
		typeof document !== 'undefined' && document.fullscreenEnabled === true
	);
	const jumlah = $derived(urls.length);

	function geser(delta: number) {
		if (jumlah === 0) return;
		indeks = (indeks + delta + jumlah) % jumlah;
	}

	async function tutup() {
		if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
		terbuka = false;
	}

	async function toggleLayarPenuh() {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			else await kotak?.requestFullscreen();
		} catch {
			// Ditolak browser — modal biasa tetap jalan.
		}
	}

	$effect(() => {
		if (!terbuka) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				// Layar penuh → Esc pertama keluar layar penuh, Esc berikutnya tutup.
				if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
				else tutup();
			} else if (e.key === 'ArrowLeft') geser(-1);
			else if (e.key === 'ArrowRight') geser(1);
		};
		const onFs = () => (layarPenuh = Boolean(document.fullscreenElement));
		document.addEventListener('keydown', onKey);
		document.addEventListener('fullscreenchange', onFs);
		const overflowLama = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		kotak?.focus();
		return () => {
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('fullscreenchange', onFs);
			document.body.style.overflow = overflowLama;
		};
	});

	// Geser (swipe) di HP.
	let mulaiX: number | null = null;
	function pointerDown(e: PointerEvent) {
		mulaiX = e.clientX;
	}
	function pointerUp(e: PointerEvent) {
		if (mulaiX === null) return;
		const dx = e.clientX - mulaiX;
		mulaiX = null;
		if (Math.abs(dx) > 40) geser(dx < 0 ? 1 : -1);
	}
</script>

{#if terbuka && jumlah > 0}
	<div
		bind:this={kotak}
		use:portal
		class="fixed inset-0 z-[100] flex flex-col bg-black outline-none"
		role="dialog"
		aria-modal="true"
		aria-label="{judul} {indeks + 1} dari {jumlah}"
		tabindex="-1"
	>
		<div class="flex items-center justify-between gap-2 px-4 py-3 text-white">
			<p class="text-sm tabular-nums">{indeks + 1} / {jumlah}</p>
			<div class="flex items-center gap-1">
				{#if bisaLayarPenuh}
					<button
						type="button"
						class="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
						aria-label={layarPenuh ? 'Keluar dari layar penuh' : 'Layar penuh'}
						title={layarPenuh ? 'Keluar dari layar penuh' : 'Layar penuh'}
						onclick={toggleLayarPenuh}
					>
						{#if layarPenuh}<Minimize class="h-5 w-5" />{:else}<Maximize class="h-5 w-5" />{/if}
					</button>
				{/if}
				<button
					type="button"
					class="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
					aria-label="Tutup"
					title="Tutup"
					onclick={tutup}
				>
					<X class="h-6 w-6" />
				</button>
			</div>
		</div>

		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			role="presentation"
			class="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-2 pb-4"
			onpointerdown={pointerDown}
			onpointerup={pointerUp}
			onclick={(e) => {
				if (e.target === e.currentTarget) tutup();
			}}
		>
			<img
				src={urls[indeks]}
				alt="{judul} {indeks + 1}"
				class="max-h-full max-w-full object-contain select-none"
				draggable="false"
			/>
			{#if jumlah > 1}
				<button
					type="button"
					class="absolute top-1/2 left-2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
					aria-label="Foto sebelumnya"
					onclick={() => geser(-1)}
				>
					<ChevronLeft class="h-6 w-6" />
				</button>
				<button
					type="button"
					class="absolute top-1/2 right-2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
					aria-label="Foto berikutnya"
					onclick={() => geser(1)}
				>
					<ChevronRight class="h-6 w-6" />
				</button>
			{/if}
		</div>
	</div>
{/if}
