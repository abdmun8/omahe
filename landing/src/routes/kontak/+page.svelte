<script lang="ts">
	import { SITE } from '$lib/config';
	import { page } from '$app/state';
	import { formatNomorTampil, telUrl, waUrl } from '$lib/utils';
	import Button from '$lib/components/ui/button.svelte';

	// ADMIN-05 — kontak diatur principal di admin (API), fallback config.
	const kontak = $derived(
		page.data.kontak ?? { whatsapp: SITE.whatsapp, telepon: SITE.telepon, email: SITE.email }
	);
</script>

<svelte:head>
	<title>Kontak · Omahe</title>
	<meta name="description" content="Hubungi tim Omahe lewat WhatsApp, telepon, atau email." />
	<meta property="og:title" content="Kontak · Omahe" />
	<meta
		property="og:description"
		content="Hubungi tim Omahe lewat WhatsApp, telepon, atau email."
	/>
	<meta property="og:image" content={`${SITE.url}/omahe-logo.jpeg`} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<h1 class="font-display text-ink text-2xl font-bold sm:text-3xl">Hubungi Kami</h1>
	<p class="text-muted mt-2 text-sm">
		Ada pertanyaan soal unit, proses pengajuan, atau ingin memasarkan proyek Anda di Omahe? Tulis ke
		kami.
	</p>

	<dl class="mt-8 grid gap-4 sm:grid-cols-2">
		<div class="border-line rounded-xl border bg-white p-5">
			<dt class="text-muted text-xs">WhatsApp</dt>
			<dd class="font-display text-ink mt-1 text-lg font-bold">
				{formatNomorTampil(kontak.whatsapp)}
			</dd>
			<Button
				variant="whatsapp"
				class="mt-3 w-full"
				href={waUrl(kontak.whatsapp)}
				target="_blank"
				rel="noopener"
			>
				Chat WhatsApp
			</Button>
		</div>
		<div class="border-line rounded-xl border bg-white p-5">
			<dt class="text-muted text-xs">Telepon</dt>
			<dd class="font-display text-ink mt-1 text-lg font-bold">
				{formatNomorTampil(kontak.telepon)}
			</dd>
			<Button variant="outline" class="mt-3 w-full" href={telUrl(kontak.telepon)}
				>Telepon Sekarang</Button
			>
		</div>
		<div class="border-line rounded-xl border bg-white p-5 sm:col-span-2">
			<dt class="text-muted text-xs">Email</dt>
			<dd class="font-display text-ink mt-1 text-lg font-bold">
				<a href="mailto:{kontak.email}" class="hover:text-primary">{kontak.email}</a>
			</dd>
		</div>
	</dl>
</div>
