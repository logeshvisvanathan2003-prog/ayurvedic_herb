import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import CustomCursor          from '@/components/CustomCursor'
import HomePage              from '@/components/pages/HomePage'
import FarmerPortalPage      from '@/components/pages/FarmerPortalPage'
import ProcessingUnitPage    from '@/components/pages/ProcessingUnitPage'
import LaboratoryTestingPage from '@/components/pages/LaboratoryTestingPage'
import LogisticsPortalPage   from '@/components/pages/LogisticsPortalPage'
import LogisticsScanPage     from '@/components/pages/LogisticsScanPage'
import ConsumerPortalPage    from '@/components/pages/ConsumerPortalPage'
import ContactPage           from '@/components/pages/ContactPage'
import AuthPage              from '@/components/pages/AuthPage'
import ApplicationStatusPage from '@/components/pages/ApplicationStatusPage'
import AdminDashboardPage    from '@/components/pages/AdminDashboardPage'
import AdminRegisterPage     from '@/components/pages/AdminRegisterPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [pathname])
  return null
}

export default function App() {

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("https://ayurveda-backend-asg5.onrender.com/api/health");
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <CustomCursor />
      <ScrollToTop />
      <Routes>
        {/* ── Main pages ── */}
        <Route path="/"                   element={<HomePage />} />
        <Route path="/farmer-portal"      element={<FarmerPortalPage />} />
        <Route path="/processing-unit"    element={<ProcessingUnitPage />} />
        <Route path="/laboratory-testing" element={<LaboratoryTestingPage />} />
        <Route path="/logistics"          element={<LogisticsPortalPage />} />
        <Route path="/logistics-scan"     element={<LogisticsScanPage />} />
        <Route path="/consumer-portal"    element={<ConsumerPortalPage />} />
        <Route path="/contact"            element={<ContactPage />} />

        {/* ── Application status (public, no login needed) ── */}
        <Route path="/application-status" element={<ApplicationStatusPage />} />

        {/* ── Admin — uses separate register page with secret key ── */}
        <Route path="/admin"          element={<AdminDashboardPage />} />
        <Route path="/admin-login"    element={<AuthPage role="admin"    type="login" />} />
        <Route path="/admin-register" element={<AdminRegisterPage />} />

        {/* ── Farmer — register requires land docs + admin approval ── */}
        <Route path="/farmer-login"    element={<AuthPage role="farmer"   type="login" />} />
        <Route path="/farmer-register" element={<AuthPage role="farmer"   type="register" />} />

        {/* ── Lab — register requires licence + admin approval ── */}
        <Route path="/lab-login"    element={<AuthPage role="lab"      type="login" />} />
        <Route path="/lab-register" element={<AuthPage role="lab"      type="register" />} />

        {/* ── Consumer — register requires govt ID + admin approval ── */}
        <Route path="/consumer-login"    element={<AuthPage role="consumer" type="login" />} />
        <Route path="/consumer-register" element={<AuthPage role="consumer" type="register" />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}