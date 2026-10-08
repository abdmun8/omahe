/**
 * Regression test mode fixture `client.ts` (env kosong — default `bun test`,
 * `$env/dynamic/private` di-mock kosong oleh `src/lib/test/setup.ts`):
 * slug yang tidak ada TIDAK boleh jadi crash generik. `getPerumahan` wajib
 * melempar `error(404, ...)` dari `@sveltejs/kit` (diterjemahkan Kit jadi
 * halaman 404 custom), sedangkan `getUnits` wajib resolve kosong supaya
 * `/cari` tetap hidup walau filter tidak match apa pun. Kalau nanti ada
 * yang mengubah `apiGet`/`getPerumahan` dan jalur 404-nya hilang, tes ini
 * yang pertama merah — bukan baru ketahuan pas production 500.
 */
import { afterEach, describe, expect, test, setSystemTime } from 'bun:test';
import { env } from '$env/dynamic/private';
import { SITE } from '$lib/config';
import { getKontak, getPerumahan, getSiteSettings, getTipeDetail, getUnits } from './client';
import { UNIT_LISTINGS } from './fixtures';

/**
 * Penjaga anti-network: dilempar masuk sebagai `fetchFn`. Di mode fixture
 * TIDAK ada satu pun jalur kode yang boleh memanggilnya — tes terakhir
 * memastikan penjaga ini benar-benar terpasang (bukan tes lulus karena
 * fungsinya diam-diam no-op).
 */
const tolakNetwork = (): never => {
	throw new Error('Tidak boleh ada panggilan network di mode fixture.');
};

/** Bentuknya dipaksa `typeof fetch` (lewat `unknown` — `typeof fetch`
 * punya static `preconnect`, jadi cast langsung ditolak svelte-check). */
const fetchDummy = tolakNetwork as unknown as typeof fetch;

describe('client (mode fixture, env kosong)', () => {
	test('getPerumahan: slug tidak ada → melempar HttpError 404, bukan crash', async () => {
		await expect(getPerumahan(fetchDummy, 'slug-tidak-ada')).rejects.toMatchObject({
			status: 404
		});
	});

	test('getPerumahan: slug valid di fixture → resolve normal tanpa throw', async () => {
		const detail = await getPerumahan(fetchDummy, 'griya-asri-bogor');
		expect(detail.slug).toBe('griya-asri-bogor');
		expect(detail.nama).toBe('Griya Asri Bogor');
	});

	test('getUnits: perumahanSlug tidak match apa pun → resolve kosong, bukan throw', async () => {
		const hasil = await getUnits(fetchDummy, { perumahanSlug: 'slug-tidak-ada' });
		expect(hasil.items).toEqual([]);
		expect(hasil.meta.total).toBe(0);
	});

	// `developerSlug` TIDAK ada di backend asli (api-contract.md §1) — di
	// mode ini filter harusnya jalan LOKAL (`filterFixtureUnits` pakai field
	// `developer.slug` di tiap item mock). Penjaga jalur API asli (strip
	// `developerSlug` sebelum fetch + filter client-side) ada di
	// `client.api.test.ts`.
	test('getUnits: developerSlug → hanya listing milik developer itu, meta.total ikut presisi', async () => {
		const hasil = await getUnits(fetchDummy, { developerSlug: 'nusa-land-development' });
		const diharapkan = UNIT_LISTINGS.filter((u) => u.developer?.slug === 'nusa-land-development');
		expect(diharapkan.length).toBeGreaterThan(0);
		expect(hasil.items.length).toBe(diharapkan.length);
		expect(hasil.items.every((u) => u.developer?.slug === 'nusa-land-development')).toBe(true);
		expect(hasil.meta.total).toBe(diharapkan.length);
	});

	test('getUnits: developerSlug tidak match apa pun → resolve kosong, bukan throw', async () => {
		const hasil = await getUnits(fetchDummy, { developerSlug: 'developer-tidak-ada' });
		expect(hasil.items).toEqual([]);
		expect(hasil.meta.total).toBe(0);
	});

	test('fetchDummy benar-benar melempar — tiga tes di atas lolos tanpa network sedikit pun', () => {
		expect(tolakNetwork).toThrow('Tidak boleh ada panggilan network');
	});
});

