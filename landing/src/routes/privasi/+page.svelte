<!--
	DRAF — belum ditinjau penasihat hukum. Dokumen legal Omahe ini TERPISAH
	dari `/legal/:kind` milik app `perumahan` (yang khusus mengatur proses
	booking); jangan disamakan. Wajib ditinjau sebelum go-live.
-->
<script lang="ts">
	import { SITE } from '$lib/config';
</script>

<svelte:head>
	<title>Kebijakan Privasi · Omahe</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<h1 class="font-display text-ink text-2xl font-bold sm:text-3xl">Kebijakan Privasi</h1>
	<p
		class="border-accent-light bg-accent-light/25 text-ink mt-4 rounded-lg border p-4 text-sm"
		role="note"
	>
		<span class="font-semibold">Draf.</span> Naskah ini belum ditinjau penasihat hukum dan belum boleh
		dipakai saat situs dibuka untuk umum.
	</p>

	<div class="text-muted mt-6 space-y-6 text-sm leading-relaxed">
		<section>
			<h2 class="font-display text-ink text-lg font-bold">Data yang kami kumpulkan</h2>
			<p class="mt-2">
				Menelusuri Omahe tidak memerlukan akun. Kami mencatat data teknis standar (alamat IP, jenis
				perangkat, halaman yang dibuka) untuk menjaga layanan tetap berjalan dan memahami halaman
				mana yang berguna.
			</p>
		</section>
		<section>
			<h2 class="font-display text-ink text-lg font-bold">Saat Anda mengajukan unit</h2>
			<p class="mt-2">
				Tombol pengajuan mengarahkan Anda ke sistem pengembang yang bersangkutan. Data yang Anda isi
				di sana — termasuk identitas dan dokumen pendukung — dikelola oleh pengembang tersebut
				sesuai kebijakan mereka, bukan oleh Omahe.
			</p>
		</section>
		<section>
			<h2 class="font-display text-ink text-lg font-bold">Tautan rujukan</h2>
			<p class="mt-2">
				Sebagian tautan menuju Omahe membawa kode rujukan dari mitra pemasaran. Kode itu hanya
				dipakai untuk mencatat mitra mana yang memperkenalkan Anda ke sebuah proyek, dan tidak
				berisi data pribadi Anda.
			</p>
		</section>
		<section>
			<h2 class="font-display text-ink text-lg font-bold">Pertanyaan</h2>
			<p class="mt-2">
				Kirim pertanyaan soal data Anda ke <a
					href="mailto:{SITE.email}"
					class="text-primary hover:underline">{SITE.email}</a
				>.
			</p>
		</section>
	</div>
</div>
