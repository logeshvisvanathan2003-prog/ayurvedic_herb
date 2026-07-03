#!/bin/bash
# Generates certs/keys for the orderer org and Org1 using the `cryptogen`
# binary directly. No Docker involved — this is a plain Go binary.
set -e
cd "$(dirname "$0")/.."   # → blockchain/network

if ! command -v cryptogen >/dev/null 2>&1; then
  echo "✗ 'cryptogen' not found on PATH. Did you add fabric-samples/bin to PATH? (see ../README.md step 2)"
  exit 1
fi

rm -rf crypto-config channel-artifacts
mkdir -p channel-artifacts

cryptogen generate --config=./crypto-config.yaml --output=crypto-config
echo "✓ Crypto material generated under blockchain/network/crypto-config/"
