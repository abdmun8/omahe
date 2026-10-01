<!--
	Syarat & Ketentuan Omahe — DIPUBLIKASIKAN 2026-10-01 (lihat catatan di
	`/privasi`). Perbarui `DIPERBARUI` setiap ada perubahan isi.
-->
<script lang="ts">
	import { SITE } from '$lib/config';
	import { page } from '$app/state';

	// ADMIN-05 — halaman ini di-prerender: email = nilai saat build (fallback config).
	const emailOmahe = $derived(page.data.kontak?.email ?? SITE.email);
	const DIPERBARUI = '1 Oktober 2026';
</script>

<svelte:head>
	<title>Syarat &amp; Ketentuan · Omahe</title>
	<meta
		name="description"
		content="Ketentuan penggunaan situs Omahe — portal informasi dan pemasaran properti."
	/>
	<link rel="canonical" href={`${SITE.url}/syarat-ketentuan`} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<h1 class="font-display text-ink text-2xl font-bold sm:text-3xl">Syarat &amp; Ketentuan</h1>
	<p class="text-muted mt-2 text-sm">Terakhir diperbarui: {DIPERBARUI}</p>

	<div class="text-muted mt-6 space-y-6 text-sm leading-relaxed">
		<section>
			<p>
				Dengan mengakses atau memakai situs <span class="text-ink">www.omahe.co.id</span> ("Omahe"),
				Anda menyetujui ketentuan berikut. Bila tidak setuju, mohon tidak memakai situs ini.
				Pemakaian data pribadi Anda diatur dalam
				<a href="/privasi" class="text-primary hover:underline">Kebijakan Privasi</a>.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">1. Peran Omahe</h2>
			<p class="mt-2">
				Omahe adalah portal informasi dan pemasaran properti yang mempertemukan calon pembeli dengan
				pengembang, pemilik perumahan, Agen Omahe, dan mitra profesional. Omahe bukan pihak dalam
				perjanjian jual beli antara Anda dan pengembang, dan tidak bertindak sebagai penilai maupun
				lembaga pembiayaan. Keputusan dan perjanjian pembelian sepenuhnya antara Anda dan pihak
				penjual.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">2. Keakuratan informasi</h2>
			<p class="mt-2">
				Harga, luas, ketersediaan unit, spesifikasi, promo, dan foto bersumber dari pengembang atau
				pemilik perumahan dan dapat berubah sewaktu-waktu tanpa pemberitahuan. Gambar dapat berupa
				ilustrasi. Pastikan kembali seluruh detail langsung kepada pengembang sebelum membuat
				komitmen atau pembayaran apa pun.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">3. Pengajuan unit dan pembayaran</h2>
			<p class="mt-2">
				Tombol pengajuan membawa Anda ke sistem pengajuan, yang memiliki syarat dan kebijakannya
				sendiri. Lakukan pembayaran hanya ke rekening resmi yang tertera pada invoice, tautan
				pembayaran, atau sistem pengajuan. Omahe tidak bertanggung jawab atas pembayaran yang
				dikirim ke rekening lain. Omahe tidak pernah meminta kode login, kode OTP, PIN, atau kata
				sandi Anda.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">4. Agen Omahe dan centang biru</h2>
			<p class="mt-2">
				Agen Omahe adalah anggota jaringan pemasaran Omahe yang identitas keanggotaannya dapat dicek
				lewat kode agen. Tanda centang biru "Agen Profesional Terverifikasi" menunjukkan bahwa tim
				Omahe telah meninjau kompetensi dan pengalaman agen tersebut pada saat verifikasi, dan hanya
				tampil selama keanggotaannya aktif. Tanda ini bukan jaminan atas hasil transaksi; tetap
				periksa setiap kesepakatan secara tertulis.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">
				5. Mitra profesional, promosi, dan konten berbayar
			</h2>
			<p class="mt-2">
				Direktori mitra profesional (seperti notaris, penilai, atau konsultan) dan sebagian banner
				atau slide di Omahe dapat berupa penempatan berbayar. Isi promosi menjadi tanggung jawab
				pemasangnya. Hubungan Anda dengan mitra profesional merupakan hubungan langsung antara Anda
				dan mitra tersebut.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">6. Formulir minat</h2>
			<p class="mt-2">
				Dengan mengirim formulir minat atau "Hubungi", Anda menyatakan data yang diisi benar dan
				milik Anda sendiri, serta setuju dihubungi oleh pihak yang Anda tuju dan oleh tim Omahe
				terkait permintaan tersebut.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">7. Simulasi KPR</h2>
			<p class="mt-2">
				Kalkulator KPR menghasilkan estimasi berdasarkan angka yang Anda masukkan. Hasilnya bukan
				penawaran kredit dan tidak mengikat bank mana pun; ketentuan akhir ditetapkan oleh lembaga
				pembiayaan.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">8. Penggunaan yang dilarang</h2>
			<p class="mt-2">Anda tidak diperkenankan:</p>
			<ul class="mt-2 list-disc space-y-1 pl-5">
				<li>mengirim data palsu, data milik orang lain, atau pesan spam melalui formulir;</li>
				<li>
					mengambil konten atau data situs secara otomatis dalam jumlah besar (scraping) tanpa izin
					tertulis;
				</li>
				<li>mengganggu, membebani, atau mencoba menembus sistem dan keamanan situs;</li>
				<li>menyalahgunakan nama, logo, atau kode agen Omahe untuk menyesatkan pihak lain.</li>
			</ul>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">9. Hak kekayaan intelektual</h2>
			<p class="mt-2">
				Nama, logo, desain, dan konten Omahe dilindungi hukum. Konten properti, foto, dan merek
				milik pengembang atau mitra tetap menjadi milik masing-masing pemiliknya. Dilarang menyalin
				atau memakai ulang tanpa izin, kecuali untuk keperluan pribadi dan non-komersial.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">10. Batasan tanggung jawab</h2>
			<p class="mt-2">
				Omahe disediakan "sebagaimana adanya". Sepanjang diizinkan hukum, Omahe tidak bertanggung
				jawab atas kerugian yang timbul dari keputusan yang diambil berdasarkan informasi di situs,
				transaksi antara Anda dan pihak lain, gangguan layanan, maupun isi situs pihak ketiga yang
				ditautkan dari Omahe.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">11. Perubahan ketentuan</h2>
			<p class="mt-2">
				Ketentuan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini.
				Dengan terus memakai Omahe setelah perubahan, Anda dianggap menyetujui ketentuan terbaru.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">12. Hukum yang berlaku</h2>
			<p class="mt-2">
				Ketentuan ini tunduk pada hukum Negara Republik Indonesia. Perselisihan diupayakan
				diselesaikan secara musyawarah terlebih dahulu.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">13. Kontak</h2>
			<p class="mt-2">
				Pertanyaan mengenai ketentuan ini: <a
					href="mailto:{emailOmahe}"
					class="text-primary hover:underline">{emailOmahe}</a
				>.
			</p>
		</section>
	</div>
</div>
