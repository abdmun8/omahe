/**
 * Hub "Gabung Jaringan Omahe" (omahe#3) — halaman murni statis (tidak
 * menampilkan kontak admin), di-prerender build-time seperti `/tentang`.
 * Sub-halaman per audiens menampilkan kontak ADMIN-05 → SSR di sana.
 */
export const prerender = true;
