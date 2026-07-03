import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, MapPin, Camera, Wifi, Database, Cloud, Plus, X, RefreshCw, CheckCircle2, Clock, XCircle, QrCode } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

interface Batch {
  batch_id: string
  herb_species: string
  quantity_kg: number | null
  moisture_level: number | null
  harvest_date: string
  location_name: string | null
  farming_practices: string | null
  status: string
  lab_status: string | null
  product_id: string | null
  created_at: string
}

const STATUS_MAP: Record<string, { cls: string }> = {
  collected:  { cls: 'badge-gold'  },
  processing: { cls: 'badge-gray'  },
  testing:    { cls: 'badge-gray'  },
  approved:   { cls: 'badge-green' },
  rejected:   { cls: 'badge-red'   },
}

const features = [
  { icon: Leaf,     title: 'Herb Registration',  desc: 'Register harvested herbs with species, quantity, moisture level, and harvest date.',       col: 'bg-primary' },
  { icon: MapPin,   title: 'GPS Tracking',        desc: 'Automatic GPS coordinate capture with browser geolocation integration.',                   col: 'bg-gold'    },
  { icon: Camera,   title: 'Image Upload',        desc: 'Attach high-quality herb images for quality verification and visual documentation.',        col: 'bg-secondary' },
  { icon: Wifi,     title: 'Offline Capture',     desc: 'Work without internet. Data syncs automatically when connectivity is restored.',            col: 'bg-primary' },
  { icon: Database, title: 'Batch Management',    desc: 'Unique batch IDs generated automatically for seamless supply chain tracking.',              col: 'bg-gold'    },
  { icon: Cloud,    title: 'Auto Sync',           desc: 'Automatic synchronisation with backend servers ensures no data is ever lost.',              col: 'bg-secondary' },
]

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="form-label">{label}</label>{children}</div>
)

