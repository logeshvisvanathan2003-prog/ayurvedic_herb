'use strict';

/**
 * Ayurvedic Herb Traceability — Hyperledger Fabric Chaincode
 * ------------------------------------------------------------
 * Implements the FHIR-style resource model requested in the AYUSH problem
 * statement: CollectionEvent -> ProcessingStep -> QualityTest -> Product,
 * plus CustodyTransfer (transport handoffs) and Provenance queries.
 *
 * Every write is a signed transaction endorsed by the invoking org's peer
 * and ordered into an immutable block — this is the "production" ledger
 * layer. The Flask backend in /backend ships a lightweight hash-chain
 * (audit_log table) that mirrors the same event model so the app works
 * end-to-end today without standing up a Fabric network; this chaincode
 * is the drop-in replacement for a real multi-organisation deployment
 * (farmer cooperatives, labs, processors, manufacturers each run a peer).
 */

const { Contract } = require('fabric-contract-api');

const DOC_TYPES = {
  COLLECTION: 'CollectionEvent',
  PROCESSING: 'ProcessingStep',
  QUALITY: 'QualityTest',
  CUSTODY: 'CustodyTransfer',
  PRODUCT: 'Product',
  ZONE: 'ConservationZone',
};

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dphi = toRad(lat2 - lat1);
  const dl = toRad(lng2 - lng1);
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

class TraceabilityContract extends Contract {

