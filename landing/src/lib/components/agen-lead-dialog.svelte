<!--
	Dialog "Daftarkan Pembeli" (SESI-OMAHE-01 + AGEN-OMAHE-11) — HANYA
	untuk pengunjung yang sesinya agen Omahe aktif (varian tombol dibuka
	dari `contact-buttons`/`sticky-cta` saat `sesiAgen.agen` ada; pemilihan
	dialognya di `minat-dialog.svelte`).

	Agen menginput lead atas nama PEMBELI ke perumahan yang tampil di Omahe;
	agen ditetapkan backend dari SESI (cookie `session` diteruskan proxy
	`/api/agen-lead`), TIDAK memakai/mengirim `ref` sama sekali — atribusi
	agen penginput, bukan ref URL (epic §Desain teknis).

	Sukses → "Pembeli terdaftar ✓ — terlindungi s.d. <tanggal>" (proteksi
	lead 60 hari, epic keputusan 3) + tombol "Lihat di Panel Agen" +
	"Daftarkan pembeli lain". 401 (sesi mati) → pesan "Sesi berakhir" +
	tombol "Lanjut lewat WhatsApp" yang MENIOLKAN store sesi (`setSesiAgenNull`)
	saat diklik — wrapper minat-dialog lalu beralih cabang ke form minat
	biasa dengan status terbuka yang sama.

	Estimasi komisi (KOMISI-AGEN-01) BELUM ada — slot di blok sukses
	ditandai komentar, jangan menampilkan angka apa pun sebelum epic itu.

	Pola visual/struktur: `lead-form-dialog.svelte` (bits-ui Dialog,
	mobile-first, token yang ada).
