import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Clock, CheckCircle2, XCircle, FileText, Shield, Eye,
  RefreshCw, ChevronDown, ChevronUp, Leaf, FlaskConical, User,
  AlertCircle, TrendingUp, Database, QrCode, BarChart3, Hash,
  Truck, AlertTriangle, Link2, MapPin
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import JourneyMap, { JourneyPoint } from '@/components/JourneyMap'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

interface Registration {
  id: string; email: string; role: string; full_name: string; phone: string | null
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_at: string | null; rejection_note: string | null
  created_at: string; doc_count: number
  land_district?: string; land_state?: string; farming_type?: string
  lab_name?: string; lab_licence_no?: string; lab_accreditation?: string
  govt_id_type?: string; govt_id_number?: string
  approved_by_name?: string
}
interface Doc { doc_type: string; doc_label: string; file_url: string; uploaded_at: string; verified: boolean }
interface Stats { [key: string]: number }
interface AuditLog { id: string; sequence: number; event_type: string; actor_name: string; actor_email: string; entity_type: string; entity_id: string; payload: any; block_hash: string; created_at: string }
interface LogisticsLeg {
  id: string; batch_id: string; herb_species: string; from_stage: string; to_stage: string
  courier_name: string; vehicle_number: string; dispatched_at: string; delivered_at: string | null
  status: string; anomaly_flag: boolean; anomaly_reason: string | null
  dispatched_by_name: string; received_by_name: string | null
  pickup_gps_lat?: number; pickup_gps_lng?: number; delivery_gps_lat?: number; delivery_gps_lng?: number
  farm_gps_lat?: number; farm_gps_lng?: number; farm_location?: string
}

const ROLE_ICON: Record<string, React.FC<any>> = { farmer: Leaf, lab: FlaskConical, consumer: User }
const ROLE_COLOR: Record<string, string> = { farmer: 'text-primary bg-primary/10', lab: 'text-secondary bg-secondary/10', consumer: 'text-yellow-700 bg-yellow-50' }
const STATUS_BADGE: Record<string, string> = { pending: 'badge-gold', approved: 'badge-green', rejected: 'badge-red' }

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="form-label">{label}</label>{children}</div>
)

function RoleIcon({ role }: { role: string }) {
  const I = ROLE_ICON[role] || User
  return <I size={13} />
}

