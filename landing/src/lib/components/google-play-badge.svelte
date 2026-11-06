<script lang="ts">
	import { SITE } from '$lib/config';

	let { class: kelas = 'h-14' }: { class?: string } = $props();
</script>

<!-- Badge resmi Google Play (id). -->
<a href={SITE.playStoreUrl} target="_blank" rel="noopener noreferrer" class="inline-block">
	<img
		src="/google-play-badge.png"
		alt="Dapatkan di Google Play"
		width="646"
		height="250"
		loading="lazy"
		class="{kelas} w-auto"
	/>
</a>
