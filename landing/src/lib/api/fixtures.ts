/**
 * Data contoh — dipakai selama `OMAHE_API_SEARCH` belum diset (lihat
 * `client.ts`/README). Endpoint asli (`GET /public/units`,
 * `/public/developers`, `/public/developers/:slug`) SUDAH ADA di backend
 * `perumahan` per 2026-09-14 (epic `UNIT-04` & `DEVELOPER-01` selesai) —
 * file ini sekarang murni saklar bertahap, bukan lagi menunggu backend.
 * Sebelum switch penuh, cek `docs/api-contract.md` §Status: shape asli
 * `/public/developers[/:slug]` LEBIH RINGKAS dari yang dikarang di sini
 * (tidak ada `cakupanLokasi` — sudah dihapus dari fixture + UI 2026-09-15;
 * `proyek[]` di detail developer tidak punya `regionNama`/`hargaMulai`/
 * `unitTersedia` di response asli — jalur API asli mengisi stats itu via
 * enrichment `getUnits` per proyek di `client.ts`, jalur fixture di bawah
 * mengkomputasinya langsung dari data mock lokal).
 *
 * BUKAN data nyata. Nama developer/perumahan/harga di sini karangan, sama
 * seperti mockup visual (`docs/user-story.md` §Mockup visual). Set
 * `OMAHE_API_BASE_URL` + `OMAHE_API_SEARCH=1` untuk switch ke API asli
 * tanpa mengubah satu pun komponen.
 *
 * `fotoUrl` sengaja `null` di seluruh fixture — placeholder gradien yang
 * dipakai komponen kartu adalah jalur yang SAMA dengan kondisi presign
 * gagal di produksi, jadi jalur itu ikut teruji tiap hari.
 */
import type {
	DeveloperDetail,
	DeveloperSummary,
	PerumahanDetail,
	RegionOption,
	UnitListing
} from './types';

export const REGIONS: RegionOption[] = [
	{ kode: '32.01', nama: 'Kab. Bogor, Jawa Barat' },
	{ kode: '32.71', nama: 'Kota Bogor, Jawa Barat' },
	{ kode: '32.73', nama: 'Kota Bandung, Jawa Barat' },
	{ kode: '36.03', nama: 'Kab. Serang, Banten' },
	{ kode: '36.71', nama: 'Kota Tangerang, Banten' },
	{ kode: '33.74', nama: 'Kota Semarang, Jawa Tengah' },
	{ kode: '35.15', nama: 'Kab. Sidoarjo, Jawa Timur' },
	{ kode: '34.71', nama: 'Kota Yogyakarta, DI Yogyakarta' }
];

interface FixtureProject {
	nama: string;
	slug: string;
	regionKode: string;
	deskripsi: string;
	developerSlug: string | null;
	alamat: string;
	tipe: Array<{
		tipe: string;
		luasTanah: number;
		luasBangunan: number;
		harga: number;
		tersedia: number;
	}>;
}

