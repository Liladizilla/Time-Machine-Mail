#!/usr/bin/env bash
set -eu

if curl --silent --fail http://127.0.0.1:3000 >/dev/null; then
  exit 0
fi

nohup npm run dev -- --hostname 0.0.0.0 > /tmp/time-machine-mail-dev.log 2>&1 </dev/null &
for attempt in $(seq 1 45); do
  if curl --silent --fail http://127.0.0.1:3000 >/dev/null; then
    exit 0
  fi
  sleep 1
done
cat /tmp/time-machine-mail-dev.log >&2
exit 1
