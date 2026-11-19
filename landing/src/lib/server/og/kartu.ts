/**
 * Kartu gambar OG 1200×630 perumahan (SHARE-02) — dibangun dengan `satori`
 * (HTML-ish tree → SVG) lalu dirasterisasi `@resvg/resvg-js` (SVG → PNG).
 *
 * PEMISAHAN MURNI/EFEK: `bangunKartuOg` adalah fungsi MURNI yang mengembalikan
 * tree satori — bisa diuji tanpa render (mis. badge cashback hilang untuk
 * ref agen). `renderKartuOg` + `muatFotoDataUrl` satu-satunya bagian dengan
 * I/O (font modul `fonts.ts`, rasterisasi native, fetch foto).
 *
 * Mengapa `@resvg/resvg-js` (native) bukan `@resvg/resvg-wasm`:
 * - Tanpa init wasm saat cold start (serverless) & render ~10× lebih cepat.
 * - Dengan `ssr.external: ['@resvg/resvg-js']` (vite.config.ts) paket tidak
 *   dibundel esbuild/rolldown (require `.node` tidak bisa dibundel), dan
 *   adapter-vercel men-trace dependensi dengan `@vercel/nft` — node_modules
 *   + binari `.node` linux-x64-gnu ikut masuk function. Pola sama seperti
 *   native deps lain di SvelteKit (mis. sharp).
 * - `bun test` (runtime Bun) memuat napi binary ini tanpa masalah.
 *
 * GLIF: font Google subset latin TIDAK punya glyph "✓" (diverifikasi render
 * langsung — jadi tofu). Centang keunggulan = path SVG (lihat `centangOg`),
 * BUKAN karakter — jangan ganti ke "✓" teks.
 *
 * FORMAT: JPEG (jpeg-js, murni JS) — PNG dengan foto ±900 KB, sedangkan
 * WhatsApp sering membuang gambar pratinjau di atas ±300 KB. Kualitas turun
 * bertahap (80 → 70 → 60) sampai ≤ `OG_MAKS_BAJT`.
 */
import { Resvg } from '@resvg/resvg-js';
import jpeg from 'jpeg-js';
import satori from 'satori';
import { formatRupiah } from '$lib/utils';
import { fontInter500, fontJakarta700, fontJakarta800 } from './fonts';

/** Warna brand (satu pintu dengan design token landing). */
const WARNA = {
	primary: '#0B3D28',
	primaryDark: '#062015',
	accent: '#B8862F',
	accentLight: '#F0D9A0',
	putih: '#FFFFFF'
} as const;

export const OG_LEBAR = 1200;
export const OG_TINGGI = 630;

export interface KartuOgInput {
	/** Nama perumahan (tanpa tipe) — fallback judul varian tipe. */
	nama: string;
	/** Varian halaman tipe — nama tipe jadi judul utama. */
	tipeNama?: string | null;
	lokasiPendek: string | null;
	hargaMulai: number | null;
	badgePromo: string[];
	poinKeunggulan: string[];
	/** Foto perumahan/cover tipe — data URL (presign difetch server-side). */
	fotoDataUrl: string | null;
}

/** Node satori sederhana (tanpa JSX — repo ini bukan proyek React). `props`
 *  longgar (Record) supaya `<img src width height>` tetap bisa diekspresikan. */
export type SatoriNode = {
	type: string;
	props: {
		style?: Record<string, unknown>;
		children?: string | SatoriNode[];
	} & Record<string, unknown>;
};

/** Teks rapi satu baris + batas panjang — teks admin tidak pernah pecah layout. */
function teksRapi(teks: unknown, maks: number): string {
	const bersih = typeof teks === 'string' ? teks.replace(/\s+/g, ' ').trim() : '';
	if (bersih.length <= maks) return bersih;
	return `${bersih.slice(0, maks - 1).trimEnd()}…`;
}

/**
 * Nama 2 baris maksimum (satori tidak punya line-clamp): 30 karakter per
 * baris pada 54px cukup untuk lebar panel ±690px.
 */
function namaKartu(nama: string): string {
	return teksRapi(nama, 60);
}

/** Centang keunggulan — SVG path (font subset tidak punya glyph "✓";
 *  satori mendukung elemen `<svg>` di tree). */
