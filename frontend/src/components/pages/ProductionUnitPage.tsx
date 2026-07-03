import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, Loader2, CheckCircle2, QrCode, Leaf, Truck, Download, Lock, Camera } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import QrScannerModal from '@/components/QrScannerModal'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

interface Delivery {
  batch_id: string; delivered_at: string; receiver_name: string
  courier_name: string; vehicle_number: string
  herb_species: string; quantity_kg: number; farmer_name: string
  product_id: string | null; product_name: string | null
}

export default function ProductionUnitPage() {
  const { isAuthenticated, userRole } = useAuthStore()
  const canUse = isAuthenticated && (userRole === 'production_unit' || userRole === 'admin')
  const navigate = useNavigate()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanError, setScanError] = useState('')

  const handleDeliveryQrScan = (decodedText: string) => {
    setScannerOpen(false); setScanError('')
    try {
      const url = new URL(decodedText)
      const token = url.searchParams.get('token')
      if (!token) throw new Error('no token')
      navigate(`/logistics-scan?token=${token}`)
    } catch {
      setScanError('That doesn\'t look like a valid collector dispatch QR.')
    }
  }

  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [qrResults, setQrResults] = useState<Record<string, { qr_code: string; product_id: string; message: string }>>({})

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/production-unit/my-deliveries')
      setDeliveries(data.deliveries || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { if (canUse) load() }, [canUse])

  const generateQr = async (batchId: string) => {
    setGenerating(batchId)
    try {
      const { data } = await api.post('/products/generate-qr', { batch_id: batchId })
      setQrResults(prev => ({ ...prev, [batchId]: { qr_code: data.qr_code, product_id: data.product_id, message: data.message } }))
      load()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate product QR.')
    }
    setGenerating(null)
  }

  if (!canUse) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-24 px-4 text-center max-w-lg mx-auto">
          <Lock size={28} className="mx-auto text-secondary/30 mb-4" />
          <p className="font-body text-sm text-secondary/60 mb-4">Sign in as a Production Unit to view this dashboard.</p>
          <Link to="/production-login" className="btn-primary inline-block px-6 py-3">Sign In</Link>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-primary py-14 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full font-heading text-[0.62rem] uppercase tracking-widest text-white/70 mb-4">
            <Package size={12} /> Production Unit
          </span>
          <h1 className="font-heading font-extrabold uppercase text-white leading-[0.9] tracking-tight"
            style={{ fontSize: 'clamp(2rem,5vw,3.2rem)' }}>
            My Confirmed<br />Deliveries
          </h1>
          <p className="font-body text-sm text-white/70 mt-3 max-w-md mx-auto">
            Batches you've received from collectors. Generate the final consumer-facing product QR once ready.
          </p>
        </motion.div>
      </section>

      <section className="py-10 px-4 md:px-12">
        <div className="max-w-[900px] mx-auto">
          <button onClick={() => setScannerOpen(true)}
            className="btn-primary w-full flex items-center justify-center gap-2 py-5 mb-3">
            <Camera size={18} /> Scan Collector's Delivery QR
          </button>
          {scanError && <p className="font-body text-xs text-red-600 mb-6 text-center">{scanError}</p>}

          {loading && <div className="text-center py-16"><Loader2 size={28} className="mx-auto animate-spin text-secondary/30" /></div>}

          {!loading && deliveries.length === 0 && (
            <div className="text-center py-16 bg-white border border-secondary/7">
              <Truck size={28} className="mx-auto text-secondary/20 mb-3" />
              <p className="font-body text-sm text-secondary/50">
                No deliveries confirmed yet — scan a collector's dispatch QR to receive a shipment.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {deliveries.map(d => {
              const qrResult = qrResults[d.batch_id]
              const hasProduct = d.product_id || qrResult
              return (
                <div key={d.batch_id} className="bg-white border border-secondary/7 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
                        <Leaf size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-heading text-sm uppercase">{d.herb_species}</p>
                        <p className="font-mono text-xs text-secondary/50">{d.batch_id}</p>
                        <p className="font-body text-xs text-secondary/50 mt-1">
                          {d.quantity_kg}kg · from {d.farmer_name || 'farmer'} · via {d.courier_name || 'courier'} ({d.vehicle_number || '—'})
                        </p>
                        <p className="font-body text-xs text-secondary/40">
                          Delivered {new Date(d.delivered_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {hasProduct ? (
                      <span className="badge badge-green gap-1 shrink-0"><CheckCircle2 size={11} /> Product QR Generated</span>
                    ) : (
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => generateQr(d.batch_id)} disabled={generating === d.batch_id}
                        className="btn-primary flex items-center gap-2 px-5 py-2.5 shrink-0">
                        {generating === d.batch_id ? <Loader2 size={14} className="animate-spin" /> : <><QrCode size={14} /> Generate Product QR</>}
                      </motion.button>
                    )}
                  </div>

                  {qrResult && (
                    <div className="mt-4 pt-4 border-t border-secondary/5 flex flex-col md:flex-row items-center gap-5">
                      <img src={qrResult.qr_code} alt="Product QR" className="w-28 h-28 shrink-0" />
                      <div>
                        <p className="font-heading text-xs uppercase text-primary mb-1">Product ID: {qrResult.product_id}</p>
                        <p className="font-body text-xs text-secondary/60 mb-2">{qrResult.message}</p>
                        <Link to={`/consumer-portal?pid=${qrResult.product_id}`} className="font-body text-xs underline text-secondary/70">
                          View consumer page
                        </Link>
                        <a href={qrResult.qr_code} download={`product-${qrResult.product_id}.png`} className="ml-4 inline-flex items-center gap-1 font-body text-xs underline text-secondary/70">
                          <Download size={11} /> Download QR
                        </a>
                      </div>
                    </div>
                  )}
                  {!qrResult && d.product_id && (
                    <div className="mt-4 pt-4 border-t border-secondary/5">
                      <Link to={`/consumer-portal?pid=${d.product_id}`} className="font-body text-xs underline text-secondary/70">
                        View consumer page for {d.product_name || d.product_id}
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleDeliveryQrScan} title="Scan Collector's Delivery QR" />
      <Footer />
    </div>
  )
}