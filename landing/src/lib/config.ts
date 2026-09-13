/** Identitas & kontak Omahe — dipakai header, footer, metadata SEO. */
export const SITE = {
	nama: 'Omahe',
	tagline: 'Where your story begins',
	deskripsi:
		'Cari rumah baru dari pengembang terpercaya di seluruh Indonesia. Bandingkan tipe, harga, dan lokasi, lalu ajukan langsung.',
	url: 'https://omahe.id',
	/**
	 * Kontak fallback Omahe. CATATAN: sumber nomor kontak per-properti BELUM
	 * DIPUTUSKAN (perumahan / developer / marketing pemegang unit — lihat
	 * `docs/user-story.md` §Kontak langsung di card). Selama belum, tombol
	 * WhatsApp/Telepon di kartu memakai nomor ini dan menyebut nama properti
	 * di pesan pembuka, supaya lead tetap bisa ditelusuri.
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
