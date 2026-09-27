/**
 * ADMIN-07 — file musik latar: redirect 302 ke URL presigned TERBARU dari
 * backend. `<audio src="/api/musik/file">` jadi stabil selamanya meski URL
 * presigned berganti/kedaluwarsa. Tidak ada musik aktif → 404.
 */
import { getSiteSettings } from '$lib/api';
import { error, redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
	const { musik } = await getSiteSettings(fetch);
	if (!musik) error(404, 'Musik tidak tersedia');
	setHeaders({ 'cache-control': 'public, max-age=60' });
	redirect(302, musik.url);
};