function centangOg(): SatoriNode {
	return {
		type: 'svg',
		props: {
			width: 26,
			height: 26,
			viewBox: '0 0 24 24',
			fill: 'none',
			style: { marginRight: 14, flexShrink: 0 },
			children: [
				{
					type: 'path',
					props: {
						d: 'M5 12.5l4.5 4.5L19 7.5',
						stroke: WARNA.accentLight,
						strokeWidth: 3,
						strokeLinecap: 'round',
						strokeLinejoin: 'round',
						fill: 'none'
					}
				}
			]
		}
	};
}

function badgeOg(label: string): SatoriNode {
	return {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				background: WARNA.accent,
				color: WARNA.accentLight,
				fontFamily: 'Inter',
				fontSize: 22,
				lineHeight: 1,
				padding: '10px 18px',
				borderRadius: 999,
				marginRight: 12,
				marginBottom: 12
			},
			children: teksRapi(label, 34)
		}
	};
}

function keunggulanBarisOg(label: string): SatoriNode {
	return {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				flexDirection: 'row',
				alignItems: 'center',
				marginBottom: 14
			},
			children: [
				centangOg(),
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							color: 'rgba(255,255,255,0.92)',
							fontFamily: 'Inter',
							fontSize: 26
						},
						children: teksRapi(label, 36)
					}
				}
			]
		}
	};
}

/** Panel kiri: foto (object-fit cover) atau panel brand + wordmark. */
function panelFotoOg(fotoDataUrl: string | null, nama: string): SatoriNode {
	if (fotoDataUrl) {
		return {
			type: 'div',
			props: {
				style: { display: 'flex', width: 660, height: '100%', position: 'relative', flexShrink: 0 },
				children: [
					{
						type: 'img',
						props: {
							src: fotoDataUrl,
							width: 660,
							height: OG_TINGGI,
							style: { width: 660, height: '100%', objectFit: 'cover' }
						}
					}
				]
			}
		};
	}
	return {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				width: 660,
				height: '100%',
				flexShrink: 0,
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				background: WARNA.primary
			},
			children: [
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							color: WARNA.putih,
							fontFamily: 'Plus Jakarta Sans',
							fontWeight: 800,
							fontSize: 96,
							letterSpacing: '-0.02em'
						},
						children: 'Omahe'
					}
				},
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							color: WARNA.accentLight,
							fontFamily: 'Inter',
							fontSize: 28,
							marginTop: 18
						},
						children: teksRapi(nama, 40)
					}
				},
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							color: 'rgba(255,255,255,0.55)',
							fontFamily: 'Inter',
							fontSize: 24,
							marginTop: 14
						},
						children: 'Where your story begins'
					}
				}
			]
		}
	};
}

/**
 * Tree kartu OG — MURNI, dipakai route `og.jpg` dan diuji langsung (badge,
 * keunggulan, varian tipe, fallback tanpa foto).
 */
