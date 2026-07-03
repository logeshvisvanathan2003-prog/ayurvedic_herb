import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Wind, Database, Thermometer, Shield, ArrowRight, Loader2, CheckCircle2, RefreshCw } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

interface ProcessingRecord {
  id: string
  batch_id: string
  herb_species: string
  farmer_name: string | null
  drying_method: string | null
  drying_duration_hrs: number | null
  drying_temperature: number | null
  grinding_status: boolean
  grinding_particle_sz: string | null
  storage_temperature: number | null
  storage_humidity: number | null
  storage_location: string | null
  chain_of_custody: string | null
  notes: string | null
  processed_at: string
  batch_status: string
}

const STEPS = [
  { icon: Package,     title: 'Batch Reception',    desc: 'Enter batch ID to retrieve complete collection details from the farmer.',      col: 'bg-primary'   },
  { icon: Wind,        title: 'Drying Operations',  desc: 'Log drying method (sun/shade/mechanical) with temperature and duration.',      col: 'bg-gold'      },
  { icon: Database,    title: 'Grinding & Milling', desc: 'Document grinding status, particle size, and milling technique.',             col: 'bg-secondary' },
  { icon: Thermometer, title: 'Storage Management', desc: 'Log temperature, humidity, and location with continuous monitoring.',          col: 'bg-primary'   },
  { icon: Shield,      title: 'Chain of Custody',   desc: 'Complete custody documentation linking every step to the original batch ID.', col: 'bg-gold'      },
  { icon: ArrowRight,  title: 'Lab Handover',        desc: 'Digital handover of processed batch to approved laboratory.',                 col: 'bg-secondary' },
]

const TIMELINE = [
  'Batch Received from Farm',
  'Drying Process Initiated',
  'Grinding & Milling Completed',
  'Quality Pre-Check',
  'Storage & Preservation',
  'Lab Handover',
]

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="form-label">{label}</label>{children}</div>
}