const PROJECTS: FixtureProject[] = [
	{
		nama: 'Griya Asri Bogor',
		slug: 'griya-asri-bogor',
		regionKode: '32.01',
		developerSlug: 'nusa-land-development',
		alamat: 'Jl. Raya Tajur No. 88, Ciawi, Kab. Bogor',
		deskripsi:
			'Hunian keluarga di kaki Gunung Salak, 10 menit dari pintu tol Ciawi. Cluster tertutup dengan one gate system, taman bermain, dan jalur pedestrian di seluruh area.',
		tipe: [
			{ tipe: 'Tipe 36/72', luasTanah: 72, luasBangunan: 36, harga: 385000000, tersedia: 12 },
			{ tipe: 'Tipe 45/90', luasTanah: 90, luasBangunan: 45, harga: 520000000, tersedia: 7 },
			{ tipe: 'Tipe 60/120', luasTanah: 120, luasBangunan: 60, harga: 785000000, tersedia: 3 }
		]
	},
	{
		nama: 'Villa Kenanga Residence',
		slug: 'villa-kenanga-residence',
		regionKode: '32.71',
		developerSlug: 'nusa-land-development',
		alamat: 'Jl. Kenanga Raya No. 12, Tanah Sareal, Kota Bogor',
		deskripsi:
			'Rumah dua lantai di tengah kota Bogor, berjarak 5 menit dari Stasiun Bogor. Cocok untuk komuter yang tetap ingin akses sekolah dan rumah sakit dalam radius 2 km.',
		tipe: [
			{ tipe: 'Tipe 50/84', luasTanah: 84, luasBangunan: 50, harga: 675000000, tersedia: 9 },
			{ tipe: 'Tipe 70/105', luasTanah: 105, luasBangunan: 70, harga: 980000000, tersedia: 4 }
		]
	},
	{
		nama: 'Cakrawala Hills Bandung',
		slug: 'cakrawala-hills-bandung',
		regionKode: '32.73',
		developerSlug: 'cakrawala-griya-utama',
		alamat: 'Jl. Setiabudi Atas KM 12, Ledeng, Kota Bandung',
		deskripsi:
			'Cluster berkontur di Bandung utara dengan pemandangan lembah. Setiap unit menghadap taman linier; akses ke kawasan pendidikan Setiabudi 15 menit.',
		tipe: [
			{ tipe: 'Tipe 45/96', luasTanah: 96, luasBangunan: 45, harga: 725000000, tersedia: 6 },
			{ tipe: 'Tipe 72/140', luasTanah: 140, luasBangunan: 72, harga: 1450000000, tersedia: 2 }
		]
	},
	{
		nama: 'Sentosa Park Sidoarjo',
		slug: 'sentosa-park-sidoarjo',
		regionKode: '35.15',
		developerSlug: 'bumi-sentosa-properti',
		alamat: 'Jl. Raya Wage No. 45, Taman, Kab. Sidoarjo',
		deskripsi:
			'Perumahan subsidi dan komersial berdampingan, 20 menit ke Bandara Juanda. Fasilitas masjid, ruko, dan sekolah dasar di dalam kawasan.',
		tipe: [
			{ tipe: 'Tipe 30/60', luasTanah: 60, luasBangunan: 30, harga: 245000000, tersedia: 24 },
			{ tipe: 'Tipe 36/72', luasTanah: 72, luasBangunan: 36, harga: 335000000, tersedia: 15 }
		]
	},
	{
		nama: 'Bumi Sentosa Regency',
		slug: 'bumi-sentosa-regency',
		regionKode: '33.74',
		developerSlug: 'bumi-sentosa-properti',
		alamat: 'Jl. Ngaliyan Raya No. 7, Ngaliyan, Kota Semarang',
		deskripsi:
			'Kawasan hunian 12 hektar di Semarang barat dengan danau retensi sebagai pusat kawasan. Tahap 2 sedang dibuka.',
		tipe: [
			{ tipe: 'Tipe 40/78', luasTanah: 78, luasBangunan: 40, harga: 425000000, tersedia: 18 },
			{ tipe: 'Tipe 55/105', luasTanah: 105, luasBangunan: 55, harga: 640000000, tersedia: 8 }
		]
	},
	{
		nama: 'Puri Mentari Tangerang',
		slug: 'puri-mentari-tangerang',
		regionKode: '36.71',
		developerSlug: null,
		alamat: 'Jl. Gatot Subroto KM 5, Jatiuwung, Kota Tangerang',
		deskripsi:
			'Rumah siap huni dekat kawasan industri Jatake. Unit terbatas, sebagian besar sudah terjual pada tahap pertama.',
		tipe: [{ tipe: 'Tipe 36/60', luasTanah: 60, luasBangunan: 36, harga: 465000000, tersedia: 5 }]
	}
];

const DEVELOPERS = [
	{
		id: 'dev-nusa-land',
		nama: 'PT Nusa Land Development',
		slug: 'nusa-land-development',
		deskripsi:
			'Pengembang perumahan menengah di Jabodetabek sejak 2009. Fokus pada cluster skala kecil-menengah dengan serah terima tepat waktu.'
	},
	{
		id: 'dev-cakrawala',
		nama: 'PT Cakrawala Griya Utama',
		slug: 'cakrawala-griya-utama',
		deskripsi:
			'Pengembang asal Bandung yang menggarap lahan berkontur di kawasan Bandung utara dan Lembang.'
	},
	{
		id: 'dev-bumi-sentosa',
		nama: 'PT Bumi Sentosa Properti',
		slug: 'bumi-sentosa-properti',
		deskripsi:
			'Menggarap perumahan subsidi dan komersial di Jawa Tengah dan Jawa Timur, dengan lebih dari 4.000 unit terbangun.'
	}
];

const regionNama = (kode: string) => REGIONS.find((r) => r.kode === kode)?.nama ?? null;