export function bangunKartuOg(input: KartuOgInput): SatoriNode {
	const tipeAktif = !!input.tipeNama;
	const judulUtama = tipeAktif ? teksRapi(input.tipeNama, 40) : namaKartu(input.nama);
	const subjudul = tipeAktif
		? teksRapi(input.nama, 60)
		: input.lokasiPendek
			? teksRapi(input.lokasiPendek, 44)
			: null;
	const harga = input.hargaMulai !== null ? `mulai ${formatRupiah(input.hargaMulai)}` : null;

	const kananChildren: SatoriNode[] = [];
	if (tipeAktif && input.nama) {
		kananChildren.push({
			type: 'div',
			props: {
				style: {
					display: 'flex',
					color: 'rgba(255,255,255,0.75)',
					fontFamily: 'Inter',
					fontSize: 26,
					marginBottom: 10
				},
				children: teksRapi(
					input.lokasiPendek ? `${input.nama} · ${input.lokasiPendek}` : input.nama,
					48
				)
			}
		});
	}
	if (!tipeAktif && subjudul) {
		kananChildren.push({
			type: 'div',
			props: {
				style: {
					display: 'flex',
					color: WARNA.accentLight,
					fontFamily: 'Inter',
					fontSize: 30,
					marginBottom: 14
				},
				children: subjudul
			}
		});
	}
	kananChildren.push({
		type: 'div',
		props: {
			style: {
				display: 'flex',
				color: WARNA.putih,
				fontFamily: 'Plus Jakarta Sans',
				fontWeight: 800,
				fontSize: judulUtama.length > 34 ? 44 : 56,
				lineHeight: 1.15,
				letterSpacing: '-0.01em'
			},
			children: judulUtama
		}
	});
	if (harga) {
		kananChildren.push({
			type: 'div',
			props: {
				style: {
					display: 'flex',
					color: WARNA.accentLight,
					fontFamily: 'Plus Jakarta Sans',
					fontWeight: 700,
					fontSize: 42,
					marginTop: 16
				},
				children: harga
			}
		});
	}
	if (input.badgePromo.length > 0) {
		kananChildren.push({
			type: 'div',
			props: {
				style: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginTop: 26 },
				children: input.badgePromo.slice(0, 3).map(badgeOg)
			}
		});
	}
	if (input.poinKeunggulan.length > 0) {
		kananChildren.push({
			type: 'div',
			props: {
				style: { display: 'flex', flexDirection: 'column', marginTop: 18 },
				children: input.poinKeunggulan.slice(0, 3).map(keunggulanBarisOg)
			}
		});
	}
	kananChildren.push({
		type: 'div',
		props: {
			style: {
				display: 'flex',
				color: 'rgba(255,255,255,0.6)',
				fontFamily: 'Inter',
				fontSize: 22,
				marginTop: 'auto'
			},
			children: 'omahe.co.id'
		}
	});

	return {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				width: OG_LEBAR,
				height: OG_TINGGI,
				flexDirection: 'row',
				background: WARNA.primaryDark
			},
			children: [
				panelFotoOg(input.fotoDataUrl, input.nama),
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							flex: 1,
							flexDirection: 'column',
							background: WARNA.primary,
							padding: 56
						},
						children: kananChildren
					}
				}
			]
		}
	};
}

const FONT_OG = [
	{ name: 'Plus Jakarta Sans', data: fontJakarta700, weight: 700, style: 'normal' },
	{ name: 'Plus Jakarta Sans', data: fontJakarta800, weight: 800, style: 'normal' },
	{ name: 'Inter', data: fontInter500, weight: 500, style: 'normal' }
] as const;

/** Batas ukuran gambar pratinjau (WhatsApp membuang yang terlalu besar). */
export const OG_MAKS_BAJT = 280_000;

/** SVG → JPEG 1200×630. Error dilempar — route pemakainya yang fail-soft. */
export async function renderKartuOg(node: SatoriNode): Promise<Buffer> {
	const svg = await satori(node as Parameters<typeof satori>[0], {
		width: OG_LEBAR,
		height: OG_TINGGI,
		fonts: [...FONT_OG]
	});
	const img = new Resvg(svg, { fitTo: { mode: 'width', value: OG_LEBAR } }).render();
	const raw = { data: Buffer.from(img.pixels), width: img.width, height: img.height };
	let hasil = jpeg.encode(raw, 80).data;
	for (const q of [70, 60]) {
		if (hasil.length <= OG_MAKS_BAJT) break;
		hasil = jpeg.encode(raw, q).data;
	}
	return Buffer.from(hasil);
}

const FOTO_TIMEOUT_MS = 2500;
const FOTO_MAKS_BAJT = 8_000_000;

/**
 * Foto presign → data URL untuk `<img>` satori. GAGAL (timeout 2,5 dtk,
 * non-200, bukan image, kosong) → `null` (panel fallback brand).
 */
export async function muatFotoDataUrl(url: string | null): Promise<string | null> {
	if (!url) return null;
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(FOTO_TIMEOUT_MS) });
		if (!res.ok) return null;
		const tipe = (res.headers.get('content-type') ?? '').split(';')[0].trim();
		if (!tipe.startsWith('image/')) return null;
		const buf = Buffer.from(await res.arrayBuffer());
		if (buf.length === 0 || buf.length > FOTO_MAKS_BAJT) return null;
		return `data:${tipe};base64,${buf.toString('base64')}`;
	} catch {
		return null;
	}
}
