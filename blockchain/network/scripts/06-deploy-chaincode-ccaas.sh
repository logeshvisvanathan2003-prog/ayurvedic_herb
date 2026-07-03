#!/bin/bash
# Packages, installs, approves and commits the traceability chaincode as
# Chaincode-as-a-Service. No Docker image is ever built for the chaincode —
# the peer just gets told "dial 127.0.0.1:9999 when you need this chaincode".
#
# IMPORTANT: start ../chaincode/server.js FIRST in another terminal —
# see step 7 in ../README.md. This script will print the CHAINCODE_ID it
# needs to be started with.
set -e
cd "$(dirname "$0")/.."   # → blockchain/network
NET_DIR=$PWD
export FABRIC_CFG_PATH=$NET_DIR/config

export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=$NET_DIR/crypto-config/peerOrganizations/org1.ayurveda.com/users/Admin@org1.ayurveda.com/msp
export CORE_PEER_ADDRESS=127.0.0.1:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=$NET_DIR/crypto-config/peerOrganizations/org1.ayurveda.com/peers/peer0.org1.ayurveda.com/tls/ca.crt
ORDERER_TLS_CA=$NET_DIR/crypto-config/ordererOrganizations/ayurveda.com/orderers/orderer.ayurveda.com/tls/ca.crt

CC_LABEL="traceability_1.0"
PKG_PATH="../chaincode/ccaas-package"   # contains only connection.json
PKG_FILE="$NET_DIR/data/traceability.tar.gz"

echo "→ Packaging chaincode (external/ccaas)..."
peer lifecycle chaincode package "$PKG_FILE" --path "$PKG_PATH" --lang external --label "$CC_LABEL"

echo "→ Installing on peer0.org1..."
peer lifecycle chaincode install "$PKG_FILE"

PACKAGE_ID=$(peer lifecycle chaincode queryinstalled --output json | python3 -c "import sys,json; d=json.load(sys.stdin); print([p['package_id'] for p in d['installed_chaincodes'] if p['label']=='$CC_LABEL'][0])")
echo "✓ Installed. Package ID: $PACKAGE_ID"
echo ""
echo "──────────────────────────────────────────────────────────────────"
echo " Now, in ANOTHER terminal, start the chaincode server with:"
echo ""
echo "   cd ../chaincode"
echo "   CHAINCODE_ID=$PACKAGE_ID npm run start:server"
echo ""
echo " Once it prints 'listening on 127.0.0.1:9999', come back here and"
echo " press Enter to continue with approve + commit."
echo "──────────────────────────────────────────────────────────────────"
read -p "Press Enter once the chaincode server is running... "

echo "→ Approving chaincode definition for Org1..."
peer lifecycle chaincode approveformyorg \
  -o 127.0.0.1:7050 --tls --cafile "$ORDERER_TLS_CA" \
  --channelID ayurveda-channel --name traceability --version 1.0 \
  --package-id "$PACKAGE_ID" --sequence 1

echo "→ Committing chaincode definition..."
peer lifecycle chaincode commit \
  -o 127.0.0.1:7050 --tls --cafile "$ORDERER_TLS_CA" \
  --channelID ayurveda-channel --name traceability --version 1.0 --sequence 1

echo "✓ traceability chaincode is committed and live on ayurveda-channel"
echo ""
echo "Test it:"
echo "  peer chaincode invoke -o 127.0.0.1:7050 --tls --cafile $ORDERER_TLS_CA \\"
echo "    -C ayurveda-channel -n traceability \\"
echo "    -c '{\"function\":\"registerConservationZone\",\"Args\":[\"zone-1\",\"Ashwagandha\",\"Nagaur-Mandsaur\",\"25.15\",\"74.85\",\"120\",\"11\",\"3\",\"50000\"]}'"
