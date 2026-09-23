<!-- DRAF — lihat catatan yang sama di `/privasi`. -->
<script lang="ts">
	import { SITE } from '$lib/config';
	import { page } from '$app/state';

	// ADMIN-05 — halaman ini di-prerender: email = nilai saat build (fallback config).
	const emailOmahe = $derived(page.data.kontak?.email ?? SITE.email);
</script>

<svelte:head>
	<title>Syarat &amp; Ketentuan · Omahe</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<h1 class="font-display text-ink text-2xl font-bold sm:text-3xl">Syarat &amp; Ketentuan</h1>
	<p
		class="border-accent-light bg-accent-light/25 text-ink mt-4 rounded-lg border p-4 text-sm"
		role="note"
	>
		<span class="font-semibold">Draf.</span> Naskah ini belum ditinjau penasihat hukum dan belum boleh
		dipakai saat situs dibuka untuk umum.
	</p>

	<div class="text-muted mt-6 space-y-6 text-sm leading-relaxed">
		<section>
			<h2 class="font-display text-ink text-lg font-bold">Peran Omahe</h2>
			<p class="mt-2">
				Omahe adalah portal informasi properti. Kami bukan pihak dalam perjanjian jual beli antara
				Anda dan pengembang, dan tidak bertindak sebagai agen properti, penilai, maupun lembaga
				pembiayaan.
			</p>
		</section>
		<section>
			<h2 class="font-display text-ink text-lg font-bold">Keakuratan informasi</h2>
			<p class="mt-2">
				Harga, luas, ketersediaan unit, dan spesifikasi bersumber dari pengembang dan dapat berubah
				sewaktu-waktu tanpa pemberitahuan. Pastikan kembali seluruh detail langsung ke pengembang
				sebelum membuat komitmen apa pun.
			</p>
		</section>
		<section>
			<h2 class="font-display text-ink text-lg font-bold">Simulasi KPR</h2>
			<p class="mt-2">
				Kalkulator KPR di situs ini menghasilkan estimasi berdasarkan angka yang Anda masukkan.
				Hasilnya bukan penawaran kredit dan tidak mengikat bank mana pun.
			</p>
		</section>
		<section>
			<h2 class="font-display text-ink text-lg font-bold">Kontak</h2>
			<p class="mt-2">
				Pertanyaan mengenai ketentuan ini: <a
					href="mailto:{emailOmahe}"
					class="text-primary hover:underline">{emailOmahe}</a
				>.
			</p>
		</section>
	</div>
</div>
