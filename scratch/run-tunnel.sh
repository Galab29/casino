#!/usr/bin/env bash
LOG_FILE="/var/log/cloudflared.log"
URL_FILE="/opt/casino/tunnel-url.txt"
> "$LOG_FILE"
/usr/local/bin/cloudflared tunnel --url http://127.0.0.1:3000 >> "$LOG_FILE" 2>&1 &
TUNNEL_PID=$!

for i in {1..30}; do
  URL=$(grep -o 'https://[-a-zA-Z0-9@:%._\+~#=]*\.trycloudflare\.com' "$LOG_FILE" | head -n 1)
  if [ -n "$URL" ]; then
    echo "$URL" > "$URL_FILE"
    chmod 644 "$URL_FILE"
    echo "$URL" > /mnt/c/Users/Galab_LD/Documents/props/TUNNEL_URL.txt 2>/dev/null || true
    echo "Túnel activo: $URL"
    break
  fi
  sleep 1
done

wait $TUNNEL_PID
