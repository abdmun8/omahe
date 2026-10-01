<!--
	Blok "Agen yang memasarkan" di detail perumahan (AGEN-OMAHE-03, api-contract
	§21). Tiap agen: foto/inisial, nama, kantor, tanda terverifikasi (link ke
	/verifikasi/:kodeAgen), dan CTA "Hubungi Agen" = FORM MINAT (keputusan 3)
	yang mengirim `ref` = kode pilihan agen itu — lead tercatat untuk agen
	tsb (bukan nomor WA agen yang dibuka langsung).

	Urutan & penyaringan `?ref=` sudah dikerjakan backend; komponen ini cukup
	merender apa adanya. List kosong → tidak merender apa pun.
-->
<script lang="ts">
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import BadgeProfesional from './badge-profesional.svelte';
	import type { AgenPemasar } from '$lib/api/types';
	import { trackEvent } from '$lib/analytics';
	import LeadFormDialog from './lead-form-dialog.svelte';
	import Button from './ui/button.svelte';

	let {
		agen,
		perumahanSlug,
		namaPerumahan,
		opsiTipe = null
	}: {
		agen: AgenPemasar[];
		perumahanSlug: string;
		namaPerumahan: string;
		opsiTipe?: string[] | null;
	} = $props();

	let dipilih = $state<AgenPemasar | null>(null);
	let terbuka = $state(false);

	/** Inisial fallback foto — dua kata pertama (pola mitra-card). */
	function inisial(nama: string): string {
		return (
			nama
				.split(/\s+/)
				.filter((kata) => /[a-zA-Z]/.test(kata[0] ?? ''))
				.slice(0, 2)
				.map((kata) => kata[0]?.toUpperCase())
				.join('') || 'A'
		);
	}

	function hubungi(a: AgenPemasar) {
		dipilih = a;
		terbuka = true;
		// Non-PII: kode agen publik (sudah tercetak di ID card).
		trackEvent('agen_hubungi_click', { perumahan: perumahanSlug, agen: a.kodeAgen });
	}
</script>

{#if agen.length > 0}
	<section aria-labelledby="agen-pemasar-judul">
		<h2 id="agen-pemasar-judul" class="font-display text-ink text-xl font-bold">
			{agen.length === 1 ? 'Agen yang memasarkan' : 'Agen yang memasarkan perumahan ini'}
		</h2>
		<p class="text-muted mt-1 text-sm">
			Agen resmi Omahe — identitasnya bisa Anda cek lewat tautan verifikasi.
		</p>
		<ul class="mt-4 grid list-none gap-3 sm:grid-cols-2">
			{#each agen as a (a.kodeRef)}
				<li class="border-line flex items-center gap-4 rounded-2xl border bg-white p-4">
					{#if a.fotoUrl}
						<img
							src={a.fotoUrl}
							alt=""
							class="h-14 w-14 shrink-0 rounded-full object-cover"
							loading="lazy"
						/>
					{:else}
						<span
							class="bg-surface text-primary font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
							aria-hidden="true">{inisial(a.nama)}</span
						>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="text-ink flex items-center gap-1 font-semibold">
							<span class="truncate">{a.nama}</span>{#if a.profesional}<BadgeProfesional
									class="shrink-0"
								/>{/if}
						</p>
						<p class="text-muted truncate text-sm">{a.kantorNama}</p>
						<a
							href={`/verifikasi/${encodeURIComponent(a.kodeAgen)}`}
							class="text-primary mt-0.5 inline-flex items-center gap-1 text-xs font-medium hover:underline"
						>
							<ShieldCheck class="h-3.5 w-3.5" aria-hidden="true" /> Agen resmi · {a.kodeAgen}
						</a>
					</div>
					<Button variant="outline" size="sm" class="shrink-0" onclick={() => hubungi(a)}>
						Hubungi
					</Button>
				</li>
			{/each}
		</ul>
	</section>

	{#if dipilih}
		<LeadFormDialog
			bind:open={terbuka}
			{perumahanSlug}
			{namaPerumahan}
			sumber="detail"
			ref={dipilih.kodeRef}
			namaAgen={dipilih.nama}
			{opsiTipe}
		/>
	{/if}
{/if}
