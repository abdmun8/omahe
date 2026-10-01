<!--
	Halaman publik "Hapus akun" (PLAY-01, 2026-10-01) — URL WAJIB di Google
	Play Console (Data safety → penghapusan akun). Menjelaskan cara menghapus
	akun panel Omahe (app `perumahan`, `PUBLIC_BOOKING_BASE_URL`) dan data apa
	yang tetap disimpan. Keputusan user: penghapusan = akun DINONAKTIFKAN.
-->
<script lang="ts">
	import { SITE } from '$lib/config';
	import { page } from '$app/state';
	import { loginUrl } from '$lib/app-url';
	import ContactButtons from '$lib/components/contact-buttons.svelte';

	const emailOmahe = $derived(page.data.kontak?.email ?? SITE.email);
	const urlMasuk = loginUrl();
</script>

<svelte:head>
	<title>Hapus Akun · Omahe</title>
	<meta
		name="description"
		content="Cara menghapus akun Omahe dan data apa yang tetap disimpan setelah akun dihapus."
	/>
	<link rel="canonical" href={`${SITE.url}/hapus-akun`} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<h1 class="font-display text-ink text-2xl font-bold sm:text-3xl">Hapus Akun Omahe</h1>
	<p class="text-muted mt-2 text-sm leading-relaxed">
		Halaman ini berlaku untuk akun di aplikasi dan panel Omahe (pengembang/pemilik perumahan, Agen
		Omahe, mitra, dan staf). Menelusuri situs Omahe tidak memerlukan akun.
	</p>

	<div class="text-muted mt-6 space-y-6 text-sm leading-relaxed">
		<section>
			<h2 class="font-display text-ink text-lg font-bold">Cara menghapus akun</h2>
			<ol class="mt-2 list-decimal space-y-1 pl-5">
				<li>
					Masuk ke aplikasi Omahe{#if urlMasuk}
						atau <a href={urlMasuk} class="text-primary hover:underline">panel Omahe</a>{/if}.
				</li>
				<li>Buka menu <span class="text-ink font-medium">Akun Saya</span>.</li>
				<li>
					Di bagian paling bawah, tekan <span class="text-ink font-medium">Hapus akun</span>, ketik
					<span class="text-ink font-mono font-semibold">HAPUS</span>, lalu konfirmasi.
				</li>
			</ol>
			<p class="mt-2">
				Akun langsung dinonaktifkan: Anda keluar dari semua perangkat dan akun tidak bisa dipakai
				masuk lagi. Tidak bisa masuk ke akun Anda? Kirim permintaan penghapusan dari nomor WhatsApp
				atau email yang terdaftar ke tim kami lewat kontak di bawah — kami memprosesnya dalam 7 hari
				kerja.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">Data yang dihapus dan yang disimpan</h2>
			<ul class="mt-2 list-disc space-y-1 pl-5">
				<li>
					<span class="text-ink font-medium">Tidak dipakai lagi:</span> akun Anda (nama, nomor WhatsApp,
					email) tidak bisa dipakai masuk dan tidak lagi menerima notifikasi. Profil Agen Omahe langsung
					tidak ditampilkan di situs; listing mitra profesional atau perumahan terkait diturunkan tim
					kami dalam 7 hari kerja.
				</li>
				<li>
					<span class="text-ink font-medium">Tetap disimpan:</span> catatan transaksi — booking, tagihan,
					invoice, kwitansi, dan komisi — karena wajib kami simpan untuk keperluan hukum, pajak, dan akuntansi,
					sesuai jangka waktu yang diwajibkan peraturan.
				</li>
			</ul>
			<p class="mt-2">
				Ingin akun diaktifkan kembali, atau ingin data profil Anda dihapus permanen? Hubungi kami.
				Ketentuan lengkap ada di <a href="/privasi" class="text-primary hover:underline"
					>Kebijakan Privasi</a
				>.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">Hubungi kami</h2>
			<p class="mt-2">
				Email: <a href="mailto:{emailOmahe}" class="text-primary hover:underline">{emailOmahe}</a>
			</p>
			<div class="mt-3">
				<ContactButtons konteks="hapus akun Omahe" size="md" />
			</div>
		</section>
	</div>
</div>
