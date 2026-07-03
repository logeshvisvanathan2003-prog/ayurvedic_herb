'use strict';

/**
 * Fabric Gateway REST Bridge
 * ---------------------------
 * The Flask backend is Python; Hyperledger's officially-supported client
 * SDKs are Node.js, Go and Java (Python support is community-maintained
 * and not production-grade). Rather than fight that, this small Express
 * service is the ONE thing that talks gRPC to your Fabric peer, using the
 * real `@hyperledger/fabric-gateway` SDK. Flask calls it over plain HTTP.
 *
 * Every route below submits/evaluates a transaction against the
 * `traceability` chaincode defined in ../chaincode/lib/traceability.js —
 * i.e. these are REAL, signed, endorsed Fabric transactions, not a
 * simulation.
 *
 * Run this AFTER you've brought up the Fabric test-network and deployed
 * the chaincode (see ../README.md for the full step-by-step).
 */

const express = require('express');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const { connect, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const app = express();
app.use(cors());
app.use(express.json());

// ── Configuration (override via .env — see .env.example) ───────────────
const CHANNEL_NAME    = process.env.CHANNEL_NAME    || 'ayurveda-channel';
const CHAINCODE_NAME  = process.env.CHAINCODE_NAME  || 'traceability';
const MSP_ID           = process.env.MSP_ID          || 'Org1MSP';
const PEER_ENDPOINT    = process.env.PEER_ENDPOINT   || 'localhost:7051';
const PEER_HOST_ALIAS  = process.env.PEER_HOST_ALIAS || 'peer0.org1.ayurveda.com';
const PORT             = process.env.PORT            || 4000;

// Default paths assume you're running this straight out of this project's
// own Docker-free network folder (blockchain/network) — see ../README.md.
const CRYPTO_PATH = process.env.CRYPTO_PATH ||
  path.resolve(__dirname, '../network/crypto-config/peerOrganizations/org1.ayurveda.com');
const KEY_DIR   = process.env.KEY_DIR   || path.join(CRYPTO_PATH, 'users/User1@org1.ayurveda.com/msp/keystore');
const CERT_DIR  = process.env.CERT_DIR  || path.join(CRYPTO_PATH, 'users/User1@org1.ayurveda.com/msp/signcerts');
const TLS_CERT_PATH = process.env.TLS_CERT_PATH || path.join(CRYPTO_PATH, 'peers/peer0.org1.ayurveda.com/tls/ca.crt');

let gatewayInstance = null;
let grpcClient = null;

async function newGrpcConnection() {
  const tlsRootCert = await fs.readFile(TLS_CERT_PATH);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(PEER_ENDPOINT, tlsCredentials, {
    'grpc.ssl_target_name_override': PEER_HOST_ALIAS,
  });
}

async function newIdentity() {
  const certFiles = await fs.readdir(CERT_DIR);
  const certPath = path.join(CERT_DIR, certFiles[0]);
  const certificate = await fs.readFile(certPath);
  return { mspId: MSP_ID, credentials: certificate };
}

async function newSigner() {
  const keyFiles = await fs.readdir(KEY_DIR);
  const keyPath = path.join(KEY_DIR, keyFiles[0]);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}

async function getGateway() {
  if (gatewayInstance) return gatewayInstance;
  grpcClient = await newGrpcConnection();
  gatewayInstance = connect({
    client: grpcClient,
    identity: await newIdentity(),
    signer: await newSigner(),
    evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
    endorseOptions: () => ({ deadline: Date.now() + 15000 }),
    submitOptions: () => ({ deadline: Date.now() + 5000 }),
    commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
  });
  return gatewayInstance;
}

function getContract(gateway) {
  const network = gateway.getNetwork(CHANNEL_NAME);
  return network.getContract(CHAINCODE_NAME);
}

// ── Routes — one per chaincode function ─────────────────────────────────

app.post('/collection-event', async (req, res) => {
  const { batchId, species, collectorId, lat, lng, harvestDate, quantityKg, initialMoisture } = req.body;
  try {
    const contract = getContract(await getGateway());
    const result = await contract.submitTransaction(
      'recordCollectionEvent', batchId, species, collectorId,
      String(lat), String(lng), harvestDate, String(quantityKg), String(initialMoisture || '')
    );
    res.json({ ok: true, result: JSON.parse(Buffer.from(result).toString()) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/processing-step', async (req, res) => {
  const { batchId, processorId, dryingMethod, storageTemp, storageHumidity, chainOfCustodyNote } = req.body;
  try {
    const contract = getContract(await getGateway());
    const result = await contract.submitTransaction(
      'recordProcessingStep', batchId, processorId, dryingMethod || '',
      String(storageTemp || ''), String(storageHumidity || ''), chainOfCustodyNote || ''
    );
    res.json({ ok: true, result: JSON.parse(Buffer.from(result).toString()) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/quality-test', async (req, res) => {
  const { batchId, labId, moistureContent, pesticideResult, dnaAuthResult, overallStatus } = req.body;
  try {
    const contract = getContract(await getGateway());
    const result = await contract.submitTransaction(
      'recordQualityTest', batchId, labId, String(moistureContent || ''),
      pesticideResult || '', dnaAuthResult || '', overallStatus
    );
    res.json({ ok: true, result: JSON.parse(Buffer.from(result).toString()) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/dispatch', async (req, res) => {
  const { batchId, transferToken, fromStage, toStage, courierName, vehicleNumber, pickupLat, pickupLng } = req.body;
  try {
    const contract = getContract(await getGateway());
    const result = await contract.submitTransaction(
      'dispatchShipment', batchId, transferToken, fromStage || '', toStage,
      courierName || '', vehicleNumber || '', String(pickupLat || ''), String(pickupLng || '')
    );
    res.json({ ok: true, result: JSON.parse(Buffer.from(result).toString()) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/confirm-delivery', async (req, res) => {
  const { transferToken, receiverName, deliveryLat, deliveryLng } = req.body;
  try {
    const contract = getContract(await getGateway());
    const result = await contract.submitTransaction(
      'confirmDelivery', transferToken, receiverName || '', String(deliveryLat || ''), String(deliveryLng || '')
    );
    res.json({ ok: true, result: JSON.parse(Buffer.from(result).toString()) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/conservation-zone', async (req, res) => {
  const { zoneId, species, zoneName, centerLat, centerLng, radiusKm, seasonStartMonth, seasonEndMonth, maxSeasonalQtyKg } = req.body;
  try {
    const contract = getContract(await getGateway());
    const result = await contract.submitTransaction(
      'registerConservationZone', zoneId, species, zoneName,
      String(centerLat), String(centerLng), String(radiusKm),
      String(seasonStartMonth || ''), String(seasonEndMonth || ''), String(maxSeasonalQtyKg || '')
    );
    res.json({ ok: true, result: JSON.parse(Buffer.from(result).toString()) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/provenance/:batchId', async (req, res) => {
  try {
    const contract = getContract(await getGateway());
    const result = await contract.evaluateTransaction('getProvenance', req.params.batchId);
    const raw = Buffer.from(result).toString();
    try {
      res.json({ ok: true, result: JSON.parse(raw) });
    } catch (parseErr) {
      res.status(500).json({ ok: false, error: `JSON parse failed: ${parseErr.message}`, raw });
    }
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok', channel: CHANNEL_NAME, chaincode: CHAINCODE_NAME }));

app.listen(PORT, () => console.log(`Fabric gateway bridge listening on :${PORT}`));

process.on('SIGINT', () => { if (grpcClient) grpcClient.close(); process.exit(0); });