#!/bin/bash
# Stops the orderer and peer OS processes started by scripts 03/04.
cd "$(dirname "$0")/.."   # → blockchain/network

for name in orderer peer0; do
  pidfile="data/${name}.pid"
  if [ -f "$pidfile" ]; then
    pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" && echo "✓ Stopped $name (PID $pid)"
    else
      echo "· $name (PID $pid) already stopped"
    fi
    rm -f "$pidfile"
  else
    echo "· No pidfile for $name — was it started?"
  fi
done

echo ""
echo "Remember to also Ctrl+C the chaincode server (server.js) and the gateway-api (npm start) in their own terminals."
echo "To fully reset all ledger state: rm -rf data crypto-config channel-artifacts config"
