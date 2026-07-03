import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, userRole, userEmail, logout } = useAuthStore()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/farmer-portal', label: 'Farmer Portal' },
    { path: '/processing-unit', label: 'Processing' },
    { path: '/laboratory-testing', label: 'Laboratory' },
    { path: '/logistics', label: 'Logistics' },
    { path: '/consumer-portal', label: 'Consumer' },
    { path: '/contact', label: 'Contact' },
    { path: '/application-status', label: 'Track Application' },
  ]

  const loginLinks = [
    { path: '/farmer-login', label: 'Farmer' },
    { path: '/lab-login', label: 'Laboratory' },
    { path: '/collector-login', label: 'Collector' },
    { path: '/production-login', label: 'Production Unit' },
    { path: '/consumer-login', label: 'Consumer' },
    { path: '/admin-login', label: 'Admin' },
  ]

  const dashboardPathByRole: Record<string, string> = {
    admin: '/admin',
    farmer: '/farmer-portal',
    lab: '/laboratory-testing',
    consumer: '/consumer-portal',
    collector: '/logistics',
    production_unit: '/production-unit',
  }
  const dashboardPath = userRole ? dashboardPathByRole[userRole] || '/' : '/'

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-cream/95 backdrop-blur-xl transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_4px_30px_rgba(0,0,0,0.07)]' : ''
        } border-b border-secondary/8`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col">
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-secondary uppercase leading-none tracking-tight">
                AYURVEDIC
              </h1>
              <span className="font-body text-[0.58rem] uppercase tracking-[0.18em] text-secondary/50 mt-0.5">
                Herbal Traceability System
              </span>
            </motion.div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative group">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="btn-primary flex items-center gap-2 px-4 py-2.5"
                >
                  <span className="font-heading text-[0.68rem] uppercase tracking-widest">
                    {userRole?.charAt(0).toUpperCase() + userRole!.slice(1)}
                  </span>
                  <ChevronDown size={14} />
                </motion.button>
                <div className="absolute right-0 mt-1 w-48 bg-white border border-secondary/8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50">
                  <div className="px-4 py-3 border-b border-secondary/6">
                    <p className="font-body text-[0.68rem] text-secondary/50 mb-0.5">Signed in as</p>
                    <p className="font-body text-sm font-medium text-secondary truncate">{userEmail}</p>
                  </div>
                  <Link
                    to={dashboardPath}
                    className="w-full flex items-center gap-2 px-4 py-3 font-body text-sm text-secondary hover:bg-primary/5 hover:text-primary transition-colors border-b border-secondary/5"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-3 font-body text-sm text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <button className="btn-outline flex items-center gap-1.5 px-4 py-2.5">
                  <span className="font-heading text-[0.68rem] uppercase tracking-widest">Login</span>
                  <ChevronDown size={13} />
                </button>
                <div className="absolute right-0 mt-1 w-40 bg-white border border-secondary/8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50">
                  {loginLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="block px-4 py-3 font-body text-sm text-secondary hover:bg-primary/5 hover:text-primary transition-colors border-b border-secondary/5 last:border-b-0"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-secondary"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-cream flex flex-col items-center justify-center gap-6"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-6 right-6 p-2 text-secondary"
            >
              <X size={24} />
            </button>
            {navLinks.map((link, i) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className="font-heading font-extrabold text-4xl uppercase text-secondary hover:text-primary transition-colors tracking-tight"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center gap-3 mt-4"
              >
                {loginLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className="font-heading text-lg uppercase text-secondary/50 hover:text-primary transition-colors"
                  >
                    {link.label} Login
                  </Link>
                ))}
              </motion.div>
            )}
            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="font-heading text-xl uppercase text-primary"
                >
                  Dashboard
                </Link>
              </motion.div>
            )}
            {isAuthenticated && (
              <button
                onClick={() => { logout(); setMobileOpen(false) }}
                className="font-heading text-xl uppercase text-red-500"
              >
                Logout
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}