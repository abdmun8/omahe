<!--
	Halaman bayar tagihan dari link (TAGIHAN-02, api-contract §27) — dibuka
	pihak yang ditagih lewat WA/email. Privasi by design: noindex+nofollow,
	referrer no-referrer, no-store, rincian TIDAK di-SSR — harus lolos
	Cloudflare Turnstile dulu (token sekali pakai: sebelum unggah bukti
	widget di-RESET dan token baru diminta).

	Alur: (1) widget Turnstile → token → POST /api/bayar/:token/lihat,
	(2) rincian + nominal transfer menonjol + tombol salin + rekening,
	(3) unggah bukti (hanya bisaUnggah) → status menunggu verifikasi.
	Backend URL tidak pernah ke browser — semua lewat proxy /api/bayar.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import Download from '@lucide/svelte/icons/download';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Button from '$lib/components/ui/button.svelte';
	import {
		angkaSalin,
		formatJatuhTempo,
		labelLayananBayar,
		labelStatusBayar,
		rekeningSalin,
		validasiFileBukti,
		type NadaStatus
	} from '$lib/bayar';
	import type { DetailBayar } from '$lib/api/types';
	import { formatRupiahPenuh } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// --- Turnstile (render eksplisit; script di-muat sekali per halaman) ---

	interface OpsiTurnstile {
		sitekey: string;
		callback: (token: string) => void;
		'expired-callback': () => void;
		'error-callback': (kode: string) => boolean | void;
	}
	interface TurnstileApi {
		render: (el: HTMLElement, opsi: OpsiTurnstile) => string;
		reset: (id?: string) => void;
		remove: (id?: string) => void;
	}
	const apiTurnstile = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;

	function muatScriptTurnstile(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (apiTurnstile()) return resolve();
			const ada = document.querySelector<HTMLScriptElement>('script[data-turnstile-omahe]');
			if (ada) {
				ada.addEventListener('load', () => resolve());
				ada.addEventListener('error', () => reject(new Error('gagal memuat')));
				return;
			}
			const s = document.createElement('script');
			s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			s.async = true;
			s.dataset.turnstileOmahe = '1';
			s.addEventListener('load', () => resolve());
			s.addEventListener('error', () => reject(new Error('gagal memuat')));
			document.head.appendChild(s);
		});
	}

	// --- State halaman -------------------------------------------------------

	// `bind:this` — reaktif supaya onMount-blok async aman membacanya
	// (svelte-check menolak update var non-`$state`).
	let kotakWidget = $state<HTMLElement | null>(null);
	let widgetId: string | null = null;
	/** Resolver token yang sedang ditunggu proses unggah (sekali pakai). */
	let resolverToken: ((token: string) => void) | null = null;

	let fase = $state<'verifikasi' | 'detail'>('verifikasi');
	let detail = $state<DetailBayar | null>(null);
	let prosesLihat = $state(false);
	let prosesUnggah = $state(false);
	/** Pesan langkah 1 (aria-live alert). */
	let pesan = $state<string | null>(null);
	/** Pesan form unggah (aria-live alert). */
	let pesanUnggah = $state<string | null>(null);
	/** Umpan balik tombol salin (aria-live status). */
	let pesanSalin = $state<string | null>(null);
	let file = $state<File | null>(null);
	let tersalin = $state<string | null>(null);
	/** true setelah `lihat` gagal — token baru dari widget DIABAIKAN sampai
	 *  pengunjung menekan "Coba lagi". Tanpa ini + Turnstile non-interaktif
	 *  (apalagi test key yang selalu lolos): gagal → reset → token → gagal →
	 *  … loop tanpa henti sampai rate limit 429 backend. */
	let menungguCobaLagi = $state(false);

	const KELAS_NADA: Record<NadaStatus, string> = {
		netral: 'bg-surface text-muted',
		info: 'bg-blue-100 text-blue-800',
		sukses: 'bg-green-100 text-green-800',
		peringatan: 'bg-amber-100 text-amber-800',
		bahaya: 'bg-red-100 text-red-700'
	};

	const status = $derived(detail ? labelStatusBayar(detail.status) : null);

	// --- Langkah 1: verifikasi → lihat rincian ------------------------------

	onMount(() => {
		if (!data.siteKey) {
			pesan = 'Verifikasi keamanan belum dikonfigurasi. Hubungi tim Omahe.';
			return;
		}
		let mati = false;
		muatScriptTurnstile()
			.then(() => {
				if (mati || !kotakWidget) return;
				const api = apiTurnstile();
				if (!api) throw new Error('Turnstile tidak tersedia');
				widgetId = api.render(kotakWidget, {
					sitekey: data.siteKey,
					callback: tokenDidapat,
					// Token kedaluwarsa (±5 menit): widget me-refresh otomatis dan
					// callback akan dipanggil ulang — tidak ada yang perlu dibatalkan.
					'expired-callback': () => {},
					'error-callback': () => {
						pesan = 'Widget keamanan gagal memuat. Muat ulang halaman lalu coba lagi.';
						return false;
					}
				});
			})
			.catch(() => {
				if (!mati) pesan = 'Widget keamanan gagal dimuat. Periksa koneksi lalu muat ulang halaman.';
			});
		return () => {
			mati = true;
			if (widgetId !== null) apiTurnstile()?.remove(widgetId);
		};
	});

	function tokenDidapat(token: string) {
		if (fase === 'verifikasi') {
			if (!menungguCobaLagi) void lihat(token);
		} else {
			const resolve = resolverToken;
			resolverToken = null;
			resolve?.(token);
		}
	}

	/** Tekan "Coba lagi": reset widget → token baru → `lihat` otomatis. */
	function cobaLagi() {
		menungguCobaLagi = false;
		pesan = null;
		const api = apiTurnstile();
		if (!api || widgetId === null) {
			pesan = 'Widget keamanan belum siap. Muat ulang halaman lalu coba lagi.';
			return;
		}
		api.reset(widgetId);
	}

	/** Token Turnstile BARU — lama sudah dipakai `/lihat` (sekali pakai). */
	function mintaTokenBaru(): Promise<string> {
		const api = apiTurnstile();
		const idWidget = widgetId; // narrowing — closure executor kehilangannya.
		if (!api || idWidget === null)
			return Promise.reject(
				new Error('Widget keamanan belum siap. Muat ulang halaman lalu coba lagi.')
			);
		return new Promise((resolve, reject) => {
			const batas = setTimeout(() => {
				resolverToken = null;
				reject(new Error('Verifikasi keamanan terlalu lama. Coba lagi.'));
			}, 45_000);
			resolverToken = (token) => {
				clearTimeout(batas);
				resolve(token);
			};
			api.reset(idWidget);
		});
	}

	async function errorDariRes(res: Response): Promise<Error> {
		let teks = 'Terjadi kesalahan. Coba lagi sebentar lagi.';
		try {
			const body = (await res.json()) as { message?: unknown };
			if (typeof body?.message === 'string' && body.message) teks = body.message;
		} catch {
			// body bukan JSON — pesan generik.
		}
		if (res.status === 404) teks = 'Link bayar tidak ditemukan atau sudah diganti.';
		else if (res.status === 429)
			teks = 'Terlalu banyak percobaan. Tunggu sebentar, lalu muat ulang halaman.';
		return new Error(teks);
	}

	function teksError(err: unknown, cadangan: string): string {
		return err instanceof Error && err.message ? err.message : cadangan;
	}

	async function lihat(turnstile: string) {
		prosesLihat = true;
		pesan = null;
		try {
			const res = await fetch(`/api/bayar/${encodeURIComponent(data.token)}/lihat`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ turnstile })
			});
			if (!res.ok) throw await errorDariRes(res);
			const body = (await res.json()) as { data: DetailBayar };
			detail = body.data;
			fase = 'detail';
		} catch (err) {
			pesan = teksError(err, 'Rincian tagihan tidak dapat dimuat. Coba lagi sebentar lagi.');
			menungguCobaLagi = true;
			// Token sudah terpakai (valid maupun gagal) — reset widget supaya
			// "Coba lagi" mendapat tantangan + token baru (tokenDidapat mengabaikan
			// token ini — lihat menungguCobaLagi, anti-loop).
			apiTurnstile()?.reset(widgetId ?? undefined);
		} finally {
			prosesLihat = false;
		}
	}

	// --- Langkah 2: unggah bukti --------------------------------------------

	function pilihFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const berkas = input.files?.[0] ?? null;
		pesanUnggah = null;
		if (!berkas) {
			file = null;
			return;
		}
		const hasil = validasiFileBukti(berkas);
		if (!hasil.ok) {
			input.value = '';
			file = null;
			pesanUnggah = hasil.pesan;
			return;
		}
		file = berkas;
	}

	async function unggah(e: SubmitEvent) {
		e.preventDefault();
		if (prosesUnggah) return;
		if (!file) {
			pesanUnggah = 'Pilih berkas bukti transfer terlebih dahulu.';
			return;
		}
		prosesUnggah = true;
		pesanUnggah = null;
		try {
			const turnstile = await mintaTokenBaru();
			const form = new FormData();
			form.append('file', file);
			form.append('turnstile', turnstile);
			const res = await fetch(`/api/bayar/${encodeURIComponent(data.token)}/bukti`, {
				method: 'POST',
				body: form
			});
			if (!res.ok) throw await errorDariRes(res);
			const body = (await res.json()) as { data: DetailBayar };
			// Respons = DetailBayar terbaru (status menunggu_verifikasi).
			detail = body.data;
			file = null;
		} catch (err) {
			pesanUnggah = teksError(err, 'Unggah bukti gagal. Coba lagi sebentar lagi.');
		} finally {
			prosesUnggah = false;
		}
	}

	// --- Salin ke clipboard ---------------------------------------------------

	async function salin(teks: string, kunci: string) {
		try {
			await navigator.clipboard.writeText(teks);
		} catch {
			pesanSalin = 'Tidak dapat menyalin otomatis — mohon salin manual.';
			return;
		}
		pesanSalin = 'Berhasil disalin.';
		tersalin = kunci;
		setTimeout(() => {
			if (tersalin === kunci) tersalin = null;
		}, 2000);
	}

	const kelasSalinGelap =
		'bg-white/15 hover:bg-white/25 text-white inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors';
	const kelasSalinTerang =
		'border-line text-primary hover:bg-surface inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-xs font-semibold transition-colors';
