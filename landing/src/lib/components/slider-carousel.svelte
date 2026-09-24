<!--
	Slider carousel homepage (MONET-02 — `GET /public/sliders`,
	api-contract.md §7). Dirender DI ATAS hero-search, container sama dengan
	hero (urus di pemanggil, `+page.svelte`).

	Fail-soft: prop `sliders` kosong → TIDAK ada DOM sama sekali (section
	"Event & kegiatan" hilang total, bukan skeleton/spinner menetap).

	Interaksi & a11y:
	- Autoplay ±6 detik; pause SEMENTARA saat hover/focus di dalam carousel,
	  mati PERMANEN begitu pengguna mengambil alih (swipe / prev / next /
	  dot). `prefers-reduced-motion: reduce` → tanpa autoplay, dan transisi
	  slide ikut dimatikan lewat `motion-reduce:transition-none`.
	- Swipe sentuh dasar via Pointer Events — touch punya implicit pointer
	  capture, jadi handler cukup dipasang di viewport (tanpa
	  setPointerCapture eksplisit yang justru merusak klik link di mouse).
	  `touch-pan-y` menjaga scroll vertikal halaman tetap jalan.
	- aria-live polite mengumumkan slide aktif; alt gambar = judul slide;
	  dot & prev/next = tombol asli ber-label.
