#!/bin/zsh
set -euo pipefail

SCRIPT_DIR=${0:A:h}
PROJECT_DIR=${SCRIPT_DIR:h}
cd "$PROJECT_DIR"

if [[ ! -d node_modules ]]; then
  echo "首次运行，正在安装前端依赖……"
  npm install
fi

echo "零碳园区平台将在 http://127.0.0.1:5274 打开"
PORT=4175 node server/index.mjs &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

npm run dev -- --host 127.0.0.1 --port 5274 --open
