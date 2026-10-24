#!/usr/bin/env bash
# Artikel harian otomatis Omahe — dijalankan cron di server (lihat README.md).
#
#   1. Claude Code (headless) riset berita ekonomi/regulasi hari ini → brief + dosier fakta
#   2. pi (glm-5.3-flash) menulis artikel dari brief (fallback: Claude bila pi gagal/kuota habis)
#   3. Claude cek fakta artikel vs dosier & perbaiki
#   4. unduh cover, validasi, commit + push ke main → Vercel deploy otomatis
#
# Idempoten: bila artikel bertanggal hari ini (WIB) sudah ada di origin/main → keluar.
# Bekerja di clone TERPISAH ($BOT) supaya tidak mengganggu repo kerja harian.
set -euo pipefail

NODE_BIN="$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1)" # pi butuh node
export PATH="$HOME/.local/bin:$HOME/.bun/bin:${NODE_BIN:+$NODE_BIN:}/usr/local/bin:/usr/bin:/bin"
REMOTE="git@github.com:abdmun8/omahe.git"
BOT="${ARTIKEL_BOT_DIR:-$HOME/projects/omahe-artikel-bot}"
STATE="$HOME/.local/state/omahe-artikel"
TANGGAL="${ARTIKEL_TANGGAL:-$(TZ=Asia/Jakarta date +%F)}"
KERJA="$STATE/$TANGGAL"
LOG="$KERJA/log.txt"
PI_MODEL="${ARTIKEL_PI_MODEL:-zai/glm-5.3-flash}"
DRY_RUN="${ARTIKEL_DRY_RUN:-0}" # 1 = semua langkah kecuali push

mkdir -p "$KERJA"
exec 9>"$STATE/lock"
flock -n 9 || { echo "$(date -Is) proses lain masih jalan" >>"$STATE/cron.log"; exit 0; }
exec >>"$LOG" 2>&1
log() { echo "[$(date '+%F %T')] $*"; }
gagal() { log "GAGAL: $*"; echo "$TANGGAL GAGAL: $*" >>"$STATE/ringkasan.log"; exit 1; }
trap 'gagal "perintah gagal di baris $LINENO (exit $?)"' ERR

log "=== mulai artikel $TANGGAL ==="

# --- clone bot (tanpa node_modules — validasi & skrip cover tanpa dependency) ---
if [ ! -d "$BOT/.git" ]; then git clone -q "$REMOTE" "$BOT"; fi
cd "$BOT"
git fetch -q origin main
git checkout -q -B main origin/main
git reset -q --hard origin/main
git clean -qfd landing/src/content/artikel landing/static/artikel
DIR_ARTIKEL="$BOT/landing/src/content/artikel"

if grep -lq "^tanggal: '$TANGGAL'" "$DIR_ARTIKEL"/*.md 2>/dev/null; then
  log "artikel bertanggal $TANGGAL sudah ada — selesai"; exit 0
fi

# --- tunggu memori: jangan bentrok dengan CI runner (RAM server 2.9 GB) ---
for i in $(seq 1 120); do
  avail=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
  if ! pgrep -f 'Runner.Worker' >/dev/null && [ "$avail" -ge 900 ]; then break; fi
  [ "$i" -eq 120 ] && gagal "memori tidak lega 2 jam (avail ${avail} MB / CI jalan)"
  sleep 60
done

render() { # render <template> → stdout, ganti {{KUNCI}} dari env RENDER_*
  python3 - "$1" <<'PY'
import os, re, sys
t = open(sys.argv[1]).read()
print(re.sub(r"\{\{([A-Z_]+)\}\}", lambda m: os.environ.get("RENDER_" + m.group(1), m.group(0)), t))
PY
}

claude_jalan() { # claude_jalan <prompt-file> <log-name> <tools>
  timeout 1800 claude -p "$(cat "$1")" \
    --allowedTools "$3" \
    --permission-mode acceptEdits \
    --add-dir "$KERJA" \
    --max-turns 80 \
    --no-session-persistence \
    >"$KERJA/$2.txt" 2>&1
}

# --- daftar artikel terakhir untuk konteks riset ---
export RENDER_TANGGAL="$TANGGAL" RENDER_BRIEF="$KERJA/brief.md" RENDER_KERJA="$KERJA" \
  RENDER_DIR_ARTIKEL="$DIR_ARTIKEL" RENDER_REPO="$BOT"
RENDER_DAFTAR_ARTIKEL="$(for f in "$DIR_ARTIKEL"/*.md; do
  case "$f" in */CREDITS.md|*/PLAN.md) continue;; esac
  t=$(grep -m1 "^tanggal:" "$f" | cut -d"'" -f2); g=$(grep -m1 "^tag:" "$f" | cut -d"'" -f2)
  j=$(grep -m1 "^judul:" "$f" | cut -d"'" -f2); echo "$t · $g · $(basename "$f" .md) · $j"