function StatCard({ icon: Icon, label, value, cls }: { icon: any; label: string; value: number; cls?: string }) {
  return (
    <div className={`bg-white border p-5 flex items-center gap-4 ${cls || 'border-secondary/8'}`}>
      <div className="w-10 h-10 bg-secondary/5 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-secondary/60" />
      </div>
      <div>
        <p className="font-heading text-[0.6rem] uppercase tracking-widest text-secondary/40">{label}</p>
        <p className="font-heading font-extrabold text-2xl">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const navigate   = useNavigate()
  const { isAuthenticated, userRole } = useAuthStore()

  const [tab, setTab]   = useState<'registrations' | 'audit' | 'logistics'>('registrations')
  const [statusF, setStatusF] = useState('pending')
  const [roleF,   setRoleF]   = useState('all')

  const [stats,    setStats]    = useState<Stats>({})
  const [regs,     setRegs]     = useState<Registration[]>([])
  const [loading,  setLoading]  = useState(true)

  const [selected, setSelected] = useState<Registration | null>(null)
  const [docs,     setDocs]     = useState<Doc[]>([])
  const [docsLoading, setDocsLoading] = useState(false)

  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg,     setActionMsg]     = useState('')
  const [actionErr,     setActionErr]     = useState('')
  const [rejectReason,  setRejectReason]  = useState('')
  const [showReject,    setShowReject]    = useState(false)

  const [auditLogs,   setAuditLogs]   = useState<AuditLog[]>([])
  const [auditTotal,  setAuditTotal]  = useState(0)
  const [auditPage,   setAuditPage]   = useState(1)
  const [chainValid,  setChainValid]  = useState<boolean | null>(null)

  const [logistics,      setLogistics]      = useState<LogisticsLeg[]>([])
  const [logisticsStats, setLogisticsStats] = useState<{ total: number; anomalies: number; in_transit: number }>({ total: 0, anomalies: 0, in_transit: 0 })
  const [logisticsLoading, setLogisticsLoading] = useState(false)
  const [expandedMapRow, setExpandedMapRow] = useState<string | null>(null)
  const [chainVerifyResult, setChainVerifyResult] = useState<Record<string, { message: string; in_sync?: boolean; on_chain: boolean }>>({})
  const [chainVerifyLoading, setChainVerifyLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || userRole !== 'admin') { navigate('/admin-login'); return }
    loadStats(); loadRegs()
  }, [isAuthenticated, userRole])

  useEffect(() => { loadRegs() }, [statusF, roleF])
  useEffect(() => { if (tab === 'audit') loadAudit() }, [tab, auditPage])
  useEffect(() => { if (tab === 'logistics') loadLogistics() }, [tab])

  const loadStats = async () => {
    try { const { data } = await api.get('/admin/stats'); setStats(data.stats) } catch {}
  }

  const loadRegs = useCallback(async () => {
    setLoading(true); setSelected(null); setDocs([])
    try {
      const { data } = await api.get(`/admin/registrations?status=${statusF}&role=${roleF}`)
      setRegs(data.registrations)
    } catch {}
    setLoading(false)
  }, [statusF, roleF])

  const selectReg = async (reg: Registration) => {
    setSelected(reg); setActionMsg(''); setActionErr(''); setShowReject(false); setRejectReason('')
    setDocsLoading(true); setDocs([])
    try {
      const { data } = await api.get(`/admin/registrations/${reg.id}/documents`)
      setDocs(data.documents)
    } catch {}
    setDocsLoading(false)
  }

  const approve = async () => {
    if (!selected) return
    setActionLoading(true); setActionMsg(''); setActionErr('')
    try {
      const { data } = await api.post(`/admin/registrations/${selected.id}/approve`, {})
      setActionMsg(data.message)
      setRegs(regs.map(r => r.id === selected.id ? { ...r, approval_status: 'approved' } : r))
      setSelected(s => s ? { ...s, approval_status: 'approved' } : s)
      loadStats()
    } catch (err: any) { setActionErr(err.response?.data?.error || 'Failed') }
    setActionLoading(false)
  }

  const reject = async () => {
    if (!selected || !rejectReason.trim()) { setActionErr('Rejection reason is required'); return }
    setActionLoading(true); setActionMsg(''); setActionErr('')
    try {
      const { data } = await api.post(`/admin/registrations/${selected.id}/reject`, { reason: rejectReason })
      setActionMsg(data.message)
      setRegs(regs.map(r => r.id === selected.id ? { ...r, approval_status: 'rejected', rejection_note: rejectReason } : r))
      setSelected(s => s ? { ...s, approval_status: 'rejected', rejection_note: rejectReason } : s)
      setShowReject(false); loadStats()
    } catch (err: any) { setActionErr(err.response?.data?.error || 'Failed') }
    setActionLoading(false)
  }

  const loadAudit = async () => {
    try {
      const { data } = await api.get(`/admin/audit-log?page=${auditPage}&per_page=30`)
      setAuditLogs(data.logs); setAuditTotal(data.total)
    } catch {}
  }

  const loadLogistics = async () => {
    setLogisticsLoading(true)
    try {
      const { data } = await api.get('/admin/logistics')
      setLogistics(data.transfers || [])
      setLogisticsStats({ total: data.total || 0, anomalies: data.anomalies || 0, in_transit: data.in_transit || 0 })
    } catch {}
    setLogisticsLoading(false)
  }

  const verifyOnChain = async (batchId: string) => {
    setChainVerifyLoading(batchId)
    try {
      const { data } = await api.get(`/admin/logistics/${batchId}/chain-verify`)
      setChainVerifyResult(prev => ({ ...prev, [batchId]: data }))
    } catch {
      setChainVerifyResult(prev => ({ ...prev, [batchId]: { message: 'Verification request failed.', on_chain: false } }))
    }
    setChainVerifyLoading(null)
  }

  const resetBatchLogistics = async (batchId: string) => {
    if (!confirm(`Clear all logistics history for ${batchId}? This lets it be dispatched again (testing use only).`)) return
    try {
      await api.delete(`/admin/logistics/${batchId}`)
      loadLogistics()
    } catch {}
  }

  const verifyChain = async () => {
    try {
      const { data } = await api.get('/admin/audit-log/verify')
      setChainValid(data.chain_valid)
      alert(data.message)
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-secondary py-14 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-white/10 rounded-full font-heading text-[0.62rem] uppercase tracking-widest text-white/50 mb-4">
            Administrator Panel
          </span>
          <h1 className="font-heading font-extrabold uppercase text-white leading-[0.88] tracking-tight"
            style={{ fontSize: 'clamp(2rem,5vw,3.5rem)' }}>
            Admin<br /><span className="text-gold">Control Dashboard</span>
          </h1>
        </motion.div>
      </section>

      <section className="py-10 px-4 md:px-12">
        <div className="max-w-[1400px] mx-auto">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <StatCard icon={Clock}       label="Pending"   value={stats.pending_registrations} cls="border-yellow-200 bg-yellow-50/50" />
            <StatCard icon={CheckCircle2} label="Approved"  value={stats.approved_users}        cls="border-primary/20" />
            <StatCard icon={XCircle}     label="Rejected"  value={stats.rejected_users}         cls="border-red-100" />
            <StatCard icon={Leaf}        label="Pending Farmers" value={stats.pending_farmers}       />
            <StatCard icon={FlaskConical} label="Pending Labs"   value={stats.pending_labs}          />
            <StatCard icon={User}        label="Pending Consumers" value={stats.pending_consumers}   />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard icon={Database}   label="Total Batches"   value={stats.total_batches}       />
            <StatCard icon={CheckCircle2} label="Lab Approved" value={stats.approved_batches}    />
            <StatCard icon={QrCode}     label="Products"        value={stats.total_products}      />
            <StatCard icon={Hash}       label="Audit Events"    value={stats.total_audit_events}  />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-secondary/10 mb-6">
            {(['registrations', 'audit', 'logistics'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2.5 font-heading text-xs uppercase tracking-widest transition-all
                  ${tab === t ? 'border-b-2 border-primary text-primary' : 'text-secondary/40 hover:text-secondary'}`}>
                {t === 'registrations' ? 'Registration Approvals' : t === 'audit' ? 'Blockchain Audit Log' : 'Logistics'}
              </button>
            ))}
          </div>

          {/* ── REGISTRATIONS TAB ── */}
          {tab === 'registrations' && (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

              {/* Left: List */}
              <div className="xl:col-span-2">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <select className="form-input flex-1" value={statusF} onChange={e => setStatusF(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select className="form-input flex-1" value={roleF} onChange={e => setRoleF(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="farmer">Farmers</option>
                    <option value="lab">Laboratories</option>
                    <option value="consumer">Consumers</option>
                  </select>
                  <button onClick={loadRegs} className="btn-ghost p-2"><RefreshCw size={14} /></button>
                </div>

                {loading ? (
                  <div className="py-20 text-center text-secondary/30">Loading…</div>
                ) : regs.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-secondary/10">
                    <Users size={36} className="mx-auto text-secondary/20 mb-3" />
                    <p className="font-body text-sm text-secondary/40">No registrations found</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[680px] overflow-y-auto pr-1">
                    {regs.map(r => {
                      const I = ROLE_ICON[r.role] || User
                      return (
                        <motion.div key={r.id} whileHover={{ scale: 1.01 }}
                          onClick={() => selectReg(r)}
                          className={`p-4 border cursor-pointer transition-all ${selected?.id === r.id
                            ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(74,124,89,0.2)]'
                            : 'border-secondary/8 bg-white hover:border-primary/30'}`}>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-heading uppercase ${ROLE_COLOR[r.role] || 'bg-secondary/10 text-secondary'}`}>
                                <I size={10} />{r.role}
                              </span>
                              {r.doc_count > 0 && (
                                <span className="text-[0.6rem] text-secondary/40 font-body">
                                  {r.doc_count} doc{r.doc_count > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <span className={`badge ${STATUS_BADGE[r.approval_status] || 'badge-gray'} text-xs`}>
                              {r.approval_status}
                            </span>
                          </div>
                          <p className="font-heading text-sm uppercase font-bold">{r.full_name}</p>
                          <p className="font-body text-xs text-secondary/50">{r.email}</p>
                          <p className="font-body text-xs text-secondary/35 mt-1">
                            {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Right: Detail */}
              <div className="xl:col-span-3">
                {!selected ? (
                  <div className="flex items-center justify-center h-96 border-2 border-dashed border-secondary/10">
                    <div className="text-center">
                      <Users size={48} className="mx-auto text-secondary/15 mb-3" />
                      <p className="font-heading text-lg uppercase text-secondary/25">Select a registration</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="bg-white border border-secondary/8 px-6 py-5 flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${ROLE_COLOR[selected.role]}`}>
                        {(() => { const I = ROLE_ICON[selected.role] || User; return <I size={20} /> })()}
                      </div>
                      <div className="flex-1">
                        <h2 className="font-heading font-bold text-xl uppercase">{selected.full_name}</h2>
                        <p className="font-body text-sm text-secondary/50">{selected.email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`badge ${STATUS_BADGE[selected.approval_status]}`}>{selected.approval_status}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-heading uppercase ${ROLE_COLOR[selected.role]}`}>
                            {(() => { const I = ROLE_ICON[selected.role] || User; return <I size={10} /> })()}
                            {selected.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Profile details */}
                    <div className="bg-white border border-secondary/8 p-6">
                      <h3 className="font-heading font-bold text-sm uppercase mb-4">Registration Details</h3>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        {[
                          ['Phone', selected.phone || '—'],
                          ['Applied', new Date(selected.created_at).toLocaleDateString('en-IN')],
                          ...(selected.role === 'farmer' ? [
                            ['Land District', selected.land_district || '—'],
                            ['Land State',    selected.land_state    || '—'],
                            ['Farming Type',  selected.farming_type  || '—'],
                          ] : []),
                          ...(selected.role === 'lab' ? [
                            ['Lab Name',        selected.lab_name         || '—'],
                            ['Licence No.',     selected.lab_licence_no   || '—'],
                            ['Accreditation',   selected.lab_accreditation || '—'],
                          ] : []),
                          ...(selected.role === 'consumer' ? [
                            ['ID Type',   selected.govt_id_type   || '—'],
                            ['ID Number', selected.govt_id_number || '—'],
                          ] : []),
                          ...(selected.approved_by_name ? [
                            ['Reviewed by', selected.approved_by_name],
                          ] : []),
                          ...(selected.rejection_note ? [
                            ['Rejection reason', selected.rejection_note],
                          ] : []),
                        ].map(([l, v]) => (
                          <div key={l}>
                            <p className="font-heading text-[0.6rem] uppercase tracking-widest text-secondary/35">{l}</p>
                            <p className="font-body text-sm text-secondary">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-white border border-secondary/8 p-6">
                      <h3 className="font-heading font-bold text-sm uppercase mb-4 flex items-center gap-2">
                        <FileText size={14} /> Submitted Documents
                      </h3>
                      {docsLoading ? (
                        <div className="text-secondary/30 text-sm font-body">Loading documents…</div>
                      ) : docs.length === 0 ? (
                        <div className="flex items-center gap-2 text-secondary/40 text-sm">
                          <AlertCircle size={14} /> No documents uploaded
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {docs.map((doc, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3 border border-secondary/8 hover:border-primary/20 transition-all">
                              <div className="flex items-center gap-3">
                                <FileText size={14} className="text-secondary/40" />
                                <div>
                                  <p className="font-body text-sm font-medium">{doc.doc_label}</p>
                                  <p className="font-body text-xs text-secondary/40">{new Date(doc.uploaded_at).toLocaleDateString('en-IN')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {doc.verified
                                  ? <span className="badge badge-green text-xs">Verified</span>
                                  : <span className="badge badge-gray text-xs">Pending</span>}
                                <a href={`http://localhost:5000${doc.file_url}`} target="_blank" rel="noopener noreferrer"
                                  className="btn-ghost flex items-center gap-1 text-xs py-1 px-2">
                                  <Eye size={12} /> View
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action messages */}
                    {actionMsg && <div className="form-success">{actionMsg}</div>}
                    {actionErr && <div className="form-error">{actionErr}</div>}

                    {/* Action buttons */}
                    {selected.approval_status === 'pending' && (
                      <div className="bg-white border border-secondary/8 p-6">
                        <h3 className="font-heading font-bold text-sm uppercase mb-4">Take Action</h3>
                        <div className="flex gap-3 flex-wrap">
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={approve} disabled={actionLoading}
                            className="btn-primary flex items-center gap-2">
                            {actionLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              : <><CheckCircle2 size={14} /> Approve Registration</>}
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setShowReject(!showReject)}
                            className="btn-outline flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50">
                            <XCircle size={14} /> Reject
                          </motion.button>
                        </div>
                        <AnimatePresence>
                          {showReject && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                              <F label="Rejection Reason *">
                                <textarea className="form-input" rows={3}
                                  placeholder="Explain why this registration is being rejected…"
                                  value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                  style={{ resize: 'vertical' }} />
                              </F>
                              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                onClick={reject} disabled={actionLoading}
                                className="btn-dark bg-red-600 hover:bg-red-700 flex items-center gap-2 mt-3">
                                <XCircle size={14} /> Confirm Rejection
                              </motion.button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                    {selected.approval_status !== 'pending' && (
                      <div className={`px-5 py-4 border ${selected.approval_status === 'approved' ? 'bg-primary/5 border-primary/15' : 'bg-red-50 border-red-100'}`}>
                        <p className="font-body text-sm">
                          {selected.approval_status === 'approved'
                            ? `✓ Approved on ${new Date(selected.approved_at!).toLocaleDateString('en-IN')}`
                            : `✗ Rejected — "${selected.rejection_note}"`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AUDIT LOG TAB ── */}
          {tab === 'audit' && (
            <div>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h2 className="font-heading font-bold text-xl uppercase">Blockchain Audit Log</h2>
                  <p className="font-body text-sm text-secondary/50">{auditTotal} immutable events recorded</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={verifyChain}
                    className={`btn-outline flex items-center gap-2 ${chainValid === true ? 'border-primary text-primary' : chainValid === false ? 'border-red-400 text-red-500' : ''}`}>
                    <Shield size={14} /> Verify Chain Integrity
                  </button>
                  <button onClick={loadAudit} className="btn-ghost flex items-center gap-2">
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 px-5 py-4 bg-primary/5 border border-primary/15 mb-5">
                <Shield size={15} className="text-primary mt-0.5 shrink-0" />
                <p className="font-body text-sm text-secondary/70">
                  Every action in the system is recorded as a cryptographically chained block. Each block references the hash of the previous block, making it impossible to tamper with historical records without detection.
                </p>
              </div>

              <div className="overflow-x-auto bg-white border border-secondary/7">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Block #</th><th>Event</th><th>Actor</th>
                      <th>Entity</th><th>Timestamp</th><th>Block Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id}>
                        <td className="font-mono text-xs text-secondary/40">#{log.sequence}</td>
                        <td>
                          <span className={`badge text-xs ${
                            log.event_type.includes('APPROVED') ? 'badge-green' :
                            log.event_type.includes('REJECTED') ? 'badge-red' :
                            'badge-gray'}`}>
                            {log.event_type.replace(/_/g,' ')}
                          </span>
                        </td>
                        <td className="text-xs">
                          <p className="font-medium">{log.actor_name || '—'}</p>
                          <p className="text-secondary/40">{log.actor_email || log.actor_id?.slice(0,8)}</p>
                        </td>
                        <td className="font-mono text-xs text-secondary/60">{log.entity_type}/{log.entity_id?.slice(0,12)}…</td>
                        <td className="text-xs text-secondary/60">{new Date(log.created_at).toLocaleString('en-IN')}</td>
                        <td className="font-mono text-[0.6rem] text-secondary/30" title={log.block_hash}>
                          {log.block_hash?.slice(0,16)}…
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {auditTotal > 30 && (
                <div className="flex items-center justify-center gap-3 mt-5">
                  <button onClick={() => setAuditPage(p => Math.max(1, p-1))} disabled={auditPage === 1}
                    className="btn-ghost text-sm">← Prev</button>
                  <span className="font-body text-sm text-secondary/50">
                    Page {auditPage} of {Math.ceil(auditTotal / 30)}
                  </span>
                  <button onClick={() => setAuditPage(p => p+1)} disabled={auditPage >= Math.ceil(auditTotal/30)}
                    className="btn-ghost text-sm">Next →</button>
                </div>
              )}
            </div>
          )}

          {/* ── LOGISTICS TAB ── */}
          {tab === 'logistics' && (
            <div>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h2 className="font-heading font-bold text-xl uppercase">Logistics Activity</h2>
                  <p className="font-body text-sm text-secondary/50">All chain-of-custody handoffs across every batch, most recent first</p>
                </div>
                <button onClick={loadLogistics} className="btn-ghost flex items-center gap-2">
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <StatCard icon={Truck}         label="Total Transfers" value={logisticsStats.total} />
                <StatCard icon={Clock}         label="In Transit"      value={logisticsStats.in_transit} />
                <StatCard icon={AlertTriangle} label="Flagged Anomalies" value={logisticsStats.anomalies} cls={logisticsStats.anomalies > 0 ? 'border-red-200 bg-red-50/50' : ''} />
              </div>

              {logisticsLoading ? (
                <p className="font-body text-sm text-secondary/40 text-center py-10">Loading…</p>
              ) : logistics.length === 0 ? (
                <div className="text-center py-16 bg-white border border-secondary/7">
                  <Truck size={28} className="mx-auto text-secondary/20 mb-3" />
                  <p className="font-body text-sm text-secondary/50">No shipments dispatched yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white border border-secondary/7">
                  <table className="data-table w-full">
                    <thead>
                      <tr>
                        <th>Batch</th><th>Route</th><th>Courier</th>
                        <th>Dispatched</th><th>Delivered</th><th>Status</th><th>Blockchain</th><th>Map</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {logistics.map(leg => {
                        const points: JourneyPoint[] = []
                        if (leg.farm_gps_lat && leg.farm_gps_lng) {
                          points.push({ lat: leg.farm_gps_lat, lng: leg.farm_gps_lng, label: `Origin — ${leg.farm_location || 'Farm'}`, kind: 'farm' })
                        }
                        if (leg.pickup_gps_lat && leg.pickup_gps_lng) {
                          points.push({ lat: leg.pickup_gps_lat, lng: leg.pickup_gps_lng, label: `Picked up — ${leg.from_stage || 'origin'}`, sublabel: `${leg.courier_name || 'Courier'} · ${new Date(leg.dispatched_at).toLocaleString('en-IN')}`, kind: leg.status === 'delivered' ? 'waypoint' : 'current' })
                        }
                        if (leg.delivery_gps_lat && leg.delivery_gps_lng) {
                          points.push({ lat: leg.delivery_gps_lat, lng: leg.delivery_gps_lng, label: `Delivered — ${leg.to_stage}`, sublabel: leg.received_by_name ? `Received by ${leg.received_by_name}` : undefined, kind: 'current' })
                        }
                        return (
                        <>
                        <tr key={leg.id}>
                          <td className="text-xs">
                            <p className="font-mono font-medium">{leg.batch_id}</p>
                            <p className="text-secondary/40">{leg.herb_species || '—'}</p>
                          </td>
                          <td className="text-xs">
                            <span className="inline-flex items-center gap-1"><Link2 size={11} className="text-secondary/30" />{leg.from_stage || '—'} → {leg.to_stage}</span>
                          </td>
                          <td className="text-xs">
                            <p>{leg.courier_name || '—'}</p>
                            <p className="text-secondary/40">{leg.vehicle_number || ''}</p>
                          </td>
                          <td className="text-xs text-secondary/60">{new Date(leg.dispatched_at).toLocaleString('en-IN')}</td>
                          <td className="text-xs text-secondary/60">{leg.delivered_at ? new Date(leg.delivered_at).toLocaleString('en-IN') : '—'}</td>
                          <td>
                            {leg.anomaly_flag ? (
                              <span className="badge badge-red gap-1" title={leg.anomaly_reason || ''}><AlertTriangle size={10} /> Flagged</span>
                            ) : leg.status === 'delivered' ? (
                              <span className="badge badge-green gap-1"><CheckCircle2 size={10} /> Delivered</span>
                            ) : (
                              <span className="badge badge-gold gap-1"><Clock size={10} /> In Transit</span>
                            )}
                          </td>
                          <td className="text-xs min-w-[180px]">
                            {chainVerifyResult[leg.batch_id] ? (
                              <span className={`flex items-center gap-1 ${chainVerifyResult[leg.batch_id].on_chain && chainVerifyResult[leg.batch_id].in_sync !== false ? 'text-primary' : 'text-red-500'}`}>
                                <Shield size={11} /> {chainVerifyResult[leg.batch_id].message}
                              </span>
                            ) : (
                              <button onClick={() => verifyOnChain(leg.batch_id)} disabled={chainVerifyLoading === leg.batch_id}
                                className="btn-ghost text-[0.65rem] flex items-center gap-1 px-2 py-1">
                                <Shield size={11} /> {chainVerifyLoading === leg.batch_id ? 'Checking…' : 'Verify on Chain'}
                              </button>
                            )}
                          </td>
                          <td>
                            <button onClick={() => setExpandedMapRow(expandedMapRow === leg.id ? null : leg.id)}
                              disabled={points.length === 0}
                              className="btn-ghost text-[0.65rem] flex items-center gap-1 px-2 py-1 disabled:opacity-30">
                              <MapPin size={11} /> {expandedMapRow === leg.id ? 'Hide' : 'View'}
                            </button>
                          </td>
                          <td>
                            <button onClick={() => resetBatchLogistics(leg.batch_id)}
                              title="Clear this batch's logistics history (testing only)"
                              className="text-[0.65rem] text-secondary/30 hover:text-red-500 transition-colors">
                              Reset
                            </button>
                          </td>
                        </tr>
                        {expandedMapRow === leg.id && (
                          <tr>
                            <td colSpan={9} className="p-0 border-t-0">
                              <JourneyMap points={points} />
                            </td>
                          </tr>
                        )}
                        </>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}