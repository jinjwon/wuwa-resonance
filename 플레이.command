#!/bin/zsh
cd -- "${0:A:h}" || exit 1
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
if ! command -v node >/dev/null; then
  echo 'Node.js 20 이상을 설치한 뒤 다시 실행해 주세요.'
  read '?Enter를 누르면 닫습니다.'
  exit 1
fi
if curl -fsS http://127.0.0.1:4190/engine.js 2>/dev/null | grep -q 'export const HEROES'; then
  open http://localhost:4190/
  exit 0
fi
node server.mjs &
game_server_pid=$!
trap 'kill "$game_server_pid" 2>/dev/null' EXIT INT TERM
sleep 1
if kill -0 "$game_server_pid" 2>/dev/null; then
  open http://localhost:4190/
  echo '게임 실행 중입니다. 이 창을 닫으면 서버가 종료됩니다.'
  wait "$game_server_pid"
else
  echo '서버를 시작하지 못했습니다. 위 오류를 확인해 주세요.'
  read '?Enter를 누르면 닫습니다.'
  exit 1
fi
