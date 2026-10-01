<!--
	Centang biru "Agen Profesional Terverifikasi" (AGEN-OMAHE-07,
	api-contract §30). Ditempel tepat setelah nama agen; ukurannya mengikuti
	tinggi huruf nama (1em). Hover (desktop) → title; ketuk (HP, tanpa hover)
	→ popover kecil berisi penjelasan + tautan "Apa artinya?".

	Hanya dirender pemanggil bila `profesional === true` dari API (backend
	sudah memperhitungkan membership aktif) — agen tanpa badge tidak diberi
	placeholder apa pun.
-->
<script lang="ts">
	let { class: kelas = '' }: { class?: string } = $props();

	const PENJELASAN = 'Agen Profesional Terverifikasi — diverifikasi tim Omahe';
	let terbuka = $state(false);
	let akar: HTMLSpanElement | undefined = $state();
	let tombol: HTMLButtonElement | undefined = $state();
	/** Posisi popover (position: fixed — lolos dari `overflow-hidden` kartu
	 *  induk), dihitung dari letak ikon & dijepit di dalam layar. */
	let posisi = $state({ top: 0, left: 0 });
	const LEBAR = 240;

	function hitungPosisi() {
		if (!tombol) return;
		const r = tombol.getBoundingClientRect();
		const tepi = 8;
		const tengah = r.left + r.width / 2 - LEBAR / 2;
		posisi = {
			top: r.bottom + 8,
			left: Math.min(Math.max(tengah, tepi), window.innerWidth - LEBAR - tepi)
		};
	}

	$effect(() => {
		if (!terbuka) return;
		// Posisi fixed basi saat halaman di-scroll/di-resize → tutup saja.
		const lepas = () => (terbuka = false);
		window.addEventListener('scroll', lepas, { passive: true });
		window.addEventListener('resize', lepas);
		const tutup = (e: Event) => {
			if (akar && !akar.contains(e.target as Node)) terbuka = false;
		};
		const esc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') terbuka = false;
		};
		document.addEventListener('pointerdown', tutup);
		document.addEventListener('keydown', esc);
		return () => {
			window.removeEventListener('scroll', lepas);
			window.removeEventListener('resize', lepas);
			document.removeEventListener('pointerdown', tutup);
			document.removeEventListener('keydown', esc);
		};
	});
</script>

<span bind:this={akar} class="relative inline-flex align-[-0.125em] {kelas}">
	<button
		bind:this={tombol}
		type="button"
		class="inline-flex h-[1em] w-[1em] cursor-pointer items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-[#1D9BF0] focus-visible:ring-offset-1 focus-visible:outline-none"
		aria-label={PENJELASAN}
		aria-expanded={terbuka}
		title={PENJELASAN}
		onclick={(e) => {
			e.preventDefault();
			e.stopPropagation();
			if (!terbuka) hitungPosisi();
			terbuka = !terbuka;
		}}
	>
		<svg viewBox="0 0 24 24" class="h-full w-full" aria-hidden="true">
			<!-- Bentuk "lencana" bergelombang (seperti centang biru media sosial). -->
			<path
				fill="#1D9BF0"
				d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
			/>
			<path
				fill="none"
				stroke="#fff"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				d="m7.75 12.25 2.75 2.75 5.75-6"
			/>
		</svg>
	</button>
	{#if terbuka}
		<span
			role="tooltip"
			style:top="{posisi.top}px"
			style:left="{posisi.left}px"
			style:width="{LEBAR}px"
			class="border-line text-ink fixed z-50 rounded-xl border bg-white p-3 text-left font-sans text-xs leading-snug font-normal shadow-lg"
		>
			<span class="block font-semibold text-[#1D9BF0]">Agen Profesional Terverifikasi</span>
			<span class="mt-1 block">
				Kompetensi & pengalaman agen ini sudah diverifikasi langsung oleh tim Omahe.
			</span>
			<a
				href="/gabung/agen#profesional"
				class="text-primary mt-2 inline-block font-medium hover:underline">Apa artinya?</a
			>
		</span>
	{/if}
</span>
