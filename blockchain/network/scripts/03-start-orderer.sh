#!/bin/bash
# Starts the Fabric orderer as a plain background OS process. No Docker.
set -e
cd "$(dirname "$0")/.."   # → blockchain/network
NET_DIR=$PWD

export FABRIC_CFG_PATH=$NET_DIR/config
export ORDERER_GENERAL_LISTENADDRESS=127.0.0.1
export ORDERER_GENERAL_LISTENPORT=7050
export ORDERER_GENERAL_LOCALMSPID=OrdererMSP
export ORDERER_GENERAL_LOCALMSPDIR=$NET_DIR/crypto-config/ordererOrganizations/ayurveda.com/orderers/orderer.ayurveda.com/msp
export ORDERER_GENERAL_TLS_ENABLED=true
export ORDERER_GENERAL_TLS_PRIVATEKEY=$NET_DIR/crypto-config/ordererOrganizations/ayurveda.com/orderers/orderer.ayurveda.com/tls/server.key
export ORDERER_GENERAL_TLS_CERTIFICATE=$NET_DIR/crypto-config/ordererOrganizations/ayurveda.com/orderers/orderer.ayurveda.com/tls/server.crt
export ORDERER_GENERAL_TLS_ROOTCAS=$NET_DIR/crypto-config/ordererOrganizations/ayurveda.com/orderers/orderer.ayurveda.com/tls/ca.crt
export ORDERER_GENERAL_BOOTSTRAPMETHOD=none
export ORDERER_CHANNELPARTICIPATION_ENABLED=true
export ORDERER_ADMIN_TLS_ENABLED=true
export ORDERER_ADMIN_TLS_CERTIFICATE=$NET_DIR/crypto-config/ordererOrganizations/ayurveda.com/orderers/orderer.ayurveda.com/tls/server.crt
export ORDERER_ADMIN_TLS_PRIVATEKEY=$NET_DIR/crypto-config/ordererOrganizations/ayurveda.com/orderers/orderer.ayurveda.com/tls/server.key
export ORDERER_ADMIN_TLS_ROOTCAS=$NET_DIR/crypto-config/ordererOrganizations/ayurveda.com/orderers/orderer.ayurveda.com/tls/ca.crt
export ORDERER_ADMIN_TLS_CLIENTAUTHREQUIRED=true
export ORDERER_ADMIN_TLS_CLIENTROOTCAS=$NET_DIR/crypto-config/ordererOrganizations/ayurveda.com/orderers/orderer.ayurveda.com/tls/ca.crt
export ORDERER_ADMIN_LISTENADDRESS=127.0.0.1:7053
export ORDERER_GENERAL_LEDGERTYPE=file
export ORDERER_FILELEDGER_LOCATION=$NET_DIR/data/orderer/ledger
export ORDERER_CONSENSUS_WALDIR=$NET_DIR/data/orderer/etcdraft/wal
export ORDERER_CONSENSUS_SNAPDIR=$NET_DIR/data/orderer/etcdraft/snapshot
export ORDERER_OPERATIONS_LISTENADDRESS=127.0.0.1:9443

mkdir -p "$NET_DIR/data/orderer" "$NET_DIR/logs"

echo "Starting orderer.ayurveda.com on :7050 (admin API :7053) — logs at logs/orderer.log"
nohup orderer > "$NET_DIR/logs/orderer.log" 2>&1 &
echo $! > "$NET_DIR/data/orderer.pid"
sleep 2
echo "✓ Orderer started (PID $(cat "$NET_DIR/data/orderer.pid"))"