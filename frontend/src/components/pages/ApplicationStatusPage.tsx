import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, CheckCircle2, XCircle, FileText, Shield, Search,
  ChevronDown, ChevronUp, RefreshCw, ArrowRight, Leaf, FlaskConical, User
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import api from '@/lib/api'

interface ApplicationData {
  id: string; email: string; role: string; full_name: string
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_at: string | null; rejection_note: string | null
  created_at: string; phone: string | null
  land_district?: string; land_state?: string
  lab_name?: string; lab_licence_no?: string; govt_id_type?: string; farming_type?: string
}
interface Document {
  doc_type: string; doc_label: string; uploaded_at: string; verified: boolean
}
interface AuditEntry {
  event_type: string; payload: any; created_at: string; block_hash: string
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  USER_REGISTERED:        { label: 'Application Submitted',   color: 'text-secondary'  },
  REGISTRATION_APPROVED:  { label: 'Application Approved ✓',  color: 'text-primary'    },
  REGISTRATION_REJECTED:  { label: 'Application Rejected',    color: 'text-red-500'    },
}

const ROLE_ICONS: Record<string, React.FC<any>> = {
  farmer: Leaf, lab: FlaskConical, consumer: User,
}

export default function ApplicationStatusPage() {
  const [params] = useSearchParams()
  const [email, setEmail]   = useState(params.get('email') || '')
  const [data, setData]     = useState<{ application: ApplicationData; documents: Document[]; audit_trail: AuditEntry[]; status_info: { label: string; desc: string } } | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState('')
  const [showAudit, setShowAudit] = useState(false)
  const [queried, setQueried]   = useState(false)

  const checkStatus = async (emailToCheck?: string) => {
    const e = (emailToCheck || email).trim()
    if (!e) { setError('Please enter your email address'); return }
    setLoading(true); setError(''); setData(null)
    try {
      const { data: res } = await api.get(`/auth/application-status?email=${encodeURIComponent(e)}`)
      setData(res); setQueried(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch application status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.get('email')) checkStatus(params.get('email')!)
  }, [])

  const app = data?.application
  const status = app?.approval_status
  const RoleIcon = app ? (ROLE_ICONS[app.role] || User) : User

  const statusConfig = {
    pending: {
      icon: <Clock size={32} className="text-yellow-600" />,
      bg: 'bg-yellow-50 border-yellow-200',
      badgeCls: 'badge-gold',
      steps: [
        { label: 'Application Submitted', done: true },
        { label: 'Documents Uploaded',    done: (data?.documents.length || 0) > 0 },
        { label: 'Under Admin Review',    done: false, active: true },
        { label: 'Approval Decision',     done: false },
      ]
    },
    approved: {
      icon: <CheckCircle2 size={32} className="text-primary" />,
      bg: 'bg-primary/5 border-primary/20',
      badgeCls: 'badge-green',
      steps: [
        { label: 'Application Submitted', done: true },
        { label: 'Documents Uploaded',    done: true },
        { label: 'Admin Review Complete', done: true },
        { label: 'Account Activated ✓',  done: true },
      ]
    },
    rejected: {
      icon: <XCircle size={32} className="text-red-500" />,
      bg: 'bg-red-50 border-red-200',
      badgeCls: 'badge-red',
      steps: [
        { label: 'Application Submitted', done: true },
        { label: 'Documents Uploaded',    done: (data?.documents.length || 0) > 0 },
        { label: 'Admin Review Complete', done: true },
        { label: 'Application Rejected',  done: true, failed: true },
      ]
    }
  }

  const sc = status ? statusConfig[status] : null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-secondary py-16 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-white/10 rounded-full font-heading text-[0.62rem] uppercase tracking-widest text-white/50 mb-4">
            Registration Portal
          </span>
          <h1 className="font-heading font-extrabold uppercase text-white leading-[0.88] tracking-tight mb-3"
            style={{ fontSize: 'clamp(1.8rem,5vw,3rem)' }}>
            Application<br /><span className="text-gold">Status Tracker</span>
          </h1>
          <p className="font-body text-sm text-white/60 leading-relaxed">
            Track your registration application and see its progress in real time.
          </p>
        </motion.div>
      </section>

      <section className="py-12 px-4 md:px-12">
        <div className="max-w-3xl mx-auto">

          {/* Search box */}
          <div className="bg-white border border-secondary/10 p-6 mb-8">
            <h2 className="font-heading font-bold text-lg uppercase mb-4">Check Your Status</h2>
            <div className="flex gap-3">
              <input className="form-input flex-1" type="email"
                placeholder="Enter your registration email address"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkStatus()} />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => checkStatus()} disabled={loading}
                className="btn-dark flex items-center gap-2 shrink-0">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Search size={14} /> Check</>}
              </motion.button>
            </div>
            {error && <div className="form-error mt-3">{error}</div>}
          </div>

          <AnimatePresence>
            {data && app && sc && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                {/* Status banner */}
                <div className={`border p-6 ${sc.bg}`}>
                  <div className="flex items-start gap-5">
                    <div className="shrink-0">{sc.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`badge ${sc.badgeCls} text-sm`}>{data.status_info?.label}</span>
                        <span className="font-heading text-xs uppercase tracking-widest text-secondary/40">
                          Submitted {new Date(app.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                        </span>
                      </div>
                      <p className="font-body text-sm text-secondary/70 leading-relaxed">{data.status_info?.desc}</p>
                      {status === 'rejected' && app.rejection_note && (
                        <div className="mt-3 px-4 py-3 bg-red-100 border border-red-200">
                          <p className="font-heading text-xs uppercase tracking-widest text-red-600 mb-1">Rejection Reason</p>
                          <p className="font-body text-sm text-red-700">{app.rejection_note}</p>
                        </div>
                      )}
                      {status === 'approved' && (
                        <Link to={`/${app.role}-login`}>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            className="btn-primary flex items-center gap-2 mt-4">
                            Login to {app.role.charAt(0).toUpperCase() + app.role.slice(1)} Portal
                            <ArrowRight size={14} />
                          </motion.button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress steps */}
                <div className="bg-white border border-secondary/8 p-6">
                  <h3 className="font-heading font-bold text-sm uppercase mb-5">Application Progress</h3>
                  <div className="flex flex-col gap-0">
                    {sc.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                            ${(step as any).failed ? 'bg-red-100 text-red-600' :
                              step.done ? 'bg-primary text-white' :
                              (step as any).active ? 'bg-gold/20 border-2 border-gold text-yellow-700' :
                              'bg-secondary/8 text-secondary/30'}`}>
                            {(step as any).failed ? '✗' : step.done ? '✓' : i + 1}
                          </div>
                          {i < sc.steps.length - 1 && (
                            <div className={`w-0.5 h-8 ${step.done && !(step as any).failed ? 'bg-primary/30' : 'bg-secondary/10'}`} />
                          )}
                        </div>
                        <p className={`font-body text-sm ${
                          (step as any).failed ? 'text-red-500' :
                          step.done ? 'text-secondary font-medium' :
                          (step as any).active ? 'text-yellow-700 font-medium' :
                          'text-secondary/30'}`}>
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Applicant details */}
                <div className="bg-white border border-secondary/8 p-6">
                  <h3 className="font-heading font-bold text-sm uppercase mb-5 flex items-center gap-2">
                    <RoleIcon size={14} /> Applicant Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      ['Full Name', app.full_name],
                      ['Email', app.email],
                      ['Role', app.role.charAt(0).toUpperCase() + app.role.slice(1)],
                      ['Phone', app.phone || '—'],
                      ...(app.role === 'farmer' ? [
                        ['Land District', app.land_district || '—'],
                        ['Land State', app.land_state || '—'],
                        ['Farming Type', app.farming_type || '—'],
                      ] : []),
                      ...(app.role === 'lab' ? [
                        ['Lab Name', app.lab_name || '—'],
                        ['Licence No.', app.lab_licence_no || '—'],
                      ] : []),
                      ...(app.role === 'consumer' ? [
                        ['ID Type', app.govt_id_type || '—'],
                      ] : []),
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="font-heading text-[0.6rem] uppercase tracking-widest text-secondary/40">{label}</p>
                        <p className="font-body text-sm text-secondary font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents submitted */}
                <div className="bg-white border border-secondary/8 p-6">
                  <h3 className="font-heading font-bold text-sm uppercase mb-4 flex items-center gap-2">
                    <FileText size={14} /> Documents Submitted ({data.documents.length})
                  </h3>
                  {data.documents.length === 0 ? (
                    <p className="font-body text-sm text-secondary/40">No documents on file.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {data.documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 bg-secondary/3 border border-secondary/8">
                          <div className="flex items-center gap-3">
                            <FileText size={14} className="text-secondary/40" />
                            <div>
                              <p className="font-body text-sm font-medium">{doc.doc_label}</p>
                              <p className="font-body text-xs text-secondary/40">
                                Uploaded {new Date(doc.uploaded_at).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          </div>
                          {doc.verified
                            ? <span className="badge badge-green text-xs">Verified ✓</span>
                            : <span className="badge badge-gray text-xs">Pending review</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Blockchain Audit Trail */}
                <div className="bg-white border border-secondary/8 p-6">
                  <button onClick={() => setShowAudit(!showAudit)}
                    className="w-full flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm uppercase flex items-center gap-2">
                      <Shield size={14} className="text-primary" />
                      Blockchain Audit Trail ({data.audit_trail.length} events)
                    </h3>
                    {showAudit ? <ChevronUp size={16} className="text-secondary/40" /> : <ChevronDown size={16} className="text-secondary/40" />}
                  </button>

                  <AnimatePresence>
                    {showAudit && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-4 flex flex-col gap-3">
                          <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/10 text-xs font-body text-secondary/60">
                            <Shield size={12} className="text-primary mt-0.5 shrink-0" />
                            Each event is cryptographically chained — any tampering will break the chain and be detected.
                          </div>
                          {data.audit_trail.map((entry, i) => {
                            const cfg = EVENT_LABELS[entry.event_type] || { label: entry.event_type, color: 'text-secondary' }
                            return (
                              <div key={i} className="border border-secondary/8 px-4 py-3">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div>
                                    <span className={`font-heading text-xs uppercase tracking-wide font-bold ${cfg.color}`}>
                                      {cfg.label}
                                    </span>
                                    <p className="font-body text-xs text-secondary/40 mt-0.5">
                                      {new Date(entry.created_at).toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                  <span className="font-heading text-[0.55rem] text-secondary/30 uppercase">
                                    Block #{i + 1}
                                  </span>
                                </div>
                                <p className="font-mono text-[0.58rem] text-secondary/25 truncate" title={entry.block_hash}>
                                  Hash: {entry.block_hash}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-center">
                  <button onClick={() => checkStatus()} className="btn-ghost flex items-center gap-2 text-sm">
                    <RefreshCw size={13} /> Refresh Status
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!queried && !loading && (
            <div className="py-16 text-center border-2 border-dashed border-secondary/10">
              <Search size={40} className="mx-auto text-secondary/20 mb-4" />
              <p className="font-body text-sm text-secondary/40">Enter your registration email above to check status</p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}
