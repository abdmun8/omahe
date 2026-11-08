/** Bentuk naskah masukan (ditulis LLM / manusia) dan data siap-render (keluaran siapkan.ts). */

export type JenisAdegan = 'foto' | 'poin' | 'angka' | 'penutup';

export interface AngkaBaris {
  label: string;
  nilai: string;
  sorot?: boolean;
}

export interface AdeganNaskah {
  jenis: JenisAdegan;
  /** Teks yang dibacakan TTS. Tulis angka apa adanya (Rp166 juta) — subtitle ikut teks ini. */
  narasi: string;
  /**
   * Sumber foto: `api:tipe/<slugPerumahan>/<slugTipe>#<indeks>` (diambil dari API publik Omahe
   * saat render — URL presign kedaluwarsa 24 jam, jadi jangan tulis URL storage langsung),
   * URL https biasa, atau path lokal.
   */
  foto?: string[];
  judul?: string;
  sub?: string;
  chip?: string[];
  poin?: string[];
  angka?: AngkaBaris[];
  url?: string;
  kredit?: string;
  /** false → subtitle tidak tampil di adegan ini (mis. penutup yang sudah menampilkan URL). */
  subtitle?: boolean;
}

export interface Fakta {
  klaim: string;
  sumber: string;
}

export interface Naskah {
  id: string;
  pilar: 'marketing' | 'edukasi' | 'berita' | 'perkenalan';
  template: string;
  suara?: string;
  kecepatan?: string;
  catatanKaki?: string;
  adegan: AdeganNaskah[];
  caption: string;
  hashtag: string[];
  link: string;
  fakta: Fakta[];
}

export interface Foto {
  src: string;
  w: number;
  h: number;
}

export interface Adegan extends Omit<AdeganNaskah, 'foto' | 'narasi'> {
  mulai: number;
  durasi: number;
  foto?: Foto[];
}

export interface Kata {
  teks: string;
  a: number;
  b: number;
  adegan: number;
}

export interface DataVideo {
  id: string;
  audio: string;
  durasi: number;
  catatanKaki?: string;
  adegan: Adegan[];
  kata: Kata[];
}
