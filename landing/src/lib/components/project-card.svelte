<!-- Kartu satu PROYEK perumahan — dipakai di profil developer (`/developer/:companySlug`). -->
<script lang="ts">
	import type { DeveloperProject } from '$lib/api/types';
	import { formatAngka, formatRupiah, formatRupiahPenuh } from '$lib/utils';
	import { withRef } from '$lib/ref';
	import ContactButtons from './contact-buttons.svelte';
	import PhotoPlaceholder from './photo-placeholder.svelte';

	let { proyek, ref = null }: { proyek: DeveloperProject; ref?: string | null } = $props();
</script>

<article
	class="border-line flex flex-col overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md"
>
	{#if proyek.fotoUrl}
		<img
			src={proyek.fotoUrl}
			alt="Foto {proyek.nama}"
			loading="lazy"
			class="h-40 w-full object-cover"
		/>
	{:else}
		<PhotoPlaceholder class="h-40 w-full" />
	{/if}

	<div class="flex flex-1 flex-col p-4">
		<h3 class="font-display text-ink text-base font-bold">
			<a href={withRef(`/perumahan/${proyek.slug}`, ref)} class="hover:text-primary"
				>{proyek.nama}</a
			>
		</h3>
		{#if proyek.regionNama}
			<p class="text-muted mt-0.5 text-xs">{proyek.regionNama}</p>
		{/if}

		<p class="text-muted mt-3 text-xs">Mulai dari</p>
		<p
			class="font-display text-primary text-lg font-extrabold"
			title={formatRupiahPenuh(proyek.hargaMulai)}
		>
			{formatRupiah(proyek.hargaMulai)}
		</p>
		<p class="text-muted mt-1 text-xs">{formatAngka(proyek.unitTersedia)} unit tersedia</p>

		<ContactButtons konteks={proyek.nama} class="mt-4" />
	</div>
</article>