-->
<script lang="ts">
	import { Dialog } from 'bits-ui';
	import X from '@lucide/svelte/icons/x';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import type { HasilInputLeadAgen } from '$lib/api/types';
	import { trackEvent } from '$lib/analytics';
	import { sesiAgen, setSesiAgenNull } from '$lib/sesi-agen.svelte';
	import Button from './ui/button.svelte';

	let {
		perumahanSlug,
		namaPerumahan,
		tipeAwal = '',
		opsiTipe = null,
		open = $bindable(false)
	}: {
		/** Slug perumahan tujuan lead (wajib, kontrak AGEN-OMAHE-11). */
		perumahanSlug: string;
		/** Nama perumahan — judul dialog & param event GA. */
		namaPerumahan: string;
		/** Prefill tipe diminati (NAMA tipe, mis. `unit.tipe` dari kartu). */
		tipeAwal?: string;
		/** Daftar nama tipe → select; null/kosong → teks bebas. */
		opsiTipe?: string[] | null;
		open?: boolean;
	} = $props();

	const uid = $props.id();

	let namaPembeli = $state('');
	let whatsapp = $state('');
	// Prefill dipetik SEKALI dari prop — statis per mount.
	// svelte-ignore state_referenced_locally
	let tipeDiminati = $state(tipeAwal);
	let catatan = $state('');

	let proses = $state(false);
	let sukses = $state<HasilInputLeadAgen | null>(null);
	let pesanError = $state<string | null>(null);
	/** 401 dari proxy — sesi agen sudah mati. */
	let sesiHabis = $state(false);

	// Tutup → reset form bila tadi SUKSES (bila gagal, isian dipertahankan
	// supaya cukup diperbaiki — pola lead-form-dialog). Kecuali 401: sesi
	// sudah mati, store agen WAJIB dinolkan juga supaya seluruh UI kembali
	// ke varian anonim (dialog ini di-unmount oleh cabang wrapper).
	$effect(() => {
		if (open) return;
		proses = false;
		if (sesiHabis) {
			setSesiAgenNull();
			sesiHabis = false;
			pesanError = null;
		}
		if (sukses) {
			sukses = null;
			pesanError = null;
			sesiHabis = false;
			namaPembeli = '';
			whatsapp = '';
			tipeDiminati = tipeAwal;
			catatan = '';
		}
	});

	// GA4 — dibuka → `agen_lead_open` (metadata saja, tanpa PII).
	$effect(() => {
		if (open) trackEvent('agen_lead_open', { perumahan: namaPerumahan });
	});

	/**
	 * Slug tipe = aturan `slugifyTipe` backend (lowercase, non-alnum → '-'):
	 * nama tipe yang dipilih/diketik agen dikonversi lokal — NAMA tipe dari
	 * data backend (opsiTipe/unit.tipe) menghasilkan slug identik dengan
	 * `unit.tipeSlug`/`tipe.slug` milik backend, jadi tidak perlu prop slug
	 * terpisah. Backend menolak slug tak dikenal (400 ramah — agen tinggal
	 * meluruskan isian).
	 */
	function slugTipe(nama: string): string {
		return nama
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	const adaDaftarTipe = $derived(Boolean(opsiTipe && opsiTipe.length > 0));

	/** Tipe pasti dikenal backend: dari daftar pemanggil atau `tipeAwal`
	 *  (nama tipe data backend milik kartu/halaman tipe). */
	function tipeDikenal(nama: string): boolean {
		return (opsiTipe ?? []).includes(nama) || (!!tipeAwal && nama === tipeAwal.trim());
	}

	function gabungCatatan(tipeBebas: string, isi: string): string | undefined {
		const bagian = [tipeBebas ? `Tipe diminati: ${tipeBebas}` : '', isi].filter(Boolean);
		return bagian.length ? bagian.join('\n').slice(0, 1000) : undefined;
	}

	async function kirim(e: SubmitEvent) {
		e.preventDefault();
		if (proses) return;
		proses = true;
		pesanError = null;
		const tipe = tipeDiminati.trim();
		try {
			const res = await fetch('/api/agen-lead', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					slug: perumahanSlug,
					namaPembeli: namaPembeli.trim(),
					whatsappPembeli: whatsapp.trim(),
					// Tipe dari daftar (select) → slug yang pasti dikenal backend.
					// Tipe ketik bebas (tanpa daftar) TIDAK dikirim sebagai slug —
					// salah eja akan ditolak 400 & menggagalkan pendaftaran —
					// melainkan digabung ke catatan untuk admin perumahan.
					tipeSlug: tipe && tipeDikenal(tipe) ? slugTipe(tipe) : undefined,
					catatan: gabungCatatan(tipe && !tipeDikenal(tipe) ? tipe : '', catatan.trim())
				})
			});
			if (!res.ok) {
				let teks = 'Pendaftaran gagal. Coba lagi sebentar lagi.';
				try {
					const body = await res.json();
					if (typeof body?.message === 'string' && body.message) teks = body.message;
				} catch {
					// body bukan JSON — pakai pesan generik.
				}
				// 401 = sesi agen mati (SESI-OMAHE-01). Store agen JANGAN
				// dinolkan di sini — dialog ini sendiri dirender di cabang
				// `sesiAgen.agen` (minat-dialog); menolanya sekarang = dialog
				// di-unmount sebelum pesan terbaca. Nolkan saat tombol
				// "Lanjut lewat WhatsApp" diklik (atau dialog ditutup).
				if (res.status === 401) {
					sesiHabis = true;
					teks = 'Sesi berakhir, silakan masuk lagi.';
				}
				throw new Error(teks);
			}
			const body = (await res.json()) as { data?: HasilInputLeadAgen };
			sukses = body.data ?? null;
			// GA4 — submit SUKSES. TANPA PII: nama & nomor WA PEMBELI tidak
			// pernah masuk params (aturan ToS, src/lib/analytics.ts).
			trackEvent('agen_lead_submit', {
				perumahan: namaPerumahan,
				tipe_minat: tipe || undefined
			});
		} catch (err) {
			pesanError =
				err instanceof Error ? err.message : 'Pendaftaran gagal. Coba lagi sebentar lagi.';
		} finally {
			proses = false;
		}
	}

	/** "Daftarkan pembeli lain" — form kosong lagi, dialog tetap terbuka. */
	function ulang() {
		sukses = null;
		pesanError = null;
		sesiHabis = false;
		namaPembeli = '';
		whatsapp = '';
		tipeDiminati = tipeAwal;
		catatan = '';
	}

	const kelasField =
		'border-line text-ink placeholder:text-muted h-11 w-full rounded-lg border bg-white px-3 text-base';

	const tanggalLindung = $derived(
		sukses?.kunciSampai
			? new Date(sukses.kunciSampai).toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				})
			: null
	);
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
						Daftarkan Pembeli — {namaPerumahan}
					</Dialog.Title>
					<Dialog.Description class="text-muted mt-1 text-sm">
						Anda masuk sebagai agen
						{#if sesiAgen.agen}
							<span class="text-ink font-medium">{sesiAgen.agen.nama}</span>
							({sesiAgen.agen.kodeAgen}){/if}. Lead tercatat atas nama Anda.
					</Dialog.Description>
				</div>
				<Dialog.Close
					class="text-muted hover:text-ink hover:bg-surface -mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
					aria-label="Tutup dialog daftarkan pembeli"
				>
					<X class="h-5 w-5" aria-hidden="true" />
				</Dialog.Close>
			</div>

			{#if sukses}
				<div role="status" class="flex flex-col gap-4">
					<p class="text-ink text-sm leading-relaxed">
						Pembeli terdaftar ✓ — terlindungi s.d.
						{#if tanggalLindung}<span class="font-semibold">{tanggalLindung}</span>{/if}.
					</p>
					<p class="text-muted text-xs leading-relaxed">
						Pembeli akan menerima WhatsApp konfirmasi bahwa Anda mendaftarkannya. Data pembeli
						dilindungi 60 hari untuk Anda.
					</p>
					<!-- KOMISI-AGEN-01 (menyusul) — estimasi komisi "± Rp… jika sampai
					     akad" dari endpoint privat /public/agen-omahe/komisi. JANGAN
					     tampilkan angka apa pun sebelum epic itu; slot ini titik
					     sisipnya. -->
					{#if sesiAgen.agen}
						<Button
							variant="primary"
							size="lg"
							href={sesiAgen.agen.panelUrl}
							target="_blank"
							rel="noopener"
						>
							Lihat di Panel Agen
						</Button>
					{/if}
					<Button variant="outline" size="lg" onclick={ulang}>Daftarkan pembeli lain</Button>
				</div>
			{:else}
				<form class="flex flex-col gap-3" onsubmit={kirim}>
					<div>
						<label for="{uid}-nama" class="text-ink mb-1 block text-sm font-medium">
							Nama pembeli
						</label>
						<input
							id="{uid}-nama"
							name="namaPembeli"
							type="text"
							required
							maxlength="100"
							autocomplete="off"
							placeholder="Nama lengkap pembeli"
							bind:value={namaPembeli}
							class={kelasField}
						/>
					</div>

					<div>
						<label for="{uid}-wa" class="text-ink mb-1 block text-sm font-medium">
							Nomor WhatsApp pembeli
						</label>
						<input
							id="{uid}-wa"
							name="whatsappPembeli"
							type="tel"
							required
							maxlength="20"
							inputmode="tel"
							autocomplete="off"
							placeholder="08xxxxxxxxxx"
							bind:value={whatsapp}
							class={kelasField}
						/>
					</div>

					<div>
						<label for="{uid}-tipe" class="text-ink mb-1 block text-sm font-medium">
							Tipe diminati <span class="text-muted font-normal">(opsional)</span>
						</label>
						{#if opsiTipe && opsiTipe.length > 0}
							<!-- Daftar tipe dari pemanggil (detail perumahan/kartu) → select. -->
							<select id="{uid}-tipe" name="tipeSlug" bind:value={tipeDiminati} class={kelasField}>
								<option value="">Belum tahu</option>
								{#each opsiTipe as tipe (tipe)}
									<option value={tipe}>{tipe}</option>
								{/each}
							</select>
						{:else}
							<input
								id="{uid}-tipe"
								name="tipeBebas"
								type="text"
								maxlength="50"
								placeholder="mis. Tipe 36/72"
								bind:value={tipeDiminati}
								class={kelasField}
							/>
						{/if}
					</div>

					<div>
						<label for="{uid}-catatan" class="text-ink mb-1 block text-sm font-medium">
							Catatan <span class="text-muted font-normal">(opsional)</span>
						</label>
						<textarea
							id="{uid}-catatan"
							name="catatan"
							rows="3"
							maxlength="1000"
							placeholder="Kebutuhan pembeli, jadwal survey, dll."
							bind:value={catatan}
							class="{kelasField} h-auto py-2"></textarea>
					</div>

					<p class="text-muted text-xs leading-relaxed">
						Pembeli akan menerima WhatsApp konfirmasi bahwa Anda mendaftarkannya. Data pembeli
						dilindungi 60 hari untuk Anda.
					</p>

					{#if pesanError}
						<!-- 409 proteksi / 400 validasi / 429 rate limit — pesan backend
						     tampil apa adanya (pola §8). -->
						<p class="text-sm text-red-700" role="alert">{pesanError}</p>
					{/if}

					{#if sesiHabis}
						<!-- 401 — sesi agen mati. Klik tombol ini yang menolkan store
						     (SESI-OMAHE-01): wrapper beralih ke form minat biasa
						     dengan dialog tetap terbuka — agen sekaligus melihat
						     tombol situs kembali "WhatsApp". -->
						<Button variant="whatsapp" size="lg" onclick={() => setSesiAgenNull()}>
							Lanjut lewat WhatsApp
						</Button>
					{/if}

					<Button type="submit" variant="whatsapp" size="lg" class="w-full" disabled={proses}>
						<UserPlus class="h-4 w-4" aria-hidden="true" />
						{proses ? 'Mendaftarkan…' : 'Daftarkan Pembeli'}
					</Button>
				</form>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
