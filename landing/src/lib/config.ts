/** Identitas & kontak Omahe — dipakai header, footer, metadata SEO. */
export const SITE = {
	nama: 'Omahe',
	tagline: 'Where your story begins',
	deskripsi:
		'Cari rumah baru dari pengembang terpercaya di seluruh Indonesia. Bandingkan tipe, harga, dan lokasi, lalu ajukan langsung.',
	url: 'https://omahe.id',
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
	email: 'halo@omahe.id'
} as const;

export const NAV = [
	{ href: '/cari', label: 'Cari Rumah' },
	{ href: '/developer', label: 'Developer' },
	{ href: '/kpr', label: 'Simulasi KPR' },
	{ href: '/tentang', label: 'Tentang' },
	{ href: '/kontak', label: 'Kontak' }
] as const;
