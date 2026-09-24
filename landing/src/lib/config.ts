/** Identitas & kontak Omahe — dipakai header, footer, metadata SEO. */
export const SITE = {
	nama: 'Omahe',
	tagline: 'Where your story begins',
	/**
	 * ADMIN-06 — teks hero homepage BAWAAN. Superadmin bisa menimpanya di
	 * admin (Pengaturan → Teks Homepage Omahe); nilai efektif ada di
	 * `page.data.teks` (layout server). Tagline di atas juga bisa ditimpa.
	 */
	heroJudul: 'Temukan hunian yang dirancang untuk memenuhi kebutuhan hidup Anda.',
	heroSubjudul:
		'Pilih dari berbagai proyek properti terpercaya, bandingkan setiap detailnya — dan temukan rumah yang tepat untuk memulai cerita baru.',
	deskripsi:
		'Temukan hunian yang dirancang untuk memenuhi kebutuhan hidup Anda. Pilih dari berbagai proyek properti terpercaya, bandingkan setiap detailnya, dan temukan rumah yang tepat untuk memulai cerita baru.',
	/** Versi ringkas (≤160 char) untuk meta/og description — SERP memotong di sekitar situ. */
	deskripsiSingkat: 'Temukan hunian yang dirancang untuk memenuhi kebutuhan hidup Anda.',
	url: 'https://www.omahe.co.id',
	/**
	 * Measurement ID Google Analytics 4. ID measurement memang PUBLIK by
	 * design (terlihat di source HTML setiap halaman) — aman ditulis di
	 * kode, bukan secret/env. Instrumentasi: `src/lib/analytics.ts`.
	 */
	gaMeasurementId: 'G-43S1SXD3GF',
	/**
	 * Kontak fallback Omahe. Keputusan (2026-09-13, `docs/user-story.md`
	 * §Kontak langsung di card): untuk tahap awal, SEMUA tombol
	 * WhatsApp/Telepon di kartu memakai nomor ini (bukan per-perumahan/
	 * developer/marketing) — nama properti disisipkan ke pesan pembuka
	 * supaya lead tetap bisa ditelusuri. Field kontak per-entitas bisa
	 * menyusul sebagai iterasi terpisah kalau dibutuhkan nanti.
	 */
	whatsapp: '0811000000',
	telepon: '0811000000',
	email: 'halo@omahe.co.id'
} as const;

export const NAV = [
	{ href: '/cari', label: 'Cari Rumah' },
	{ href: '/developer', label: 'Developer' },
	{ href: '/kpr', label: 'Simulasi KPR' },
	{ href: '/artikel', label: 'Artikel' },
	{ href: '/mitra', label: 'Mitra' },
	{ href: '/tentang', label: 'Tentang' },
	{ href: '/kontak', label: 'Kontak' }
] as const;
