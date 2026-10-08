<!--
	Dialog "Form Minat" untuk perumahan partner BERBAYAR (MONET-03,
	api-contract.md §8) — dipakai CTA kartu/detail dengan `prioritas > 0`,
	bukan WA langsung. Partner GRATIS tidak memakai komponen ini — tombol
	WA/Telepon mereka tidak berubah sama sekali (keputusan 2026-09-13
	§Kontak langsung di card).

	Submit POST ke `/api/lead` (proxy server internal — `client.ts` itu
	server-only), yang meneruskan ke `POST /public/leads` backend. Pasca
	sukses (LEAD-02, 2026-10-03): tombol utama "Lanjut ke WhatsApp" ke
	nomor dari backend — agen Omahe (mode `kodeAgen`/minat umum maupun
	`ref` AO-…), WA marketing, atau owner perumahan; fallback nomor umum
	Omahe — dengan pesan pembuka berisi nama + nomor `+62…` peminat
	supaya penerima tinggal klik. Lead SUDAH tercatat sebelum WA dibuka.

	Honeypot `website` dikirim APA ADANYA (manusia tidak pernah mengisinya,
	bot iseng mengisi) — keputusannya di server, bukan di sini; respons
	sukses & honeypot SAMA sehingga tidak ada yang bisa dibedakan bot.

	Dialog memakai bits-ui (`Dialog`) — headless, a11y lengkap (focus trap,
	Escape, aria-modal); visualnya design token yang sudah ada, mobile-first
	(hampir penuh layar di layar kecil, max-w-md mulai sm).