const developerRef = (slug: string | null) => {
	const d = DEVELOPERS.find((x) => x.slug === slug);
	return d ? { nama: d.nama, slug: d.slug } : null;
};

/** Semua kartu hasil pencarian — satu per (perumahan, tipe). */
export const UNIT_LISTINGS: UnitListing[] = PROJECTS.flatMap((p) =>
	p.tipe.map((t) => ({
		id: `${p.slug}--${t.tipe.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
		tipe: t.tipe,
		luasTanah: t.luasTanah,
		luasBangunan: t.luasBangunan,
		hargaMin: t.harga,
		hargaMax: t.harga,
		unitTersedia: t.tersedia,
		perumahan: {
			nama: p.nama,
			slug: p.slug,
			regionKode: p.regionKode,
			regionNama: regionNama(p.regionKode)
		},
		developer: developerRef(p.developerSlug),
		fotoUrl: null
	}))
);

export const DEVELOPER_SUMMARIES: DeveloperSummary[] = DEVELOPERS.map((d) => {
	const proyek = PROJECTS.filter((p) => p.developerSlug === d.slug);
	return {
		...d,
		logoUrl: null,
		jumlahProyek: proyek.length
	};
});

export function developerDetail(slug: string): DeveloperDetail | null {
	const summary = DEVELOPER_SUMMARIES.find((d) => d.slug === slug);
	if (!summary) return null;
	return {
		...summary,
		proyek: PROJECTS.filter((p) => p.developerSlug === slug).map((p) => ({
			nama: p.nama,
			slug: p.slug,
			regionNama: regionNama(p.regionKode),
			fotoUrl: null,
			hargaMulai: Math.min(...p.tipe.map((t) => t.harga)),
			unitTersedia: p.tipe.reduce((sum, t) => sum + t.tersedia, 0)
		}))
	};
}

/**
 * Detail perumahan versi fixture. Sengaja mencontohkan MODE LEGACY
 * (`sections: null`) untuk sebagian proyek dan mode section builder untuk
 * yang lain — dua-duanya harus bisa dirender `/perumahan/:slug`.
 */
export function perumahanDetail(slug: string): PerumahanDetail | null {
	const p = PROJECTS.find((x) => x.slug === slug);
	if (!p) return null;

	const pakaiBuilder = p.slug === 'griya-asri-bogor' || p.slug === 'cakrawala-hills-bandung';

	return {
		id: `perumahan-${p.slug}`,
		nama: p.nama,
		slug: p.slug,
		deskripsi: p.deskripsi,
		photos: [],
		developer: developerRef(p.developerSlug),
		regionNama: regionNama(p.regionKode),
		sections: pakaiBuilder
			? [
					{
						id: '00000000-0000-4000-8000-000000000001',
						type: 'hero',
						enabled: true,
						props: {
							headline: p.nama,
							subheadline: p.deskripsi.split('.')[0] + '.',
							ctaLabel: 'Ajukan Sekarang',
							imageUrl: null
						}
					},
					{
						id: '00000000-0000-4000-8000-000000000002',
						type: 'facilities',
						enabled: true,
						props: {
							heading: 'Fasilitas Kawasan',
							items: [
								{ label: 'One gate system 24 jam' },
								{ label: 'Taman bermain anak' },
								{ label: 'Masjid kawasan' },
								{ label: 'Jalur pedestrian' },
								{ label: 'Saluran air tertutup' },
								{ label: 'Listrik bawah tanah' }
							]
						}
					},
					{
						id: '00000000-0000-4000-8000-000000000003',
						type: 'location',
						enabled: true,
						props: { heading: 'Lokasi', address: p.alamat }
					},
					{
						id: '00000000-0000-4000-8000-000000000004',
						type: 'faq',
						enabled: true,
						props: {
							heading: 'Pertanyaan yang Sering Diajukan',
							items: [
								{
									q: 'Apakah bisa KPR?',
									a: 'Bisa. Pengajuan KPR diproses lewat bank rekanan setelah berkas Anda lengkap. Simulasi cicilan bisa dicoba dulu di halaman Simulasi KPR.'
								},
								{
									q: 'Berapa tanda jadi yang harus dibayar?',
									a: 'Besaran tanda jadi ditentukan pengembang dan diinformasikan saat Anda mengajukan unit.'
								}
							]
						}
					}
				]
			: null
	};
}

export function projectSlugs(): string[] {
	return PROJECTS.map((p) => p.slug);
}
