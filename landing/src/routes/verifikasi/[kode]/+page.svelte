<!--
	Verifikasi ID card agen Omahe (AGEN-OMAHE-01, api-contract §20) —
	dibuka lewat QR di ID card agen (`/verifikasi/:kode`). TIGA state,
	semua jelas menurut epic: (✓) agen terverifikasi & membership aktif,
	(✗) kode dikenali tapi tidak aktif, dan (?) kode tidak dikenali /
	layanan sedang bermasalah — dibedakan supaya API down tidak
	membuat agen terlihat "palsu".

	Fail-soft fixture-first pola MITRA-01: produksi menampilkan state (?)
	sampai backend AGEN-OMAHE-01 di-deploy, lalu nyala otomatis.
-->
<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const agenData = $derived(data.hasil.ketemu ? data.hasil.data : null);

	/** "26 Sep 2027" — konsisten formatter periode promo (WIB). */
	const berlakuSampai = $derived(
		agenData?.berlakuSampai
			? new Date(agenData.berlakuSampai).toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'short',
					year: 'numeric',
					timeZone: 'Asia/Jakarta'
				})
			: null
	);

	/** Inisial fallback foto — pola mitra-card. */
	const inisial = $derived(
		(agenData?.nama ?? '')
			.split(/\s+/)
			.filter((kata) => /[a-zA-Z]/.test(kata[0] ?? ''))
			.slice(0, 2)
			.map((kata) => kata[0]?.toUpperCase())
			.join('') || 'A'
	);
</script>

<svelte:head>
	<title>Verifikasi Agen Omahe</title>
	<meta
		name="description"
		content="Verifikasi keaslian ID card agen Omahe lewat kode pada kartu."
	/>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-md px-4 py-10">
	<div class="border-line rounded-2xl border bg-white p-6 text-center sm:p-8">
		{#if data.hasil.ketemu}
			{@const agen = data.hasil.data}
			{#if agen.status === 'aktif'}
				<span
					class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"
					aria-hidden="true"
				>
					<svg viewBox="0 0 24 24" fill="none" class="h-8 w-8">
						<path
							d="m5 13 4 4L19 7"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</span>
				<h1 class="font-display text-ink mt-4 text-xl font-bold">Agen Omahe terverifikasi</h1>
			{:else}
				<span
					class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700"
					aria-hidden="true"
				>
					<svg viewBox="0 0 24 24" fill="none" class="h-8 w-8">
						<path
							d="M6 6l12 12M18 6 6 18"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
				</span>
				<h1 class="font-display text-ink mt-4 text-xl font-bold">Agen tidak aktif</h1>
			{/if}

			{#if agen.fotoUrl}
				<img
					src={agen.fotoUrl}
					alt="Foto {agen.nama}"
					width="96"
					height="96"
					loading="lazy"
					decoding="async"
					class="border-line mx-auto mt-5 h-24 w-24 rounded-full border object-cover"
				/>
			{:else}
				<span
					class="bg-primary/8 text-primary font-display mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-full text-2xl font-extrabold"
					aria-hidden="true">{inisial}</span
				>
			{/if}

			<p class="font-display text-ink mt-4 text-lg font-bold">{agen.nama}</p>
			<p class="text-muted mt-0.5 text-sm">{agen.kantorNama}</p>
			<p class="text-muted mt-3 font-mono text-xs tracking-wider">{agen.kodeAgen}</p>

			{#if agen.status === 'aktif'}
				<p class="text-muted mt-4 text-sm">
					Membership berlaku sampai
					<span class="text-ink font-medium">{berlakuSampai ?? '—'}</span>.
				</p>
			{:else}
				<p class="text-muted mt-4 text-sm leading-relaxed">
					Membership agen ini sudah berakhir
					{#if berlakuSampai}({berlakuSampai}){/if} atau statusnya dinonaktifkan. Hubungi tim Omahe kalau
					Anda merasa ini tidak wajar.
				</p>
			{/if}
		{:else if data.hasil.layananError}
			<span
				class="bg-surface text-muted mx-auto flex h-14 w-14 items-center justify-center rounded-full"
				aria-hidden="true"
			>
				<svg viewBox="0 0 24 24" fill="none" class="h-8 w-8">
					<path
						d="M12 8v4m0 4h.01M12 3l9.5 16.5h-19L12 3Z"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</span>
			<h1 class="font-display text-ink mt-4 text-xl font-bold">Belum dapat memverifikasi</h1>
			<p class="text-muted mt-3 text-sm leading-relaxed">
				Layanan verifikasi sedang tidak dapat dihubungi. Coba lagi sebentar lagi, atau hubungi tim
				Omahe lewat
				<a href="/kontak" class="text-primary font-medium hover:underline">halaman kontak</a>.
			</p>
		{:else}
			<span
				class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700"
				aria-hidden="true"
			>
				<svg viewBox="0 0 24 24" fill="none" class="h-8 w-8">
					<path
						d="M6 6l12 12M18 6 6 18"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			</span>
			<h1 class="font-display text-ink mt-4 text-xl font-bold">Kode agen tidak dikenali</h1>
			<p class="text-muted mt-3 text-sm leading-relaxed">
				Kode pada tautan ini tidak terdaftar. Pastikan Anda memindai QR pada ID card agen Omahe yang
				sah. Ragu? Hubungi tim Omahe lewat
				<a href="/kontak" class="text-primary font-medium hover:underline">halaman kontak</a>.
			</p>
		{/if}
	</div>

	<p class="text-muted mt-6 text-center text-xs">
		Verifikasi agen resmi Omahe hanya melalui tautan/QR pada ID card agen — bukan tautan lain.
	</p>
</div>
