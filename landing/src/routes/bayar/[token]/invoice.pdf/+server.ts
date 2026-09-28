/** Unduh invoice PDF dari link bayar (TAGIHAN-02, api-contract §27) —
 *  proxy stream, lihat `$lib/server/dokumen-bayar`. */
import { proxyDokumenBayar } from '$lib/server/dokumen-bayar';

export const GET = proxyDokumenBayar('invoice');
