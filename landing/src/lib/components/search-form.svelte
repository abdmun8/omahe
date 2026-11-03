<!--
	Form pencarian utama. Sengaja <form method="GET" action="/cari"> murni:
	hasilnya URL yang bisa di-bookmark/dibagikan dan tetap jalan tanpa JS —
	penting untuk halaman publik yang SEO-heavy.

	Dua varian layout (prop `kompak`):
	- default (dipakai /cari): semua field, bertumpuk di mobile lalu grid di
	  sm+/lg+. UNIT-10: baris kedua (kecamatan + kamar tidur/mandi) bertumpuk
	  di mobile, grid 3 kolom di sm+.
	- `kompak` (homepage): mobile cuma SATU baris (lokasi + kata kunci +
	  tombol) + link "Filter lanjutan" ke /cari; select harga tetap di DOM
	  tapi disembunyikan CSS di mobile — field tersembunyi tetap ikut submit
	  GET, jadi semantik query form identik di semua varian. Di sm+ varian
	  kompak memakai grid penuh yang sama seperti default. UNIT-10: tidak
	  berubah kecuali kotak kata kunci (kini `q`, bukan `tipe`).

	UNIT-10 — kotak utama kini mengirim `q` (nama perumahan/lokasi/tipe).
	URL lama yang masih membawa `?tipe=` tetap jalan (server tetap parse),
	tapi form TIDAK PERNAH mengirim `tipe` lagi — submit GET membangun URL
	dari nol, jadi otomatis bersih.
-->
<script lang="ts">
	import type { RegionOption } from '$lib/api/types';
	import { trackEvent } from '$lib/analytics';
	import { REF_PARAM, withRef } from '$lib/ref';
	import { cn } from '$lib/utils';
	import Button from './ui/button.svelte';

	let {
		regions,
		ref = null,
		nilai = {},
		kompak = false
	}: {
		regions: RegionOption[];
		ref?: string | null;
		/** `tipe` dibaca HANYA sebagai nilai awal kompatibel URL lama —
		 *  form tidak pernah mengirimnya lagi. */
		nilai?: {
			regionKode?: string;
			hargaMin?: number;
			hargaMaks?: number;
			tipe?: string;
			q?: string;
			kecamatanKode?: string;
			kamarTidurMin?: number;
			kamarMandiMin?: number;
		};
		kompak?: boolean;
	} = $props();

	const BATAS_HARGA = [
		{ nilai: 300_000_000, label: 'Di bawah Rp300 jt' },
		{ nilai: 500_000_000, label: 'Di bawah Rp500 jt' },
		{ nilai: 750_000_000, label: 'Di bawah Rp750 jt' },
		{ nilai: 1_000_000_000, label: 'Di bawah Rp1 M' },
		{ nilai: 2_000_000_000, label: 'Di bawah Rp2 M' }
	];

	// UNIT-10 — pilihan kamar minimal (cermin server parse 1–10; UI cuma
	// menawarkan 1+/2+/3+/4+ utk tidur, 1+/2+/3+ utk mandi).
	const PILIHAN_KAMAR_TIDUR = [1, 2, 3, 4];
	const PILIHAN_KAMAR_MANDI = [1, 2, 3];

	// Nilai live dari field utama — dipakai menyusun href "Filter lanjutan"
	// supaya lokasi/kata kunci yang sudah diisi pengunjung ikut terbawa ke
	// /cari, bukan hilang di tengah jalan. `ref` menyusul lewat `withRef()`.
	// Nilai awal sengaja dipetik SEKALI dari prop `nilai` (seed state, bukan
	// reaktivitas) — prop ini statis per-page-load, tidak berubah di tengah
	// jalan, jadi ignore warning-nya di sini.
	// svelte-ignore state_referenced_locally
	let lokasi = $state(nilai.regionKode ?? '');
	// UNIT-10 — `q` menggantikan `tipe`; URL lama `?tipe=…` tetap terisi ke
	// kotak ini (`nilai.q ?? nilai.tipe`) supaya hasil lama tidak kehilangan
	// kriterianya saat form di-submit ulang.
	// svelte-ignore state_referenced_locally
	let kataKunci = $state(nilai.q ?? nilai.tipe ?? '');
	// svelte-ignore state_referenced_locally
	let kecamatan = $state(nilai.kecamatanKode ?? '');

	/** UNIT-10 — opsi kecamatan mengikuti kab/kota terpilih (backend lama
	 *  belum mengirim field `kecamatan` → opsional, `?? []`). */
	const opsiKecamatan = $derived(
		regions.find((r) => r.kode === lokasi)?.kecamatan ?? []
	);

	// Ganti kab/kota = kecamatan lama pasti salah kabupaten → reset. Validasi
	// (bukan blind reset) supaya nilai awal dari URL tetap hidup saat mount.
	$effect(() => {
		if (kecamatan && !opsiKecamatan.some((k) => k.kode === kecamatan)) kecamatan = '';
	});

	const filterLainnyaHref = $derived.by(() => {
		const params = new URLSearchParams();
		if (lokasi) params.set('regionKode', lokasi);
		if (kataKunci.trim()) params.set('q', kataKunci.trim());
		const qs = params.toString();
		return withRef(`/cari${qs ? `?${qs}` : ''}`, ref);
	});

	// Iterasi 1 GA4: event inti 'search' — SATU handler untuk kedua varian.
	// TANPA preventDefault: form tetap submit GET native (no-JS tetap jalan,
	// URL hasil tetap bisa di-bookmark); event GA cuma payload tambahan yang
	// dikirim saat pengunjung menekan tombol. Nilai kosong → undefined →
	// di-strip sebelum dikirim (src/lib/analytics.ts). Tidak ada PII di sini
	// — hanya kata kunci tipe/lokasi/harga, bukan input pribadi pengunjung.
	function lacakSubmit(e: SubmitEvent) {
		const form = e.currentTarget as HTMLFormElement;
		// 2026-10-08 — harga min/maks dibaca dari elemen form (varian penuh =
		// input ketik sendiri; kompak = select preset `hargaMax`).
		const min = (form.elements.namedItem('hargaMin') as HTMLInputElement | null)?.value;
		const maks = (form.elements.namedItem('hargaMax') as HTMLInputElement | HTMLSelectElement | null)
			?.value;
		// UNIT-10 — kecamatan & kamar tidur min (varian penuh; kompak tidak
		// punya field-nya → undefined → ter-strip).
		const kamarTidur = (form.elements.namedItem('kamarTidurMin') as HTMLSelectElement | null)
			?.value;
		trackEvent('search', {
			search_term: kataKunci.trim() || undefined,
			region: lokasi || undefined,
			kecamatan: kecamatan || undefined,
			kamar_tidur_min: kamarTidur ? Number(kamarTidur) : undefined,
			harga_min: min ? Number(min) : undefined,
			harga_max: maks ? Number(maks) : undefined,
			// Homepage = varian kompak; /cari = varian penuh. ('home' disiapkan
			// untuk homepage varian penuh kalau suatu saat ada — butuh prop baru.)
			form: kompak ? 'home_kompak' : 'cari'
		});
	}

	/** Rupiah ketik sendiri — hanya digit (titik/spasi di-strip live;
	 *  parsing server juga toleran non-digit, `/cari/+page.server.ts`). */
	function maskDigit(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		input.value = input.value.replace(/\D/g, '').slice(0, 15);
	}

	// Kelas dasar field TANPA tinggi — tingginya dipisah supaya varian kompak
	// tidak mengirim h-11 dan h-12 sekaligus (arbitrase CSS order terlalu
	// rapuh; lihat `cn()` = twMerge yang menyelesaikan konflik per-breakpoint).
	const kelas =
		'w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted';
	// Varian kompak: 44px di mobile (target sentuh minimum) lalu 48px lagi di sm+.
	const tinggi = $derived(kompak ? 'h-11 sm:h-12' : 'h-12');