/**
 * Test `getKontak` (ADMIN-05). Env di-mutasi langsung seperti di
 * `client.api.test.ts` (baca `env.*` SAAT PANGGILAN, bukan saat import), dan
 * `setSystemTime` mengendalikan cache 60 detik yang module-level — tiap tes
 * jaringan memakai jendela waktu sendiri supaya cache tes sebelumnya pasti
 * kedaluwarsa, lalu waktu nyata dikembalikan di `afterEach`.
 */
const T0 = 1_750_000_000_000;

const apiJson = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const kontakSite = () => ({
	whatsapp: SITE.whatsapp,
	telepon: SITE.telepon,
	email: SITE.email
});

describe('getKontak (ADMIN-05)', () => {
	afterEach(() => {
		delete (env as Record<string, string | undefined>).OMAHE_API_BASE_URL;
		setSystemTime();
	});

	test('tanpa base URL → fallback SITE, TANPA network sama sekali', async () => {
		const kontak = await getKontak(fetchDummy);
		expect(kontak).toEqual(kontakSite());
	});

	test('error fetch → fallback SITE tanpa throw, dan fallback-nya ter-cache 60 detik', async () => {
		env.OMAHE_API_BASE_URL = 'https://api.perumahan.test';
		setSystemTime(T0);

		const gagal = (() => Promise.reject(new Error('timeout'))) as unknown as typeof fetch;
		// JANGAN pernah throw — kegagalan kontak tidak boleh menjatuhkan halaman.
		expect(await getKontak(gagal)).toEqual(kontakSite());

		// Fallback-karena-error cukup 60 detik juga: 30 detik kemudian endpoint
		// sudah "sehat" pun TIDAK dipanggil ulang — masih dilayani cache.
		setSystemTime(T0 + 30_000);
		const sehat = (async () =>
			apiJson({
				success: true,
				data: { kontak: { whatsapp: '628111111111', telepon: '6221111111', email: 'x@y.z' } }
			})) as unknown as typeof fetch;
		expect(await getKontak(sehat)).toEqual(kontakSite());
	});

	test('field null di-merge dengan fallback SITE; cache 60 detik lalu kedaluwarsa', async () => {
		env.OMAHE_API_BASE_URL = 'https://api.perumahan.test';
		setSystemTime(T0 + 120_000); // jendela baru — cache tes sebelumnya basi

		let dipanggil = 0;
		const fetchMock = (async () => {
			dipanggil += 1;
			return apiJson({
				success: true,
				data: {
					appTitle: 'Omahe',
					kontak: { whatsapp: '6281112345678', telepon: null, email: null }
				}
			});
		}) as unknown as typeof fetch;

		const diharapkan = {
			whatsapp: '6281112345678',
			telepon: SITE.telepon,
			email: SITE.email
		};
		expect(await getKontak(fetchMock)).toEqual(diharapkan);

		// Masih segar → tidak fetch ulang (dipanggil 1x saja).
		expect(await getKontak(fetchMock)).toEqual(diharapkan);
		expect(dipanggil).toBe(1);

		// Lewat 60 detik → cache kedaluwarsa, fetch ulang.
		setSystemTime(T0 + 120_000 + 61_000);
		expect(await getKontak(fetchMock)).toEqual(diharapkan);
		expect(dipanggil).toBe(2);
	});
});

describe('getTipeDetail (UNIT-05, mode fixture)', () => {
	test('tipe ada → detail + deskripsi Markdown mentah', async () => {
		const d = await getTipeDetail(fetch, 'cakrawala-hills-bandung', 'tipe-45-96');
		expect(d.tipe.nama).toBe('Tipe 45/96');
		expect(d.tipe.deskripsi).toContain('## Spesifikasi');
		expect(d.perumahan.developer?.slug).toBe('cakrawala-griya-utama');
	});

	test('tipe tidak ada → 404', async () => {
		await expect(getTipeDetail(fetch, 'griya-asri-bogor', 'tidak-ada')).rejects.toMatchObject({
			status: 404
		});
	});

	test('kartu fixture membawa tipeSlug yang sama dengan URL detail', () => {
		const kartu = UNIT_LISTINGS.find((u) => u.tipe === 'Tipe 45/96');
		expect(kartu?.tipeSlug).toBe('tipe-45-96');
	});
});

