#!/bin/bash
# Builds the channel genesis block from configtx.yaml using `configtxgen`.
set -e
cd "$(dirname "$0")/.."   # → blockchain/network
export FABRIC_CFG_PATH=$PWD

if ! command -v configtxgen >/dev/null 2>&1; then
  echo "✗ 'configtxgen' not found on PATH."
  exit 1
fi

configtxgen -profile AyurvedaChannel -outputBlock ./channel-artifacts/ayurveda-channel.block -channelID ayurveda-channel
echo "✓ Channel genesis block written to blockchain/network/channel-artifacts/ayurveda-channel.block"
