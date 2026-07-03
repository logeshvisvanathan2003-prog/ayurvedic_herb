import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Shield, CheckCircle, Lock, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

/* ── Field wrapper — defined OUTSIDE component so identity stays stable ─────── */
const F = ({ label, children, hint }: {
  label: string; children: React.ReactNode; hint?: string
}) => (
  <div>
    <label className="form-label">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-secondary/40 font-body">{hint}</p>}
  </div>
)

export default function AdminRegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [fullName,     setFullName]     = useState('')
  const [email,        setEmail]        = useState('')
  const [phone,        setPhone]        = useState('')
  const [password,     setPassword]     = useState('')
  const [adminSecret,  setAdminSecret]  = useState('')
  const [showPwd,      setShowPwd]      = useState(false)
  const [showSecret,   setShowSecret]   = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/admin-register', {
        full_name:    fullName,
        email,
        phone,
        password,
        admin_secret: adminSecret,
      })
      login(data.user, data.token)
      setSuccess(data.message)
      setTimeout(() => navigate('/admin'), 1000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Check your secret key.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ── Left panel ── */}
      <div className="bg-secondary hidden lg:flex flex-col justify-center px-12 py-16">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="max-w-md">
          <Link to="/"
            className="inline-flex items-center gap-2 font-heading text-[0.65rem] uppercase tracking-widest text-white/50 hover:text-white/80 transition-colors mb-10">
            ← Back to Home
          </Link>

          <div className="w-14 h-14 bg-white/10 flex items-center justify-center mb-6">
            <Shield size={28} className="text-white" strokeWidth={1.5} />
          </div>

          <h1 className="font-heading font-extrabold uppercase text-white leading-[0.88] tracking-tight mb-5"
            style={{ fontSize: 'clamp(2rem,5vw,3rem)' }}>
            Admin<br />Registration
          </h1>
          <p className="font-body text-sm text-white/70 leading-relaxed mb-8">
            Create an administrator account. A secret key is required — only authorised personnel can create admin accounts.
          </p>

          <div className="space-y-3 mb-8">
            {[
              'Requires secret admin key for security',
              'Instant activation — no approval wait',
              'Full control over all registrations',
              'Approve / reject farmers, labs & consumers',
              'Access to blockchain audit log',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <CheckCircle size={11} className="text-white" />
                </div>
                <span className="font-body text-sm text-white/80">{item}</span>
              </div>
            ))}
          </div>

          <div className="px-4 py-4 bg-gold/15 border border-gold/25">
            <p className="font-heading text-xs uppercase tracking-widest text-gold mb-1.5">Default Secret Key</p>
            <p className="font-mono text-sm text-white/70 bg-black/20 px-3 py-1.5 select-all">
              ayurveda-admin-2026
            </p>
            <p className="font-body text-xs text-white/35 mt-2">
              Change via ADMIN_SECRET environment variable on the server.
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-col justify-center px-6 md:px-12 py-12 bg-background overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full mx-auto">

          <Link to="/"
            className="lg:hidden inline-flex items-center gap-2 font-heading text-[0.65rem] uppercase tracking-widest text-secondary/40 hover:text-secondary mb-8">
            ← Back to Home
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-secondary flex items-center justify-center shrink-0">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-2xl uppercase">Create Admin</h2>
              <p className="font-body text-xs text-secondary/40">Administrator account — instant access</p>
            </div>
          </div>
          <p className="font-body text-sm text-secondary/50 mb-6">
            Already an admin?{' '}
            <Link to="/admin-login" className="text-primary font-medium hover:underline">Sign in here</Link>
          </p>

          {/* Notice */}
          <div className="flex items-start gap-3 px-4 py-3 bg-gold/10 border border-gold/20 mb-5">
            <AlertTriangle size={14} className="text-yellow-600 mt-0.5 shrink-0" />
            <p className="font-body text-xs text-yellow-700 leading-relaxed">
              This creates an admin account with full system access. You need the <strong>admin secret key</strong> to proceed.
              Admin accounts do not go through the approval process.
            </p>
          </div>

          {error   && <div className="form-error mb-4">{error}</div>}
          {success && <div className="form-success mb-4">{success}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <F label="Full Name *">
              <input className="form-input" type="text" name="full_name"
                placeholder="Your full name"
                value={fullName} onChange={e => setFullName(e.target.value)} required />
            </F>

            <F label="Email Address *">
              <input className="form-input" type="email" name="email"
                placeholder="admin@yourorg.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </F>

            <F label="Phone (optional)">
              <input className="form-input" type="tel" name="phone"
                placeholder="+91 XXXXX XXXXX"
                value={phone} onChange={e => setPhone(e.target.value)} />
            </F>

            <F label="Password *">
              <div className="relative">
                <input className="form-input pr-10" name="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </F>

            <F label="Admin Secret Key *" hint="Ask your system administrator for this key">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40 pointer-events-none">
                  <Lock size={14} />
                </div>
                <input className="form-input pl-9 pr-10" name="admin_secret"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="Enter the admin secret key"
                  value={adminSecret} onChange={e => setAdminSecret(e.target.value)} required />
                <button type="button" onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary transition-colors">
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </F>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading}
              className="btn-dark flex items-center justify-center gap-2 mt-2">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Shield size={15} /> Create Admin Account</>}
            </motion.button>
          </form>

        </motion.div>
      </div>
    </div>
  )
}
