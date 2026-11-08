/**
 * public/kerja/<id>/data.json → keluaran/<id>.mp4 (1080×1920, 30 fps).
 *
 *   npx tsx render.ts <id>
 *
 * Butuh Chrome headless (puppeteer). Di mesin tanpa library sistem Chrome, set
 * CHROME_BIN + LD_LIBRARY_PATH (lihat README). Di GitHub Actions ubuntu-latest tidak perlu.
 */
import fs from 'node:fs';
import {renderVideo} from '@revideo/renderer';

process.env.DISABLE_TELEMETRY = 'true';
const id = process.argv[2];
if (!id) throw new Error('pakai: tsx render.ts <id>');
const data = JSON.parse(fs.readFileSync(`public/kerja/${id}/data.json`, 'utf8'));

const mulai = Date.now();
const file = await renderVideo({
  projectFile: './src/project.tsx',
  variables: {data},
  settings: {
    outFile: `${id}.mp4`,
    outDir: 'keluaran',
    workers: 1,
    logProgress: false,
    puppeteer: {
      executablePath: process.env.CHROME_BIN || undefined,
      headless: true,
      args: ['--no-sandbox'],
    },
  },
});
console.log(`render: ${file} (${((Date.now() - mulai) / 1000).toFixed(0)} dtk)`);
