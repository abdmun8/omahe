<!--
	Kebijakan Privasi Omahe (www.omahe.co.id) — DIPUBLIKASIKAN 2026-10-01
	(keputusan user: publish, bukan draf). Dokumen ini TERPISAH dari
	`/legal/:kind` milik sistem pengajuan (app `perumahan`) yang mengatur
	proses booking unit. Perbarui tanggal `DIPERBARUI` setiap ada perubahan
	isi, dan sesuaikan bila ada fitur baru yang mengumpulkan data.
-->
<script lang="ts">
	import { SITE } from '$lib/config';
	import { page } from '$app/state';

	// ADMIN-05 — halaman ini di-prerender: email = nilai saat build (fallback config).
	const emailOmahe = $derived(page.data.kontak?.email ?? SITE.email);
	const DIPERBARUI = '1 Oktober 2026';
</script>

<svelte:head>
	<title>Kebijakan Privasi · Omahe</title>
	<meta
		name="description"
		content="Bagaimana Omahe mengumpulkan, memakai, membagikan, dan melindungi data pribadi Anda."
	/>
	<link rel="canonical" href={`${SITE.url}/privasi`} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<h1 class="font-display text-ink text-2xl font-bold sm:text-3xl">Kebijakan Privasi</h1>
	<p class="text-muted mt-2 text-sm">Terakhir diperbarui: {DIPERBARUI}</p>

	<div class="text-muted mt-6 space-y-6 text-sm leading-relaxed">
		<section>
			<p>
				Kebijakan ini menjelaskan bagaimana Omahe ("kami") mengumpulkan, memakai, membagikan, dan
				melindungi data pribadi Anda saat memakai situs <span class="text-ink">www.omahe.co.id</span
				>, sejalan dengan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi. Proses
				pengajuan atau pemesanan unit di sistem pengajuan diatur oleh kebijakan tersendiri yang
				ditampilkan di sistem tersebut.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">1. Data yang kami kumpulkan</h2>
			<p class="mt-2">Menelusuri Omahe tidak memerlukan akun. Kami mengumpulkan:</p>
			<ul class="mt-2 list-disc space-y-1 pl-5">
				<li>
					<span class="text-ink font-medium">Data yang Anda berikan</span> — saat mengisi formulir minat
					atau "Hubungi" (nama, nomor WhatsApp, pesan, serta perumahan, agen, atau mitra yang Anda tuju),
					dan saat membayar tagihan lewat tautan pembayaran (bukti transfer yang Anda unggah).
				</li>
				<li>
					<span class="text-ink font-medium">Data teknis</span> — alamat IP, jenis perangkat dan peramban,
					halaman yang dibuka, serta waktu kunjungan, untuk menjaga layanan tetap berjalan dan aman.
				</li>
				<li>
					<span class="text-ink font-medium">Kode rujukan</span> — sebagian tautan membawa kode mitra
					pemasaran atau agen. Kode itu hanya mencatat siapa yang memperkenalkan Anda ke sebuah proyek
					(untuk perhitungan komisi mereka) dan tidak berisi data pribadi Anda.
				</li>
			</ul>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">2. Untuk apa data dipakai</h2>
			<ul class="mt-2 list-disc space-y-1 pl-5">
				<li>
					Meneruskan minat Anda kepada pihak yang Anda tuju (pengembang/pemilik perumahan, Agen
					Omahe, atau mitra profesional) agar mereka dapat menghubungi Anda, dan agar tim Omahe
					dapat membantu tindak lanjutnya.
				</li>
				<li>Menghubungi Anda lewat WhatsApp, telepon, atau email terkait permintaan Anda.</li>
				<li>Memproses dan memverifikasi pembayaran tagihan layanan Omahe.</li>
				<li>Mencatat rujukan mitra pemasaran dan agen untuk perhitungan komisi.</li>
				<li>
					Menjaga keamanan layanan, termasuk mencegah penyalahgunaan formulir dan akses otomatis.
				</li>
				<li>Memahami penggunaan situs untuk memperbaiki layanan kami.</li>
			</ul>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">3. Dengan siapa data dibagikan</h2>
			<p class="mt-2">Kami tidak menjual data pribadi Anda. Data hanya dibagikan kepada:</p>
			<ul class="mt-2 list-disc space-y-1 pl-5">
				<li>
					Pihak yang Anda pilih sendiri saat mengisi formulir (pengembang/pemilik perumahan, Agen
					Omahe, atau mitra profesional). Setelah diterima, penggunaan data oleh mereka juga tunduk
					pada tanggung jawab mereka sendiri.
				</li>
				<li>
					Penyedia layanan yang membantu kami menjalankan situs — misalnya penyedia hosting dan
					server, layanan pengiriman pesan WhatsApp dan email, layanan pencegahan bot (Cloudflare
					Turnstile), serta analitik (Google Analytics) — hanya sebatas yang diperlukan untuk
					layanan tersebut.
				</li>
				<li>Pihak berwenang bila diwajibkan oleh peraturan perundang-undangan.</li>
			</ul>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">
				4. Cookie, analitik, dan penyimpanan di peramban
			</h2>
			<p class="mt-2">
				Kami memakai Google Analytics untuk memahami halaman dan fitur mana yang berguna (kunjungan
				halaman, pencarian, tombol yang ditekan, properti yang dilihat). Layanan ini dapat
				menempatkan cookie di peramban Anda. Kami tidak mengirim nama, nomor telepon, atau identitas
				Anda ke Google Analytics. Situs juga menyimpan preferensi kecil di peramban Anda (misalnya
				pilihan musik latar menyala atau mati). Anda dapat menghapus atau menolak cookie lewat
				pengaturan peramban; sebagian fitur mungkin kurang optimal tanpanya.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">5. Penyimpanan dan keamanan</h2>
			<p class="mt-2">
				Data disimpan selama diperlukan untuk tujuan di atas atau selama diwajibkan peraturan, lalu
				dihapus atau dianonimkan. Kami menerapkan langkah keamanan yang wajar, termasuk koneksi
				terenkripsi (HTTPS), pembatasan akses, dan pencadangan terenkripsi. Tidak ada sistem yang
				sepenuhnya bebas risiko; bila terjadi kegagalan pelindungan data pribadi, kami akan
				memberitahukannya sesuai ketentuan yang berlaku.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">6. Hak Anda</h2>
			<p class="mt-2">
				Sesuai peraturan pelindungan data pribadi, Anda berhak meminta akses atas data Anda,
				memperbaiki data yang keliru, meminta penghapusan, menarik persetujuan, serta mengajukan
				keberatan atas pemrosesan tertentu. Kirim permintaan ke email di bawah; kami akan
				menanggapinya dalam waktu yang wajar dan dapat meminta verifikasi identitas lebih dulu.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">7. Keamanan akun dan penipuan</h2>
			<p class="mt-2">
				Omahe tidak pernah meminta kode login, kode OTP, PIN, atau kata sandi Anda melalui telepon
				maupun chat. Pembayaran hanya dilakukan ke rekening resmi yang tertera pada invoice atau
				tautan pembayaran Omahe. Bila ragu, hubungi kami lewat halaman Kontak.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">8. Perubahan kebijakan</h2>
			<p class="mt-2">
				Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini
				dengan tanggal pembaruan di bagian atas.
			</p>
		</section>

		<section>
			<h2 class="font-display text-ink text-lg font-bold">9. Hubungi kami</h2>
			<p class="mt-2">
				Pertanyaan atau permintaan terkait data pribadi Anda dapat dikirim ke <a
					href="mailto:{emailOmahe}"
					class="text-primary hover:underline">{emailOmahe}</a
				>.
			</p>
		</section>
	</div>
</div>