-->
<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { PublicSlider } from '$lib/api/types';
	import { trackEvent } from '$lib/analytics';
	import { withRef } from '$lib/ref';

	let { sliders, ref = null }: { sliders: PublicSlider[]; ref?: string | null } = $props();

	let aktif = $state(0);
	/** Hover/focus berada di dalam carousel — autoplay pause sementara. */
	let tertunda = $state(false);
	/** Pengguna sudah mengambil alih (swipe/tombol) — autoplay mati permanen. */
	let matiPermanen = $state(false);
	/** `prefers-reduced-motion` — hanya relevan di browser (SSR: false). */
	let gerakDikurangi = $state(false);

	// Iterasi 2 GA4: IMPRESI slide aktif — terkirim SEKALI setiap kali `aktif`
	// berubah (saat mount + tiap pindah: autoplay/swipe/dot/panah), BUKAN
	// berulang-ulang saat re-render biasa — efek Svelte hanya jalan di browser
	// dan satu-satunya dependensinya `aktif`. `trackEvent` no-op yang aman
	// kalau gtag belum termuat (dev/ad-blocker) dan tidak mengirim PII.
	$effect(() => {
		const slider = sliders[aktif];
		if (!slider) return;
		trackEvent('slider_view', {
			perumahan: slider.perumahan?.nama ?? 'Omahe',
			judul: teksSlide(slider),
			posisi: aktif + 1
		});
	});

	$effect(() => {
		// Optional-call: jsdom (component test) tidak punya matchMedia —
		// di situ saja autoplay tak masalah karena interval ikut ter-clear
		// saat unmount.
		const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
		if (!mq) return;
		gerakDikurangi = mq.matches;
		const ubah = (e: MediaQueryListEvent) => (gerakDikurangi = e.matches);
		mq.addEventListener('change', ubah);
		return () => mq.removeEventListener('change', ubah);
	});

	// Autoplay. Dependensi effect = semua kondisi mati/pause; pembacaan
	// `aktif` di dalam callback interval sengaja tidak di-track.
	$effect(() => {
		if (gerakDikurangi || tertunda || matiPermanen || sliders.length <= 1) return;
		const timer = setInterval(() => {
			aktif = (aktif + 1) % sliders.length;
		}, 6000);
		return () => clearInterval(timer);
	});

	// --- Swipe dasar -------------------------------------------------------

	const AMBANG_GESER = 40; // px — di bawah ini dianggap tap, bukan swipe.

	let mulaiX: number | null = null;
	let geserPiksel = 0;
	/** Swipe barusan benar-benar terjadi → klik (tap sisa geseran) blokir. */
	let baruGeser = $state(false);

	function pointerDown(e: PointerEvent) {
		mulaiX = e.clientX;
		geserPiksel = 0;
		baruGeser = false;
	}

	function pointerMove(e: PointerEvent) {
		if (mulaiX === null) return;
		geserPiksel = e.clientX - mulaiX;
	}

	function pointerUp() {
		if (mulaiX === null) return;
		mulaiX = null;
		if (Math.abs(geserPiksel) > AMBANG_GESER) {
			arah(geserPiksel < 0 ? 1 : -1);
			// Navigasi slide selesai; click yang menyusul dari gesture yang
			// sama tidak boleh ikut membuka link slide.
			baruGeser = true;
		}
		geserPiksel = 0;
	}

	/** Blokir klik penerus gesture swipe (fase tangkap → sebelum link). */
	function cegahKlikSetelahGeser(e: MouseEvent) {
		if (!baruGeser) return;
		e.preventDefault();
		e.stopPropagation();
		baruGeser = false;
	}

	// --- Navigasi ----------------------------------------------------------

	/** Langsar relatif; pengguna mengambil alih → autoplay mati permanen. */
	function arah(delta: number) {
		matiPermanen = true;
		aktif = (aktif + delta + sliders.length) % sliders.length;
	}

	function keSlide(i: number) {
		matiPermanen = true;
		aktif = i;
	}

	/**
	 * Atribut link slide: `linkUrl` terisi → eksternal, tab baru,
	 * rel=noopener (api-contract.md §7); selain itu internal ke detail
	 * perumahan pemilik — WAJIB lewat `withRef()` (rantai komisi mitra,
	 * CLAUDE.md §Redirect `/p/:slug`).
	 */
	function tautanSlide(slider: PublicSlider) {
		// MONET-04 — path internal Omahe (`/kpr`, `/artikel/…`): tab sama,
		// WAJIB `withRef()` seperti link internal lain.
		if (linkInternal(slider.linkUrl)) {
			return { href: withRef(slider.linkUrl, ref) };
		}
		if (slider.linkUrl) {
			return { href: slider.linkUrl, target: '_blank', rel: 'noopener' };
		}
		// Slide Omahe selalu punya link (dijamin backend); fallback aman ke beranda.
		return {
			href: withRef(slider.perumahan ? `/perumahan/${slider.perumahan.slug}` : '/', ref)
		};
	}

	/**
	 * MONET-06 — teks aksesibel slide: judul, atau deskripsi gambar untuk
	 * slide tanpa judul (teks sudah di dalam gambar).
	 */
	function teksSlide(slider: PublicSlider): string {
		return slider.judul ?? slider.altText ?? 'Slide promo';
	}

	/** Path internal Omahe: diawali `/` tapi bukan `//` (protocol-relative). */
	function linkInternal(url: string | null): url is string {
		return !!url && url.startsWith('/') && !url.startsWith('//');
	}

	/** Penanda & tab baru hanya untuk link ke luar Omahe. */
	function linkEksternal(slider: PublicSlider): boolean {
		return !!slider.linkUrl && !linkInternal(slider.linkUrl);
	}

	// Iterasi 2 GA4: klik slide — penanda perumahan/judul + jenis tujuan
	// (eksternal/internal), tanpa PII. Klik yang tersisa dari gesture swipe
	// sudah diblokir `cegahKlikSetelahGeser` SEBELUM sampai ke sini.
	function lacakKlikSlide(slider: PublicSlider) {
		trackEvent('slider_click', {
			perumahan: slider.perumahan?.nama ?? 'Omahe',
			judul: teksSlide(slider),
			link: linkEksternal(slider) ? 'eksternal' : 'internal'
		});
	}
</script>

