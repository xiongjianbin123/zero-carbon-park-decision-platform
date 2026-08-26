#!/bin/zsh
set -euo pipefail

PROJECT_DIR="/Users/xiongjianbin/MAC-400G/项目资料/个人自研软件/23、零碳园区全过程决策与申报咨询平台"
export PATH="/Users/xiongjianbin/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
cd "$PROJECT_DIR"

if [[ ! -f dist/client/index.html ]]; then
  scripts/build-static.command
fi

exec npm run preview -- --host 127.0.0.1 --port 4174
