import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode, Search, Download, CheckCircle2, XCircle, Clock,
  MapPin, Leaf, FlaskConical, Package, Loader2, AlertCircle,
  ShieldCheck, ShieldAlert, Truck, Link2, AlertTriangle, PackageCheck, Lock
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import JourneyMap, { JourneyPoint } from '@/components/JourneyMap'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

interface Product {
  product_id: string; product_name: string; description: string
  manufacturing_date: string; expiry_date: string; qr_code_data: string
  batch_id: string; herb_species: string; quantity_kg: number
  moisture_level: number; harvest_date: string
  gps_lat: number; gps_lng: number; location_name: string; herb_image: string
  farmer_name: string; farm_address: string; farmer_phone: string
  drying_method: string; drying_duration_hrs: number; grinding_status: boolean
  storage_temperature: number; storage_humidity: number; storage_location: string
  moisture_content: number; pesticide_residue_result: string
  dna_auth_result: string; heavy_metal_result: string; microbial_count: string
  lab_status: string; tested_by: string; tested_at: string
  moisture_report_url: string; pesticide_report_url: string; dna_certificate_url: string
  recalled?: boolean; batch_recalled?: boolean; recall_reason?: string; geofence_flag?: string
  production_unit_name?: string; production_unit_contact?: string
}

interface CustodyLeg {
  from_stage: string; to_stage: string; courier_name: string; vehicle_number: string
  dispatched_at: string; delivered_at: string | null; status: string
  anomaly_flag: boolean; anomaly_reason: string | null; receiver_name: string | null
  pickup_gps_lat?: number; pickup_gps_lng?: number; delivery_gps_lat?: number; delivery_gps_lng?: number
}

function StatusIcon({ s }: { s: string }) {
  if (s === 'approved') return <CheckCircle2 size={15} className="text-primary" />
  if (s === 'rejected') return <XCircle size={15} className="text-red-500" />
  return <Clock size={15} className="text-yellow-500" />
}

function StatusBadge({ s }: { s: string | null | undefined }) {
  if (!s) return <span className="badge badge-gray">Unknown</span>
  const map: Record<string, string> = { approved: 'badge-green', rejected: 'badge-red', pending: 'badge-gold' }
  return <span className={`badge ${map[s] || 'badge-gray'} gap-1`}><StatusIcon s={s} />{s}</span>
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2.5 border-b border-secondary/5 last:border-0">
      <span className="font-heading text-[0.6rem] uppercase tracking-widest text-secondary/40">{label}</span>
      <span className="font-body text-sm text-right max-w-[55%]">{String(value)}</span>
    </div>
  )
}

function Section({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-secondary/7">
      <div className={`${color} px-5 py-3 flex items-center gap-2`}>
        <Icon size={16} className="text-white" />
        <span className="font-heading text-[0.65rem] uppercase tracking-widest text-white">{title}</span>
      </div>
      <div className="px-5 pb-2">{children}</div>
    </div>
  )
}