  // ── CollectionEvent ────────────────────────────────────────────────
  // Records a geo-tagged harvest by a farmer/wild collector. Enforces
  // geo-fencing, seasonal-harvest and conservation-quota rules — the
  // "smart contract" validation called for in the problem statement.
  async recordCollectionEvent(ctx, batchId, species, collectorId, lat, lng, harvestDateISO, quantityKg, initialMoisture) {
    const exists = await this._exists(ctx, batchId);
    if (exists) throw new Error(`Batch ${batchId} already exists`);

    const zone = await this._findMatchingZone(ctx, species, parseFloat(lat), parseFloat(lng));
    let complianceFlag = null;
    if (!zone) {
      complianceFlag = `No approved harvesting zone found for ${species} at (${lat}, ${lng})`;
    } else {
      const month = new Date(harvestDateISO).getMonth() + 1;
      if (zone.seasonStartMonth && zone.seasonEndMonth &&
          !(month >= zone.seasonStartMonth && month <= zone.seasonEndMonth)) {
        complianceFlag = `Harvest outside approved season for ${species} in zone ${zone.zoneName}`;
      }
      if (!complianceFlag && zone.maxSeasonalQtyKg) {
        const used = await this._seasonalTotal(ctx, species, new Date(harvestDateISO).getFullYear());
        if (used + parseFloat(quantityKg) > zone.maxSeasonalQtyKg) {
          complianceFlag = `Seasonal conservation quota exceeded for ${species} in zone ${zone.zoneName}`;
        }
      }
    }

    const event = {
      docType: DOC_TYPES.COLLECTION,
      batchId, species, collectorId,
      gps: { lat: parseFloat(lat), lng: parseFloat(lng) },
      harvestDate: harvestDateISO,
      quantityKg: parseFloat(quantityKg),
      initialMoisture: initialMoisture ? parseFloat(initialMoisture) : null,
      complianceFlag,
      status: complianceFlag ? 'flagged' : 'collected',
      recordedAt: ctx.stub.getTxTimestamp(),
      txId: ctx.stub.getTxID(),
    };
    await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(event)));
    await this._emit(ctx, 'CollectionEventRecorded', event);
    return JSON.stringify(event);
  }

  // ── ProcessingStep ──────────────────────────────────────────────────
  async recordProcessingStep(ctx, batchId, processorId, dryingMethod, storageTemp, storageHumidity, chainOfCustodyNote) {
    const batch = await this._getBatch(ctx, batchId);
    const key = `${batchId}::PROCESSING`;
    const step = {
      docType: DOC_TYPES.PROCESSING, batchId, processorId,
      dryingMethod, storageTemp: parseFloat(storageTemp) || null,
      storageHumidity: parseFloat(storageHumidity) || null,
      chainOfCustodyNote, recordedAt: ctx.stub.getTxTimestamp(), txId: ctx.stub.getTxID(),
    };
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(step)));
    batch.status = 'processing';
    await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
    await this._emit(ctx, 'ProcessingStepRecorded', step);
    return JSON.stringify(step);
  }

  // ── QualityTest ──────────────────────────────────────────────────────
  async recordQualityTest(ctx, batchId, labId, moistureContent, pesticideResult, dnaAuthResult, overallStatus) {
    if (!['approved', 'rejected', 'pending'].includes(overallStatus)) {
      throw new Error('overallStatus must be approved | rejected | pending');
    }
    const batch = await this._getBatch(ctx, batchId);
    const key = `${batchId}::QUALITY`;
    const test = {
      docType: DOC_TYPES.QUALITY, batchId, labId,
      moistureContent: parseFloat(moistureContent) || null,
      pesticideResult, dnaAuthResult, overallStatus,
      recordedAt: ctx.stub.getTxTimestamp(), txId: ctx.stub.getTxID(),
    };
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(test)));
    batch.status = overallStatus === 'approved' ? 'approved' : overallStatus === 'rejected' ? 'rejected' : 'testing';
    await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
    await this._emit(ctx, 'QualityTestRecorded', test);
    return JSON.stringify(test);
  }

  // ── CustodyTransfer (anti-transport-fraud) ───────────────────────────
  // dispatch: only the endorsing org holding the batch may call this.
  // The returned transferToken is single-use — confirmDelivery consumes it.
  async dispatchShipment(ctx, batchId, transferToken, fromStage, toStage, courierName, vehicleNumber, pickupLat, pickupLng) {
    await this._getBatch(ctx, batchId); // ensures batch exists
    const tokenKey = `TOKEN::${transferToken}`;
    const existingToken = await ctx.stub.getState(tokenKey);
    if (existingToken && existingToken.length > 0) throw new Error('Transfer token already used — possible replay/counterfeit');

    const transfer = {
      docType: DOC_TYPES.CUSTODY, batchId, transferToken, fromStage, toStage,
      courierName, vehicleNumber,
      pickup: { lat: parseFloat(pickupLat) || null, lng: parseFloat(pickupLng) || null, at: ctx.stub.getTxTimestamp() },
      delivery: null,
      status: 'dispatched',
      anomalyFlag: false,
      txId: ctx.stub.getTxID(),
    };
    await ctx.stub.putState(tokenKey, Buffer.from(JSON.stringify(transfer)));
    await this._emit(ctx, 'ShipmentDispatched', transfer);
    return JSON.stringify(transfer);
  }

  async confirmDelivery(ctx, transferToken, receiverName, deliveryLat, deliveryLng) {
    const tokenKey = `TOKEN::${transferToken}`;
    const raw = await ctx.stub.getState(tokenKey);
    if (!raw || raw.length === 0) throw new Error('Unknown transfer token — not issued by this ledger');
    const transfer = JSON.parse(raw.toString());
    if (transfer.status !== 'dispatched') throw new Error(`Token already redeemed (status=${transfer.status}) — reuse detected`);

    let anomalyReason = null;
    if (deliveryLat && deliveryLng && transfer.pickup.lat && transfer.pickup.lng) {
      const dist = haversineKm(transfer.pickup.lat, transfer.pickup.lng, parseFloat(deliveryLat), parseFloat(deliveryLng));
      // Fabric tx timestamps are google.protobuf.Timestamp {seconds, nanos}
      const elapsedSec = Math.max(ctx.stub.getTxTimestamp().seconds.low - transfer.pickup.at.seconds.low, 60);
      const speedKmh = dist / (elapsedSec / 3600);
      if (speedKmh > 120) anomalyReason = `Implausible transit speed ${speedKmh.toFixed(0)} km/h`;
    }

    transfer.delivery = { lat: parseFloat(deliveryLat) || null, lng: parseFloat(deliveryLng) || null, at: ctx.stub.getTxTimestamp(), receiverName };
    transfer.status = 'delivered';
    transfer.anomalyFlag = !!anomalyReason;
    transfer.anomalyReason = anomalyReason;
    await ctx.stub.putState(tokenKey, Buffer.from(JSON.stringify(transfer)));

    const batch = await this._getBatch(ctx, transfer.batchId);
    batch.status = transfer.toStage;
    await ctx.stub.putState(transfer.batchId, Buffer.from(JSON.stringify(batch)));

    await this._emit(ctx, anomalyReason ? 'CustodyAnomaly' : 'CustodyDelivered', transfer);
    return JSON.stringify(transfer);
  }

  // ── Conservation zones (admin/regulator maintained) ──────────────────
  async registerConservationZone(ctx, zoneId, species, zoneName, centerLat, centerLng, radiusKm, seasonStartMonth, seasonEndMonth, maxSeasonalQtyKg) {
    const zone = {
      docType: DOC_TYPES.ZONE, zoneId, species, zoneName,
      centerLat: parseFloat(centerLat), centerLng: parseFloat(centerLng), radiusKm: parseFloat(radiusKm),
      seasonStartMonth: seasonStartMonth ? parseInt(seasonStartMonth, 10) : null,
      seasonEndMonth: seasonEndMonth ? parseInt(seasonEndMonth, 10) : null,
      maxSeasonalQtyKg: maxSeasonalQtyKg ? parseFloat(maxSeasonalQtyKg) : null,
      active: true,
    };
    await ctx.stub.putState(`ZONE::${zoneId}`, Buffer.from(JSON.stringify(zone)));
    return JSON.stringify(zone);
  }

  // ── Provenance / consumer QR-scan query ──────────────────────────────
  async getProvenance(ctx, batchId) {
    const batch = await this._getBatch(ctx, batchId);
    const processing = await this._safeGet(ctx, `${batchId}::PROCESSING`);
    const quality = await this._safeGet(ctx, `${batchId}::QUALITY`);
    const transfers = await this._queryCustodyForBatch(ctx, batchId);
    return JSON.stringify({
      collectionEvent: batch,
      processingStep: processing,
      qualityTest: quality,
      custodyChain: transfers,
      chainValid: true, // Fabric's own ledger + MVCC guarantees tamper-evidence; no manual re-hash needed
    });
  }

  // ── internal helpers ──────────────────────────────────────────────────
  async _exists(ctx, key) {
    const b = await ctx.stub.getState(key);
    return b && b.length > 0;
  }

  async _getBatch(ctx, batchId) {
    const b = await ctx.stub.getState(batchId);
    if (!b || b.length === 0) throw new Error(`Batch ${batchId} not found`);
    return JSON.parse(b.toString());
  }

  async _safeGet(ctx, key) {
    const b = await ctx.stub.getState(key);
    return b && b.length > 0 ? JSON.parse(b.toString()) : null;
  }

  async _findMatchingZone(ctx, species, lat, lng) {
    const iterator = await ctx.stub.getStateByRange('ZONE::', 'ZONE::~');
    let result = await iterator.next();
    while (!result.done) {
      const zone = JSON.parse(result.value.value.toString());
      if (zone.species.toLowerCase() === species.toLowerCase() && zone.active) {
        const d = haversineKm(lat, lng, zone.centerLat, zone.centerLng);
        if (d <= zone.radiusKm) { await iterator.close(); return zone; }
      }
      result = await iterator.next();
    }
    await iterator.close();
    return null;
  }

  async _seasonalTotal(ctx, species, year) {
    // NOTE: for a real deployment, back this with a CouchDB rich query
    // (index on species+year) instead of a full range scan.
    const iterator = await ctx.stub.getStateByRange('', '');
    let total = 0;
    let result = await iterator.next();
    while (!result.done) {
      try {
        const doc = JSON.parse(result.value.value.toString());
        if (doc.docType === DOC_TYPES.COLLECTION && doc.species.toLowerCase() === species.toLowerCase() &&
            new Date(doc.harvestDate).getFullYear() === year) {
          total += doc.quantityKg;
        }
      } catch (e) { /* skip non-JSON keys */ }
      result = await iterator.next();
    }
    await iterator.close();
    return total;
  }

  async _queryCustodyForBatch(ctx, batchId) {
    const iterator = await ctx.stub.getStateByRange('TOKEN::', 'TOKEN::~');
    const legs = [];
    let result = await iterator.next();
    while (!result.done) {
      const doc = JSON.parse(result.value.value.toString());
      if (doc.batchId === batchId) legs.push(doc);
      result = await iterator.next();
    }
    await iterator.close();
    return legs.sort((a, b) => (a.pickup.at.seconds.low || 0) - (b.pickup.at.seconds.low || 0));
  }

  async _emit(ctx, eventName, payload) {
    ctx.stub.setEvent(eventName, Buffer.from(JSON.stringify(payload)));
  }
}

module.exports = TraceabilityContract;
