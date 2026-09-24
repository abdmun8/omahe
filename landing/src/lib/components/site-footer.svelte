<script lang="ts">
	import { NAV, SITE } from '$lib/config';
	import { withRef } from '$lib/ref';
	import { page } from '$app/state';

	// ADMIN-05 — email Omahe dari API (layout root), fallback config.
	const emailOmahe = $derived(page.data.kontak?.email ?? SITE.email);
	// ADMIN-06 — tagline dari admin, fallback config.
	const tagline = $derived(page.data.teks?.tagline ?? SITE.tagline);

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
		</div>

		<div>
			<h2 class="text-ink text-sm font-semibold">Jelajahi</h2>
			<ul class="text-muted mt-3 space-y-2 text-sm">
				{#each NAV as item (item.href)}
					<li><a href={withRef(item.href, ref)} class="hover:text-primary">{item.label}</a></li>
				{/each}
				<!-- PROMO-02 — di footer (bukan nav utama): daftar promo bisa kosong. -->
				<li><a href={withRef('/promo', ref)} class="hover:text-primary">Promo</a></li>
			</ul>
		</div>

		<div>
			<h2 class="text-ink text-sm font-semibold">Legal</h2>
			<ul class="text-muted mt-3 space-y-2 text-sm">
				<li><a href="/privasi" class="hover:text-primary">Kebijakan Privasi</a></li>
				<li><a href="/syarat-ketentuan" class="hover:text-primary">Syarat &amp; Ketentuan</a></li>
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
