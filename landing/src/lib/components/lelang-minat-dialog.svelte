<!--
	LELANG-01 — form minat rumah lelang: lead dicatat (superadmin) lalu
	"Lanjut ke WhatsApp" ke nomor kontak Omahe/principal (keputusan user —
	sementara semua lelang lewat kontak principal). Pola LeadFormDialog:
	honeypot `website`, persetujuan privasi wajib, pesan backend apa adanya.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { Dialog } from 'bits-ui';
	import X from '@lucide/svelte/icons/x';
	import { trackEvent } from '$lib/analytics';
	import { SITE } from '$lib/config';
	import { nomorInternasional, waUrl } from '$lib/utils';
	import Button from './ui/button.svelte';

	let {
		slug,
		judul,
		kodeLot = null,
		open = $bindable(false)
	}: { slug: string; judul: string; kodeLot?: string | null; open?: boolean } = $props();

	const uid = $props.id();
	let nama = $state('');
	let telepon = $state('');
	let pesan = $state('');
	let website = $state('');
	let setuju = $state(false);
	let proses = $state(false);
	let waLanjut = $state<string | null>(null);
	let pesanError = $state<string | null>(null);

	$effect(() => {
		if (open) return;
		proses = false;
		if (waLanjut) {
			waLanjut = null;
			nama = '';
			telepon = '';
			pesan = '';
			website = '';
			setuju = false;
		}
	});

	async function kirim(e: SubmitEvent) {
		e.preventDefault();
		if (proses) return;
		proses = true;
		pesanError = null;
		try {
			const res = await fetch('/api/lelang-minat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					slug,
					nama: nama.trim(),
					telepon: telepon.trim(),
					pesan: pesan.trim() || undefined,
					website
				})
			});
			if (!res.ok) {
				let teks = 'Pengiriman gagal. Coba lagi sebentar lagi.';
				try {
					const body = await res.json();
					if (typeof body?.message === 'string' && body.message) teks = body.message;
				} catch {
					// bukan JSON
				}
				throw new Error(teks);
			}
			const baris = [
				`Halo, saya ${nama.trim()} (${nomorInternasional(telepon)}).`,
				`Saya tertarik dengan rumah lelang "${judul}"${kodeLot ? ` (kode lot ${kodeLot})` : ''} yang saya lihat di Omahe.`
			];
			if (pesan.trim()) baris.push('', pesan.trim());
			waLanjut = waUrl(page.data.kontak?.whatsapp ?? SITE.whatsapp, baris.join('\n'));
			trackEvent('lead_form_submit', { perumahan: `lelang:${slug}`, sumber: 'lelang' });
		} catch (err) {
			pesanError =
				err instanceof Error ? err.message : 'Pengiriman gagal. Coba lagi sebentar lagi.';
		} finally {
			proses = false;
		}
	}

	const kelasField =
		'border-line text-ink placeholder:text-muted h-11 w-full rounded-lg border bg-white px-3 text-base';
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/60" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[85dvh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
		>
			<div class="flex items-start justify-between gap-4">
				<div>
					<Dialog.Title class="font-display text-ink text-lg font-extrabold"
						>Minat — {judul}</Dialog.Title
					>
					<Dialog.Description class="text-muted mt-1 text-sm">
						Tinggalkan kontak Anda, lalu lanjut tanya lewat WhatsApp tim Omahe.
					</Dialog.Description>
				</div>
				<Dialog.Close
					class="text-muted hover:text-ink -mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
					aria-label="Tutup"
				>
					<X class="h-5 w-5" aria-hidden="true" />
				</Dialog.Close>
			</div>

			{#if waLanjut}
				<div role="status" class="flex flex-col gap-4">
					<p class="text-ink text-sm">
						Terima kasih, data Anda tercatat. Lanjutkan percakapan lewat WhatsApp.
					</p>
					<Button variant="whatsapp" size="lg" href={waLanjut} target="_blank" rel="noopener"
						>Lanjut ke WhatsApp</Button
					>
					<Dialog.Close>
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-full">Tutup</Button>
						{/snippet}
					</Dialog.Close>
				</div>
			{:else}
				<form class="flex flex-col gap-3" onsubmit={kirim}>
					<div>
						<label for="{uid}-nama" class="text-ink mb-1 block text-sm font-medium">Nama</label>
						<input
							id="{uid}-nama"
							required
							maxlength="100"
							autocomplete="name"
							bind:value={nama}
							class={kelasField}
							placeholder="Nama lengkap"
						/>
					</div>
					<div>
						<label for="{uid}-telepon" class="text-ink mb-1 block text-sm font-medium"
							>Nomor WhatsApp</label
						>
						<input
							id="{uid}-telepon"
							type="tel"
							required
							maxlength="20"
							inputmode="tel"
							autocomplete="tel"
							bind:value={telepon}
							class={kelasField}
							placeholder="08xxxxxxxxxx"
						/>
					</div>
					<div>
						<label for="{uid}-pesan" class="text-ink mb-1 block text-sm font-medium"
							>Pesan <span class="text-muted font-normal">(opsional)</span></label
						>
						<textarea
							id="{uid}-pesan"
							rows="3"
							maxlength="500"
							bind:value={pesan}
							class="{kelasField} h-auto py-2"
							placeholder="Tanya syarat, cara ikut lelang, dll."></textarea>
					</div>
					<div class="hidden" aria-hidden="true">
						<input
							type="text"
							name="website"
							tabindex="-1"
							autocomplete="off"
							bind:value={website}
						/>
					</div>
					<label class="flex items-start gap-2 text-xs leading-relaxed">
						<input
							type="checkbox"
							required
							bind:checked={setuju}
							class="accent-primary mt-0.5 h-4 w-4 shrink-0"
						/>
						<span class="text-muted">
							Saya setuju data kontak saya diproses sesuai
							<a
								href="/privasi"
								target="_blank"
								rel="noopener"
								class="text-primary font-medium hover:underline">Kebijakan Privasi</a
							>.
						</span>
					</label>
					{#if pesanError}<p class="text-sm text-red-700" role="alert">{pesanError}</p>{/if}
					<Button
						type="submit"
						variant="primary"
						size="lg"
						class="w-full"
						disabled={proses || !setuju}
					>
						{proses ? 'Mengirim…' : 'Kirim'}
					</Button>
				</form>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
