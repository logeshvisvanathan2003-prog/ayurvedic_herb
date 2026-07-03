#!/bin/bash
# Starts peer0.org1 as a plain background OS process. No Docker — chaincode
# runs separately as Chaincode-as-a-Service (see 06-deploy-chaincode-ccaas.sh),
# so the peer never needs to build/launch containers.
set -e
cd "$(dirname "$0")/.."   # → blockchain/network
NET_DIR=$PWD

export FABRIC_CFG_PATH=$NET_DIR/config
export CORE_PEER_ID=peer0.org1.ayurveda.com
export CORE_PEER_ADDRESS=127.0.0.1:7051
export CORE_PEER_LISTENADDRESS=127.0.0.1:7051
export CORE_PEER_CHAINCODEADDRESS=127.0.0.1:7052
export CORE_PEER_CHAINCODELISTENADDRESS=127.0.0.1:7052
export CORE_PEER_GOSSIP_BOOTSTRAP=127.0.0.1:7051
export CORE_PEER_GOSSIP_EXTERNALENDPOINT=127.0.0.1:7051
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=$NET_DIR/crypto-config/peerOrganizations/org1.ayurveda.com/peers/peer0.org1.ayurveda.com/msp
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_CERT_FILE=$NET_DIR/crypto-config/peerOrganizations/org1.ayurveda.com/peers/peer0.org1.ayurveda.com/tls/server.crt
export CORE_PEER_TLS_KEY_FILE=$NET_DIR/crypto-config/peerOrganizations/org1.ayurveda.com/peers/peer0.org1.ayurveda.com/tls/server.key
export CORE_PEER_TLS_ROOTCERT_FILE=$NET_DIR/crypto-config/peerOrganizations/org1.ayurveda.com/peers/peer0.org1.ayurveda.com/tls/ca.crt
export CORE_PEER_FILESYSTEMPATH=$NET_DIR/data/peer0/production
export CORE_LEDGER_SNAPSHOTS_ROOTDIR=$NET_DIR/data/peer0/snapshots
export CORE_PEER_PROFILE_ENABLED=false
export CORE_OPERATIONS_LISTENADDRESS=127.0.0.1:9444
# No CORE_VM_ENDPOINT needed — we're not using Docker-built chaincode at all.

mkdir -p "$NET_DIR/data/peer0" "$NET_DIR/logs"

echo "Starting peer0.org1.ayurveda.com on :7051 — logs at logs/peer0.log"
nohup peer node start > "$NET_DIR/logs/peer0.log" 2>&1 &
echo $! > "$NET_DIR/data/peer0.pid"
sleep 3
echo "✓ Peer started (PID $(cat "$NET_DIR/data/peer0.pid"))"
