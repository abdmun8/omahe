/**
 * Naskah JSON → bahan render: foto (dari API publik Omahe), narasi TTS per adegan
 * (Edge TTS, suara id-ID) digabung jadi satu WAV, waktu per kata untuk subtitle.
 *
 *   npx tsx siapkan.ts naskah/<id>.json      → public/kerja/<id>/data.json
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {MsEdgeTTS, OUTPUT_FORMAT} from 'msedge-tts';
import type {Adegan, DataVideo, Foto, Kata, Naskah} from './src/tipe';

const require = createRequire(import.meta.url);
const FFMPEG: string = require('@ffmpeg-installer/ffmpeg').path;
const FFPROBE: string = require('@ffprobe-installer/ffprobe').path;
const API = process.env.OMAHE_API_BASE_URL || 'https://api.omahe.co.id';
const JEDA = 0.25; // detik hening antar-adegan
const EKOR = 0.6; // hening setelah adegan terakhir

const fileNaskah = process.argv[2];
if (!fileNaskah) throw new Error('pakai: tsx siapkan.ts naskah/<id>.json');
const naskah: Naskah = JSON.parse(fs.readFileSync(fileNaskah, 'utf8'));
const KERJA = path.resolve('public/kerja', naskah.id);
fs.rmSync(KERJA, {recursive: true, force: true});
fs.mkdirSync(KERJA, {recursive: true});

function durasi(file: string): number {
  return Number(
    execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim(),
  );
}

function ukuran(file: string): {w: number; h: number} {
  const [w, h] = execFileSync(FFPROBE, [
    '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file,
  ])
    .toString()
    .trim()
    .split(',')
    .map(Number);
  return {w, h};
}

const cacheApi = new Map<string, any>();
async function urlFoto(sumber: string): Promise<string> {
  const m = /^api:tipe\/([^/]+)\/([^#]+)#(\d+)$/.exec(sumber);
  if (!m) return sumber;
  const [, slug, tipe, i] = m;
  const kunci = `${slug}/${tipe}`;
  if (!cacheApi.has(kunci)) {
    const r = await fetch(`${API}/public/perumahan/${slug}/tipe/${tipe}`);
    if (!r.ok) throw new Error(`API ${r.status} untuk ${kunci}`);
    cacheApi.set(kunci, (await r.json()).data);
  }
  const foto = cacheApi.get(kunci).tipe.photos?.[Number(i)];
  if (!foto) throw new Error(`foto #${i} tidak ada di ${kunci}`);
  return foto.url;
}

let nomorFoto = 0;
async function ambilFoto(sumber: string): Promise<Foto> {
  const url = await urlFoto(sumber);
  const tujuan = path.join(KERJA, `foto-${nomorFoto++}`);
  if (/^https?:/.test(url)) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`unduh foto ${r.status}: ${sumber}`);
    fs.writeFileSync(tujuan, Buffer.from(await r.arrayBuffer()));
  } else {
    fs.copyFileSync(url, tujuan);
  }
  // Normalisasi ke JPEG ≤1920 px sisi panjang (PNG 1,5 MB dari storage → ringan di browser render).
  const jpg = `${tujuan}.jpg`;
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', tujuan, '-vf', "scale='min(1920,iw)':-2", '-q:v', '3', jpg]);
  fs.rmSync(tujuan);
  return {src: `/kerja/${naskah.id}/${path.basename(jpg)}`, ...ukuran(jpg)};
}

async function tts(teks: string, dir: string): Promise<{wav: string; kata: {teks: string; a: number; b: number}[]}> {
  fs.mkdirSync(dir, {recursive: true});
  for (let coba = 1; ; coba++) {
    try {
      const mesin = new MsEdgeTTS();
      await mesin.setMetadata(naskah.suara ?? 'id-ID-GadisNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {
        wordBoundaryEnabled: true,
      });
      const {audioFilePath, metadataFilePath} = await mesin.toFile(dir, teks, {rate: naskah.kecepatan ?? '+10%'});
      mesin.close();
      const meta = JSON.parse(fs.readFileSync(metadataFilePath!, 'utf8')).Metadata as any[];
      const wav = path.join(dir, 'narasi.wav');
      execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', audioFilePath, '-ar', '48000', '-ac', '1', wav]);
      return {
        wav,
        kata: meta
          .filter((x) => x.Type === 'WordBoundary')
          .map((x) => ({teks: x.Data.text.Text, a: x.Data.Offset / 1e7, b: (x.Data.Offset + x.Data.Duration) / 1e7})),
      };
    } catch (e) {
      if (coba >= 3) throw e;
      await new Promise((r) => setTimeout(r, 2000 * coba));
    }
  }
}

const adegan: Adegan[] = [];
const kata: Kata[] = [];
const potongan: string[] = [];
let mulai = 0;

for (const [i, a] of naskah.adegan.entries()) {
  const suara = await tts(a.narasi, path.join(KERJA, `tts-${i}`));
  const terakhir = i === naskah.adegan.length - 1;
  const lama = durasi(suara.wav) + (terakhir ? EKOR : JEDA);
  // Potong/padatkan tiap adegan tepat ke `lama` supaya waktu audio = waktu visual.
  const pas = path.join(KERJA, `adegan-${i}.wav`);
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', suara.wav, '-af', 'apad', '-t', String(lama), pas]);
  potongan.push(pas);

  const foto = a.foto ? await Promise.all(a.foto.map(ambilFoto)) : undefined;
  const {narasi: _n, foto: _f, ...sisa} = a;
  adegan.push({...sisa, foto, mulai, durasi: lama});
  if (a.subtitle !== false) {
    for (const k of suara.kata) kata.push({teks: k.teks, a: mulai + k.a, b: mulai + k.b, adegan: i});
  }
  mulai += lama;
}

const daftar = path.join(KERJA, 'daftar.txt');
fs.writeFileSync(daftar, potongan.map((p) => `file '${p}'`).join('\n'));
const narasi = path.join(KERJA, 'narasi.wav');
execFileSync(FFMPEG, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', daftar, '-c', 'copy', narasi]);

const data: DataVideo = {
  id: naskah.id,
  audio: `/kerja/${naskah.id}/narasi.wav`,
  durasi: mulai,
  catatanKaki: naskah.catatanKaki,
  adegan,
  kata,
};
fs.writeFileSync(path.join(KERJA, 'data.json'), JSON.stringify(data, null, 2));
console.log(`siap: ${naskah.id} — ${adegan.length} adegan, ${mulai.toFixed(1)} dtk, ${kata.length} kata`);