</script>

<form action="/cari" method="GET" onsubmit={lacakSubmit} class="space-y-3">
	<!-- `ref` ikut dibawa sebagai hidden input: submit form membangun URL
	     baru dari nol, jadi tanpa ini atribusi referral putus di sini. -->
	{#if ref}
		<input type="hidden" name={REF_PARAM} value={ref} />
	{/if}

	<div
		class={cn(
			'gap-3',
			kompak
				? 'flex flex-wrap items-center gap-2 sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-[2fr_1.5fr_1.5fr_auto]'
				: 'grid sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr_auto]'
		)}
	>
		<div class={cn(kompak && 'w-[42%] max-w-44 shrink-0 sm:w-auto sm:max-w-none')}>
			<label for="cari-lokasi" class="sr-only">Lokasi</label>
			<select id="cari-lokasi" name="regionKode" bind:value={lokasi} class={cn(kelas, tinggi)}>
				<option value="">Semua lokasi</option>
				{#each regions as region (region.kode)}
					<option value={region.kode}>{region.nama}</option>
				{/each}
			</select>
		</div>

		<!-- Harga: varian kompak (homepage) = preset cepat; varian penuh (/cari)
		     = INPUT KETIK SENDIRI min & maks (2026-10-08) — non-digit di-strip,
		     URL tetap angka polos. Kompak menyembunyikan di mobile (tetap di DOM
		     supaya submit form tidak berubah). -->
		{#if kompak}
			<div class="hidden sm:block">
				<label for="cari-harga" class="sr-only">Harga maksimal</label>
				<select id="cari-harga" name="hargaMax" class={cn(kelas, tinggi)}>
					<option value="">Semua harga</option>
					{#each BATAS_HARGA as batas (batas.nilai)}
						<option value={batas.nilai} selected={nilai.hargaMaks === batas.nilai}
							>{batas.label}</option
						>
					{/each}
				</select>
			</div>
		{:else}
			<div>
				<label for="cari-harga-min" class="sr-only">Harga minimum</label>
				<input
					id="cari-harga-min"
					name="hargaMin"
					type="text"
					inputmode="numeric"
					placeholder="Harga min. (Rp)"
					value={nilai.hargaMin ?? ''}
					oninput={maskDigit}
					class={cn(kelas, tinggi)}
				/>
			</div>
			<div>
				<label for="cari-harga-maks" class="sr-only">Harga maksimal</label>
				<input
					id="cari-harga-maks"
					name="hargaMax"
					type="text"
					inputmode="numeric"
					placeholder="Harga maks. (Rp)"
					value={nilai.hargaMaks ?? ''}
					oninput={maskDigit}
					class={cn(kelas, tinggi)}
				/>
			</div>
		{/if}

		<!-- UNIT-10 — kotak utama kini kata kunci `q` (bukan lagi `tipe`). -->
		<div class={cn(kompak && 'min-w-0 flex-1')}>
			<label for="cari-kata-kunci" class="sr-only">Kata kunci</label>
			<input
				id="cari-kata-kunci"
				name="q"
				type="search"
				inputmode="search"
				placeholder={kompak ? 'Cari perumahan / lokasi' : 'Nama perumahan, lokasi, atau tipe'}
				bind:value={kataKunci}
				class={cn(kelas, tinggi)}
			/>
		</div>

		<Button
			type="submit"
			size={kompak ? 'md' : 'lg'}
			class={kompak ? 'shrink-0 sm:h-12 sm:px-6 sm:text-base' : 'w-full lg:w-auto'}
		>
			{#if kompak}
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-4 w-4"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.3-4.3" />
				</svg>
				<!-- Teks pendek di mobile, label penuh di desktop — keduanya teks
				     nyata, bukan cuma aria-label, supaya nama tombol selalu terbaca. -->
				<span class="sm:hidden">Cari</span>
				<span class="hidden sm:inline">Cari Rumah</span>
			{:else}
				Cari Rumah
			{/if}
		</Button>

		{#if kompak}
			<!-- Pintasan ke filter lengkap di /cari — query yang sudah diisi
			     (lokasi/kata kunci/ref) ikut di href-nya. Baris sendiri di mobile
			     (w-full pada flex-wrap), hilang di sm+ karena grid penuh sudah
			     menampilkan semua field. -->
			<div class="w-full sm:hidden">
				<a
					href={filterLainnyaHref}
					class="text-primary inline-flex items-center gap-1.5 pt-0.5 text-sm font-medium hover:underline"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="h-4 w-4"
						aria-hidden="true"
					>
						<line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" />
						<line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" />
						<line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" />
						<line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" />
						<line x1="16" x2="16" y1="18" y2="22" />
					</svg>
					Filter lanjutan (harga, dll.)
				</a>
			</div>
		{/if}
	</div>

	<!-- UNIT-10 — baris kedua varian penuh: kecamatan + kamar tidur/mandi.
	     Bertumpuk di mobile, grid 3 kolom di sm+. Varian kompak tidak
	     menampilkan baris ini (filter lanjutan tetap di /cari). -->
	{#if !kompak}
		<div class="grid gap-3 sm:grid-cols-3">
			<div>
				<label for="cari-kecamatan" class="sr-only">Kecamatan</label>
				<select
					id="cari-kecamatan"
					name="kecamatanKode"
					bind:value={kecamatan}
					disabled={!lokasi}
					class={cn(kelas, tinggi)}
				>
					{#if !lokasi}
						<option value="">Pilih kab/kota dulu</option>
					{:else}
						<option value="">Semua kecamatan</option>
						{#each opsiKecamatan as k (k.kode)}
							<option value={k.kode}>{k.nama}</option>
						{/each}
					{/if}
				</select>
			</div>
			<div>
				<label for="cari-kamar-tidur" class="sr-only">Kamar tidur</label>
				<select id="cari-kamar-tidur" name="kamarTidurMin" class={cn(kelas, tinggi)}>
					<option value="">Semua</option>
					{#each PILIHAN_KAMAR_TIDUR as n (n)}
						<option value={n} selected={nilai.kamarTidurMin === n}>{n}+</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="cari-kamar-mandi" class="sr-only">Kamar mandi</label>
				<select id="cari-kamar-mandi" name="kamarMandiMin" class={cn(kelas, tinggi)}>
					<option value="">Semua</option>
					{#each PILIHAN_KAMAR_MANDI as n (n)}
						<option value={n} selected={nilai.kamarMandiMin === n}>{n}+</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}
</form>
