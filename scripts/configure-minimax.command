#!/bin/zsh
set -euo pipefail

SCRIPT_DIR=${0:A:h}
PROJECT_DIR=${SCRIPT_DIR:h}
ENV_FILE="$PROJECT_DIR/.env.local"
TEMP_FILE=$(mktemp "$PROJECT_DIR/.env.local.tmp.XXXXXX")

cleanup() {
  [[ -f "$TEMP_FILE" ]] && rm -f "$TEMP_FILE"
}
trap cleanup EXIT

echo "MiniMax 本机配置"
read -r -s "MINIMAX_KEY?请输入 API Key（输入内容不会显示）："
echo
if [[ -z "$MINIMAX_KEY" ]]; then
  echo "未输入内容，已取消配置。"
  exit 1
fi

umask 077
printf 'MINIMAX_API_KEY=%s\n' "$MINIMAX_KEY" > "$TEMP_FILE"
printf 'MINIMAX_BASE_URL=https://api.minimaxi.com/anthropic\n' >> "$TEMP_FILE"
printf 'MINIMAX_MODEL=MiniMax-M3\n' >> "$TEMP_FILE"
chmod 600 "$TEMP_FILE"
mv -f "$TEMP_FILE" "$ENV_FILE"
trap - EXIT

unset MINIMAX_KEY
echo "配置已保存在本机 .env.local，重启平台后生效。"
