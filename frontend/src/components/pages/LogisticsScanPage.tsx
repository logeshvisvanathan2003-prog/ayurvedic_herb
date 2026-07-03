import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Truck, PackageCheck, MapPin, Loader2, AlertCircle, CheckCircle2,
  Leaf, FlaskConical, Clock, Lock, QrCode
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import JourneyMap, { JourneyPoint } from '@/components/JourneyMap'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

interface Transfer {
  batch_id: string; from_stage: string; to_stage: string
  courier_name: string; vehicle_number: string
  pickup_gps_lat: number; pickup_gps_lng: number; dispatched_at: string
  delivery_gps_lat: number | null; delivery_gps_lng: number | null; delivered_at: string | null
  receiver_name: string | null; status: string; anomaly_flag: boolean; anomaly_reason: string | null
  herb_species: string; quantity_kg: number; moisture_level: number; harvest_date: string
  location_name: string; farmer_name: string
}
interface LabTest {
  overall_status: string; moisture_content: number; pesticide_residue_result: string
  dna_auth_result: string; heavy_metal_result: string; microbial_count: string
  tested_by: string; tested_at: string
}
interface Product { product_id: string; product_name: string }

export default function LogisticsScanPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { isAuthenticated, userRole, userName } = useAuthStore()
  const canConfirm = isAuthenticated && (userRole === 'admin' || userRole === 'production_unit')

  const [transfer, setTransfer] = useState<Transfer | null>(null)
  const [labTest, setLabTest] = useState<LabTest | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [receiverName, setReceiverName] = useState('')
  useEffect(() => { if (userName && !receiverName) setReceiverName(userName) }, [userName])
  const [gps, setGps] = useState<{ lat: string; lng: string }>({ lat: '', lng: '' })
  const [confirming, setConfirming] = useState(false)
  const [confirmResult, setConfirmResult] = useState<{ message: string; anomaly: boolean } | null>(null)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await api.get(`/logistics/scan/${token}`)
      setTransfer(data.transfer); setLabTest(data.lab_test); setProduct(data.product)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load this shipment.')
    }
    setLoading(false)
  }

  useEffect(() => { if (token) load() }, [token])

  const captureGps = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setGps({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }),
      () => {}
    )
  }

  const [gpsError, setGpsError] = useState('')

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gps.lat || !gps.lng) { setGpsError('GPS location is required — tap "Capture Delivery GPS" before confirming.'); return }
    setGpsError('')
    setConfirming(true)
    try {
      const { data } = await api.post('/logistics/confirm-delivery', {
        transfer_token: token, receiver_name: receiverName,
        delivery_gps_lat: gps.lat || undefined, delivery_gps_lng: gps.lng || undefined,
      })
      setConfirmResult({ message: data.message, anomaly: data.anomaly })
      load()
    } catch (err: any) {
      setConfirmResult({ message: err.response?.data?.error || 'Failed to confirm delivery.', anomaly: true })
    }
    setConfirming(false)
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-lg mx-auto py-24 text-center px-4">
          <AlertCircle size={28} className="mx-auto text-secondary/30 mb-4" />
          <p className="font-body text-sm text-secondary/60">No transfer token in this link.</p>
        </div>
        <Footer />
      </div>
    )
  }

  const points: JourneyPoint[] = []
  if (transfer?.pickup_gps_lat && transfer?.pickup_gps_lng) {
    points.push({ lat: transfer.pickup_gps_lat, lng: transfer.pickup_gps_lng, label: `Picked up — ${transfer.from_stage || 'origin'}`, sublabel: `${transfer.courier_name || 'Courier'} · ${new Date(transfer.dispatched_at).toLocaleString('en-IN')}`, kind: transfer.status === 'delivered' ? 'waypoint' : 'current' })
  }
  if (transfer?.delivery_gps_lat && transfer?.delivery_gps_lng) {
    points.push({ lat: transfer.delivery_gps_lat, lng: transfer.delivery_gps_lng, label: `Delivered — ${transfer.to_stage}`, sublabel: transfer.receiver_name ? `Received by ${transfer.receiver_name}` : undefined, kind: 'current' })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-secondary py-14 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full font-heading text-[0.62rem] uppercase tracking-widest text-white/70 mb-4">
            <QrCode size={12} /> Shipment Scan
          </span>
          <h1 className="font-heading font-extrabold uppercase text-white leading-[0.9] tracking-tight"
            style={{ fontSize: 'clamp(1.8rem,5vw,3rem)' }}>
            {loading ? 'Loading Shipment…' : transfer ? `${transfer.herb_species} Shipment` : 'Shipment'}
          </h1>
          {transfer && <p className="font-mono text-xs text-white/50 mt-2">{transfer.batch_id}</p>}
        </motion.div>
      </section>

      <section className="py-10 px-4 md:px-12">
        <div className="max-w-[900px] mx-auto">
          {loading && (
            <div className="text-center py-20"><Loader2 size={28} className="mx-auto animate-spin text-secondary/30" /></div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="font-body text-sm">{error}</p>
            </div>
          )}

          {transfer && !loading && (
            <>
              {transfer.anomaly_flag && (
                <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border-l-4 border-red-500 text-red-700 mb-5">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p className="font-body text-sm">⚠ This shipment leg was flagged: {transfer.anomaly_reason}</p>
                </div>
              )}

              {/* Batch details */}
              <div className="bg-white border border-secondary/7 mb-5">
                <div className="bg-primary px-5 py-3 flex items-center gap-2">
                  <Leaf size={16} className="text-white" />
                  <span className="font-heading text-[0.65rem] uppercase tracking-widest text-white">Batch Details</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
                  {[
                    ['Species', transfer.herb_species],
                    ['Weight', `${transfer.quantity_kg ?? '—'} kg`],
                    ['Moisture at Harvest', transfer.moisture_level ? `${transfer.moisture_level}%` : '—'],
                    ['Harvested', transfer.harvest_date ? new Date(transfer.harvest_date).toLocaleDateString('en-IN') : '—'],
                    ['Origin', transfer.location_name || '—'],
                    ['Farmer', transfer.farmer_name || '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="font-heading text-[0.6rem] uppercase tracking-widest text-secondary/40">{label}</p>
                      <p className="font-body text-sm text-secondary mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab report */}
              <div className="bg-white border border-secondary/7 mb-5">
                <div className="bg-gold px-5 py-3 flex items-center gap-2">
                  <FlaskConical size={16} className="text-secondary" />
                  <span className="font-heading text-[0.65rem] uppercase tracking-widest text-secondary">Laboratory Report</span>
                </div>
                {labTest ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5">
                    {[
                      ['Overall Status', labTest.overall_status],
                      ['Moisture', labTest.moisture_content ? `${labTest.moisture_content}%` : '—'],
                      ['Pesticide Residue', labTest.pesticide_residue_result || '—'],
                      ['DNA Authentication', labTest.dna_auth_result || '—'],
                      ['Heavy Metals', labTest.heavy_metal_result || '—'],
                      ['Microbial Count', labTest.microbial_count || '—'],
                      ['Tested By', labTest.tested_by || '—'],
                      ['Tested At', labTest.tested_at ? new Date(labTest.tested_at).toLocaleString('en-IN') : '—'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="font-heading text-[0.6rem] uppercase tracking-widest text-secondary/40">{label}</p>
                        <p className="font-body text-sm text-secondary mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-body text-sm text-secondary/50 p-5">Lab testing not yet completed for this batch.</p>
                )}
              </div>

              {/* Transport map */}
              <div className="bg-white border border-secondary/7 mb-5">
                <div className="bg-secondary px-5 py-3 flex items-center gap-2">
                  <Truck size={16} className="text-white" />
                  <span className="font-heading text-[0.65rem] uppercase tracking-widest text-white">Transport Leg</span>
                </div>
                <JourneyMap points={points} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
                  {[
                    ['Route', `${transfer.from_stage || '—'} → ${transfer.to_stage}`],
                    ['Courier', transfer.courier_name || '—'],
                    ['Vehicle', transfer.vehicle_number || '—'],
                    ['Picked Up', new Date(transfer.dispatched_at).toLocaleString('en-IN')],
                    ['Delivered', transfer.delivered_at ? new Date(transfer.delivered_at).toLocaleString('en-IN') : 'Not yet'],
                    ['Received By', transfer.receiver_name || '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="font-heading text-[0.6rem] uppercase tracking-widest text-secondary/40">{label}</p>
                      <p className="font-body text-sm text-secondary mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm delivery / status */}
              {transfer.status === 'delivered' ? (
                <div className="bg-green-50 border-l-4 border-green-600 px-5 py-4 flex items-start gap-3 mb-5">
                  <CheckCircle2 size={18} className="text-green-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-heading text-sm uppercase text-green-800">Shipment Delivered — Tracking Complete</p>
                    <p className="font-body text-xs text-green-700/80 mt-1">
                      Received by {transfer.receiver_name || 'recipient'} on {transfer.delivered_at && new Date(transfer.delivered_at).toLocaleString('en-IN')}.
                    </p>
                    {product && (
                      <Link to={`/consumer-portal?pid=${product.product_id}`} className="inline-block mt-2 text-xs font-heading uppercase underline text-green-800">
                        View finished product: {product.product_name}
                      </Link>
                    )}
                    {!product && (
                      <p className="font-body text-xs text-green-700/60 mt-2">Product QR not generated yet — pending manufacturing completion.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-secondary/7 p-6">
                  <p className="font-heading text-sm uppercase mb-4 flex items-center gap-2">
                    <PackageCheck size={16} className="text-primary" /> Confirm Delivery
                  </p>
                  {!canConfirm ? (
                    <div className="flex items-start gap-3 px-4 py-3 bg-secondary/5 border-l-4 border-secondary/30 text-secondary/70">
                      <Lock size={15} className="mt-0.5 shrink-0" />
                      <p className="font-body text-sm">
                        Sign in as the receiving Production Unit or Admin to confirm this delivery.{' '}
                        <Link to="/production-login" className="underline font-medium">Sign in</Link>
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleConfirm} className="space-y-4">
                      <div>
                        <label className="form-label">Transfer Token (from scanned QR)</label>
                        <div className="form-input bg-secondary/5 text-secondary/50 font-mono flex items-center gap-2 cursor-not-allowed select-all">
                          <Lock size={12} className="shrink-0" /> {token}
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Receiver Name</label>
                        <input className="form-input" value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder={userName ? '' : 'Enter your name'} />
                      </div>
                      <div>
                        <button type="button" onClick={captureGps}
                          className={`btn-outline flex items-center gap-2 text-xs ${gps.lat ? 'border-primary text-primary' : ''}`}>
                          <MapPin size={13} /> {gps.lat ? 'GPS Captured ✓' : 'Capture Delivery GPS (required)'}
                        </button>
                        {gps.lat && <p className="font-body text-xs text-secondary/50 mt-2">📍 {gps.lat}, {gps.lng}</p>}
                        {gpsError && <p className="font-body text-xs text-red-600 mt-2">{gpsError}</p>}
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={confirming || !gps.lat}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-40 disabled:cursor-not-allowed">
                        {confirming ? <Loader2 size={16} className="animate-spin" /> : <><PackageCheck size={15} /> Confirm Receipt</>}
                      </motion.button>
                    </form>
                  )}
                  {confirmResult && (
                    <div className={`mt-4 p-4 flex items-start gap-3 ${confirmResult.anomaly ? 'bg-red-50 border-l-4 border-red-500 text-red-700' : 'bg-green-50 border-l-4 border-green-600 text-green-700'}`}>
                      {confirmResult.anomaly ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
                      <p className="font-body text-sm">{confirmResult.message}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}