done | sort -r | head -40)"
RENDER_TAG_TERAKHIR="$(echo "$RENDER_DAFTAR_ARTIKEL" | head -2 | awk -F ' · ' '{print $2}' | xargs)"
export RENDER_DAFTAR_ARTIKEL RENDER_TAG_TERAKHIR

# --- 1. riset (Claude) ---
rm -f "$KERJA/brief.md" # jangan pakai brief basi dari percobaan sebelumnya
log "1/4 riset (claude)"
render "$BOT/ops/artikel-otomatis/prompt-riset.md" >"$KERJA/prompt-riset.txt"
claude_jalan "$KERJA/prompt-riset.txt" riset \
  "WebSearch WebFetch Read Write Bash(curl:*) Bash(pdftotext:*) Bash(grep:*) Bash(ls:*)" || true
[ -s "$KERJA/brief.md" ] || gagal "brief tidak terbentuk (lihat riset.txt)"
SLUG=$(grep -m1 '^slug:' "$KERJA/brief.md" | sed 's/^slug:[[:space:]]*//; s/[[:space:]]*$//')
[[ "$SLUG" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || gagal "slug tidak valid: '$SLUG'"
[ ! -e "$DIR_ARTIKEL/$SLUG.md" ] || gagal "slug sudah dipakai: $SLUG"
ARTIKEL="$DIR_ARTIKEL/$SLUG.md"
log "topik: $SLUG"

# --- 2. tulis (pi, fallback Claude) ---
export RENDER_SLUG="$SLUG" RENDER_ARTIKEL="$ARTIKEL" RENDER_BRIEF_ISI="$(cat "$KERJA/brief.md")"
render "$BOT/ops/artikel-otomatis/prompt-tulis.md" >"$KERJA/prompt-tulis.txt"
log "2/4 tulis (pi $PI_MODEL)"
timeout 1500 pi -p --model "$PI_MODEL" --no-session "$(cat "$KERJA/prompt-tulis.txt")" >"$KERJA/tulis-pi.txt" 2>&1 || true
if [ ! -s "$ARTIKEL" ] || ! bun "$BOT/ops/artikel-otomatis/validasi.ts" "$ARTIKEL" "$TANGGAL" >>"$LOG" 2>&1; then
  log "pi gagal/hasil tidak valid → fallback claude"
  claude_jalan "$KERJA/prompt-tulis.txt" tulis-claude "Read Write Edit Glob Grep Bash(bun:*)" || true
fi
[ -s "$ARTIKEL" ] || gagal "artikel tidak terbentuk"

# --- 3. cek fakta (Claude) ---
log "3/4 cek fakta (claude)"
render "$BOT/ops/artikel-otomatis/prompt-cek.md" >"$KERJA/prompt-cek.txt"
claude_jalan "$KERJA/prompt-cek.txt" cek "Read Edit Bash(bun:*)" || true
log "cek: $(tail -1 "$KERJA/cek.txt")"

# --- 4. cover + validasi + publikasi ---
log "4/4 cover, validasi, publikasi"
bun landing/scripts/ambil-gambar-artikel.ts >>"$LOG" 2>&1 || gagal "unduh cover"
[ -s "landing/static/artikel/$SLUG-cover.jpg" ] || gagal "cover tidak terunduh"
bun "$BOT/ops/artikel-otomatis/validasi.ts" "$ARTIKEL" "$TANGGAL" || gagal "validasi akhir"
liar=$(git status --porcelain | grep -v -e ' landing/src/content/artikel/' -e ' landing/static/artikel/' || true)
[ -z "$liar" ] || gagal "ada perubahan di luar folder artikel: $liar"

JUDUL=$(grep -m1 '^judul:' "$ARTIKEL" | cut -d"'" -f2)
git add "$ARTIKEL" "landing/static/artikel/$SLUG-cover.jpg" landing/src/content/artikel/CREDITS.md
git commit -q -m "artikel($TANGGAL): $JUDUL" -m "Riset & cek fakta: Claude Code · penulis: pi ($PI_MODEL). Brief: ops/artikel-otomatis."
if [ "$DRY_RUN" = 1 ]; then log "DRY RUN — tidak push ($(git log --oneline -1))"; exit 0; fi
for n in 1 2 3; do
  git push -q origin main && break
  [ "$n" -eq 3 ] && gagal "push ditolak 3x"
  git pull -q --rebase origin main
done
log "TERBIT: $SLUG ($(git log --oneline -1))"
echo "$TANGGAL TERBIT $SLUG — $JUDUL" >>"$STATE/ringkasan.log"
