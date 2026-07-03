import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Truck, Loader2, CheckCircle2, Leaf, MapPin, Lock, Camera, Clock, AlertTriangle, QrCode, ChevronDown } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import QrScannerModal from '@/components/QrScannerModal'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

const STAGES = ['processing', 'lab', 'manufacturer', 'distributor', 'retail']

interface Dispatch {
  batch_id: string; transfer_token: string; from_stage: string; to_stage: string
  courier_name: string; vehicle_number: string
  dispatched_at: string; delivered_at: string | null; status: string
  anomaly_flag: boolean; receiver_name: string | null
  herb_species: string; quantity_kg: number; farmer_name: string
}

export default function CollectorPage() {
  const { isAuthenticated, userRole } = useAuthStore()
  const canUse = isAuthenticated && (userRole === 'collector' || userRole === 'admin')

  const [dForm, setDForm] = useState({ batch_id: '', to_stage: STAGES[0], courier_name: '', vehicle_number: '', gps_lat: '', gps_lng: '' })
  const [batchLocked, setBatchLocked] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanError, setScanError] = useState('')
  const [dispatching, setDispatching] = useState(false)
  const [dResult, setDResult] = useState<{ message: string; qr_code?: string; error?: boolean } | null>(null)

  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedToken, setExpandedToken] = useState<string | null>(null)
  const [qrInfo, setQrInfo] = useState<Record<string, { qr_code: string; used: boolean; message: string }>>({})
  const [qrLoading, setQrLoading] = useState<string | null>(null)

  const toggleExpand = async (token: string) => {
    if (expandedToken === token) { setExpandedToken(null); return }
    setExpandedToken(token)
    if (qrInfo[token]) return
    setQrLoading(token)
    try {
      const { data } = await api.get(`/logistics/qr-image/${token}`)
      setQrInfo(prev => ({ ...prev, [token]: data }))
    } catch {}
    setQrLoading(null)
  }

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/collector/my-dispatches')
      setDispatches(data.dispatches || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (!canUse) return
    api.get('/logistics/my-profile').then(({ data }) => {
      setDForm(f => ({ ...f, courier_name: data.courier_name || f.courier_name, vehicle_number: data.vehicle_number || f.vehicle_number }))
    }).catch(() => {})
    load()
  }, [canUse])

  const handleLabQrScan = async (decodedText: string) => {
    setScannerOpen(false); setScanError(''); setDResult(null)
    try {
      const url = new URL(decodedText)
      const pid = url.searchParams.get('pid')
      if (!pid) throw new Error('no pid')
      const { data } = await api.get(`/products/${pid}/scan`)
      const batchId = data.product?.batch_id
      if (!batchId) throw new Error('no batch')
      setDForm(f => ({ ...f, batch_id: batchId }))
      setBatchLocked(true)
    } catch {
      setScanError('That QR doesn\'t look like a valid lab-approved product QR. Try again, or ask the lab to confirm the batch was approved.')
    }
  }

  const captureGps = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setDForm(f => ({ ...f, gps_lat: pos.coords.latitude.toFixed(6), gps_lng: pos.coords.longitude.toFixed(6) })),
      () => {}
    )
  }

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault(); setDispatching(true); setDResult(null)
    try {
      const { data } = await api.post('/logistics/dispatch', {
        batch_id: dForm.batch_id, from_stage: 'collected', to_stage: dForm.to_stage,
        courier_name: dForm.courier_name, vehicle_number: dForm.vehicle_number,
        pickup_gps_lat: dForm.gps_lat || undefined, pickup_gps_lng: dForm.gps_lng || undefined,
      })
      setDResult({ message: data.message, qr_code: data.qr_code })
      setBatchLocked(false)
      setDForm(f => ({ ...f, batch_id: '', gps_lat: '', gps_lng: '' }))
      load()
    } catch (err: any) {
      setDResult({ message: err.response?.data?.error || 'Failed to dispatch shipment.', error: true })
    }
    setDispatching(false)
  }

  if (!canUse) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-24 px-4 text-center max-w-lg mx-auto">
          <Lock size={28} className="mx-auto text-secondary/30 mb-4" />
          <p className="font-body text-sm text-secondary/60 mb-4">Sign in as a Collector to view this dashboard.</p>
          <Link to="/collector-login" className="btn-primary inline-block px-6 py-3">Sign In</Link>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gold py-14 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 rounded-full font-heading text-[0.62rem] uppercase tracking-widest text-secondary/70 mb-4">
            <Truck size={12} /> Collector
          </span>
          <h1 className="font-heading font-extrabold uppercase text-secondary leading-[0.9] tracking-tight"
            style={{ fontSize: 'clamp(2rem,5vw,3.2rem)' }}>
            My Dispatched<br />Shipments
          </h1>
          <p className="font-body text-sm text-secondary/70 mt-3 max-w-md mx-auto">
            Scan a lab-approved product QR to dispatch a batch for delivery.
          </p>
        </motion.div>
      </section>

      <section className="py-10 px-4 md:px-12">
        <div className="max-w-[900px] mx-auto">

          {!batchLocked ? (
            <button onClick={() => setScannerOpen(true)}
              className="btn-primary w-full flex items-center justify-center gap-2 py-5 mb-3">
              <Camera size={18} /> Scan Lab-Approved QR
            </button>
          ) : (
            <div className="bg-white border border-secondary/7 p-6 mb-6">
              <p className="font-heading text-sm uppercase mb-4 flex items-center gap-2">
                <Truck size={16} className="text-primary" /> Dispatch This Batch
              </p>
              <form onSubmit={handleDispatch} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="form-label">Batch ID</label>
                  <div className="form-input bg-secondary/5 text-secondary/50 font-mono flex items-center gap-2 cursor-not-allowed">
                    <Lock size={12} className="shrink-0" /> {dForm.batch_id}
                  </div>
                </div>
                <div>
                  <label className="form-label">From Stage</label>
                  <div className="form-input bg-secondary/5 text-secondary/50 flex items-center gap-2 cursor-not-allowed">
                    <Lock size={12} className="shrink-0" /> collected
                  </div>
                </div>
                <div>
                  <label className="form-label">To Stage *</label>
                  <select required className="form-input" value={dForm.to_stage}
                    onChange={e => setDForm(f => ({ ...f, to_stage: e.target.value }))}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Courier Name</label>
                  <input className="form-input" value={dForm.courier_name}
                    onChange={e => setDForm(f => ({ ...f, courier_name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Vehicle Number</label>
                  <input className="form-input" value={dForm.vehicle_number}
                    onChange={e => setDForm(f => ({ ...f, vehicle_number: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <button type="button" onClick={captureGps}
                    className={`btn-outline flex items-center gap-2 text-xs ${dForm.gps_lat ? 'border-primary text-primary' : ''}`}>
                    <MapPin size={13} /> {dForm.gps_lat ? 'Pickup GPS Captured ✓' : 'Capture Pickup GPS'}
                  </button>
                  {dForm.gps_lat && <p className="font-body text-xs text-secondary/50 mt-2">📍 {dForm.gps_lat}, {dForm.gps_lng}</p>}
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="button" onClick={() => { setBatchLocked(false); setDForm(f => ({ ...f, batch_id: '' })) }}
                    className="btn-outline px-5 py-4">Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={dispatching}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-4">
                    {dispatching ? <Loader2 size={16} className="animate-spin" /> : <><Truck size={15} /> Generate Dispatch QR</>}
                  </motion.button>
                </div>
              </form>
            </div>
          )}
          {scanError && <p className="font-body text-xs text-red-600 mb-6 text-center">{scanError}</p>}

          {dResult && (
            <div className={`p-5 flex flex-col md:flex-row items-center gap-6 mb-6 ${dResult.error ? 'bg-red-50 border-l-4 border-red-500' : 'bg-white border border-secondary/7'}`}>
              {dResult.qr_code && <img src={dResult.qr_code} alt="Dispatch QR" className="w-28 h-28 shrink-0" />}
              <div>
                <p className={`font-heading text-sm uppercase mb-1 flex items-center gap-2 ${dResult.error ? 'text-red-700' : 'text-primary'}`}>
                  {dResult.error ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                  {dResult.error ? 'Dispatch Failed' : 'Shipment Dispatched'}
                </p>
                <p className="font-body text-xs text-secondary/60">{dResult.message}</p>
              </div>
            </div>
          )}

          {loading && <div className="text-center py-16"><Loader2 size={28} className="mx-auto animate-spin text-secondary/30" /></div>}

          {!loading && dispatches.length === 0 && (
            <div className="text-center py-16 bg-white border border-secondary/7">
              <Truck size={28} className="mx-auto text-secondary/20 mb-3" />
              <p className="font-body text-sm text-secondary/50">No shipments dispatched yet.</p>
            </div>
          )}

          <div className="space-y-4">
            {dispatches.map(d => (
              <div key={d.transfer_token} className="bg-white border border-secondary/7">
                <button onClick={() => toggleExpand(d.transfer_token)}
                  className="w-full p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left hover:bg-secondary/2 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gold/20 flex items-center justify-center shrink-0">
                      <Leaf size={18} className="text-secondary" />
                    </div>
                    <div>
                      <p className="font-heading text-sm uppercase flex items-center gap-2">
                        {d.herb_species}
                        <ChevronDown size={14} className={`text-secondary/30 transition-transform ${expandedToken === d.transfer_token ? 'rotate-180' : ''}`} />
                      </p>
                      <p className="font-mono text-xs text-secondary/50">{d.batch_id}</p>
                      <p className="font-body text-xs text-secondary/50 mt-1">
                        {d.quantity_kg}kg · from {d.farmer_name || 'farmer'} · to {d.to_stage}
                      </p>
                      <p className="font-body text-xs text-secondary/40">
                        Dispatched {new Date(d.dispatched_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  {d.anomaly_flag ? (
                    <span className="badge badge-red gap-1 shrink-0"><AlertTriangle size={11} /> Flagged</span>
                  ) : d.status === 'delivered' ? (
                    <span className="badge badge-green gap-1 shrink-0"><CheckCircle2 size={11} /> Delivered</span>
                  ) : (
                    <span className="badge badge-gold gap-1 shrink-0"><Clock size={11} /> In Transit</span>
                  )}
                </button>

                {expandedToken === d.transfer_token && (
                  <div className="px-6 pb-6 pt-2 border-t border-secondary/5 flex flex-col md:flex-row items-center gap-5">
                    {qrLoading === d.transfer_token ? (
                      <Loader2 size={22} className="animate-spin text-secondary/30" />
                    ) : qrInfo[d.transfer_token] ? (
                      <>
                        <img
                          src={qrInfo[d.transfer_token].qr_code}
                          alt="Dispatch QR"
                          className={`w-28 h-28 shrink-0 ${qrInfo[d.transfer_token].used ? 'opacity-30 grayscale' : ''}`}
                        />
                        <div>
                          <p className="font-heading text-xs uppercase mb-1 flex items-center gap-2">
                            <QrCode size={13} className={qrInfo[d.transfer_token].used ? 'text-secondary/40' : 'text-primary'} />
                            {qrInfo[d.transfer_token].used ? 'QR Already Scanned' : 'QR Still Valid'}
                          </p>
                          <p className="font-body text-xs text-secondary/60">{qrInfo[d.transfer_token].message}</p>
                          <p className="font-body text-[0.65rem] text-secondary/40 mt-2">Every dispatch QR can only be scanned once — this prevents cloned or reused labels.</p>
                        </div>
                      </>
                    ) : (
                      <p className="font-body text-xs text-secondary/40">Could not load QR.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleLabQrScan} title="Scan Lab-Approved QR" />
      <Footer />
    </div>
  )
}