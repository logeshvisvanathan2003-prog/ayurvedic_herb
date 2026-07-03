import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, Shield, Microscope, FileCheck, CheckCircle, Globe,
  QrCode, Download, RefreshCw, ChevronDown, AlertCircle, Loader2,
  CheckCircle2, XCircle, Clock, ArrowRight
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

/* ─── types ────────────────────────────────────────────────────────────────── */
interface BatchRow {
  batch_id: string; herb_species: string; quantity_kg: number
  harvest_date: string; status: string; farmer_name: string
  lab_status: string | null; drying_method: string | null; product_id: string | null
}

interface QRResult { product_id: string; qr_code: string; scan_url: string; message: string }

const TESTS = [
  { icon: FlaskConical, title: 'Moisture Analysis',    col: 'bg-primary' },
  { icon: Shield,       title: 'Pesticide Residue',    col: 'bg-gold' },
  { icon: Microscope,   title: 'DNA Authentication',   col: 'bg-secondary' },
  { icon: FileCheck,    title: 'Heavy Metal Testing',  col: 'bg-primary' },
  { icon: CheckCircle,  title: 'Microbial Count',      col: 'bg-gold' },
  { icon: Globe,        title: 'Quality Certification',col: 'bg-secondary' },
]

/* ─── Field wrapper — OUTSIDE main component so identity stays stable ───────*/
const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="form-label">{label}</label>{children}</div>
)

function LabStatusBadge({ s }: { s: string | null }) {
  if (!s) return <span className="badge badge-gray">Not Tested</span>
  const map: Record<string, string> = { approved: 'badge-green', rejected: 'badge-red', pending: 'badge-gold', testing: 'badge-gray' }
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>
}

