#!/bin/bash
# Joins the orderer to the channel (channel-participation API — no system
# channel needed) and joins peer0.org1 to the same channel.
set -e
cd "$(dirname "$0")/.."   # → blockchain/network
NET_DIR=$PWD
export FABRIC_CFG_PATH=$NET_DIR/config

ORDERER_ADMIN_TLS_CA=$NET_DIR/crypto-config/ordererOrganizations/ayurveda.com/orderers/orderer.ayurveda.com/tls/ca.crt
ORDERER_ADMIN_CLIENT_CERT=$NET_DIR/crypto-config/ordererOrganizations/ayurveda.com/orderers/orderer.ayurveda.com/tls/server.crt
ORDERER_ADMIN_CLIENT_KEY=$NET_DIR/crypto-config/ordererOrganizations/ayurveda.com/orderers/orderer.ayurveda.com/tls/server.key

echo "→ Joining orderer to channel 'ayurveda-channel'..."
osnadmin channel join \
  --channelID ayurveda-channel \
  --config-block ./channel-artifacts/ayurveda-channel.block \
  -o 127.0.0.1:7053 \
  --ca-file "$ORDERER_ADMIN_TLS_CA" \
  --client-cert "$ORDERER_ADMIN_CLIENT_CERT" \
  --client-key "$ORDERER_ADMIN_CLIENT_KEY"

echo "→ Joining peer0.org1 to channel..."
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=$NET_DIR/crypto-config/peerOrganizations/org1.ayurveda.com/users/Admin@org1.ayurveda.com/msp
export CORE_PEER_ADDRESS=127.0.0.1:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=$NET_DIR/crypto-config/peerOrganizations/org1.ayurveda.com/peers/peer0.org1.ayurveda.com/tls/ca.crt

peer channel join -b ./channel-artifacts/ayurveda-channel.block

echo "✓ Orderer and peer0.org1 have both joined ayurveda-channel"
