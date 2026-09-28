import { error } from '@sveltejs/kit';
import { getKartuNamaAgen } from '$lib/api';
import { SITE } from '$lib/config';
import { buatVCard } from '$lib/vcard';
import type { RequestHandler } from './$types';

/** AGEN-OMAHE-05 — "Simpan kontak": vCard agen AKTIF saja (tanpa nomor bila
 *  tidak aktif, kartu nama pun tidak menampilkan tombol ini). */
export const GET: RequestHandler = async ({ fetch, params }) => {
	const kartu = await getKartuNamaAgen(fetch, params.kode ?? '');
	if (!kartu || kartu.status !== 'aktif') error(404, 'Kontak agen tidak tersedia.');
	const isi = buatVCard({
		nama: kartu.nama,
		kodeAgen: kartu.kodeAgen,
		kantorNama: kartu.kantorNama,
		whatsapp: kartu.whatsapp,
		url: `${SITE.url}/agen-omahe/${kartu.kodeAgen}`
	});
	return new Response(isi, {
		headers: {
			'content-type': 'text/vcard; charset=utf-8',
			'content-disposition': `attachment; filename="${kartu.kodeAgen}.vcf"`,
			'cache-control': 'no-store'
		}
	});
};
