<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		url,
		page: halaman,
		pageSize,
		total,
		basePath = '/cari'
	}: { url: URL; page: number; pageSize: number; total: number; basePath?: string } = $props();

	const totalHalaman = $derived(Math.max(1, Math.ceil(total / pageSize)));

	function href(n: number): string {
		const params = new URLSearchParams(url.searchParams);
		if (n <= 1) params.delete('page');
		else params.set('page', String(n));
		const qs = params.toString();
		return `${basePath}${qs ? `?${qs}` : ''}`;
	}

	/** Jendela nomor halaman di sekitar halaman aktif — daftar penuh tidak
	 *  muat di layar ponsel begitu hasilnya ratusan. */
	const nomor = $derived.by(() => {
		const mulai = Math.max(1, Math.min(halaman - 1, totalHalaman - 2));
		const akhir = Math.min(totalHalaman, mulai + 2);
		return Array.from({ length: akhir - mulai + 1 }, (_, i) => mulai + i);
	});

	const kelas = (aktif: boolean) =>
		cn(
			'inline-flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm',
			aktif
				? 'border-primary bg-primary text-white'
				: 'border-line bg-white text-ink hover:bg-surface'
		);
</script>

{#if totalHalaman > 1}
	<nav class="flex items-center justify-center gap-2" aria-label="Navigasi halaman">
		{#if halaman > 1}
			<a href={href(halaman - 1)} class={kelas(false)} rel="prev">Sebelumnya</a>
		{/if}
		{#each nomor as n (n)}
			<a
				href={href(n)}
				class={kelas(n === halaman)}
				aria-current={n === halaman ? 'page' : undefined}
			>
				{n}
			</a>
		{/each}
		{#if halaman < totalHalaman}
			<a href={href(halaman + 1)} class={kelas(false)} rel="next">Berikutnya</a>
		{/if}
	</nav>
{/if}
