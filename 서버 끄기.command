#!/bin/zsh
# 「서버 켜기.command」로 켠 백그라운드 게임 서버(포트 4190)를 끕니다.
pids=$(lsof -nP -tiTCP:4190 -sTCP:LISTEN)
if [ -n "$pids" ]; then kill $pids && echo '서버를 껐습니다.'; else echo '실행 중인 서버가 없습니다.'; fi
