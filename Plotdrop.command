#!/bin/zsh

cd "$(dirname "$0")" || exit 1

if [[ ! -d node_modules ]]; then
  echo "Plotdrop을 처음 실행할 준비를 하고 있습니다..."
  npm install || exit 1
fi

npm run dev &
plotdrop_pid=$!

cleanup() {
  kill "$plotdrop_pid" 2>/dev/null
}
trap cleanup EXIT INT TERM

for attempt in {1..40}; do
  if curl -s http://localhost:3000/ >/dev/null; then
    open http://localhost:3000/
    break
  fi
  sleep 0.5
done

echo "Plotdrop이 실행 중입니다. 이 창을 닫으면 앱도 종료됩니다."
wait "$plotdrop_pid"
