<!--
	Musik latar Omahe (ADMIN-07) — mini-player mengambang di layout root, jadi
	musik BERLANJUT saat pindah halaman. Browser memblokir autoplay bersuara:
	musik mulai pada klik/tap/tombol pertama pengunjung (kecuali pengunjung
	pernah mematikannya — diingat per browser). Elemen <audio> baru dibuat
	saat itu, jadi file tidak diunduh sebelum ada interaksi (tidak membebani
	muat halaman). Tombol pause/putar selalu terlihat (WCAG 1.4.2).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { bacaPreferensiMusik, simpanPreferensiMusik } from '$lib/musik';

	/** Status dari `/api/musik` (dicek di browser — halaman prerender ikut
	 *  mengikuti saklar superadmin tanpa redeploy). */
	let ada = $state(false);
	let judul = $state('');

	let audio: HTMLAudioElement | null = null;
	let berbunyi = $state(false);
	let tombol: HTMLButtonElement | undefined = $state();

	function storage(): Storage | null {
		try {
			return window.localStorage;
		} catch {
			return null;
		}
	}

	async function putar() {
		if (!audio) {
			audio = new Audio('/api/musik/file');
			audio.loop = true;
			audio.volume = 0.4;
			audio.addEventListener('pause', () => (berbunyi = false));
			audio.addEventListener('play', () => (berbunyi = true));
		}
		try {
			await audio.play();
		} catch {
			// Diblokir browser / gagal muat — tombol tetap bisa dicoba manual.
			berbunyi = false;
		}
	}

	function toggle() {
		if (berbunyi) {
			audio?.pause();
			simpanPreferensiMusik(storage(), 'mati');
		} else {
			simpanPreferensiMusik(storage(), 'nyala');
			putar();
		}
	}

	onMount(() => {
		let batal = false;
		fetch('/api/musik')
			.then((r) => (r.ok ? r.json() : null))
			.then((d: { ada?: boolean; judul?: string } | null) => {
				if (batal || !d?.ada) return;
				ada = true;
				judul = d.judul ?? '';
				pasangPemicu();
			})
			.catch(() => {
				// Gagal cek — tanpa musik, halaman tetap normal.
			});
		return () => {
			batal = true;
			lepasPemicu?.();
			audio?.pause();
		};
	});

	let lepasPemicu: (() => void) | null = null;

	/** Musik mulai di interaksi pertama (kecuali pengunjung pernah mematikan). */
	function pasangPemicu() {
		if (bacaPreferensiMusik(storage()) === 'mati') return;
		const mulai = (e: Event) => {
			lepas();
			// Interaksi pertama ADALAH klik tombol ini → biar toggle() yang urus.
			if (tombol && e.target instanceof Node && tombol.contains(e.target)) return;
			putar();
		};
		const lepas = () => {
			window.removeEventListener('pointerdown', mulai);
			window.removeEventListener('keydown', mulai);
		};
		window.addEventListener('pointerdown', mulai, { once: true });
		window.addEventListener('keydown', mulai, { once: true });
		lepasPemicu = lepas;
	}
</script>

{#if ada}<button
		bind:this={tombol}
		type="button"
		onclick={toggle}
		aria-pressed={berbunyi}
		aria-label={berbunyi
			? `Hentikan musik${judul ? `: ${judul}` : ''}`
			: `Putar musik${judul ? `: ${judul}` : ''}`}
		title={berbunyi ? 'Hentikan musik' : `Putar musik${judul ? ` — ${judul}` : ''}`}
		class="border-line text-primary fixed bottom-24 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border bg-white/95 shadow-md backdrop-blur transition-colors hover:bg-white md:bottom-6"
	>
		{#if berbunyi}
			<!-- Ikon speaker aktif -->
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				class="h-5 w-5"
				aria-hidden="true"
			>
				<path d="M11 5 6 9H2v6h4l5 4V5z" stroke-linejoin="round" />
				<path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" stroke-linecap="round" />
			</svg>
		{:else}
			<!-- Ikon speaker mati -->
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				class="h-5 w-5"
				aria-hidden="true"
			>
				<path d="M11 5 6 9H2v6h4l5 4V5z" stroke-linejoin="round" />
				<path d="m22 9-6 6M16 9l6 6" stroke-linecap="round" />
			</svg>
		{/if}
	</button>{/if}