-->
<script lang="ts">
	import { page } from '$app/state';
	import { Dialog } from 'bits-ui';
	import X from '@lucide/svelte/icons/x';
	import type { LeadSumber } from '$lib/api/types';
	import { trackEvent } from '$lib/analytics';
	import { LANJUT_WA_OTOMATIS, SITE } from '$lib/config';
	import { pesanWaPeminat, waUrl } from '$lib/utils';
	import Button from './ui/button.svelte';

	let {
		perumahanSlug,
		namaPerumahan,
		sumber,
		ref = null,
		tipeMinatAwal = '',
		opsiTipe = null,
		namaAgen = null,
		kodeAgen = null,
		open = $bindable(false)
	}: {
		/** Slug perumahan tujuan lead — wajib di kontrak API §8. */
		perumahanSlug: string;
		/** Nama perumahan — muncul di judul dialog & pesan sukses. */
		namaPerumahan: string;
		/** `card` | `slider` | `detail` — PEMANGGIL yang men-set (§8). */
		sumber: LeadSumber;
		/** Passthrough `?ref=` dari URL — atribusi mitra, ikut terkirim. */
		ref?: string | null;
		/** Prefill tipe yang diminati (mis. `unit.tipe` dari kartu pencarian). */
		tipeMinatAwal?: string;
		/** Daftar tipe → dirender sebagai select; null/kosong → teks bebas. */
		opsiTipe?: string[] | null;
		/** AGEN-OMAHE-03 — form minat agen Omahe: lead dikirim ke agen ini
		 *  (`ref` = kode pilihan agen), bukan ke tim perumahan. */
		namaAgen?: string | null;
		/** AGEN-OMAHE-04 — mode minat UMUM ke agen (tab Agen Omahe di /mitra,
		 *  tanpa perumahan): POST ke `/api/agen-minat`, field tipe disembunyikan. */
		kodeAgen?: string | null;
		open?: boolean;
	} = $props();

	// Id unik per instance — di /cari ada belasan kartu, hanya SATU dialog
	// yang terbuka di satu waktu, tapi id label tetap tidak boleh tabrakan.
	const uid = $props.id();

	let nama = $state('');
	let telepon = $state('');
	// Prefill dipetik SEKALI dari prop — prop ini statis per mount.
	// svelte-ignore state_referenced_locally
	let tipeMinat = $state(tipeMinatAwal);
	let pesan = $state('');
	/** HONEYPOT — manusia tidak melihat field ini, bot mengisinya. */
	let website = $state('');
	/** Persetujuan privasi WAJIB sebelum submit (api-contract.md §8). */
	let setuju = $state(false);

	let proses = $state(false);
	let sukses = $state(false);
	/** LEAD-02 — link WA pasca-sukses (dibekukan saat submit berhasil). */
	let waLanjut = $state<string | null>(null);
	let pesanError = $state<string | null>(null);

	// Dialog ditutup: kalau pengiriman tadi SUKSES, form dikosongkan untuk
	// pemakaian berikutnya; kalau gagal, isian dipertahankan supaya
	// pengunjung cukup memperbaiki, pesan errornya ikut tetap terlihat.
	$effect(() => {
		if (open) return;
		proses = false;
		if (sukses) {
			sukses = false;
			waLanjut = null;
			nama = '';
			telepon = '';
			tipeMinat = tipeMinatAwal;
			pesan = '';
			website = '';
			setuju = false;
		}
	});

	// Iterasi 1 GA4: dialog DIBUKA → 'lead_form_open' (nama perumahan +
	// sumber CTA). Tanpa isi form apa pun — nama/telepon pengunjung tidak
	// boleh masuk GA (aturan ToS, lihat src/lib/analytics.ts).
	$effect(() => {
		if (open) {
			trackEvent('lead_form_open', { perumahan: namaPerumahan, sumber });
		}
	});

	async function kirim(e: SubmitEvent) {
		e.preventDefault();
		if (proses) return;
		proses = true;
		pesanError = null;
		try {
			const res = kodeAgen
				? await fetch('/api/agen-minat', {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({
							kodeAgen,
							nama: nama.trim(),
							telepon: telepon.trim(),
							pesan: pesan.trim() || undefined,
							website
						})
					})
				: await fetch('/api/lead', {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({
							perumahanSlug,
							nama: nama.trim(),
							telepon: telepon.trim(),
							tipeMinat: tipeMinat.trim() || undefined,
							pesan: pesan.trim() || undefined,
							sumber,
							ref: ref ?? undefined,
							website // honeypot dikirim APA ADANYA — server yang menangani.
						})
					});
			if (!res.ok) {
				// Pesan backend lebih tahu (429 rate limit sudah ramah, 400 punya
				// detail field) — tampilkan apa adanya (api-contract.md §8).
				let teks = 'Pengiriman gagal. Coba lagi sebentar lagi.';
				try {
					const body = await res.json();
					if (typeof body?.message === 'string' && body.message) teks = body.message;
				} catch {
					// body bukan JSON — pakai pesan generik.
				}
				throw new Error(teks);
			}
			// LEAD-02 — tujuan WA dari backend: nomor agen (minat umum maupun
			// ref AO-…) / WA marketing / owner perumahan; null → nomor umum Omahe.
			let tujuan: string | null = null;
			try {
				const body = await res.json();
				if (typeof body?.data?.whatsapp === 'string' && body.data.whatsapp) {
					tujuan = body.data.whatsapp;
				}
			} catch {
				// body bukan JSON — pakai nomor umum Omahe.
			}
			waLanjut = waUrl(
				tujuan ?? page.data.kontak?.whatsapp ?? SITE.whatsapp,
				pesanWaPeminat({
					nama,
					telepon,
					namaPerumahan: namaAgen && kodeAgen ? `layanan agen ${namaAgen}` : namaPerumahan,
					tipeMinat: kodeAgen ? undefined : tipeMinat,
					pesan
				})
			);
			sukses = true;
			// 2026-10-08 — auto-lanjut ke wa.me setelah lead TERSIMPAT (nomor WA
			// gateway terblokir — hand-off chat jadi kanal utama; klik "Kirim" adalah
			// user gesture, location.assign tidak kena popup blocker). Tombol
			// "Lanjut ke WhatsApp" tetap tampil sebagai fallback bila navigasi
			// gagal/diblokir atau saklar dimatikan. jsdom (test) tidak
			// mengimplementasikan navigasi — dilewati supaya output test bersih.
			if (LANJUT_WA_OTOMATIS && waLanjut && !navigator.userAgent.includes('jsdom')) {
				try {
					window.location.assign(waLanjut);
				} catch {
					// Navigasi gagal — tombol manual tetap ada.
				}
			}
			// Iterasi 1 GA4: submit SUKSES → 'lead_form_submit' — HANYA metadata
			// non-identitas. Nama & nomor telepon pengunjung TIDAK PERNAH masuk
			// sini (aturan Google ToS, lihat src/lib/analytics.ts); `tipe_minat`
			// bisa undefined (ter-strip) kalau dibiarkan kosong.
			trackEvent('lead_form_submit', {
				perumahan: namaPerumahan,
				sumber,
				tipe_minat: tipeMinat.trim() || undefined,
				ada_ref: Boolean(ref)
			});
		} catch (err) {
			pesanError =
				err instanceof Error ? err.message : 'Pengiriman gagal. Coba lagi sebentar lagi.';
		} finally {
			proses = false;
		}
	}

	// Tinggi 44px selaras target sentuh mobile-first di ui/button.svelte.
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
					<Dialog.Title class="font-display text-ink text-lg font-extrabold">
						{kodeAgen && namaAgen ? `Hubungi ${namaAgen}` : `Minat — ${namaPerumahan}`}
					</Dialog.Title>
					<Dialog.Description class="text-muted mt-1 text-sm">
						{#if namaAgen}
							Tinggalkan kontak Anda, agen {namaAgen} akan menghubungi Anda.
						{:else}
							Tinggalkan kontak Anda, tim {namaPerumahan} akan menghubungi Anda.
						{/if}
					</Dialog.Description>
				</div>
				<Dialog.Close
					class="text-muted hover:text-ink hover:bg-surface -mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
					aria-label="Tutup form minat"
				>
					<X class="h-5 w-5" aria-hidden="true" />
				</Dialog.Close>
			</div>

			{#if sukses}
				<div role="status" class="flex flex-col gap-4">
					<p class="text-ink text-sm leading-relaxed">
						{#if namaAgen}
							Terima kasih, agen {namaAgen} akan menghubungi Anda.
						{:else}
							Terima kasih, tim {namaPerumahan} akan menghubungi Anda.
						{/if}
					</p>
					<!-- LEAD-02 — lanjut chat ke nomor perumahan/agen (fallback nomor
					     umum Omahe); pesan pembuka memuat nama + nomor +62 peminat. -->
					<Button
						variant="whatsapp"
						size="lg"
						href={waLanjut ?? waUrl(page.data.kontak?.whatsapp ?? SITE.whatsapp)}
						target="_blank"
						rel="noopener"
						onclick={() => trackEvent('whatsapp_click', { perumahan: namaPerumahan })}
					>
						<svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4" aria-hidden="true">
							<path
								d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.86 9.86 0 0 0 4.74 1.21c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm5.72 14.03c-.24.67-1.4 1.28-1.93 1.32-.5.04-.96.22-3.24-.67-2.73-1.07-4.46-3.85-4.6-4.03-.13-.18-1.1-1.46-1.1-2.78 0-1.32.7-1.97.94-2.24.25-.27.54-.34.72-.34h.52c.17 0 .4-.06.62.48.24.57.8 1.98.87 2.12.07.14.12.3.02.49-.1.18-.15.29-.29.45-.14.16-.3.36-.43.48-.14.14-.29.29-.13.57.17.27.74 1.22 1.58 1.97 1.09.97 2 1.27 2.29 1.41.28.14.45.12.61-.07.17-.2.7-.82.89-1.1.18-.28.37-.23.62-.14.25.09 1.6.76 1.87.9.28.13.46.2.53.31.07.11.07.65-.17 1.32z"
							/>
						</svg>
						Lanjut ke WhatsApp
					</Button>
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
							name="nama"
							type="text"
							required
							maxlength="100"
							autocomplete="name"
							placeholder="Nama lengkap"
							bind:value={nama}
							class={kelasField}
						/>
					</div>

					<div>
						<label for="{uid}-telepon" class="text-ink mb-1 block text-sm font-medium">
							Nomor WhatsApp
						</label>
						<input
							id="{uid}-telepon"
							name="telepon"
							type="tel"
							required
							maxlength="20"
							inputmode="tel"
							autocomplete="tel"
							placeholder="08xxxxxxxxxx"
							bind:value={telepon}
							class={kelasField}
						/>
					</div>

					{#if !kodeAgen}<div>
							<label for="{uid}-tipe" class="text-ink mb-1 block text-sm font-medium">
								Tipe yang diminati <span class="text-muted font-normal">(opsional)</span>
							</label>
							{#if opsiTipe && opsiTipe.length > 0}
								<!-- Pemanggil mengirim daftar tipe (mis. halaman detail yang
							     punya daftar tipe unit) → select; teks bebas kalau tidak. -->
								<select id="{uid}-tipe" name="tipeMinat" bind:value={tipeMinat} class={kelasField}>
									<option value="">Belum tahu</option>
									{#each opsiTipe as tipe (tipe)}
										<option value={tipe}>{tipe}</option>
									{/each}
								</select>
							{:else}
								<input
									id="{uid}-tipe"
									name="tipeMinat"
									type="text"
									maxlength="50"
									placeholder="mis. Tipe 36/72"
									bind:value={tipeMinat}
									class={kelasField}
								/>
							{/if}
						</div>{/if}

					<div>
						<label for="{uid}-pesan" class="text-ink mb-1 block text-sm font-medium">
							Pesan <span class="text-muted font-normal">(opsional)</span>
						</label>
						<textarea
							id="{uid}-pesan"
							name="pesan"
							rows="3"
							maxlength="500"
							placeholder="Minta brosur, tanya promo, jadwal survey, dll."
							bind:value={pesan}
							class="{kelasField} h-auto py-2"></textarea>
					</div>

					<!-- HONEYPOT (api-contract.md §8) — tersembunyi total, TANPA
					     label/aria apa pun yang terlihat, tabindex -1 supaya tidak
					     bisa di-focus keyboard. Manusia membiarkannya kosong. -->
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
							class="text-primary accent-primary mt-0.5 h-4 w-4 shrink-0"
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

					{#if pesanError}
						<!-- 429 rate limit dll. — pesan backend tampil apa adanya (§8). -->
						<p class="text-sm text-red-700" role="alert">{pesanError}</p>
					{/if}

					<!-- Submit terkunci sampai persetujuan dicentang (§8) & saat proses. -->
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