describe('getSiteSettings — teks hero (ADMIN-06)', () => {
	afterEach(() => {
		delete (env as Record<string, string | undefined>).OMAHE_API_BASE_URL;
		setSystemTime();
	});

	test('field teks terisi dipakai; null per field → fallback SITE', async () => {
		env.OMAHE_API_BASE_URL = 'https://api.perumahan.test';
		// Jendela waktu sendiri supaya cache modul (60 dtk) tes lain kedaluwarsa.
		setSystemTime(T0 + 10 * 60_000);
		const fetchMock = (async () =>
			apiJson({
				success: true,
				data: {
					kontak: { whatsapp: null, telepon: null, email: null },
					omahe: { tagline: 'Rumahmu mulai di sini', heroJudul: null, heroSubjudul: '  ' }
				}
			})) as unknown as typeof fetch;

		const { teks } = await getSiteSettings(fetchMock);
		expect(teks.tagline).toBe('Rumahmu mulai di sini');
		expect(teks.heroJudul).toBe(SITE.heroJudul);
		expect(teks.heroSubjudul).toBe(SITE.heroSubjudul);
	});

	test('tanpa base URL → semua teks bawaan SITE', async () => {
		const { teks } = await getSiteSettings(fetchDummy);
		expect(teks).toEqual({
			tagline: SITE.tagline,
			heroJudul: SITE.heroJudul,
			heroSubjudul: SITE.heroSubjudul
		});
	});
});

// AGEN-OMAHE-01 — verifikasi ID card agen (mode fixture, env kosong). Sisi
// backend epic masih WIP saat halaman ini dibangun: jalur fail-soft harus
// terkunci dari sekarang supaya nyala otomatis begitu endpoint live (pola
// MITRA-01). Semua tes memakai fetchDummy — tidak boleh ada network.
describe('getVerifikasiAgen (AGEN-OMAHE-01, mode fixture)', () => {
	test('kode terdaftar di fixture → ketemu + data profil publik saja', async () => {
		const { getVerifikasiAgen } = await import('./client');
		const hasil = await getVerifikasiAgen(fetchDummy, 'omh-7kq2mx');
		expect(hasil.ketemu).toBe(true);
		if (hasil.ketemu) {
			expect(hasil.data.nama).toBe('Widya Pratama');
			expect(hasil.data.kantorNama).toBe('Omahe Bogor');
			expect(hasil.data.status).toBe('aktif');
		}
	});

	test('kode rapi tapi tidak terdaftar → tidak ketemu, BUKAN layananError (bukan crash 404 Kit)', async () => {
		const { getVerifikasiAgen } = await import('./client');
		// Karakter tanpa ambigu semua (O/I/L dikecualikan generator kode).
		const hasil = await getVerifikasiAgen(fetchDummy, 'OMH-WXYZ99');
		expect(hasil).toEqual({ ketemu: false, layananError: false });
	});

	test('kode tak sesuai pola OMH- → ditolak lokal tanpa fetch sama sekali', async () => {
		const { getVerifikasiAgen } = await import('./client');
		for (const salah of ['', 'budi', 'OMH-', '../etc/passwd', 'OMH-abc def'])
			expect(await getVerifikasiAgen(fetchDummy, salah)).toEqual({
				ketemu: false,
				layananError: false
			});
	});
});

