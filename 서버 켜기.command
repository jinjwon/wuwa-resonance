#!/bin/zsh
# 게임 서버를 터미널과 분리된 백그라운드로 켭니다. 이 창이나 터미널을 닫아도 서버는 계속 돌아갑니다.
# 끄기: 같은 폴더의 「서버 끄기.command」 실행. 로그: ~/Library/Logs/wuwa-resonance.log
cd -- "${0:A:h}" || exit 1
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
if lsof -nP -iTCP:4190 -sTCP:LISTEN >/dev/null 2>&1; then
  echo '이미 서버가 실행 중입니다.'
else
  python3 -c 'import subprocess,os,sys; log=open(os.path.expanduser("~/Library/Logs/wuwa-resonance.log"),"a"); subprocess.Popen(["node","server.mjs"],start_new_session=True,stdin=subprocess.DEVNULL,stdout=log,stderr=subprocess.STDOUT)'
  sleep 1
fi
ip=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
echo "이 Mac:            http://localhost:4190/"
[ -n "$ip" ] && echo "같은 와이파이 기기: http://$ip:4190/"
echo 'Mac이 잠자기에 들어가면 접속이 끊깁니다. 깨우면 다시 접속됩니다.'