export default function FarmerPortalPage() {
  const navigate = useNavigate()
  const { isAuthenticated, userRole, userName } = useAuthStore()
  const [batches,    setBatches]    = useState<Batch[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message,    setMessage]    = useState('')
  const [isError,    setIsError]    = useState(false)
  const [form, setForm] = useState({
    herb_species: '', quantity_kg: '', moisture_level: '', harvest_date: '',
    location_name: '', farming_practices: '', gps_lat: '', gps_lng: '', notes: ''
  })

  useEffect(() => {
    if (!isAuthenticated || (userRole !== 'farmer' && userRole !== 'admin')) {
      navigate('/farmer-login'); return
    }
    loadBatches()
  }, [isAuthenticated, userRole])

  const loadBatches = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/farmer/batches')
      setBatches(data.batches || [])
    } catch {}
    setLoading(false)
  }

  const getGPS = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => setForm(f => ({ ...f, gps_lat: pos.coords.latitude.toFixed(6), gps_lng: pos.coords.longitude.toFixed(6) })),
      () => alert('Location access denied.')
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSubmitting(true); setMessage('')
    try {
      const fd = new FormData(e.currentTarget)
      const { data } = await api.post('/farmer/batches', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMessage(data.message); setIsError(false); setShowForm(false)
      setForm({ herb_species:'', quantity_kg:'', moisture_level:'', harvest_date:'', location_name:'', farming_practices:'', gps_lat:'', gps_lng:'', notes:'' })
      loadBatches()
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to submit.'); setIsError(true)
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-primary py-20 px-4 text-center">
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} className="max-w-[1000px] mx-auto">
          <span className="inline-block px-4 py-1.5 bg-white/15 rounded-full font-heading text-[0.62rem] uppercase tracking-widest text-white/70 mb-5">
            For Farmers & Wild Collectors
          </span>
          <h1 className="font-heading font-extrabold uppercase text-white leading-[0.88] tracking-tight mb-4"
            style={{ fontSize:'clamp(2.5rem,7vw,5rem)' }}>
            Farmer<br /><span className="text-gold">Collector</span><br />Dashboard
          </h1>
          <p className="font-body text-base text-white/80 leading-relaxed max-w-2xl mx-auto">
            {userName ? `Welcome, ${userName}. ` : ''}Register herb harvests and track them through the full supply chain.
          </p>
        </motion.div>
      </section>

      <section className="py-16 px-4 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-heading font-extrabold text-3xl uppercase">My Batches</h2>
              <p className="font-body text-sm text-secondary/50 mt-1">{batches.length} batch{batches.length !== 1 ? 'es' : ''} registered</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale:1.02 }} onClick={loadBatches} className="btn-ghost flex items-center gap-2">
                <RefreshCw size={14} /> Refresh
              </motion.button>
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={() => { setShowForm(!showForm); setMessage('') }}
                className={showForm ? 'btn-outline flex items-center gap-2' : 'btn-primary flex items-center gap-2'}>
                {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Register Batch</>}
              </motion.button>
            </div>
          </div>

          {message && <div className={isError ? 'form-error' : 'form-success'}>{message}</div>}

          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
                className="bg-white border border-secondary/8 p-8 mb-8">
                <h3 className="font-heading font-bold text-xl uppercase mb-6">Register New Herb Batch</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <F label="Herb Species *">
                    <input className="form-input" type="text" name="herb_species" placeholder="e.g. Ashwagandha, Tulsi, Brahmi"
                      value={form.herb_species} onChange={e => setForm(f => ({ ...f, herb_species: e.target.value }))} required />
                  </F>
                  <F label="Quantity (kg) *">
                    <input className="form-input" type="number" name="quantity_kg" step="0.01" min="0" placeholder="e.g. 50.00"
                      value={form.quantity_kg} onChange={e => setForm(f => ({ ...f, quantity_kg: e.target.value }))} required />
                  </F>
                  <F label="Initial Moisture Level (%)">
                    <input className="form-input" type="number" name="moisture_level" step="0.1" min="0" max="100" placeholder="e.g. 12.5"
                      value={form.moisture_level} onChange={e => setForm(f => ({ ...f, moisture_level: e.target.value }))} />
                  </F>
                  <F label="Harvest Date *">
                    <input className="form-input" type="date" name="harvest_date" value={form.harvest_date}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, harvest_date: e.target.value }))} required />
                  </F>
                  <div className="md:col-span-2">
                    <F label="Farm / Collection Location">
                      <div className="flex gap-3">
                        <input className="form-input flex-1" type="text" name="location_name" placeholder="Village, district, state"
                          value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))} />
                        <motion.button type="button" whileHover={{ scale:1.03 }} onClick={getGPS}
                          className="btn-outline flex items-center gap-2 shrink-0">
                          <MapPin size={14} /> Get GPS
                        </motion.button>
                      </div>
                      {form.gps_lat && (
                        <p className="mt-2 text-xs text-primary font-body bg-primary/8 px-3 py-2 inline-block">
                          📍 GPS: {form.gps_lat}, {form.gps_lng}
                        </p>
                      )}
                      <input type="hidden" name="gps_lat" value={form.gps_lat} />
                      <input type="hidden" name="gps_lng" value={form.gps_lng} />
                    </F>
                  </div>
                  <div className="md:col-span-2">
                    <F label="Farming Practices">
                      <select className="form-input" name="farming_practices" value={form.farming_practices}
                        onChange={e => setForm(f => ({ ...f, farming_practices: e.target.value }))}>
                        <option value="">— Select farming method —</option>
                        <option>Organic Certified</option>
                        <option>Natural Farming (No chemicals)</option>
                        <option>Traditional / Indigenous methods</option>
                        <option>Wild Collection</option>
                        <option>Conventional Farming</option>
                        <option>Integrated Pest Management</option>
                      </select>
                    </F>
                  </div>
                  <div className="md:col-span-2">
                    <F label="Herb Image (optional)">
                      <input className="form-input" type="file" name="image" accept="image/*" />
                    </F>
                  </div>
                  <div className="md:col-span-2">
                    <F label="Notes">
                      <textarea className="form-input" rows={3} name="notes" placeholder="Special observations, conditions, etc."
                        value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        style={{ resize:'vertical' }} />
                    </F>
                  </div>
                  <div className="md:col-span-2">
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      type="submit" disabled={submitting} className="btn-primary">
                      {submitting
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : 'Register Batch'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Batch table */}
          {loading ? (
            <div className="py-20 text-center text-secondary/40 font-body">Loading batches…</div>
          ) : batches.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-secondary/10">
              <Leaf size={40} className="mx-auto text-secondary/20 mb-4" />
              <p className="font-body text-sm text-secondary/40">No batches yet. Register your first herb collection above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white border border-secondary/7">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Batch ID</th><th>Species</th><th>Qty (kg)</th>
                    <th>Moisture</th><th>Harvest Date</th><th>Location</th>
                    <th>Practices</th><th>Status</th><th>Product</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.batch_id}>
                      <td className="font-mono text-xs text-primary font-bold">{b.batch_id}</td>
                      <td className="font-medium">{b.herb_species}</td>
                      <td>{b.quantity_kg ?? '—'}</td>
                      <td>{b.moisture_level ? `${b.moisture_level}%` : '—'}</td>
                      <td>{b.harvest_date ? new Date(b.harvest_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="text-secondary/60">{b.location_name || '—'}</td>
                      <td className="text-secondary/60 text-xs">{b.farming_practices || '—'}</td>
                      <td>
                        <span className={`badge ${(STATUS_MAP[b.status] || STATUS_MAP.collected).cls}`}>{b.status}</span>
                      </td>
                      <td>
                        {b.product_id
                          ? <span className="flex items-center gap-1 font-mono text-xs text-primary"><QrCode size={10}/>{b.product_id}</span>
                          : <span className="text-secondary/30 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {batches.length > 0 && (
            <div className="mt-5 px-5 py-4 bg-primary/5 border border-primary/15">
              <p className="font-body text-sm text-secondary/70">
                <strong>Next step:</strong> Share your <strong className="text-primary">Batch ID</strong> with the Processing Unit and Laboratory.
                Once lab-approved, a QR code is generated and your Product ID will appear in the table.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-4 md:px-12 bg-cream">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="font-heading font-extrabold text-3xl uppercase mb-10">Dashboard Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*0.08 }} whileHover={{ y:-4 }} className="card p-6">
                <div className={`${f.col} w-12 h-12 flex items-center justify-center mb-4 rounded-sm`}>
                  <f.icon size={22} className="text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-base uppercase mb-2">{f.title}</h3>
                <p className="font-body text-xs text-secondary/55 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