// AGEN-OMAHE-03 — agen pemasar di detail perumahan (mode fixture).
describe('getAgenPemasar (AGEN-OMAHE-03, mode fixture)', () => {
	test('tanpa ref → semua agen perumahan itu, urutan fixture', async () => {
		const { getAgenPemasar } = await import('./client');
		const agen = await getAgenPemasar(fetchDummy, 'griya-asri-bogor', null);
		expect(agen.map((a) => a.nama)).toEqual(['Widya Pratama', 'Dimas Nugraha']);
	});

	test('ref milik salah satu agen → hanya agen itu (atribusi tidak dibajak)', async () => {
		const { getAgenPemasar } = await import('./client');
		const agen = await getAgenPemasar(fetchDummy, 'griya-asri-bogor', 'ao-m7rq3hza');
		expect(agen.map((a) => a.nama)).toEqual(['Dimas Nugraha']);
	});

	test('ref lain (QR kerjasama) diabaikan; perumahan tanpa agen → []', async () => {
		const { getAgenPemasar } = await import('./client');
		expect(await getAgenPemasar(fetchDummy, 'griya-asri-bogor', 'abc123')).toHaveLength(2);
		expect(await getAgenPemasar(fetchDummy, 'villa-kenanga-residence', null)).toEqual([]);
	});
});

// AGEN-OMAHE-04 — direktori agen (mode fixture).
describe('getDirektoriAgen (AGEN-OMAHE-04, mode fixture)', () => {
	test('fixture dev: agen tanpa nomor HP, urut kantor', async () => {
		const { getDirektoriAgen, KODE_AGEN_PATTERN } = await import('./client');
		const agen = await getDirektoriAgen(fetchDummy);
		expect(agen.length).toBeGreaterThan(0);
		for (const a of agen) {
			// AGEN-OMAHE-05: kode fixture kini `OMHA-A…` (kode lama `OMH-…`
			// tetap sah — ikut pola kanonik client, bukan hardcode satu era.
			expect(a.kodeAgen).toMatch(KODE_AGEN_PATTERN);
			expect('telepon' in a).toBe(false);
		}
	});

	test('kirimMinatAgen mode fixture → sukses tanpa fetch, whatsapp null (nomor umum)', async () => {
		const { kirimMinatAgen } = await import('./client');
		await expect(
			kirimMinatAgen(fetchDummy, { kodeAgen: 'OMH-7KQ2MX', nama: 'Budi', telepon: '0812' })
		).resolves.toEqual({ whatsapp: null });
	});
});

// MITRA-04 — master kategori (mode fixture).
describe('getKategoriMitra (MITRA-04, mode fixture)', () => {
	test('fixture dev: master terurut & memuat kategori TANPA mitra di fixture MITRA', async () => {
		const { getKategoriMitra } = await import('./client');
		const { MITRA, KATEGORI_MITRA_MASTER } = await import('./fixtures');
		const master = await getKategoriMitra(fetchDummy);
		expect(master).toEqual(KATEGORI_MITRA_MASTER);
		// Urutan fixture = urutan server — jangan diacak di klien.
		const urutan = master!.map((k) => k.urutan);
		expect(urutan).toEqual([...urutan].sort((a, b) => a - b));
		// Minimal satu kategori master tanpa mitra — menjaga jalur tab kosong
		// (empty-state + CTA gabung) tetap teruji di dev fixture.
		const punyaMitra = new Set(MITRA.map((m) => m.kategori));
		expect(master!.some((k) => !punyaMitra.has(k.slug))).toBe(true);
	});
});

// Bentuk error backend `{ error, code, issues }` — pesan ramah harus sampai UI.
describe('pesanErrorBackend', () => {
	const res = (status: number, body: unknown) =>
		new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

	test('429 → pesan `error` backend (rate limit ramah)', async () => {
		const { pesanErrorBackend } = await import('./client');
		expect(
			await pesanErrorBackend(res(429, { error: 'Terlalu banyak permintaan.', code: 429 }))
		).toBe('Terlalu banyak permintaan.');
	});

	test('400 validasi → pesan issue pertama, bukan "Validation failed"', async () => {
		const { pesanErrorBackend } = await import('./client');
		expect(
			await pesanErrorBackend(
				res(400, {
					error: 'Validation failed',
					code: 400,
					issues: [{ message: 'Nomor WhatsApp tidak valid.' }]
				})
			)
		).toBe('Nomor WhatsApp tidak valid.');
	});

	test('5xx / bukan JSON → null (pesan generik di pemanggil)', async () => {
		const { pesanErrorBackend } = await import('./client');
		expect(await pesanErrorBackend(res(500, { error: 'stack trace' }))).toBeNull();
		expect(await pesanErrorBackend(new Response('oops', { status: 404 }))).toBeNull();
	});
});
