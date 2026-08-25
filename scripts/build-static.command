#!/bin/zsh
set -euo pipefail

SCRIPT_DIR=${0:A:h}
PROJECT_DIR=${SCRIPT_DIR:h}
cd "$PROJECT_DIR"

if [[ ! -d node_modules ]]; then
  echo "正在安装构建依赖……"
  npm install
fi

echo "1/4 检查 TypeScript"
npm run typecheck
echo "2/4 运行页面与配置测试"
npm run test -- --run
echo "3/4 运行检索与服务端测试"
npm run test:server
echo "4/4 生成静态构建包"
npm run build
echo "构建完成：$PROJECT_DIR/dist"