/* ─── Pipeline banner ────────────────────────────────────────────────────────*/
function PipelineBanner({ active }: { active: number }) {
  const steps = ['Farmer Registers', 'Processing', 'Lab Testing', 'QR Generation', 'Consumer Scan']
  return (
    <div className="bg-secondary/5 border border-secondary/10 px-6 py-4 mb-8 overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-heading text-[0.62rem] uppercase tracking-widest
              ${i === active ? 'bg-primary text-white shadow-[0_4px_16px_rgba(74,124,89,0.35)]' : i < active ? 'text-primary' : 'text-secondary/35'}`}>
              {i < active ? <CheckCircle2 size={12} /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[0.5rem]">{i + 1}</span>}
              {s}
            </div>
            {i < steps.length - 1 && <ArrowRight size={14} className={i < active ? 'text-primary mx-1' : 'text-secondary/20 mx-1'} />}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────────────────*/
export default function LaboratoryTestingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, userRole } = useAuthStore()

  /* batch list */
  const [batches,      setBatches]      = useState<BatchRow[]>([])
  const [loadingBatch, setLoadingBatch] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null)

  /* lab test form */
  const [form, setForm] = useState({
    moisture_content: '', pesticide_residue_result: '', dna_auth_result: '',
    heavy_metal_result: '', microbial_count: '', overall_status: 'pending',
    tested_by: '', notes: '',
  })
  const [submitting,   setSubmitting]   = useState(false)
  const [testMsg,      setTestMsg]      = useState('')
  const [testIsErr,    setTestIsErr]    = useState(false)

  /* QR generation */
  const [qrLoading,    setQrLoading]    = useState(false)
  const [qrResult,     setQrResult]     = useState<QRResult | null>(null)
  const [qrError,      setQrError]      = useState('')

  /* active pipeline step */
  const activeStep = selectedBatch
    ? (qrResult || selectedBatch.product_id ? 3 : selectedBatch.lab_status === 'approved' ? 3 : 2)
    : 2

  useEffect(() => {
    if (!isAuthenticated || (userRole !== 'lab' && userRole !== 'admin')) { navigate('/lab-login'); return }
    loadBatches()
  }, [isAuthenticated, userRole])

  const loadBatches = useCallback(async () => {
    setLoadingBatch(true)
    try {
      const { data } = await api.get('/lab/batches')
      setBatches(data.batches || [])
    } catch {}
    setLoadingBatch(false)
  }, [])

  /* select a batch → pre-fill known lab status */
  const selectBatch = (b: BatchRow) => {
    setSelectedBatch(b)
    setTestMsg(''); setQrError(''); setQrResult(null)
    if (b.lab_status) setForm(f => ({ ...f, overall_status: b.lab_status! }))
  }

  /* submit lab test */
  const handleTestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBatch) return
    setSubmitting(true); setTestMsg('')
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('batch_id', selectedBatch.batch_id)
      Object.entries(form).forEach(([k, v]) => v && fd.set(k, v))
      const { data } = await api.post('/lab/tests', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setTestMsg(data.message || 'Lab results saved!'); setTestIsErr(false)
      const updated = batches.map(b =>
        b.batch_id === selectedBatch.batch_id
          ? { ...b, lab_status: form.overall_status, status: form.overall_status === 'approved' ? 'approved' : form.overall_status === 'rejected' ? 'rejected' : 'testing' }
          : b
      )
      setBatches(updated)
      setSelectedBatch(b => b ? { ...b, lab_status: form.overall_status } : b)
    } catch (err: any) {
      setTestMsg(err.response?.data?.error || 'Failed to save.'); setTestIsErr(true)
    }
    setSubmitting(false)
  }

  /* generate QR */
  const handleGenerateQR = async () => {
    if (!selectedBatch) return
    setQrLoading(true); setQrError(''); setQrResult(null)
    try {
      const { data } = await api.post('/products/generate-qr', { batch_id: selectedBatch.batch_id })
      setQrResult({ product_id: data.product_id, qr_code: data.qr_code, scan_url: data.scan_url, message: data.message })
      setBatches(prev => prev.map(b => b.batch_id === selectedBatch.batch_id ? { ...b, product_id: data.product_id } : b))
      setSelectedBatch(b => b ? { ...b, product_id: data.product_id } : b)
    } catch (err: any) {
      setQrError(err.response?.data?.error || 'QR generation failed.')
    }
    setQrLoading(false)
  }

  const canGenerateQR = selectedBatch?.lab_status === 'approved' && !selectedBatch?.product_id && !qrResult

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-secondary py-16 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-[900px] mx-auto">
          <span className="inline-block px-4 py-1.5 bg-white/10 rounded-full font-heading text-[0.62rem] uppercase tracking-widest text-white/50 mb-4">For Quality Testing Laboratories</span>
          <h1 className="font-heading font-extrabold uppercase text-white leading-[0.88] tracking-tight mb-3"
            style={{ fontSize: 'clamp(2rem,6vw,4rem)' }}>
            Laboratory<br /><span className="text-gold">Testing &amp; QR</span><br />Dashboard
          </h1>
          <p className="font-body text-sm text-white/60 max-w-xl mx-auto leading-relaxed">
            Review batches → Submit test results → Approve → Generate QR code → Consumer verification
          </p>
        </motion.div>
      </section>

      <section className="py-12 px-4 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <PipelineBanner active={activeStep} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

            {/* ── LEFT: Batch list ────────────────────────────────────────── */}
            <div className="xl:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-extrabold text-xl uppercase">Batches</h2>
                <button onClick={loadBatches} className="btn-ghost flex items-center gap-1.5">
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {loadingBatch ? (
                <div className="flex items-center justify-center py-20 text-secondary/30">
                  <Loader2 size={28} className="animate-spin" />
                </div>
              ) : batches.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-secondary/10">
                  <FlaskConical size={36} className="mx-auto text-secondary/20 mb-3" />
                  <p className="font-body text-sm text-secondary/40">No batches available yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[680px] overflow-y-auto pr-1">
                  {batches.map((b) => (
                    <motion.div key={b.batch_id} whileHover={{ scale: 1.01 }}
                      onClick={() => selectBatch(b)}
                      className={`p-4 border cursor-pointer transition-all ${selectedBatch?.batch_id === b.batch_id
                        ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(74,124,89,0.2)]'
                        : 'border-secondary/8 bg-white hover:border-primary/30'}`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="font-mono text-[0.65rem] text-secondary/40 leading-tight">{b.batch_id}</span>
                        <LabStatusBadge s={b.lab_status} />
                      </div>
                      <p className="font-heading text-sm uppercase font-bold">{b.herb_species}</p>
                      <p className="font-body text-xs text-secondary/50 mt-0.5">{b.farmer_name || 'Unknown farmer'}</p>
                      {b.product_id && (
                        <p className="mt-1.5 font-mono text-[0.6rem] text-primary bg-primary/8 px-2 py-0.5 inline-block">
                          QR: {b.product_id}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Test form + QR ───────────────────────────────────── */}
            <div className="xl:col-span-2 flex flex-col gap-6">

              {!selectedBatch ? (
                <div className="flex-1 flex flex-col items-center justify-center py-24 border-2 border-dashed border-secondary/10 text-center">
                  <FlaskConical size={48} className="text-secondary/15 mb-4" />
                  <p className="font-heading text-lg uppercase text-secondary/30">Select a batch from the left</p>
                  <p className="font-body text-sm text-secondary/25 mt-2">to submit test results or generate QR</p>
                </div>
              ) : (
                <>
                  {/* Batch info strip */}
                  <div className="bg-white border border-secondary/8 px-6 py-4 flex flex-wrap gap-6 items-center">
                    <div>
                      <p className="form-label mb-0.5">Selected Batch</p>
                      <p className="font-mono text-xs text-primary font-bold">{selectedBatch.batch_id}</p>
                    </div>
                    <div>
                      <p className="form-label mb-0.5">Species</p>
                      <p className="font-body text-sm font-semibold">{selectedBatch.herb_species}</p>
                    </div>
                    <div>
                      <p className="form-label mb-0.5">Batch Status</p>
                      <span className={`badge ${
                        selectedBatch.status === 'approved' ? 'badge-green'
                        : selectedBatch.status === 'rejected' ? 'badge-red'
                        : 'badge-gold'}`}>{selectedBatch.status}</span>
                    </div>
                    <div>
                      <p className="form-label mb-0.5">Lab Result</p>
                      <LabStatusBadge s={selectedBatch.lab_status} />
                    </div>
                  </div>

                  {/* ── Lab test form ─────────────────────────────────────── */}
                  <div className="bg-white border border-secondary/8 p-7">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-secondary flex items-center justify-center">
                        <FlaskConical size={18} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg uppercase leading-none">Submit Lab Results</h3>
                        <p className="font-body text-xs text-secondary/50 mt-0.5">Fill test data and set overall approval status</p>
                      </div>
                    </div>

                    {testMsg && <div className={testIsErr ? 'form-error' : 'form-success'}>{testMsg}</div>}

                    <form onSubmit={handleTestSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <F label="Moisture Content (%)">
                        <input className="form-input" type="number" step="0.01" placeholder="e.g. 8.5"
                          value={form.moisture_content} onChange={e => setForm(f => ({ ...f, moisture_content: e.target.value }))} />
                      </F>
                      <F label="Microbial Count">
                        <input className="form-input" type="text" placeholder="e.g. 10³ CFU/g — Within Limits"
                          value={form.microbial_count} onChange={e => setForm(f => ({ ...f, microbial_count: e.target.value }))} />
                      </F>
                      <F label="Pesticide Residue Result">
                        <select className="form-input" value={form.pesticide_residue_result}
                          onChange={e => setForm(f => ({ ...f, pesticide_residue_result: e.target.value }))}>
                          <option value="">— Select —</option>
                          <option value="Pass — Within Limits">✓ Pass — Within Limits</option>
                          <option value="Fail — Exceeds Limits">✗ Fail — Exceeds Limits</option>
                          <option value="Not Detected">Not Detected</option>
                        </select>
                      </F>
                      <F label="DNA Authentication Result">
                        <select className="form-input" value={form.dna_auth_result}
                          onChange={e => setForm(f => ({ ...f, dna_auth_result: e.target.value }))}>
                          <option value="">— Select —</option>
                          <option value="Authentic — Species Verified">✓ Authentic — Species Verified</option>
                          <option value="Adulterated — Mismatch Found">✗ Adulterated — Mismatch Found</option>
                          <option value="Inconclusive">Inconclusive</option>
                        </select>
                      </F>
                      <F label="Heavy Metal Result">
                        <select className="form-input" value={form.heavy_metal_result}
                          onChange={e => setForm(f => ({ ...f, heavy_metal_result: e.target.value }))}>
                          <option value="">— Select —</option>
                          <option value="Pass — Within Safe Limits">✓ Pass — Within Safe Limits</option>
                          <option value="Fail — Elevated Levels">✗ Fail — Elevated Levels</option>
                        </select>
                      </F>
                      <F label="Tested By">
                        <input className="form-input" type="text" placeholder="Senior Analyst Name"
                          value={form.tested_by} onChange={e => setForm(f => ({ ...f, tested_by: e.target.value }))} />
                      </F>

                      {/* File uploads */}
                      <F label="Moisture Report (PDF/Image)">
                        <input className="form-input" type="file" name="moisture_report" accept=".pdf,.jpg,.png,.jpeg" />
                      </F>
                      <F label="Pesticide Report (PDF/Image)">
                        <input className="form-input" type="file" name="pesticide_report" accept=".pdf,.jpg,.png,.jpeg" />
                      </F>
                      <div className="md:col-span-2">
                        <F label="DNA Certificate (PDF/Image)">
                          <input className="form-input" type="file" name="dna_certificate" accept=".pdf,.jpg,.png,.jpeg" />
                        </F>
                      </div>
                      <div className="md:col-span-2">
                        <F label="Notes">
                          <textarea className="form-input" rows={2} placeholder="Additional observations…"
                            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            style={{ resize: 'vertical' }} />
                        </F>
                      </div>

                      {/* ── CRITICAL: Overall Status ───────────────────────── */}
                      <div className="md:col-span-2 p-5 border-2 border-dashed border-secondary/15 bg-secondary/2">
                        <p className="font-heading text-[0.65rem] uppercase tracking-widest text-secondary/60 mb-3 flex items-center gap-2">
                          <AlertCircle size={13} className="text-gold" />
                          Overall Batch Approval Status — this determines if QR can be generated
                        </p>
                        <div className="flex gap-3 flex-wrap">
                          {[
                            { value: 'pending',  label: 'Pending Review', Icon: Clock,        cls: 'border-secondary/20 text-secondary' },
                            { value: 'approved', label: 'Approved ✓',     Icon: CheckCircle2, cls: 'border-primary text-primary bg-primary/5' },
                            { value: 'rejected', label: 'Rejected ✗',     Icon: XCircle,      cls: 'border-red-400 text-red-600 bg-red-50' },
                          ].map(opt => (
                            <label key={opt.value}
                              className={`flex items-center gap-2.5 px-5 py-3 border-2 cursor-pointer transition-all font-heading text-sm uppercase tracking-wide
                                ${form.overall_status === opt.value ? opt.cls + ' shadow-md' : 'border-secondary/10 text-secondary/40 hover:border-secondary/25'}`}>
                              <input type="radio" name="overall_status_ui" value={opt.value}
                                checked={form.overall_status === opt.value}
                                onChange={() => setForm(f => ({ ...f, overall_status: opt.value }))}
                                className="sr-only" />
                              <opt.Icon size={15} />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          type="submit" disabled={submitting} className="btn-dark">
                          {submitting
                            ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                            : 'Save Lab Results'}
                        </motion.button>
                      </div>
                    </form>
                  </div>

                  {/* ── QR Generation ─────────────────────────────────────── */}
                  <div className={`bg-white border-2 p-7 transition-all ${
                    selectedBatch.lab_status === 'approved'
                      ? 'border-primary/40 bg-primary/2'
                      : 'border-secondary/10 opacity-60'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 flex items-center justify-center ${selectedBatch.lab_status === 'approved' ? 'bg-primary' : 'bg-secondary/20'}`}>
                        <QrCode size={18} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg uppercase leading-none">Generate QR Code</h3>
                        <p className="font-body text-xs text-secondary/50 mt-0.5">
                          {selectedBatch.lab_status === 'approved'
                            ? selectedBatch.product_id
                              ? `Already generated — Product ID: ${selectedBatch.product_id}`
                              : 'Batch is APPROVED — you can generate QR now'
                            : 'Only available after lab status is set to APPROVED'}
                        </p>
                      </div>
                    </div>

                    {selectedBatch.lab_status !== 'approved' && (
                      <div className="flex items-start gap-3 px-4 py-3 bg-secondary/5 border border-secondary/10 mb-4">
                        <AlertCircle size={15} className="text-gold mt-0.5 shrink-0" />
                        <p className="font-body text-xs text-secondary/60 leading-relaxed">
                          <strong>QR is locked.</strong> Set the Overall Batch Status to <span className="text-primary font-semibold">Approved</span> in the test form above, then save. Once approved, you can generate the QR code here.
                        </p>
                      </div>
                    )}

                    {qrError && <div className="form-error mb-4">{qrError}</div>}

                    <AnimatePresence>
                      {(qrResult || selectedBatch.product_id) ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col md:flex-row gap-6 items-center p-6 bg-primary/5 border border-primary/20">
                          {qrResult?.qr_code && (
                            <img src={qrResult.qr_code} alt="QR Code" className="w-36 h-36 shrink-0 border border-secondary/10" />
                          )}
                          <div className="flex-1 text-center md:text-left">
                            <p className="badge badge-green mb-3">QR Generated Successfully</p>
                            <p className="font-heading text-sm uppercase mb-1">Product ID</p>
                            <p className="font-mono text-xl font-bold text-primary mb-3">
                              {qrResult?.product_id || selectedBatch.product_id}
                            </p>
                            <p className="font-body text-xs text-secondary/50 mb-4">
                              Share this Product ID with consumers. They can enter it at the Consumer Portal to verify this product.
                            </p>
                            <div className="flex flex-wrap gap-3">
                              {qrResult?.qr_code && (
                                <a href={qrResult.qr_code} download={`${qrResult.product_id}.png`}>
                                  <motion.button whileHover={{ scale: 1.03 }} className="btn-primary flex items-center gap-2">
                                    <Download size={13} /> Download QR
                                  </motion.button>
                                </a>
                              )}
                              <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-white font-heading text-[0.65rem] uppercase tracking-widest">
                                Consumer URL: <span className="text-gold font-mono normal-case">/consumer-portal?pid={qrResult?.product_id || selectedBatch.product_id}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : canGenerateQR ? (
                        <motion.button
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={handleGenerateQR} disabled={qrLoading}
                          className="btn-primary flex items-center gap-2 text-base px-8 py-4"
                        >
                          {qrLoading
                            ? <><Loader2 size={16} className="animate-spin" /> Generating…</>
                            : <><QrCode size={18} /> Generate QR Code</>}
                        </motion.button>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* What we test */}
          <div className="mt-16">
            <h3 className="font-heading font-extrabold text-2xl uppercase mb-6">Testing Services</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {TESTS.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="card p-5 text-center">
                  <div className={`${t.col} w-10 h-10 flex items-center justify-center mx-auto mb-3`}>
                    <t.icon size={18} className="text-white" strokeWidth={1.5} />
                  </div>
                  <p className="font-heading text-[0.62rem] uppercase leading-tight">{t.title}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