export default function ProcessingUnitPage() {
  const { isAuthenticated, userRole } = useAuthStore()
  const canEdit = isAuthenticated && (userRole === 'admin' || userRole === 'lab')

  const [records,   setRecords]   = useState<ProcessingRecord[]>([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [batchId,   setBatchId]   = useState('')
  const [form, setForm] = useState({
    drying_method: '', drying_duration_hrs: '', drying_temperature: '',
    grinding_status: false, grinding_particle_sz: '',
    storage_temperature: '', storage_humidity: '', storage_location: '',
    chain_of_custody: '', notes: '',
  })
  const [loading,  setLoading]  = useState(false)
  const [message,  setMessage]  = useState('')
  const [isError,  setIsError]  = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'form' | 'records'>('form')

  const loadRecords = useCallback(async () => {
    if (!canEdit) return
    setLoadingRecs(true)
    try {
      const { data } = await api.get('/processing/list')
      setRecords(data.records || [])
    } catch {}
    setLoadingRecs(false)
  }, [canEdit])

  useEffect(() => { loadRecords() }, [loadRecords])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchId.trim()) { setMessage('Batch ID is required'); setIsError(true); return }
    setLoading(true); setMessage('')
    try {
      const payload = {
        batch_id: batchId,
        ...form,
        drying_duration_hrs:  form.drying_duration_hrs  ? Number(form.drying_duration_hrs)  : undefined,
        drying_temperature:   form.drying_temperature   ? Number(form.drying_temperature)   : undefined,
        storage_temperature:  form.storage_temperature  ? Number(form.storage_temperature)  : undefined,
        storage_humidity:     form.storage_humidity     ? Number(form.storage_humidity)     : undefined,
      }
      const { data } = await api.post('/processing', payload)
      setMessage(data.message || 'Processing record saved!'); setIsError(false)
      setShowForm(false)
      setBatchId('')
      setForm({ drying_method:'', drying_duration_hrs:'', drying_temperature:'', grinding_status:false,
        grinding_particle_sz:'', storage_temperature:'', storage_humidity:'', storage_location:'',
        chain_of_custody:'', notes:'' })
      loadRecords()
      setActiveTab('records')
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to save.'); setIsError(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gold py-16 px-4 text-center">
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} className="max-w-[1000px] mx-auto">
          <span className="inline-block px-4 py-1.5 bg-secondary/10 rounded-full font-heading text-[0.62rem] uppercase tracking-widest text-secondary/70 mb-4">
            For Processing Centers
          </span>
          <h1 className="font-heading font-extrabold uppercase text-secondary leading-[0.88] tracking-tight mb-3"
            style={{ fontSize:'clamp(2rem,6vw,4rem)' }}>
            Processing<br /><span className="text-primary">Unit</span><br />Dashboard
          </h1>
          <p className="font-body text-sm text-secondary/70 max-w-xl mx-auto leading-relaxed">
            Record post-harvest operations with complete batch traceability — drying, grinding, storage and lab handover.
          </p>
        </motion.div>
      </section>

      <section className="py-12 px-4 md:px-12 bg-background">
        <div className="max-w-[1400px] mx-auto">

          {canEdit ? (
            <div className="mb-12">
              {/* Tab buttons */}
              <div className="flex items-center gap-4 mb-6 border-b border-secondary/10">
                {(['form', 'records'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`pb-3 font-heading text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                      activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-secondary/40 hover:text-secondary'}`}>
                    {tab === 'form' ? 'Log Record' : `View Records (${records.length})`}
                  </button>
                ))}
                <button onClick={loadRecords} className="ml-auto btn-ghost flex items-center gap-1.5 pb-3">
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {message && <div className={`mb-4 ${isError ? 'form-error' : 'form-success'}`}>{message}</div>}

              {/* Form tab */}
              {activeTab === 'form' && (
                <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-heading font-extrabold text-2xl uppercase">Log Processing Record</h2>
                      <p className="font-body text-sm text-secondary/50 mt-1">Enter batch ID and fill processing details.</p>
                    </div>
                    <motion.button whileHover={{ scale:1.02 }} onClick={() => setShowForm(s => !s)}
                      className={showForm ? 'btn-outline' : 'btn-primary'}>
                      {showForm ? 'Collapse Form' : 'Open Form'}
                    </motion.button>
                  </div>

                  {showForm && (
                    <motion.div initial={{ opacity:0, y:-15 }} animate={{ opacity:1, y:0 }}
                      className="bg-white border border-secondary/8 p-8">
                      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2 p-4 bg-primary/5 border border-primary/15">
                          <F label="Batch ID * (from Farmer Portal)">
                            <input className="form-input font-mono" type="text"
                              placeholder="BATCH-YYYYMMDD-XXXXXXXX"
                              value={batchId} onChange={e => setBatchId(e.target.value)} required />
                          </F>
                          <p className="mt-1 font-body text-xs text-secondary/40">
                            Enter the exact Batch ID provided by the farmer.
                          </p>
                        </div>

                        <F label="Drying Method">
                          <select className="form-input" value={form.drying_method}
                            onChange={e => setForm(f => ({ ...f, drying_method: e.target.value }))}>
                            <option value="">— Select —</option>
                            <option>Sun Drying</option>
                            <option>Shade Drying</option>
                            <option>Mechanical / Oven Drying</option>
                            <option>Freeze Drying</option>
                            <option>Spray Drying</option>
                          </select>
                        </F>
                        <F label="Drying Duration (hours)">
                          <input className="form-input" type="number" min="0" placeholder="e.g. 48"
                            value={form.drying_duration_hrs}
                            onChange={e => setForm(f => ({ ...f, drying_duration_hrs: e.target.value }))} />
                        </F>
                        <F label="Drying Temperature (°C)">
                          <input className="form-input" type="number" step="0.1" placeholder="e.g. 40.0"
                            value={form.drying_temperature}
                            onChange={e => setForm(f => ({ ...f, drying_temperature: e.target.value }))} />
                        </F>
                        <F label="Grinding Particle Size">
                          <input className="form-input" type="text" placeholder="e.g. 200 mesh, 80 micron"
                            value={form.grinding_particle_sz}
                            onChange={e => setForm(f => ({ ...f, grinding_particle_sz: e.target.value }))} />
                        </F>
                        <div className="flex items-center gap-3 pt-4">
                          <input type="checkbox" id="grinding_status" checked={form.grinding_status}
                            onChange={e => setForm(f => ({ ...f, grinding_status: e.target.checked }))}
                            className="w-4 h-4 accent-primary" style={{ cursor: 'pointer' }} />
                          <label htmlFor="grinding_status" className="font-heading text-sm uppercase tracking-wide"
                            style={{ cursor: 'pointer' }}>
                            Grinding Completed
                          </label>
                        </div>
                        <F label="Storage Temperature (°C)">
                          <input className="form-input" type="number" step="0.1" placeholder="e.g. 20.0"
                            value={form.storage_temperature}
                            onChange={e => setForm(f => ({ ...f, storage_temperature: e.target.value }))} />
                        </F>
                        <F label="Storage Humidity (%)">
                          <input className="form-input" type="number" step="0.1" placeholder="e.g. 45.0"
                            value={form.storage_humidity}
                            onChange={e => setForm(f => ({ ...f, storage_humidity: e.target.value }))} />
                        </F>
                        <F label="Storage Location">
                          <input className="form-input" type="text" placeholder="Warehouse / Cold Storage name"
                            value={form.storage_location}
                            onChange={e => setForm(f => ({ ...f, storage_location: e.target.value }))} />
                        </F>
                        <div className="md:col-span-2">
                          <F label="Chain of Custody Notes">
                            <textarea className="form-input" rows={2}
                              placeholder="Document handover details, seal numbers, signatures…"
                              value={form.chain_of_custody}
                              onChange={e => setForm(f => ({ ...f, chain_of_custody: e.target.value }))}
                              style={{ resize:'vertical' }} />
                          </F>
                        </div>
                        <div className="md:col-span-2">
                          <F label="General Notes">
                            <textarea className="form-input" rows={2}
                              placeholder="Additional observations…"
                              value={form.notes}
                              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                              style={{ resize:'vertical' }} />
                          </F>
                        </div>
                        <div className="md:col-span-2">
                          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                            type="submit" disabled={loading} className="btn-dark">
                            {loading
                              ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                              : <><CheckCircle2 size={15} /> Save Processing Record</>}
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Records tab */}
              {activeTab === 'records' && (
                <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                  <h2 className="font-heading font-extrabold text-2xl uppercase mb-4">Processing Records</h2>
                  {loadingRecs ? (
                    <div className="py-16 text-center text-secondary/40"><Loader2 size={28} className="animate-spin mx-auto" /></div>
                  ) : records.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-secondary/10">
                      <Package size={36} className="mx-auto text-secondary/20 mb-3" />
                      <p className="font-body text-sm text-secondary/40">No processing records yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-white border border-secondary/7">
                      <table className="data-table w-full">
                        <thead>
                          <tr>
                            <th>Batch ID</th><th>Species</th><th>Farmer</th>
                            <th>Drying Method</th><th>Duration</th><th>Temp</th>
                            <th>Ground</th><th>Storage</th><th>Processed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map(r => (
                            <tr key={r.id}>
                              <td className="font-mono text-xs text-primary font-bold">{r.batch_id}</td>
                              <td className="font-medium">{r.herb_species}</td>
                              <td className="text-secondary/60">{r.farmer_name || '—'}</td>
                              <td>{r.drying_method || '—'}</td>
                              <td>{r.drying_duration_hrs ? `${r.drying_duration_hrs}h` : '—'}</td>
                              <td>{r.drying_temperature ? `${r.drying_temperature}°C` : '—'}</td>
                              <td>
                                <span className={`badge ${r.grinding_status ? 'badge-green' : 'badge-gray'}`}>
                                  {r.grinding_status ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="text-secondary/60 text-xs">{r.storage_location || '—'}</td>
                              <td className="text-secondary/50 text-xs">{new Date(r.processed_at).toLocaleDateString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          ) : (
            <div className="mb-10 px-5 py-4 bg-secondary/5 border border-secondary/10 flex items-center gap-3">
              <Shield size={16} className="text-gold shrink-0" />
              <p className="font-body text-sm text-secondary/60">
                Processing record entry is available for <strong>Admin</strong> and <strong>Lab</strong> roles.
                <a href="/lab-login" className="ml-2 text-primary hover:underline">Login here →</a>
              </p>
            </div>
          )}

          {/* Feature grid */}
          <h2 className="font-heading font-extrabold text-2xl uppercase mb-6">Core Functions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <motion.div key={i} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*0.08 }} whileHover={{ y:-4 }} className="card p-7">
                <div className={`${s.col} w-12 h-12 flex items-center justify-center mb-5`}>
                  <s.icon size={22} className="text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-base uppercase mb-2">{s.title}</h3>
                <p className="font-body text-xs text-secondary/55 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-12 bg-secondary">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-heading font-extrabold uppercase text-white leading-[0.88] tracking-tight mb-4"
              style={{ fontSize:'clamp(2rem,4vw,3rem)' }}>
              Processing<br /><span className="text-gold">Flow</span>
            </h2>
            <p className="font-body text-sm text-white/55 leading-relaxed mb-6">
              Every herb batch undergoes a rigorous multi-stage protocol ensuring quality retention and complete traceability from farm to laboratory.
            </p>
          </div>
          <div className="timeline">
            {TIMELINE.map((step, i) => (
              <div key={i} className="pb-7 relative pl-5">
                <div className="absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full border-2 border-cream"
                  style={{ background: i % 2 === 0 ? '#4a7c59' : '#b9b04a' }} />
                <span className="font-heading text-[0.58rem] uppercase tracking-widest text-white/30">
                  Stage {String(i + 1).padStart(2, '0')}
                </span>
                <p className="font-body text-sm text-white/75 mt-0.5 font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}