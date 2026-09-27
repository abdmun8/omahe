/**
 * ADMIN-07 — status musik latar untuk mini-player (`musik-latar.svelte`).
 * Dipanggil dari BROWSER (bukan data layout) supaya halaman prerender
 * (/tentang, /gabung, artikel) ikut tahu saat superadmin mengaktifkan/
 * mematikan musik tanpa redeploy. File diputar lewat `/api/musik/file`
 * (URL stabil — presigned URL backend kedaluwarsa, tidak boleh dibekukan
 * di HTML prerender).
 */
import { getSiteSettings } from '$lib/api';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
	const { musik } = await getSiteSettings(fetch);
	setHeaders({ 'cache-control': 'public, max-age=60' });
	return json({ ada: musik !== null, judul: musik?.judul ?? '' });
};
