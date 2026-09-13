<script lang="ts">
	import { amortisasi, DEFAULT_INPUT, hitungKpr, type InputKpr } from '$lib/kpr';
	import { formatAngka, formatRupiahPenuh } from '$lib/utils';
	import Button from '$lib/components/ui/button.svelte';

	let input = $state<InputKpr>({ ...DEFAULT_INPUT });
	let tampilRincian = $state(false);

	const hasil = $derived(hitungKpr(input));
	const rincian = $derived(tampilRincian ? amortisasi(input, 12) : []);

	const kelasInput = 'h-12 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink';
	const kelasLabel = 'block text-sm font-medium text-ink';
</script>

<svelte:head>
	<title>Simulasi Cicilan KPR · Omahe</title>
	<meta
		name="description"
		content="Hitung estimasi cicilan KPR bulanan dari harga rumah, uang muka, tenor, dan suku bunga — metode anuitas maupun flat."
	/>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="font-display text-ink text-2xl font-bold sm:text-3xl">Simulasi Cicilan KPR</h1>
	<p class="text-muted mt-2 max-w-2xl text-sm">
		Perkirakan cicilan bulanan sebelum mengajukan. Ubah angkanya dan hasilnya langsung menyesuaikan.
	</p>

	<div class="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
		<!-- Input -->
		<form
			class="border-line space-y-5 rounded-xl border bg-white p-5"
			onsubmit={(e) => e.preventDefault()}
		>
			<div>
				<label for="kpr-harga" class={kelasLabel}>Harga rumah</label>
				<p class="text-muted mt-1 text-xs">{formatRupiahPenuh(input.harga)}</p>
				<input
					id="kpr-harga"
					type="number"
					min="0"
					step="10000000"
					bind:value={input.harga}
					class="{kelasInput} mt-2"
				/>
			</div>

			<div>
				<label for="kpr-dp" class={kelasLabel}>
					Uang muka — {input.dpPersen}% ({formatRupiahPenuh(hasil.uangMuka)})
				</label>
				<input
					id="kpr-dp"
					type="range"
					min="0"
					max="90"
					step="1"
					bind:value={input.dpPersen}
					class="mt-3 w-full accent-[var(--omahe-primary)]"
				/>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label for="kpr-tenor" class={kelasLabel}>Tenor (tahun)</label>
					<input
						id="kpr-tenor"
						type="number"
						min="1"
						max="30"
						bind:value={input.tenorTahun}
						class="{kelasInput} mt-2"
					/>
				</div>
				<div>
					<label for="kpr-bunga" class={kelasLabel}>Suku bunga (% / tahun)</label>
					<input
						id="kpr-bunga"
						type="number"
						min="0"
						max="30"
						step="0.1"
						bind:value={input.bungaPersen}
						class="{kelasInput} mt-2"
					/>
				</div>
			</div>

			<fieldset>
				<legend class={kelasLabel}>Metode perhitungan bunga</legend>
				<div class="mt-2 grid grid-cols-2 gap-2">
					{#each [{ nilai: 'anuitas', label: 'Anuitas', ket: 'Cicilan tetap, bunga dari sisa pokok' }, { nilai: 'flat', label: 'Flat', ket: 'Bunga dari pokok awal sepanjang tenor' }] as opsi (opsi.nilai)}
						<label
							class="cursor-pointer rounded-lg border p-3 text-sm {input.metode === opsi.nilai
								? 'border-primary bg-primary/5'
								: 'border-line'}"
						>
							<input type="radio" bind:group={input.metode} value={opsi.nilai} class="sr-only" />
							<span class="text-ink font-medium">{opsi.label}</span>
							<span class="text-muted mt-1 block text-xs">{opsi.ket}</span>
						</label>
					{/each}
				</div>
			</fieldset>
		</form>

		<!-- Hasil -->
		<div class="space-y-4">
			<div class="bg-primary rounded-xl p-6 text-white">
				<p class="text-sm text-white/70">Estimasi cicilan per bulan</p>
				<p class="font-display mt-1 text-3xl font-extrabold sm:text-4xl">
					{formatRupiahPenuh(hasil.cicilanBulanan)}
				</p>
				<p class="mt-2 text-sm text-white/70">
					selama {formatAngka(hasil.tenorBulan)} bulan ({input.tenorTahun} tahun)
				</p>
			</div>

			<dl class="grid grid-cols-2 gap-3">
				{#each [{ k: 'Uang muka', v: formatRupiahPenuh(hasil.uangMuka) }, { k: 'Pokok pinjaman', v: formatRupiahPenuh(hasil.pokokPinjaman) }, { k: 'Total bunga', v: formatRupiahPenuh(hasil.totalBunga) }, { k: 'Total pembayaran', v: formatRupiahPenuh(hasil.totalPembayaran) }] as item (item.k)}
					<div class="border-line rounded-xl border bg-white p-4">
						<dt class="text-muted text-xs">{item.k}</dt>
						<dd class="font-display text-ink mt-1 text-base font-bold">{item.v}</dd>
					</div>
				{/each}
			</dl>

			<div class="border-accent-light bg-accent-light/25 rounded-xl border p-4">
				<p class="text-ink text-sm">
					<span class="font-semibold"
						>Penghasilan minimal ±{formatRupiahPenuh(hasil.penghasilanMinimal)}/bulan.</span
					>
					Bank umumnya membatasi cicilan maksimal sepertiga penghasilan.
				</p>
			</div>

			<Button variant="outline" onclick={() => (tampilRincian = !tampilRincian)}>
				{tampilRincian ? 'Sembunyikan' : 'Lihat'} rincian 12 bulan pertama
			</Button>

			{#if tampilRincian}
				<div class="border-line overflow-x-auto rounded-xl border bg-white">
					<table class="w-full min-w-[28rem] text-left text-sm">
						<thead class="border-line text-muted border-b text-xs">
							<tr>
								<th class="px-4 py-2">Bulan</th>
								<th class="px-4 py-2">Pokok</th>
								<th class="px-4 py-2">Bunga</th>
								<th class="px-4 py-2">Sisa pokok</th>
							</tr>
						</thead>
						<tbody>
							{#each rincian as baris (baris.bulan)}
								<tr class="border-line/60 border-b">
									<td class="text-muted px-4 py-2">{baris.bulan}</td>
									<td class="text-ink px-4 py-2">{formatRupiahPenuh(baris.pokok)}</td>
									<td class="text-ink px-4 py-2">{formatRupiahPenuh(baris.bunga)}</td>
									<td class="text-muted px-4 py-2">{formatRupiahPenuh(baris.sisaPokok)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			<p class="text-muted text-xs leading-relaxed">
				Angka di atas adalah estimasi, bukan penawaran kredit. Omahe belum terhubung ke sistem bank
				mana pun — suku bunga, biaya provisi, asuransi, dan biaya administrasi yang sebenarnya
				ditentukan bank saat pengajuan Anda diproses.
			</p>
		</div>
	</div>
</div>
