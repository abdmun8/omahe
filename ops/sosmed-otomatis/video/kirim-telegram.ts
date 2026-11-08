/**
 * Kirim video hasil render ke Telegram untuk direview: video + caption singkat + tombol
 * ✅ Setujui / ✏️ Revisi / ❌ Lewati, lalu satu pesan berisi caption lengkap, hashtag,
 * link UTM, dan daftar fakta+sumber (bahan cek sebelum disetujui).
 *
 *   npx tsx kirim-telegram.ts <id>
 *
 * Rahasia dibaca dari ~/.config/omahe-sosmed/env (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) —
 * tidak pernah disimpan di repo.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {Naskah} from './src/tipe';

function bacaEnv(): Record<string, string> {
  const file = process.env.OMAHE_SOSMED_ENV || path.join(os.homedir(), '.config/omahe-sosmed/env');
  const hasil: Record<string, string> = {};
  for (const baris of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(baris);
    if (m) hasil[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return hasil;
}

const id = process.argv[2];
if (!id) throw new Error('pakai: tsx kirim-telegram.ts <id>');
const env = {...bacaEnv(), ...process.env};
const TOKEN = env.TELEGRAM_BOT_TOKEN;
const CHAT = env.TELEGRAM_CHAT_ID;
if (!TOKEN || !CHAT) throw new Error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID belum diisi');

const naskah: Naskah = JSON.parse(fs.readFileSync(`naskah/${id}.json`, 'utf8'));
const data = JSON.parse(fs.readFileSync(`public/kerja/${id}/data.json`, 'utf8'));
const video = `keluaran/${id}.mp4`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function api(metode: string, body: FormData | Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${metode}`, {
    method: 'POST',
    ...(body instanceof FormData
      ? {body}
      : {body: JSON.stringify(body), headers: {'content-type': 'application/json'}}),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(`${metode}: ${j.description}`);
  return j.result;
}

const ringkas =
  `<b>🎬 Review video — ${esc(naskah.pilar)} (${esc(naskah.template)})</b>\n` +
  `<code>${esc(id)}</code> · ${data.durasi.toFixed(0)} dtk\n\n` +
  esc(naskah.caption.split('\n')[0]);

const form = new FormData();
form.set('chat_id', CHAT);
form.set('caption', ringkas);
form.set('parse_mode', 'HTML');
form.set('supports_streaming', 'true');
form.set('width', '1080');
form.set('height', '1920');
form.set('duration', String(Math.round(data.durasi)));
form.set(
  'reply_markup',
  JSON.stringify({
    inline_keyboard: [
      [
        {text: '✅ Setujui', callback_data: `ok:${id}`.slice(0, 64)},
        {text: '✏️ Revisi', callback_data: `revisi:${id}`.slice(0, 64)},
        {text: '❌ Lewati', callback_data: `lewati:${id}`.slice(0, 64)},
      ],
    ],
  }),
);
form.set('video', new Blob([fs.readFileSync(video)], {type: 'video/mp4'}), `${id}.mp4`);
const pesanVideo = await api('sendVideo', form);

const detail =
  `<b>Caption</b>\n${esc(naskah.caption)}\n\n${esc(naskah.hashtag.join(' '))}\n\n` +
  `<b>Link</b>\n${esc(naskah.link)}\n\n` +
  `<b>Fakta & sumber</b>\n` +
  naskah.fakta.map((f) => `• ${esc(f.klaim)}\n  <i>${esc(f.sumber)}</i>`).join('\n');
await api('sendMessage', {
  chat_id: CHAT,
  text: detail.slice(0, 4000),
  parse_mode: 'HTML',
  reply_parameters: {message_id: pesanVideo.message_id},
  link_preview_options: {is_disabled: true},
});
console.log(`terkirim: ${id} (pesan ${pesanVideo.message_id})`);
