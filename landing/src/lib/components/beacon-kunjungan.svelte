<!--
	ANALITIK-01 — catat satu kunjungan halaman perumahan (detail perumahan &
	tipe) ke statistik internal admin. Id anonim browser disimpan di
	localStorage (`omahe_vid`, tanpa data pribadi); backend hanya menyimpan
	hash id + tanggal, jadi satu browser = satu kunjungan per perumahan per
	hari. Fail-soft total — tidak merender apa pun, error diabaikan.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let { slug }: { slug: string } = $props();

	function idPengunjung(): string {
		const baru = () => crypto.randomUUID().replaceAll('-', '');
		try {
			const ada = localStorage.getItem('omahe_vid');
			if (ada && /^[A-Za-z0-9_-]{16,64}$/.test(ada)) return ada;
			const id = baru();
			localStorage.setItem('omahe_vid', id);
			return id;
		} catch {
			return baru();
		}
	}

	onMount(() => {
		try {
			void fetch('/api/kunjungan', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ slug, pengunjung: idPengunjung() }),
				keepalive: true
			}).catch(() => {});
		} catch {
			// crypto/fetch tidak tersedia — lewati.
		}
	});
</script>
