'use strict';

/**
 * Chaincode-as-a-Service (CCaaS) entrypoint.
 * ------------------------------------------
 * This is what makes the chaincode itself Docker-free: instead of the
 * peer building a Docker image and launching a container for it (the
 * traditional flow), the chaincode runs as an ordinary long-lived Node
 * process listening on a TCP port, and the peer dials in as a gRPC
 * client. Start this BEFORE running scripts/06-deploy-chaincode-ccaas.sh.
 *
 * Usage:
 *   CHAINCODE_ID=<package-id-from-peer> node server.js
 *
 * <package-id-from-peer> comes from:
 *   peer lifecycle chaincode queryinstalled
 * after you've installed the package (see 06-deploy-chaincode-ccaas.sh).
 */

const { ChaincodeServer, ChaincodeFromContract } = require('fabric-shim');
const TraceabilityContract = require('./lib/traceability');

const ccid = process.env.CHAINCODE_ID;
if (!ccid) {
  console.error('✗ CHAINCODE_ID env var is required (get it from `peer lifecycle chaincode queryinstalled`)');
  process.exit(1);
}

const address = process.env.CHAINCODE_SERVER_ADDRESS || '127.0.0.1:9999';
const chaincode = new ChaincodeFromContract([TraceabilityContract]);

const server = new ChaincodeServer(chaincode, {
  ccid,
  address,
});

server.start()
  .then(() => console.log(`✓ traceability chaincode server listening on ${address} (ccid=${ccid})`))
  .catch((err) => { console.error('Chaincode server failed to start:', err); process.exit(1); });
