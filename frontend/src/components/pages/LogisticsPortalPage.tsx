import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Truck, PackageCheck, QrCode, MapPin, Loader2, AlertTriangle,
  CheckCircle2, Search, Link2, Clock, Lock
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

interface CustodyLeg {
  from_stage: string; to_stage: string; courier_name: string; vehicle_number: string
  dispatched_at: string; delivered_at: string | null; status: string
  anomaly_flag: boolean; anomaly_reason: string | null; receiver_name: string | null
}

const STAGES = ['processing', 'lab', 'manufacturer', 'distributor', 'retail']

export default function LogisticsPortalPage() {
  const { isAuthenticated, userRole } = useAuthStore()
  const canDispatch = isAuthenticated && (userRole === 'admin' || userRole === 'collector')
  const canConfirm  = isAuthenticated && (userRole === 'admin' || userRole === 'production_unit')
  const canUse = canDispatch || canConfirm
  const [tab, setTab] = useState<'dispatch' | 'confirm' | 'track'>('dispatch')

  /* ---- Dispatch ---- */
  const [dForm, setDForm] = useState({ batch_id: '', from_stage: '', to_stage: STAGES[0], courier_name: '', vehicle_number: '', gps_lat: '', gps_lng: '' })
  const [dLoading, setDLoading] = useState(false)
  const [dResult, setDResult] = useState<any>(null)
  const [dError, setDError] = useState('')

  const captureGps = (setter: (lat: string, lng: string) => void) => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setter(pos.coords.latitude.toFixed(6), pos.coords.longitude.toFixed(6)),
      () => {}
    )
  }

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault(); setDLoading(true); setDError(''); setDResult(null)
    try {
      const { data } = await api.post('/logistics/dispatch', {
        ...dForm,
        pickup_gps_lat: dForm.gps_lat || undefined,
        pickup_gps_lng: dForm.gps_lng || undefined,
      })
      setDResult(data)
    } catch (err: any) {
      setDError(err.response?.data?.error || 'Failed to dispatch shipment.')
    }
    setDLoading(false)
  }

  /* ---- Confirm delivery ---- */
  const [cForm, setCForm] = useState({ transfer_token: '', receiver_name: '', gps_lat: '', gps_lng: '' })
  const [cLoading, setCLoading] = useState(false)
  const [cResult, setCResult] = useState<any>(null)
  const [cError, setCError] = useState('')

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault(); setCLoading(true); setCError(''); setCResult(null)
    try {
      const { data } = await api.post('/logistics/confirm-delivery', {
        transfer_token: cForm.transfer_token,
        receiver_name: cForm.receiver_name,
        delivery_gps_lat: cForm.gps_lat || undefined,
        delivery_gps_lng: cForm.gps_lng || undefined,
      })
      setCResult(data)
    } catch (err: any) {
      setCError(err.response?.data?.error || 'Failed to confirm delivery.')
    }
    setCLoading(false)
  }

  /* ---- Track ---- */
  const [tBatchId, setTBatchId] = useState('')
  const [tLoading, setTLoading] = useState(false)
  const [tChain, setTChain] = useState<CustodyLeg[]>([])
  const [tError, setTError] = useState('')

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault(); setTLoading(true); setTError(''); setTChain([])
    try {
      const { data } = await api.get(`/logistics/${tBatchId.trim()}`)
      setTChain(data.custody_chain || [])
      if (!data.custody_chain?.length) setTError('No shipment legs recorded yet for this batch.')
    } catch {
      setTError('Could not fetch custody trail for this batch.')
    }
    setTLoading(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gold py-16 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-[800px] mx-auto">
          <span className="inline-block px-4 py-1.5 bg-secondary/10 rounded-full font-heading text-[0.62rem] uppercase tracking-widest text-secondary/70 mb-4">
            Chain of Custody
          </span>
          <h1 className="font-heading font-extrabold uppercase text-secondary leading-[0.88] tracking-tight mb-3"
            style={{ fontSize: 'clamp(2rem,6vw,4rem)' }}>
            Logistics &<br /><span className="text-primary">Transport</span><br />Verification
          </h1>
          <p className="font-body text-sm text-secondary/70 leading-relaxed max-w-lg mx-auto">
            Every handoff between farm, processor, lab and market gets a single-use QR. It can only be redeemed once —
            cloned labels and phantom deliveries get caught instantly.
          </p>
        </motion.div>
      </section>

      <section className="py-14 px-4 md:px-12">
        <div className="max-w-[900px] mx-auto">

          {!canUse && (
            <div className="flex items-start gap-3 px-5 py-4 bg-secondary/5 border-l-4 border-secondary/30 text-secondary/70 mb-8">
              <Lock size={16} className="mt-0.5 shrink-0" />
              <p className="font-body text-sm">Sign in as a Collector to dispatch shipments, or a Production Unit to confirm deliveries. Anyone can still track a batch's transport trail below.</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-secondary/10">
            {[
              { id: 'dispatch', label: 'Dispatch Shipment', icon: Truck },
              { id: 'confirm', label: 'Confirm Delivery', icon: PackageCheck },
              { id: 'track', label: 'Track Batch', icon: Search },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-heading text-[0.65rem] uppercase tracking-widest border-b-2 transition-colors ${
                  tab === t.id ? 'border-primary text-primary' : 'border-transparent text-secondary/40 hover:text-secondary/70'
                }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {/* Dispatch tab */}
          {tab === 'dispatch' && (
            <div className="card p-7">
              {!canDispatch ? (
                <div className="flex items-start gap-3 px-4 py-3 bg-secondary/5 border-l-4 border-secondary/30 text-secondary/70">
                  <Lock size={15} className="mt-0.5 shrink-0" />
                  <p className="font-body text-sm">Only Collector accounts can dispatch shipments. <Link to="/collector-login" className="underline font-medium">Sign in as Collector</Link></p>
                </div>
              ) : (
                <form onSubmit={handleDispatch} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="form-label">Batch ID *</label>
                    <input required className="form-input" placeholder="BATCH-20260701-XXXXXXXX"
                      value={dForm.batch_id} onChange={e => setDForm(f => ({ ...f, batch_id: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">From Stage</label>
                    <input className="form-input" placeholder="e.g. collected" value={dForm.from_stage}
                      onChange={e => setDForm(f => ({ ...f, from_stage: e.target.value }))} />
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
                    <button type="button" onClick={() => captureGps((lat, lng) => setDForm(f => ({ ...f, gps_lat: lat, gps_lng: lng })))}
                      className="btn-outline flex items-center gap-2 text-xs">
                      <MapPin size={13} /> Capture Pickup GPS
                    </button>
                    {dForm.gps_lat && <p className="font-body text-xs text-secondary/50 mt-2">📍 {dForm.gps_lat}, {dForm.gps_lng}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={dLoading}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                      {dLoading ? <Loader2 size={16} className="animate-spin" /> : <><Truck size={15} /> Generate Dispatch QR</>}
                    </motion.button>
                  </div>
                </form>
              )}

              {dError && <p className="font-body text-sm text-red-600 mt-4">{dError}</p>}

              {dResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-secondary/3 border border-secondary/10 p-6 flex flex-col md:flex-row items-center gap-6">
                  <img src={dResult.qr_code} alt="Custody QR" className="w-32 h-32 shrink-0" />
                  <div>
                    <p className="font-heading text-sm uppercase mb-2 text-primary flex items-center gap-2">
                      <CheckCircle2 size={15} /> Shipment Dispatched
                    </p>
                    <p className="font-body text-xs text-secondary/60 mb-2">{dResult.message}</p>
                    <p className="font-mono text-xs bg-white px-2 py-1 border border-secondary/10 inline-block">{dResult.transfer_token}</p>
                    <a href={dResult.qr_code} download={`custody-${dResult.transfer_token}.png`} className="block mt-3">
                      <button className="btn-outline text-xs">Download QR</button>
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Confirm delivery tab */}
          {tab === 'confirm' && (
            <div className="card p-7">
              {!canConfirm ? (
                <div className="flex items-start gap-3 px-4 py-3 bg-secondary/5 border-l-4 border-secondary/30 text-secondary/70">
                  <Lock size={15} className="mt-0.5 shrink-0" />
                  <p className="font-body text-sm">Only Production Unit accounts can confirm deliveries. <Link to="/production-login" className="underline font-medium">Sign in as Production Unit</Link></p>
                </div>
              ) : (
                <form onSubmit={handleConfirm} className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="form-label">Transfer Token (scan or paste from courier's QR) *</label>
                    <input required className="form-input font-mono" placeholder="32-character token"
                      value={cForm.transfer_token} onChange={e => setCForm(f => ({ ...f, transfer_token: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Receiver Name</label>
                    <input className="form-input" value={cForm.receiver_name}
                      onChange={e => setCForm(f => ({ ...f, receiver_name: e.target.value }))} />
                  </div>
                  <div>
                    <button type="button" onClick={() => captureGps((lat, lng) => setCForm(f => ({ ...f, gps_lat: lat, gps_lng: lng })))}
                      className="btn-outline flex items-center gap-2 text-xs">
                      <MapPin size={13} /> Capture Delivery GPS
                    </button>
                    {cForm.gps_lat && <p className="font-body text-xs text-secondary/50 mt-2">📍 {cForm.gps_lat}, {cForm.gps_lng}</p>}
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={cLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                    {cLoading ? <Loader2 size={16} className="animate-spin" /> : <><PackageCheck size={15} /> Confirm Receipt</>}
                  </motion.button>
                </form>
              )}

              {cError && <p className="font-body text-sm text-red-600 mt-4">{cError}</p>}

              {cResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-6 flex items-start gap-3 ${cResult.anomaly ? 'bg-red-50 border-l-4 border-red-500 text-red-700' : 'bg-green-50 border-l-4 border-green-600 text-green-700'}`}>
                  {cResult.anomaly ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
                  <p className="font-body text-sm">{cResult.message}</p>
                </motion.div>
              )}
            </div>
          )}

          {/* Track tab */}
          {tab === 'track' && (
            <div className="card p-7">
              <form onSubmit={handleTrack} className="flex gap-3 mb-2">
                <input className="form-input flex-1" placeholder="Enter Batch ID e.g. BATCH-20260701-XXXXXXXX"
                  value={tBatchId} onChange={e => setTBatchId(e.target.value)} />
                <button type="submit" disabled={tLoading} className="btn-primary shrink-0 px-6">
                  {tLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={15} />}
                </button>
              </form>
              {tError && <p className="font-body text-sm text-secondary/50 mt-4">{tError}</p>}
              {tChain.length > 0 && (
                <div className="mt-6">
                  {tChain.map((leg, i) => (
                    <div key={i} className="flex items-start gap-3 py-4 border-b border-secondary/5 last:border-0">
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
                </div>
              )}
            </div>
          )}

          {/* How it works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
            {[
              { n: '01', icon: QrCode, title: 'Single-Use QR', desc: 'Each handoff gets its own dispatch QR. It can be redeemed exactly once — a cloned or reprinted copy is worthless.', bg: 'bg-primary' },
              { n: '02', icon: MapPin, title: 'GPS + Time Check', desc: 'Pickup and delivery GPS plus elapsed time are checked for physically plausible transit speed.', bg: 'bg-gold' },
              { n: '03', icon: Lock, title: 'Immutable Record', desc: 'Every dispatch and delivery is hash-chained into the ledger — tampering breaks the chain and is instantly visible.', bg: 'bg-secondary' },
            ].map(step => (
              <div key={step.n} className="card p-7 text-center">
                <div className={`${step.bg} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <step.icon size={20} className="text-white" />
                </div>
                <span className="font-heading text-[0.58rem] uppercase tracking-widest text-gold">{step.n}</span>
                <h4 className="font-heading text-sm uppercase mt-1 mb-2">{step.title}</h4>
                <p className="font-body text-xs text-secondary/55 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}