{#if sliders.length > 0}
	<!-- role=group + aria-roledescription: label section-nya disediakan
	     pemanggil (homepage) — di sini cukup deklarasi "ini carousel". -->
	<div
		role="group"
		aria-roledescription="carousel"
		class="relative select-none"
		onmouseenter={() => (tertunda = true)}
		onmouseleave={() => (tertunda = false)}
		onfocusin={() => (tertunda = true)}
		onfocusout={() => (tertunda = false)}
		onpointerdown={pointerDown}
		onpointermove={pointerMove}
		onpointerup={pointerUp}
		onpointercancel={pointerUp}
		onclickcapture={cegahKlikSetelahGeser}
	>
		<!-- Viewport: satu slide terlihat; track digeser per 100% lewat transform. -->
		<div class="bg-surface touch-pan-y overflow-hidden rounded-none sm:rounded-2xl">
			<div
				class="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
				style:transform={`translateX(-${aktif * 100}%)`}
			>
				{#each sliders as slider, i (slider.id)}
					<div class="relative w-full shrink-0">
						<a
							{...tautanSlide(slider)}
							class="block"
							draggable="false"
							onclick={() => lacakKlikSlide(slider)}
						>
							<img
								src={slider.gambarUrl}
								alt={slider.altText ?? slider.judul ?? teksSlide(slider)}
								loading={i === 0 ? 'eager' : 'lazy'}
								fetchpriority={i === 0 ? 'high' : undefined}
								class="h-[180px] w-full object-cover sm:h-[220px] md:h-[280px] lg:h-[320px]"
							/>
							{#if slider.judul}
								<!-- Scrim gradien bawah: jaga kontras teks AA di atas gambar apa pun. -->
								<div
									class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
									aria-hidden="true"
								></div>
								<div class="absolute inset-x-0 bottom-0 p-4 pb-8 sm:p-6 sm:pb-9">
									<p
										class="font-display flex items-center gap-1.5 text-lg font-extrabold text-white sm:text-2xl"
									>
										{slider.judul}
										{#if linkEksternal(slider)}
											<!-- Penanda link eksternal — ikon dekoratif, judul sudah cukup. -->
											<ArrowUpRight class="h-4 w-4 shrink-0 sm:h-6 sm:w-6" aria-hidden="true" />
										{/if}
									</p>
									{#if slider.subjudul}
										<p class="mt-1 text-xs text-white/90 sm:text-sm">{slider.subjudul}</p>
									{/if}
								</div>
							{:else}
								<!-- MONET-06 — slide gambar saja: tanpa teks & tanpa scrim penuh;
								     gradasi tipis di tepi bawah hanya supaya titik indikator
								     tetap terlihat di atas gambar terang. -->
								<div
									class="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/35 to-transparent"
									aria-hidden="true"
								></div>
							{/if}
						</a>
					</div>
				{/each}
			</div>
		</div>

		{#if sliders.length > 1}
			<!-- Prev/next kecil — sembunyikan di mobile, dots cukup (§Mobile-first). -->
			<button
				type="button"
				class="absolute top-1/2 left-2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 md:flex"
				aria-label="Slide sebelumnya"
				onclick={() => arah(-1)}
			>
				<ChevronLeft class="h-5 w-5" aria-hidden="true" />
			</button>
			<button
				type="button"
				class="absolute top-1/2 right-2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 md:flex"
				aria-label="Slide berikutnya"
				onclick={() => arah(1)}
			>
				<ChevronRight class="h-5 w-5" aria-hidden="true" />
			</button>

			<!-- Dot indikator: tombol asli supaya bisa di-Tab & di-enter. -->
			<div class="absolute inset-x-0 bottom-2.5 flex justify-center gap-2">
				{#each sliders as slider, i (slider.id)}
					<button
						type="button"
						class={`h-1.5 rounded-full transition-all ${
							i === aktif ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'
						}`}
						aria-label="Ke slide {i + 1}: {teksSlide(slider)}"
						aria-current={i === aktif ? 'true' : undefined}
						onclick={() => keSlide(i)}
					></button>
				{/each}
			</div>

			<!-- Pengumuman slide aktif untuk screen reader (visual: sr-only). -->
			<p class="sr-only" aria-live="polite">
				Slide {aktif + 1} dari {sliders.length}: {sliders[aktif] ? teksSlide(sliders[aktif]) : ''}
			</p>
		{/if}
	</div>
{/if}