export default function ConsumerPortalPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query,   setQuery]   = useState(searchParams.get('pid') || '')
  const [product, setProduct] = useState<Product | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [chainInfo, setChainInfo] = useState<{ chain_valid: boolean; message: string } | null>(null)
  const [custody, setCustody] = useState<CustodyLeg[]>([])

  const { isAuthenticated, userRole } = useAuthStore()
  const canDispatch = isAuthenticated && (userRole === 'collector' || userRole === 'admin')
  const [courierDefaults, setCourierDefaults] = useState<{ courier_name: string | null; vehicle_number: string | null }>({ courier_name: null, vehicle_number: null })
  const [dispatchForm, setDispatchForm] = useState({ to_stage: 'processing', courier_name: '', vehicle_number: '', gps_lat: '', gps_lng: '' })
  const [dispatching, setDispatching] = useState(false)
  const [dispatchResult, setDispatchResult] = useState<{ message: string; qr_code?: string; transfer_token?: string; error?: boolean } | null>(null)

  useEffect(() => {
    if (!canDispatch) return
    api.get('/logistics/my-profile').then(({ data }) => {
      setCourierDefaults(data)
      setDispatchForm(f => ({ ...f, courier_name: data.courier_name || '', vehicle_number: data.vehicle_number || '' }))
    }).catch(() => {})
  }, [canDispatch])

  const captureDispatchGps = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setDispatchForm(f => ({ ...f, gps_lat: pos.coords.latitude.toFixed(6), gps_lng: pos.coords.longitude.toFixed(6) })),
      () => {}
    )
  }

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault(); setDispatching(true); setDispatchResult(null)
    try {
      const { data } = await api.post('/logistics/dispatch', {
        batch_id: product?.batch_id, from_stage: 'collected', to_stage: dispatchForm.to_stage,
        courier_name: dispatchForm.courier_name, vehicle_number: dispatchForm.vehicle_number,
        pickup_gps_lat: dispatchForm.gps_lat || undefined, pickup_gps_lng: dispatchForm.gps_lng || undefined,
      })
      setDispatchResult({ message: data.message, qr_code: data.qr_code, transfer_token: data.transfer_token })
      if (product?.batch_id) loadTrustData(product.batch_id)
    } catch (err: any) {
      setDispatchResult({ message: err.response?.data?.error || 'Failed to dispatch shipment.', error: true })
    }
    setDispatching(false)
  }

  const loadTrustData = async (batchId: string) => {
    try {
      const { data } = await api.get(`/blockchain/verify/${batchId}`)
      setChainInfo({ chain_valid: data.chain_valid, message: data.message })
    } catch { setChainInfo(null) }
    try {
      const { data } = await api.get(`/logistics/${batchId}`)
      setCustody(data.custody_chain || [])
    } catch { setCustody([]) }
  }

  /* Auto-load if ?pid= is present in URL */
  useEffect(() => {
    const pid = searchParams.get('pid')
    if (pid) { setQuery(pid); loadProduct(pid) }
  }, [])

  const loadProduct = async (pid: string) => {
    setLoading(true); setError(''); setProduct(null); setResults([]); setChainInfo(null); setCustody([])
    try {
      const { data } = await api.get(`/products/${pid}/scan`)
      setProduct(data.product)
      if (data.product?.batch_id) loadTrustData(data.product.batch_id)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Product not found. Please check the ID.')
    }
    setLoading(false)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const pid = query.trim()
    if (!pid) return
    // Try direct product scan first
    setLoading(true); setError(''); setProduct(null); setResults([]); setChainInfo(null); setCustody([])
    try {
      const { data } = await api.get(`/products/${pid}/scan`)
      setProduct(data.product)
      if (data.product?.batch_id) loadTrustData(data.product.batch_id)
      setSearchParams({ pid })
    } catch {
      // Fall back to keyword search
      try {
        const { data } = await api.get(`/consumer/search?q=${encodeURIComponent(pid)}`)
        setResults(data.results || [])
        if (!data.results?.length) setError(`No products found matching "${pid}". Please verify the Product ID.`)
      } catch {
        setError('Search failed. Please check the ID and try again.')
      }
    }
    setLoading(false)
  }

  const selectResult = (pid: string) => {
    setQuery(pid); loadProduct(pid); setSearchParams({ pid })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gold py-16 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-[800px] mx-auto">
          <span className="inline-block px-4 py-1.5 bg-secondary/10 rounded-full font-heading text-[0.62rem] uppercase tracking-widest text-secondary/70 mb-4">
            For End Consumers
          </span>
          <h1 className="font-heading font-extrabold uppercase text-secondary leading-[0.88] tracking-tight mb-3"
            style={{ fontSize: 'clamp(2rem,6vw,4rem)' }}>
            Product<br /><span className="text-primary">Verification</span><br />Portal
          </h1>
          <p className="font-body text-sm text-secondary/70 leading-relaxed max-w-lg mx-auto">
            Enter the Product ID printed on your packaging to verify authenticity and trace the complete herb journey.
          </p>
        </motion.div>
      </section>

      <section className="py-14 px-4 md:px-12">
        <div className="max-w-[900px] mx-auto">

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-2">
            <input
              className="form-input flex-1 text-base py-4"
              type="text"
              placeholder="Enter Product ID  e.g.  PROD-A82KD93X"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading}
              className="btn-primary shrink-0 px-6 py-4"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <><Search size={15} /> Verify</>}
            </motion.button>
          </form>
          <p className="font-body text-xs text-secondary/40 mb-8">
            Product IDs start with <code className="bg-secondary/6 px-1.5 py-0.5 rounded font-mono">PROD-</code>. You can also search by herb species or batch ID.
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border-l-4 border-red-500 text-red-700 mb-6">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="font-body text-sm">{error}</p>
            </div>
          )}

          {/* Search results list */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-secondary/8 mb-8 overflow-hidden">
                <div className="px-5 py-3 border-b border-secondary/6 bg-secondary/3">
                  <span className="font-heading text-[0.62rem] uppercase tracking-widest text-secondary/50">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                {results.map(r => (
                  <div key={r.product_id} onClick={() => selectResult(r.product_id)}
                    className="px-5 py-4 border-b border-secondary/5 last:border-0 flex justify-between items-center cursor-pointer hover:bg-primary/3 transition-colors">
                    <div>
                      <p className="font-heading text-sm uppercase">{r.product_name || r.herb_species}</p>
                      <p className="font-mono text-xs text-secondary/40 mt-0.5">{r.product_id}</p>
                    </div>
                    <StatusBadge s={r.overall_status} />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Product detail ────────────────────────────────────────────── */}
          <AnimatePresence>
            {product && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {(product.recalled || product.batch_recalled) && (
                  <div className="flex items-start gap-3 px-5 py-4 bg-red-600 text-white mb-4">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-heading text-sm uppercase mb-1">⚠ This Product Has Been Recalled</p>
                      <p className="font-body text-sm text-white/90">{product.recall_reason || 'Do not consume. Contact the point of purchase for a refund/replacement.'}</p>
                    </div>
                  </div>
                )}

                {product.geofence_flag && (
                  <div className="flex items-start gap-3 px-5 py-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 mb-4">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p className="font-body text-sm">Compliance note from origin: {product.geofence_flag}</p>
                  </div>
                )}

                {/* Blockchain integrity badge */}
                {chainInfo && (
                  <div className={`flex items-center gap-3 px-5 py-3 mb-4 ${chainInfo.chain_valid ? 'bg-green-50 border-l-4 border-green-600 text-green-800' : 'bg-red-50 border-l-4 border-red-600 text-red-800'}`}>
                    {chainInfo.chain_valid ? <ShieldCheck size={18} className="shrink-0" /> : <ShieldAlert size={18} className="shrink-0" />}
                    <p className="font-body text-sm">{chainInfo.message}</p>
                  </div>
                )}

                {/* Header card */}
                <div className="bg-secondary px-7 py-6 mb-4 flex flex-wrap gap-4 justify-between items-center">
                  <div>
                    <p className="font-heading text-[0.62rem] uppercase tracking-widest text-white/40 mb-1">Verified Product</p>
                    <h2 className="font-heading font-extrabold text-2xl uppercase text-white leading-none">
                      {product.product_name || product.herb_species}
                    </h2>
                    <p className="font-mono text-xs text-gold mt-1">{product.product_id}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge s={product.lab_status} />
                    {product.lab_status === 'approved' && (
                      <span className="badge badge-green gap-1"><CheckCircle2 size={10} /> Authentic & Safe</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Farm Origin */}
                  <Section icon={MapPin} title="Farm Origin" color="bg-primary">
                    <InfoRow label="Farmer" value={product.farmer_name} />
                    <InfoRow label="Farm / Village" value={product.location_name || product.farm_address} />
                    <InfoRow label="Phone" value={product.farmer_phone} />
                    {product.gps_lat && <InfoRow label="GPS" value={`${product.gps_lat}, ${product.gps_lng}`} />}
                    <InfoRow label="Harvest Date" value={product.harvest_date ? new Date(product.harvest_date).toLocaleDateString('en-IN') : undefined} />
                    <InfoRow label="Quantity Collected" value={product.quantity_kg ? `${product.quantity_kg} kg` : undefined} />
                    <InfoRow label="Initial Moisture" value={product.moisture_level ? `${product.moisture_level}%` : undefined} />
                  </Section>

                  {/* Herb */}
                  <Section icon={Leaf} title="Herb Details" color="bg-gold">
                    <InfoRow label="Species" value={product.herb_species} />
                    <InfoRow label="Product Name" value={product.product_name} />
                    <InfoRow label="Description" value={product.description} />
                    <InfoRow label="Batch Reference" value={product.batch_id} />
                    <InfoRow label="Manufactured" value={product.manufacturing_date ? new Date(product.manufacturing_date).toLocaleDateString('en-IN') : undefined} />
                    <InfoRow label="Production Unit" value={product.production_unit_name || product.production_unit_contact} />
                    <InfoRow label="Expires" value={product.expiry_date ? new Date(product.expiry_date).toLocaleDateString('en-IN') : undefined} />
                  </Section>

                  {/* Processing */}
                  <Section icon={Package} title="Processing Details" color="bg-secondary">
                    {!product.drying_method && !product.storage_location ? (
                      <p className="py-4 font-body text-xs text-secondary/40">Processing details not available.</p>
                    ) : <>
                      <InfoRow label="Drying Method" value={product.drying_method} />
                      <InfoRow label="Drying Duration" value={product.drying_duration_hrs ? `${product.drying_duration_hrs} hours` : undefined} />
                      <InfoRow label="Grinding Status" value={product.grinding_status ? 'Ground & Processed' : product.grinding_status === false ? 'Whole Herb' : undefined} />
                      <InfoRow label="Storage Temp" value={product.storage_temperature ? `${product.storage_temperature}°C` : undefined} />
                      <InfoRow label="Storage Humidity" value={product.storage_humidity ? `${product.storage_humidity}%` : undefined} />
                      <InfoRow label="Storage Location" value={product.storage_location} />
                    </>}
                  </Section>

                  {/* Lab Results */}
                  <Section icon={FlaskConical} title="Laboratory Test Results" color={product.lab_status === 'approved' ? 'bg-primary' : 'bg-secondary'}>
                    <InfoRow label="Moisture Content" value={product.moisture_content ? `${product.moisture_content}%` : undefined} />
                    <InfoRow label="Pesticide Residue" value={product.pesticide_residue_result} />
                    <InfoRow label="DNA Authentication" value={product.dna_auth_result} />
                    <InfoRow label="Heavy Metals" value={product.heavy_metal_result} />
                    <InfoRow label="Microbial Count" value={product.microbial_count} />
                    <InfoRow label="Tested By" value={product.tested_by} />
                    <InfoRow label="Test Date" value={product.tested_at ? new Date(product.tested_at).toLocaleDateString('en-IN') : undefined} />
                    <div className="py-3 flex items-center justify-between">
                      <span className="font-heading text-[0.6rem] uppercase tracking-widest text-secondary/40">Lab Verdict</span>
                      <StatusBadge s={product.lab_status} />
                    </div>
                    {/* Certificate downloads */}
                    <div className="flex flex-wrap gap-2 py-2">
                      {product.moisture_report_url && (
                        <a href={product.moisture_report_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 border border-secondary/15 font-heading text-[0.58rem] uppercase hover:border-primary hover:text-primary transition-colors">
                          <Download size={10} /> Moisture Report
                        </a>
                      )}
                      {product.pesticide_report_url && (
                        <a href={product.pesticide_report_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 border border-secondary/15 font-heading text-[0.58rem] uppercase hover:border-primary hover:text-primary transition-colors">
                          <Download size={10} /> Pesticide Report
                        </a>
                      )}
                      {product.dna_certificate_url && (
                        <a href={product.dna_certificate_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 border border-secondary/15 font-heading text-[0.58rem] uppercase hover:border-primary hover:text-primary transition-colors">
                          <Download size={10} /> DNA Certificate
                        </a>
                      )}
                    </div>
                  </Section>
                </div>

                {/* Dispatch This Shipment — logistics/lab/admin only, and only if not already dispatched */}
                {canDispatch && custody.length === 0 && !dispatchResult && (
                  <div className="bg-white border border-secondary/7 mb-4">
                    <div className="bg-gold px-5 py-3 flex items-center gap-2">
                      <Truck size={16} className="text-secondary" />
                      <span className="font-heading text-[0.65rem] uppercase tracking-widest text-secondary">Dispatch This Shipment</span>
                    </div>
                    <form onSubmit={handleDispatch} className="p-5 space-y-4">
                      <div>
                        <label className="form-label">Batch ID</label>
                        <div className="form-input bg-secondary/5 text-secondary/50 font-mono flex items-center gap-2 cursor-not-allowed">
                          <Lock size={12} className="shrink-0" /> {product.batch_id}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">From Stage</label>
                          <div className="form-input bg-secondary/5 text-secondary/50 flex items-center gap-2 cursor-not-allowed">
                            <Lock size={12} className="shrink-0" /> collected
                          </div>
                        </div>
                        <div>
                          <label className="form-label">To Stage *</label>
                          <select className="form-input" value={dispatchForm.to_stage}
                            onChange={e => setDispatchForm(f => ({ ...f, to_stage: e.target.value }))}>
                            {['processing', 'lab', 'manufacturer', 'distributor', 'retail'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Courier Name {courierDefaults.courier_name && '(from your profile)'}</label>
                          <input className="form-input" value={dispatchForm.courier_name}
                            onChange={e => setDispatchForm(f => ({ ...f, courier_name: e.target.value }))} />
                        </div>
                        <div>
                          <label className="form-label">Vehicle Number {courierDefaults.vehicle_number && '(from your profile)'}</label>
                          <input className="form-input" value={dispatchForm.vehicle_number}
                            onChange={e => setDispatchForm(f => ({ ...f, vehicle_number: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <button type="button" onClick={captureDispatchGps}
                          className={`btn-outline flex items-center gap-2 text-xs ${dispatchForm.gps_lat ? 'border-primary text-primary' : ''}`}>
                          <MapPin size={13} /> {dispatchForm.gps_lat ? 'Pickup GPS Captured ✓' : 'Capture Pickup GPS'}
                        </button>
                        {dispatchForm.gps_lat && <p className="font-body text-xs text-secondary/50 mt-2">📍 {dispatchForm.gps_lat}, {dispatchForm.gps_lng}</p>}
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={dispatching}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                        {dispatching ? <Loader2 size={16} className="animate-spin" /> : <><Truck size={15} /> Generate Dispatch QR</>}
                      </motion.button>
                    </form>
                  </div>
                )}

                {dispatchResult && (
                  <div className={`p-5 flex flex-col md:flex-row items-center gap-6 mb-4 ${dispatchResult.error ? 'bg-red-50 border-l-4 border-red-500' : 'bg-white border border-secondary/7'}`}>
                    {dispatchResult.qr_code && <img src={dispatchResult.qr_code} alt="Dispatch QR" className="w-28 h-28 shrink-0" />}
                    <div>
                      <p className={`font-heading text-sm uppercase mb-1 flex items-center gap-2 ${dispatchResult.error ? 'text-red-700' : 'text-primary'}`}>
                        {dispatchResult.error ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                        {dispatchResult.error ? 'Dispatch Failed' : 'Shipment Dispatched'}
                      </p>
                      <p className="font-body text-xs text-secondary/60">{dispatchResult.message}</p>
                    </div>
                  </div>
                )}

                {canDispatch && custody.length > 0 && (
                  <div className="flex items-center gap-3 px-5 py-4 bg-secondary/5 border-l-4 border-secondary/30 text-secondary/70 mb-4">
                    <PackageCheck size={16} className="shrink-0" />
                    <p className="font-body text-sm">This batch has already been dispatched — a batch can only be shipped once.</p>
                  </div>
                )}

                {/* Transport Chain of Custody */}
                {custody.length > 0 && (
                  <div className="bg-white border border-secondary/7 mb-4">
                    <div className="bg-secondary px-5 py-3 flex items-center gap-2">
                      <Truck size={16} className="text-white" />
                      <span className="font-heading text-[0.65rem] uppercase tracking-widest text-white">Transport Journey (Chain of Custody)</span>
                    </div>

                    {(() => {
                      const points: JourneyPoint[] = []
                      if (product.gps_lat && product.gps_lng) {
                        points.push({ lat: product.gps_lat, lng: product.gps_lng, label: `Farm — ${product.farmer_name || 'Origin'}`, sublabel: product.location_name, kind: 'farm' })
                      }
                      custody.forEach((leg, i) => {
                        const isLast = i === custody.length - 1
                        if (leg.pickup_gps_lat && leg.pickup_gps_lng) {
                          points.push({
                            lat: leg.pickup_gps_lat, lng: leg.pickup_gps_lng,
                            label: `Picked up — ${leg.from_stage || 'origin'}`,
                            sublabel: `${leg.courier_name || 'Courier'} · ${new Date(leg.dispatched_at).toLocaleString('en-IN')}`,
                            kind: isLast && !leg.delivered_at ? 'current' : 'waypoint',
                          })
                        }
                        if (leg.delivery_gps_lat && leg.delivery_gps_lng) {
                          points.push({
                            lat: leg.delivery_gps_lat, lng: leg.delivery_gps_lng,
                            label: `Delivered — ${leg.to_stage}`,
                            sublabel: leg.receiver_name ? `Received by ${leg.receiver_name} · ${new Date(leg.delivered_at!).toLocaleString('en-IN')}` : new Date(leg.delivered_at!).toLocaleString('en-IN'),
                            kind: isLast ? 'current' : 'delivered',
                          })
                        }
                      })
                      return <JourneyMap points={points} />
                    })()}

                    <div className="px-5 py-2">
                      {custody.map((leg, i) => (
                        <div key={i} className="flex items-start gap-3 py-3 border-b border-secondary/5 last:border-0">
                          <Link2 size={14} className="mt-1 text-secondary/40 shrink-0" />
                          <div className="flex-1">
                            <p className="font-heading text-xs uppercase text-secondary">{leg.from_stage} → {leg.to_stage}</p>
                            <p className="font-body text-xs text-secondary/60 mt-0.5">
                              {leg.courier_name || 'Courier not specified'}{leg.vehicle_number ? ` · ${leg.vehicle_number}` : ''}
                            </p>
                            <p className="font-body text-xs text-secondary/40 mt-0.5">
                              Dispatched {new Date(leg.dispatched_at).toLocaleString('en-IN')}
                              {leg.delivered_at ? ` · Delivered ${new Date(leg.delivered_at).toLocaleString('en-IN')}` : ' · In transit'}
                            </p>
                          </div>
                          {leg.anomaly_flag ? (
                            <span className="badge badge-red gap-1 shrink-0"><AlertTriangle size={10} /> Flagged</span>
                          ) : leg.status === 'delivered' ? (
                            <span className="badge badge-green gap-1 shrink-0"><CheckCircle2 size={10} /> Verified</span>
                          ) : (
                            <span className="badge badge-gold gap-1 shrink-0"><Clock size={10} /> In Transit</span>
                          )}
                        </div>
                      ))}
                      {custody.some(l => l.anomaly_flag) && (
                        <p className="font-body text-xs text-red-600 py-2">⚠ One or more legs of this shipment were flagged for unusual transit timing/location. Verify with the seller before purchase.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* QR Code */}
                {product.qr_code_data && (
                  <div className="bg-white border border-secondary/7 p-7 flex flex-col md:flex-row items-center gap-8">
                    <img src={product.qr_code_data} alt="Product QR" className="w-36 h-36 shrink-0" />
                    <div>
                      <p className="font-heading text-sm uppercase mb-2">Product QR Code</p>
                      <p className="font-body text-xs text-secondary/55 leading-relaxed mb-4 max-w-sm">
                        This QR code links directly to this product verification page. Share it to allow others to verify authenticity.
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        <a href={product.qr_code_data} download={`${product.product_id}.png`}>
                          <motion.button whileHover={{ scale: 1.03 }} className="btn-outline flex items-center gap-2">
                            <Download size={13} /> Download QR
                          </motion.button>
                        </a>
                        <button
                          onClick={() => { setProduct(null); setQuery(''); setSearchParams({}) }}
                          className="btn-ghost">
                          Search Another
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* How it works — show when idle */}
          {!product && !loading && results.length === 0 && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
              {[
                { n: '01', icon: QrCode,   title: 'Scan QR Code',       desc: 'Use your camera to scan the QR code on the product, or manually type the Product ID above.', bg: 'bg-primary' },
                { n: '02', icon: Search,   title: 'Verify Instantly',    desc: 'Get the complete farm-to-shelf journey: origin, processing, and lab test results.', bg: 'bg-gold' },
                { n: '03', icon: Download, title: 'Download Certificates', desc: 'Save official lab certificates and quality documentation to your device.', bg: 'bg-secondary' },
              ].map(step => (
                <motion.div key={step.n} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * parseInt(step.n) }} className="card p-7 text-center">
                  <div className={`${step.bg} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <step.icon size={20} className="text-white" />
                  </div>
                  <span className="font-heading text-[0.58rem] uppercase tracking-widest text-gold">{step.n}</span>
                  <h4 className="font-heading text-sm uppercase mt-1 mb-2">{step.title}</h4>
                  <p className="font-body text-xs text-secondary/55 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}