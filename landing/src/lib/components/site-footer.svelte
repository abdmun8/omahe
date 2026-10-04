<script lang="ts">
	import { NAV, SITE } from '$lib/config';
	import { withRef } from '$lib/ref';
	import { page } from '$app/state';

	// ADMIN-05 — email Omahe dari API (layout root), fallback config.
	const emailOmahe = $derived(page.data.kontak?.email ?? SITE.email);
	// ADMIN-06 — tagline dari admin, fallback config.
	const tagline = $derived(page.data.teks?.tagline ?? SITE.tagline);

	// KONTAK-01 — alamat kantor & media sosial dari admin (kosong = disembunyikan).
	const situs = $derived(page.data.situs ?? { alamatKantor: null, sosial: {} });
	const LABEL_SOSIAL = {
		instagram: 'Instagram',
		facebook: 'Facebook',
		tiktok: 'TikTok',
		youtube: 'YouTube'
	} as const;
	const sosial = $derived(
		(Object.keys(LABEL_SOSIAL) as (keyof typeof LABEL_SOSIAL)[])
			.filter((k) => situs.sosial[k])
			.map((k) => ({ label: LABEL_SOSIAL[k], url: situs.sosial[k] as string }))
	);

	const ref = $derived(page.data.ref as string | null);
	const tahun = new Date().getFullYear();
</script>

<footer class="border-line bg-surface mt-16 border-t">
	<div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
		<div class="sm:col-span-2 lg:col-span-2">
			<span class="font-display text-primary text-xl font-extrabold">
				Omahe<span class="text-accent">.</span>
			</span>
			<p class="font-display text-accent-dark mt-1 text-sm">{tagline}</p>
			<p class="text-muted mt-3 max-w-sm text-sm leading-relaxed">{SITE.deskripsi}</p>
			{#if situs.alamatKantor}
				<p class="text-muted mt-3 max-w-sm text-sm leading-relaxed">{situs.alamatKantor}</p>
			{/if}
			{#if sosial.length > 0}
				<ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
					{#each sosial as s (s.label)}
						<li>
							<a
								href={s.url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary hover:underline">{s.label}</a
							>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div>
			<h2 class="text-ink text-sm font-semibold">Jelajahi</h2>
			<ul class="text-muted mt-3 space-y-2 text-sm">
				{#each NAV as item (item.href)}
					<li><a href={withRef(item.href, ref)} class="hover:text-primary">{item.label}</a></li>
				{/each}
				<!-- PROMO-02 — di footer (bukan nav utama): daftar promo bisa kosong. -->
				<li><a href={withRef('/promo', ref)} class="hover:text-primary">Promo</a></li>
				<li><a href={withRef('/agen', ref)} class="hover:text-primary">Agen Properti</a></li>
				<!-- omahe#3 — rekrutmen jaringan: nav utama tetap 7 item (muat tanpa
				     overflow, terverifikasi MITRA-01), pintu masuknya footer + banner
				     homepage + empty-state /mitra. -->
				<li><a href={withRef('/gabung', ref)} class="hover:text-primary">Gabung</a></li>
			</ul>
		</div>

		<div>
			<h2 class="text-ink text-sm font-semibold">Legal</h2>
			<ul class="text-muted mt-3 space-y-2 text-sm">
				<li><a href="/privasi" class="hover:text-primary">Kebijakan Privasi</a></li>
				<li><a href="/syarat-ketentuan" class="hover:text-primary">Syarat &amp; Ketentuan</a></li>
				<li><a href="/hapus-akun" class="hover:text-primary">Hapus Akun</a></li>
				<li><a href="mailto:{emailOmahe}" class="hover:text-primary">{emailOmahe}</a></li>
			</ul>
		</div>
	</div>

	<div class="border-line border-t">
		<p class="text-muted mx-auto max-w-6xl px-4 py-4 text-xs">
			© {tahun} Omahe. Harga dan ketersediaan unit dapat berubah sewaktu-waktu tanpa pemberitahuan.
		</p>
	</div>
</footer>