</script>

<svelte:head>
	<title>Bayar Tagihan — Omahe</title>
	<!-- Token URL = kunci tagihan — halaman tidak boleh diindeks/di-share ke crawler. -->
	<meta name="robots" content="noindex, nofollow" />
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-8 sm:py-10">
	<header class="mb-6 text-center">
		<h1 class="font-display text-ink text-2xl font-extrabold">Pembayaran Tagihan</h1>
	</header>

	{#if fase === 'verifikasi'}
		<!-- Langkah 1: verifikasi keamanan (rincian TIDAK di-SSR) -->
		<div class="border-line rounded-2xl border bg-white p-6 text-center sm:p-8">
			<span
				class="bg-surface text-primary mx-auto flex h-14 w-14 items-center justify-center rounded-full"
				aria-hidden="true"
			>
				<ShieldCheck class="h-8 w-8" />
			</span>
			<h2 class="font-display text-ink mt-4 text-lg font-bold">Verifikasi keamanan</h2>
			<p class="text-muted mx-auto mt-2 max-w-sm text-sm leading-relaxed">
				Selesaikan verifikasi di bawah untuk melihat rincian tagihan Anda. Rincian hanya terlihat
				oleh pemegang tautan ini.
			</p>
			{#if prosesLihat}
				<p role="status" aria-live="polite" class="text-muted mt-4 text-sm">
					Memeriksa verifikasi &amp; memuat rincian tagihan…
				</p>
			{/if}
			{#if pesan}
				<p role="alert" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{pesan}</p>
				{#if menungguCobaLagi}
					<Button variant="primary" class="mt-3" onclick={cobaLagi}>Coba lagi</Button>
				{/if}
			{/if}
		</div>
	{:else if detail}
		{@const d = detail}
		<div class="border-line overflow-hidden rounded-2xl border bg-white">
			<!-- Kepala: nomor invoice + badge status -->
			<div
				class="border-line flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4 sm:px-6"
			>
				<div>
					<p class="text-muted text-xs font-medium tracking-wide uppercase">Nomor invoice</p>
					<p class="text-ink font-mono text-sm font-semibold">{d.nomor}</p>
				</div>
				{#if status}
					<span
						class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold {KELAS_NADA[
							status.nada
						]}"
					>
						{status.label}
					</span>
				{/if}
			</div>

			<div class="px-5 py-5 sm:px-6">
				<dl class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
					<div>
						<dt class="text-muted text-xs font-medium tracking-wide uppercase">
							Ditagihkan kepada
						</dt>
						<dd class="text-ink mt-0.5 text-sm font-semibold">{d.pihakNama}</dd>
					</div>
					{#if d.penerbitNama}
						<div>
							<dt class="text-muted text-xs font-medium tracking-wide uppercase">
								Diterbitkan oleh
							</dt>
							<dd class="text-ink mt-0.5 text-sm font-semibold">{d.penerbitNama}</dd>
						</div>
					{/if}
					<div>
						<dt class="text-muted text-xs font-medium tracking-wide uppercase">Layanan</dt>
						<dd class="text-ink mt-0.5 text-sm font-semibold">{labelLayananBayar(d.layanan)}</dd>
					</div>
					<div>
						<dt class="text-muted text-xs font-medium tracking-wide uppercase">Jatuh tempo</dt>
						<dd class="text-ink mt-0.5 text-sm font-semibold">{formatJatuhTempo(d.jatuhTempo)}</dd>
					</div>
				</dl>

				<!-- Rincian item -->
				<table class="mt-6 w-full text-sm">
					<caption class="sr-only">Rincian item tagihan</caption>
					<thead>
						<tr class="border-line border-b text-left">
							<th scope="col" class="text-muted pb-2 font-medium">Rincian</th>
							<th scope="col" class="text-muted pb-2 text-right font-medium">Jumlah</th>
							<th scope="col" class="text-muted pb-2 text-right font-medium">Harga</th>
						</tr>
					</thead>
					<tbody>
						{#each d.items as item, i (i)}
							<tr class="border-line border-b last:border-0">
								<td class="text-ink py-2.5 pr-2">{item.deskripsi}</td>
								<td class="text-ink py-2.5 pl-3 text-right whitespace-nowrap">×{item.jumlah}</td>
								<td class="text-ink py-2.5 pl-3 text-right whitespace-nowrap">
									{formatRupiahPenuh(item.hargaSatuan)}
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot class="text-sm">
						<tr>
							<td colspan="2" class="text-muted py-1.5 pr-3 text-right">Subtotal</td>
							<td class="text-ink py-1.5 text-right whitespace-nowrap"
								>{formatRupiahPenuh(d.subtotal)}</td
							>
						</tr>
						{#if d.ppn > 0}
							<tr>
								<td colspan="2" class="text-muted py-1.5 pr-3 text-right">PPN {d.ppnPersen}%</td>
								<td class="text-ink py-1.5 text-right whitespace-nowrap"
									>{formatRupiahPenuh(d.ppn)}</td
								>
							</tr>
						{/if}
						<tr class="border-line border-t">
							<td colspan="2" class="text-ink py-2 pr-3 text-right font-semibold">Total</td>
							<td class="text-ink py-2 text-right font-semibold whitespace-nowrap">
								{formatRupiahPenuh(d.total)}
							</td>
						</tr>
						{#if d.kodeUnik > 0}
							<tr>
								<td colspan="2" class="text-muted py-1.5 pr-3 text-right">Kode unik</td>
								<td class="text-accent-dark py-1.5 text-right font-semibold whitespace-nowrap">
									{d.kodeUnik}
								</td>
							</tr>
						{/if}
					</tfoot>
				</table>

				<!-- Nominal transfer — angka PALING penting di halaman ini -->
				<div class="bg-primary mt-6 rounded-xl px-5 py-5 text-white">
					<p class="text-xs font-medium tracking-wide uppercase opacity-80">Nominal transfer</p>
					<div class="mt-1 flex flex-wrap items-center justify-between gap-3">
						<p class="font-display text-3xl font-extrabold break-all">
							{formatRupiahPenuh(d.nominalTransfer)}
						</p>
						<button
							type="button"
							onclick={() => salin(angkaSalin(d.nominalTransfer), 'transfer')}
							class={kelasSalinGelap}
							aria-label="Salin nominal transfer (tanpa titik)"
						>
							{#if tersalin === 'transfer'}
								<Check class="h-4 w-4" aria-hidden="true" /> Tersalin
							{:else}
								<Copy class="h-4 w-4" aria-hidden="true" /> Salin
							{/if}
						</button>
					</div>
					<p class="mt-3 text-xs leading-relaxed font-medium text-amber-200">
						Transfer TEPAT sebesar nominal transfer{d.kodeUnik > 0
							? ` (termasuk kode unik ${d.kodeUnik})`
							: ''} agar pembayaran cepat dikenali.
					</p>
				</div>

				<!-- Rekening tujuan -->
				{#if d.rekening.nomor || d.rekening.bank}
					<div class="border-line mt-5 rounded-xl border px-4 py-4">
						<p class="text-muted text-xs font-medium tracking-wide uppercase">Transfer ke</p>
						<p class="font-display text-ink mt-1 text-base font-bold">
							{d.rekening.bank ?? '—'}
						</p>
						<div class="mt-1 flex flex-wrap items-center justify-between gap-2">
							<p class="text-ink font-mono text-lg font-semibold tracking-wide">
								{d.rekening.nomor ?? '—'}
							</p>
							{#if d.rekening.nomor}
								<button
									type="button"
									onclick={() => salin(rekeningSalin(d.rekening.nomor ?? ''), 'rekening')}
									class={kelasSalinTerang}
									aria-label="Salin nomor rekening"
								>
									{#if tersalin === 'rekening'}
										<Check class="h-4 w-4" aria-hidden="true" /> Tersalin
									{:else}
										<Copy class="h-4 w-4" aria-hidden="true" /> Salin
									{/if}
								</button>
							{/if}
						</div>
						{#if d.rekening.atasNama}
							<p class="text-muted mt-1 text-sm">a.n. {d.rekening.atasNama}</p>
						{/if}
					</div>
				{:else}
					<p class="text-muted mt-5 text-sm">
						Nomor rekening belum tersedia — hubungi penerbit tagihan.
					</p>
				{/if}

				<!-- Panel status -->
				{#if d.status === 'lunas'}
					<div
						role="status"
						class="mt-5 rounded-xl bg-green-50 px-4 py-4 text-sm leading-relaxed text-green-800"
					>
						Tagihan ini sudah <strong>lunas</strong>. Terima kasih! Kwitansi (bukti pembayaran sah)
						bisa diunduh di bawah.
					</div>
				{:else if d.status === 'menunggu_verifikasi'}
					<div
						role="status"
						class="mt-5 rounded-xl bg-blue-50 px-4 py-4 text-sm leading-relaxed text-blue-800"
					>
						Bukti pembayaran Anda sudah diterima dan sedang diverifikasi — biasanya selesai dalam
						1×24 jam. Halaman ini bisa Anda buka kembali untuk melihat hasilnya.
					</div>
				{:else if d.status === 'batal'}
					<div
						role="status"
						class="bg-surface text-muted mt-5 rounded-xl px-4 py-4 text-sm leading-relaxed"
					>
						Tagihan ini sudah <strong>dibatalkan</strong> dan tidak dapat dibayar lagi. Hubungi penerbit
						tagihan bila Anda merasa ini keliruan.
					</div>
				{:else}
					{#if d.status === 'ditolak' && d.catatanTolak}
						<div
							role="alert"
							class="mt-5 rounded-xl bg-red-50 px-4 py-4 text-sm leading-relaxed text-red-700"
						>
							<p class="font-semibold">Bukti transfer Anda ditolak.</p>
							<p class="mt-1">{d.catatanTolak}</p>
						</div>
					{/if}

					{#if d.bisaUnggah}
						<form class="mt-5" onsubmit={unggah} aria-label="Unggah bukti pembayaran">
							<label for="bukti-file" class="text-ink mb-1 block text-sm font-medium">
								Bukti transfer <span class="text-muted font-normal"
									>(JPG, PNG, atau PDF — maks 4 MB)</span
								>
							</label>
							<input
								id="bukti-file"
								name="bukti"
								type="file"
								accept="image/jpeg,image/png,application/pdf"
								onchange={pilihFile}
								class="border-line text-ink file:text-primary hover:border-primary/40 cursor-pointer rounded-lg border bg-white p-2 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-transparent file:px-2 file:py-1 file:text-sm file:font-semibold"
							/>
							{#if file}
								<p class="text-muted mt-1.5 text-xs">{file.name}</p>
							{/if}
							{#if pesanUnggah}
								<p role="alert" class="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
									{pesanUnggah}
								</p>
							{/if}
							<Button
								type="submit"
								variant="primary"
								size="lg"
								class="mt-3 w-full"
								disabled={prosesUnggah || !file}
							>
								{prosesUnggah ? 'Mengunggah…' : 'Kirim Bukti Transfer'}
							</Button>
							<p class="text-muted mt-2 text-center text-xs">
								Verifikasi keamanan di bawah akan diulang otomatis saat Anda mengirim bukti.
							</p>
						</form>
					{/if}
				{/if}

				<!-- Umpan balik tombol salin (screen reader). -->
				<p role="status" aria-live="polite" class="sr-only">{pesanSalin}</p>

				<!-- Tagihan batal: backend menolak dokumen (409) — tombol disembunyikan. -->
				{#if d.status !== 'batal'}
					<Button
						variant="outline"
						href="/bayar/{encodeURIComponent(data.token)}/invoice.pdf"
						download
						class="mt-6 w-full"
					>
						<Download class="h-4 w-4" aria-hidden="true" /> Unduh Invoice (PDF)
					</Button>
				{/if}
				{#if d.bisaKwitansi}
					<Button
						variant="primary"
						href="/bayar/{encodeURIComponent(data.token)}/kwitansi.pdf"
						download
						class="mt-3 w-full"
					>
						<Download class="h-4 w-4" aria-hidden="true" /> Unduh Kwitansi (PDF)
					</Button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Kontainer widget Turnstile (render eksplisit via onMount; managed
		300×65px). SENGAJA di luar blok fase: widget yang sama di-reset untuk
		token baru saat unggah bukti — kalau ikut blok `verifikasi`, elemennya
		hilang begitu rincian tampil dan reset tidak pernah menghasilkan token.
		Disembunyikan bila tidak ada lagi yang perlu diverifikasi. -->
	<div
		bind:this={kotakWidget}
		class="mt-5 flex min-h-[65px] justify-center"
		class:hidden={fase === 'detail' && !detail?.bisaUnggah}
		aria-label="Verifikasi keamanan"
	></div>

	<p class="text-muted mt-6 text-center text-xs leading-relaxed">
		Tautan ini bersifat pribadi — jangan diteruskan ke orang lain. Butuh bantuan? Hubungi tim Omahe
		lewat <a href="/kontak" class="text-primary font-medium hover:underline">halaman kontak</a>.
	</p>
</div>
