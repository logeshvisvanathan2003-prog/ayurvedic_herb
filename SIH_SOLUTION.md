# SIH Solution Summary — Blockchain-Based Botanical Traceability for Ayurvedic Herbs

This document maps what's actually implemented in this repo against the AYUSH
problem statement, so you can use it directly in your report/PPT and know
exactly what's real vs. what's architecture-only.

## 1. Requirement-by-requirement mapping

| AYUSH requirement | Status | Where |
|---|---|---|
| Permissioned ledger recording every supply-chain transaction | ✅ Working (hash-chain) + ✅ Fabric chaincode provided | `backend/app.py::record_audit`, `blockchain/chaincode` |
| Geo-tagged "CollectionEvent" capture (GPS, timestamp, collector, species, initial quality) | ✅ Working | `POST /api/farmer/batches` — `gps_lat`, `gps_lng`, `moisture_level` |
| "ProcessingStep" / "QualityTest" events | ✅ Working | `POST /api/processing`, `POST /api/lab/tests` |
| Smart-contract geo-fencing, seasonal restrictions, conservation quotas | ✅ **New** — added this session | `check_geofence()` in `backend/app.py`, `conservation_zones` table |
| Quality-gate validation (moisture, pesticide, DNA barcode) | ✅ Working | `lab_tests` table + lab portal |
| On-chain unique QR per finished batch | ✅ Working (fixed broken localhost URL) | `POST /api/products/generate-qr` |
| Consumer web/mobile portal, no install required | ✅ Working | `ConsumerPortalPage.tsx` |
| Chain-of-custody handoffs through supply-chain nodes | ✅ **New** — added this session | `custody_transfers` table, `/api/logistics/*`, `LogisticsPortalPage.tsx` |
| **QR-based anti-fraud during transportation** | ✅ **New** — single-use dispatch QR + GPS/time plausibility check | see §2 below |
| Interactive farmer/community profile on scan | ✅ Working | farmer name/address/location shown on scan |
| Recall management | ✅ **New** — added this session | `POST /api/admin/batches/<id>/recall`, recall banner on consumer page |
| RESTful APIs for dashboards | ✅ Working | `/api/admin/*` |
| FHIR-style resource naming (CollectionEvent, QualityTest, ProcessingStep, Provenance) | ✅ Reflected in Fabric chaincode function names | `blockchain/chaincode/lib/traceability.js` |
| Offline/low-bandwidth capture, SMS sync | ⚠️ Not implemented — flagged as future work | see §4 |
| Live pilot demo w/ one species (e.g. Ashwagandha) | ✅ Seed data included | demo conservation zone seeded on first boot |

## 2. How the transport-fraud fix actually works

This was the core gap you asked me to close. The mechanism:

1. When a batch leaves one custodian (farmer → processor → lab → manufacturer →
   retail), the sender calls **Dispatch Shipment** (`/api/logistics/dispatch`).
   This mints a **single-use QR token** tied to that specific batch + leg, and
   records the pickup GPS + time.
2. The token is handed to the courier (printed or shown on phone). It is
   **not** the same as the product's permanent QR — it's a one-time transfer
   credential.
3. On arrival, the receiving party calls **Confirm Delivery**
   (`/api/logistics/confirm-delivery`) with that token. The backend:
   - Rejects tokens that don't exist ("not issued by this ledger" — catches
     cloned/forged QR codes).
   - Rejects tokens that were already redeemed ("reuse detected" — catches
     the classic scam of photographing/reprinting a valid delivery QR to fake
     multiple deliveries).
   - Flags implausible transit speed between pickup and delivery GPS given
     the elapsed time (catches falsified GPS / suspicious diversions).
4. Every dispatch and delivery — including anomalies — is written to the
   hash-chain audit log, so the transport leg can never be silently edited
   afterward.
5. Consumers scanning the final product QR see the full **Transport Journey**
   trail (`ConsumerPortalPage.tsx`), including a red "Flagged" badge on any
   leg with a detected anomaly.

## 3. What you should still do before submission

- Replace the seeded demo conservation zone (`Ashwagandha`, Rajasthan/MP)
  with real NMPB-approved zones for whichever species your pilot uses.
- Decide whether "logistics" should be its own registered role (currently
  Farmer/Lab/Admin can dispatch & confirm — reasonable for a PoC, but a real
  deployment would want a dedicated `transporter` role with its own
  login/registration flow, following the same pattern as `farmer`/`lab`).
- Deploy the Fabric chaincode on the Fabric test-network for your demo video
  (see `blockchain/README.md`) so you can show both layers if asked.
- Fix the CORS/env-var issue mentioned in memory (persistent CORS blocker
  on Render) if it's still open — this is unrelated to the features added
  this session.

## 4. Explicitly out of scope for this session (be upfront about this)

- Offline mobile capture + SMS-over-blockchain gateway for low-connectivity
  rural areas — this needs a native/PWA app with local storage + sync
  queue, which is a separate, sizeable build.
- IoT sensor integration for automated environmental data capture.
- A live multi-organisation Fabric network (needs Docker infra you'd deploy
  separately — see `blockchain/README.md`).

## 5. Files changed/added this session

```
backend/app.py                          — geofence check, logistics endpoints,
                                            blockchain verify endpoint, recall endpoint,
                                            fixed QR scan URL, Fabric gateway client
                                            (fabric_submit) wired into every write endpoint
backend/requirements.txt                — added `requests`
backend/migrate_v6.sql                  — conservation_zones, custody_transfers,
                                            recall + geofence_flag columns
frontend/src/components/pages/ConsumerPortalPage.tsx  — recall banner, blockchain
                                            verify badge, transport journey trail
frontend/src/components/pages/LogisticsPortalPage.tsx — NEW: dispatch/confirm/track UI
frontend/src/components/Router.tsx      — /logistics route
frontend/src/components/Header.tsx      — Logistics nav link
blockchain/chaincode/                   — Hyperledger Fabric smart contract (chaincode),
                                            plus server.js for Docker-free Chaincode-as-a-Service
blockchain/network/                     — NEW: Docker-free Fabric network (crypto-config.yaml,
                                            configtx.yaml, and numbered scripts to run orderer +
                                            peer as plain OS processes, no Docker anywhere)
blockchain/gateway-api/                 — Node/Express REST bridge using the
                                            official @hyperledger/fabric-gateway SDK,
                                            so Flask can submit real signed transactions
blockchain/README.md                    — full solution paragraph + step-by-step
                                            Docker-free macOS/Homebrew install + run guide
```

## 6. Real blockchain — is it wired into the whole app now?

Yes, end-to-end, feature-flagged. Every one of these Flask endpoints now
also submits a real Fabric transaction when `FABRIC_GATEWAY_URL` is set:
`POST /api/farmer/batches`, `POST /api/processing`, `POST /api/lab/tests`,
`POST /api/logistics/dispatch`, `POST /api/logistics/confirm-delivery`.
`GET /api/blockchain/status` tells you whether Fabric is currently reachable.
See `blockchain/README.md` §"Step-by-step: install Hyperledger Fabric" for
the exact commands to bring the network up on your Mac.
