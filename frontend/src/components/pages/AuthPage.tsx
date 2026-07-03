import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, CheckCircle, Upload, FileText, MapPin, Leaf, FlaskConical, User, ArrowRight } from 'lucide-react'
import { useAuthStore, UserRole } from '@/stores/authStore'
import api from '@/lib/api'

interface AuthPageProps { role: UserRole; type: 'login' | 'register' }

const ROLE_CONFIG = {
  farmer:   { bg: 'bg-primary',   title: 'Farmer Portal',     redirect: '/farmer-portal',      icon: Leaf,         color: 'primary'   },
  consumer: { bg: 'bg-gold',      title: 'Consumer Portal',   redirect: '/consumer-portal',    icon: User,         color: 'gold'      },
  lab:      { bg: 'bg-secondary', title: 'Laboratory Portal', redirect: '/laboratory-testing', icon: FlaskConical, color: 'secondary' },
  admin:    { bg: 'bg-secondary', title: 'Admin Portal',      redirect: '/admin', icon: User, color: 'secondary' },
}

const F = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div>
    <label className="form-label">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-secondary/40 font-body">{hint}</p>}
  </div>
)

export default function AuthPage({ role, type }: AuthPageProps) {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const isRegister = type === 'register'
  const config = ROLE_CONFIG[role!] ?? ROLE_CONFIG.consumer
  const Icon = config.icon

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '', address: '',
    // Farmer
    land_area_acres: '', land_survey_no: '', land_district: '', land_state: '', farming_type: '',
    // Lab
    lab_name: '', lab_licence_no: '', lab_accreditation: '', lab_address: '',
    // Consumer
    govt_id_type: '', govt_id_number: '',
    notes: '',
  })
  const [files, setFiles] = useState<Record<string, File | null>>({
    land_document: null, lab_licence: null, govt_id: null, extra_document: null,
  })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [appEmail, setAppEmail] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setFile = (k: string, f: File | null) => setFiles(prev => ({ ...prev, [k]: f }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (isRegister) {
        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
        fd.append('role', role!)
        Object.entries(files).forEach(([k, f]) => { if (f) fd.append(k, f) })
        const { data } = await api.post('/auth/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        setSuccess(data.message)
        setAppEmail(data.application_email)
      } else {
        const { data } = await api.post('/auth/login', { email: form.email, password: form.password, role })
        login(data.user, data.token)
        setSuccess('Login successful! Redirecting…')
        setTimeout(() => navigate(config.redirect), 800)
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed'
      if (err.response?.data?.approval_status === 'pending') {
        setError(''); setSuccess('')
        navigate(`/application-status?email=${encodeURIComponent(form.email)}`)
        return
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Submitted → show success card
  if (success && isRegister && appEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white border border-secondary/10 p-10 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-primary" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl uppercase mb-3">Application Submitted!</h2>
          <p className="font-body text-secondary/60 text-sm leading-relaxed mb-6">{success}</p>
          <div className="bg-primary/5 border border-primary/15 px-5 py-4 mb-6 text-left">
            <p className="font-heading text-xs uppercase tracking-widest text-secondary/50 mb-1">Your Application Email</p>
            <p className="font-mono text-primary font-bold">{appEmail}</p>
          </div>
          <Link to={`/application-status?email=${encodeURIComponent(appEmail)}`}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="btn-primary w-full flex items-center justify-center gap-2">
              Track Application Status <ArrowRight size={14} />
            </motion.button>
          </Link>
          <Link to="/" className="block mt-4 font-body text-sm text-secondary/40 hover:text-secondary transition-colors">
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left panel */}
      <div className={`${config.bg} hidden lg:flex flex-col justify-center px-12 py-16`}>
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 font-heading text-[0.65rem] uppercase tracking-widest text-white/50 hover:text-white/80 mb-10">
            ← Back to Home
          </Link>
          <div className="w-14 h-14 bg-white/15 flex items-center justify-center mb-6">
            <Icon size={28} className="text-white" strokeWidth={1.5} />
          </div>
          <h1 className="font-heading font-extrabold uppercase text-white leading-[0.88] tracking-tight mb-5" style={{ fontSize: 'clamp(2rem,5vw,3rem)' }}>
            {config.title}
          </h1>
          <p className="font-body text-sm text-white/70 leading-relaxed mb-8">
            {isRegister
              ? 'Submit your application with required documents. Admin will review and approve your account.'
              : 'Welcome back. Sign in to continue your work.'}
          </p>
          {isRegister && (
            <div className="space-y-3">
              {role === 'farmer' && [
                'Submit land documents for verification',
                'GPS-enabled herb batch registration',
                'Real-time supply chain tracking',
                'Blockchain-recorded audit trail',
              ].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle size={11} className="text-white" />
                  </div>
                  <span className="font-body text-sm text-white/85">{f}</span>
                </div>
              ))}
              {role === 'lab' && [
                'Submit lab licence for verification',
                'Access all batches for testing',
                'Issue quality approvals & QR codes',
                'Immutable lab records on blockchain',
              ].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle size={11} className="text-white" />
                  </div>
                  <span className="font-body text-sm text-white/85">{f}</span>
                </div>
              ))}
              {role === 'consumer' && [
                'Submit government ID for verification',
                'Verify product authenticity via QR',
                'View full supply chain transparency',
                'Blockchain-verified product history',
              ].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle size={11} className="text-white" />
                  </div>
                  <span className="font-body text-sm text-white/85">{f}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col justify-center px-6 md:px-12 py-12 bg-background overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full mx-auto">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 font-heading text-[0.65rem] uppercase tracking-widest text-secondary/40 hover:text-secondary mb-8">
            ← Back to Home
          </Link>

          <h2 className="font-heading font-extrabold text-2xl uppercase mb-1">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="font-body text-sm text-secondary/50 mb-7">
            {isRegister
              ? `Register as ${role} — documents required for verification`
              : `Sign in to your ${role} account`}
          </p>

          {error && (
            <div className="form-error mb-5">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* ── Common fields ── */}
            {isRegister && (
              <F label="Full Name *">
                <input className="form-input" type="text" placeholder="Your full legal name"
                  value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
              </F>
            )}
            <F label="Email Address *">
              <input className="form-input" type="email" placeholder="your@email.com"
                value={form.email} onChange={e => set('email', e.target.value)} required />
            </F>
            <F label="Password *">
              <div className="relative">
                <input className="form-input pr-10" type={showPwd ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </F>

            {isRegister && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Phone">
                    <input className="form-input" type="tel" placeholder="+91 XXXXX XXXXX"
                      value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </F>
                  <F label="Address">
                    <input className="form-input" type="text" placeholder="City, State"
                      value={form.address} onChange={e => set('address', e.target.value)} />
                  </F>
                </div>

                {/* ── FARMER fields ── */}
                {role === 'farmer' && (
                  <div className="border border-primary/15 bg-primary/3 p-5 flex flex-col gap-4">
                    <p className="font-heading text-xs uppercase tracking-widest text-primary flex items-center gap-2">
                      <Leaf size={12} /> Land & Farming Details
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <F label="Land Area (Acres)">
                        <input className="form-input" type="number" step="0.01" placeholder="e.g. 5.5"
                          value={form.land_area_acres} onChange={e => set('land_area_acres', e.target.value)} />
                      </F>
                      <F label="Survey / Plot No.">
                        <input className="form-input" type="text" placeholder="e.g. 123/4A"
                          value={form.land_survey_no} onChange={e => set('land_survey_no', e.target.value)} />
                      </F>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <F label="District *">
                        <input className="form-input" type="text" placeholder="e.g. Coimbatore"
                          value={form.land_district} onChange={e => set('land_district', e.target.value)} required />
                      </F>
                      <F label="State *">
                        <input className="form-input" type="text" placeholder="e.g. Tamil Nadu"
                          value={form.land_state} onChange={e => set('land_state', e.target.value)} required />
                      </F>
                    </div>
                    <F label="Farming Type">
                      <select className="form-input" value={form.farming_type} onChange={e => set('farming_type', e.target.value)}>
                        <option value="">— Select —</option>
                        <option>Organic Certified</option>
                        <option>Natural Farming</option>
                        <option>Traditional / Indigenous</option>
                        <option>Wild Collection</option>
                        <option>Conventional Farming</option>
                      </select>
                    </F>
                    <F label="Land Document *" hint="Patta / Chitta / Land Record (PDF or Image)">
                      <FileUploadField accept=".pdf,.jpg,.jpeg,.png" onChange={f => setFile('land_document', f)}
                        current={files.land_document} icon={<MapPin size={14} />} required />
                    </F>
                  </div>
                )}

                {/* ── LAB fields ── */}
                {role === 'lab' && (
                  <div className="border border-secondary/15 bg-secondary/3 p-5 flex flex-col gap-4">
                    <p className="font-heading text-xs uppercase tracking-widest text-secondary flex items-center gap-2">
                      <FlaskConical size={12} /> Laboratory Details
                    </p>
                    <F label="Laboratory Name">
                      <input className="form-input" type="text" placeholder="Name of your lab"
                        value={form.lab_name} onChange={e => set('lab_name', e.target.value)} />
                    </F>
                    <div className="grid grid-cols-2 gap-3">
                      <F label="Licence Number *">
                        <input className="form-input" type="text" placeholder="e.g. LIC/2024/TN/001"
                          value={form.lab_licence_no} onChange={e => set('lab_licence_no', e.target.value)} required />
                      </F>
                      <F label="Accreditation">
                        <input className="form-input" type="text" placeholder="e.g. NABL, ISO"
                          value={form.lab_accreditation} onChange={e => set('lab_accreditation', e.target.value)} />
                      </F>
                    </div>
                    <F label="Lab Address">
                      <input className="form-input" type="text" placeholder="Full lab address"
                        value={form.lab_address} onChange={e => set('lab_address', e.target.value)} />
                    </F>
                    <F label="Lab Licence Document *" hint="Upload your valid laboratory licence (PDF or Image)">
                      <FileUploadField accept=".pdf,.jpg,.jpeg,.png" onChange={f => setFile('lab_licence', f)}
                        current={files.lab_licence} icon={<FileText size={14} />} required />
                    </F>
                  </div>
                )}

                {/* ── CONSUMER fields ── */}
                {role === 'consumer' && (
                  <div className="border border-yellow-200 bg-yellow-50/50 p-5 flex flex-col gap-4">
                    <p className="font-heading text-xs uppercase tracking-widest text-yellow-700 flex items-center gap-2">
                      <User size={12} /> Identity Verification
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <F label="ID Type *">
                        <select className="form-input" value={form.govt_id_type} onChange={e => set('govt_id_type', e.target.value)} required>
                          <option value="">— Select —</option>
                          <option value="Aadhaar">Aadhaar Card</option>
                          <option value="PAN">PAN Card</option>
                          <option value="Passport">Passport</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="Driving Licence">Driving Licence</option>
                        </select>
                      </F>
                      <F label="ID Number *">
                        <input className="form-input" type="text" placeholder="ID number"
                          value={form.govt_id_number} onChange={e => set('govt_id_number', e.target.value)} required />
                      </F>
                    </div>
                    <F label="Government ID Document *" hint="Upload clear photo/scan of your ID">
                      <FileUploadField accept=".pdf,.jpg,.jpeg,.png" onChange={f => setFile('govt_id', f)}
                        current={files.govt_id} icon={<FileText size={14} />} required />
                    </F>
                  </div>
                )}

                <F label="Additional Document (optional)" hint="Any supporting document">
                  <FileUploadField accept=".pdf,.jpg,.jpeg,.png" onChange={f => setFile('extra_document', f)}
                    current={files.extra_document} icon={<Upload size={14} />} />
                </F>

                <F label="Notes (optional)">
                  <textarea className="form-input" rows={2} placeholder="Any additional information for admin review…"
                    value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
                </F>
              </>
            )}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 mt-2">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : isRegister ? 'Submit Application' : 'Sign In'}
            </motion.button>
          </form>

          <p className="font-body text-sm text-secondary/50 text-center mt-5">
            {isRegister
              ? <>Already have an account?{' '}
                  <Link to={`/${role}-login`} className="text-primary hover:underline font-medium">Sign in</Link>
                </>
              : <>Don't have an account?{' '}
                  <Link to={`/${role}-register`} className="text-primary hover:underline font-medium">Apply now</Link>
                </>}
          </p>
          {!isRegister && (
            <p className="font-body text-xs text-secondary/40 text-center mt-2">
              <Link to="/application-status" className="hover:text-secondary transition-colors">
                Check registration application status →
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

/* ── File Upload Component ─────────────────────────────────────────────────── */
function FileUploadField({ accept, onChange, current, icon, required }: {
  accept: string; onChange: (f: File | null) => void;
  current: File | null; icon: React.ReactNode; required?: boolean
}) {
  return (
    <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed cursor-pointer transition-all
      ${current ? 'border-primary/40 bg-primary/5 text-primary' : 'border-secondary/20 hover:border-secondary/40 text-secondary/50'}`}>
      {icon}
      <span className="font-body text-sm flex-1 truncate">
        {current ? current.name : 'Click to upload file…'}
      </span>
      {current && <CheckCircle size={14} className="text-primary shrink-0" />}
      <input type="file" accept={accept} className="sr-only" required={required && !current}
        onChange={e => onChange(e.target.files?.[0] || null)} />
    </label>
  )
}
