/** Unduh kwitansi PDF (bukti bayar sah, hanya tagihan lunas — backend 409
 *  selain itu) dari link bayar (TAGIHAN-02 keputusan 6, api-contract §27). */
import { proxyDokumenBayar } from '$lib/server/dokumen-bayar';

export const GET = proxyDokumenBayar('kwitansi');
