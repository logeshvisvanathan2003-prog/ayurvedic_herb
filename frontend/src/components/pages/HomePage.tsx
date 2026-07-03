import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Leaf, Factory, FlaskConical, QrCode, Shield, MapPin, Globe,
  ArrowRight, CheckCircle2
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Marquee from '@/components/Marquee'
import { useInView } from '@/hooks/useInView'

const PORTALS = [
  {
    id: 'farmer-portal',
    cls: 'bg-primary text-white',
    icon: Leaf,
    title: 'Farmer Portal',
    desc: 'Digital registration of harvested herbs with GPS tracking, offline data capture, and image upload capabilities for rural environments.',
    chips: ['GPS Tracking', 'Offline Capture', 'Image Upload', 'Batch Registration'],
  },
  {
    id: 'processing-unit',
    cls: 'bg-secondary text-secondary-foreground',
    icon: Factory,
    title: 'Processing Unit',
    desc: 'Record post-harvest operations including drying methods, grinding status, and storage conditions with complete batch traceability.',
    chips: ['Batch Tracking', 'Processing Logs', 'Storage Monitor', 'Chain of Custody'],
  },
  {
    id: 'laboratory-testing',
    cls: 'bg-gold text-secondary',
    icon: FlaskConical,
    title: 'Laboratory Testing',
    desc: 'Upload test reports, moisture analysis, pesticide screening, and DNA authentication results with quality approval workflows.',
    chips: ['Test Reports', 'Quality Standards', 'Batch Approval', 'Certification'],
  },
  {
    id: 'consumer-portal',
    cls: 'bg-cream text-secondary border-2 border-secondary/10',
    icon: QrCode,
    title: 'Consumer Portal',
    desc: 'Public interface for product verification through QR code scanning, displaying complete provenance and laboratory certificates.',
    chips: ['QR Scanning', 'Product Verify', 'Origin Map', 'Certificate Download'],
  },
]

const OVERVIEW = [
  { icon: Shield, title: 'Quality Assurance', desc: 'Rigorous testing protocols and certification standards ensure only authentic, safe medicinal herbs reach consumers.', stat: '100%', label: 'Compliance' },
  { icon: MapPin,  title: 'Geographic Tracking', desc: 'GPS-enabled collection site mapping provides complete visibility of herb origins and harvesting locations.', stat: 'GPS', label: 'Precision' },
  { icon: FlaskConical, title: 'Laboratory Testing', desc: 'Comprehensive analysis including moisture content, pesticide residue, and DNA authentication for species verification.', stat: 'ISO', label: 'Certified' },
]

const BENEFITS = [
  'Real-time supply chain monitoring',
  'Blockchain-inspired data integrity',
  'Mobile-first design for field operations',
  'Automated quality compliance checks',
  'Consumer-facing transparency tools',
]

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-3 py-1 border border-secondary/20 rounded-full font-heading text-[0.6rem] uppercase tracking-[0.18em] text-secondary/50 mb-3">
      {children}
    </span>
  )
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroTextY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const heroShapeY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])

  const [missionRef, missionInView] = useInView()
  const [portalsRef, portalsInView] = useInView()
  const [overviewRef, overviewInView] = useInView()
  const [benefitsRef, benefitsInView] = useInView()

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        className="relative min-h-screen bg-cream flex flex-col justify-between overflow-hidden grain"
      >
        {/* Top content */}
        <motion.div
          style={{ y: heroTextY }}
          className="relative z-10 w-full max-w-[1400px] mx-auto px-4 md:px-12 pt-14 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 border border-secondary/15 rounded-full font-heading text-[0.6rem] uppercase tracking-[0.18em] text-secondary/50 mb-5"
          >
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse-dot" />
            Ministry of AYUSH Initiative
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse-dot" style={{ animationDelay: '0.5s' }} />
          </motion.div>

          {/* Main title */}
          <h1 className="font-heading font-extrabold uppercase leading-[0.85] tracking-tight overflow-hidden"
            style={{ fontSize: 'clamp(4rem, 12vw, 10rem)' }}>
            {['National', 'Ayurvedic', 'Network'].map((word, i) => (
              <motion.span
                key={word}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className={`block ${i === 1 ? 'text-primary' : 'text-secondary'}`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Role row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-wrap justify-between items-center border-t-2 border-secondary mt-7 pt-3 pb-6"
          >
            {['Farmer', 'Processor', 'Laboratory', 'Consumer'].map((r) => (
              <span
                key={r}
                className="font-heading text-sm md:text-base uppercase text-secondary/40 hover:text-primary transition-colors tracking-wide"
              >
                {r}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Abstract hero shapes */}
        <motion.div
          style={{ y: heroShapeY }}
          className="w-full max-w-[1400px] mx-auto px-4 md:px-8"
        >
          <div className="grid grid-cols-3 gap-3 md:gap-4 items-end" style={{ height: 'clamp(280px, 45vh, 520px)' }}>
            {[
              { bg: 'bg-secondary', delay: '0.4s', h: '78%' },
              { bg: 'bg-primary', delay: '0.2s', h: '100%', extra: '-mx-5 md:-mx-8 z-10 shadow-[0_-30px_80px_rgba(74,124,89,0.35)]' },
              { bg: 'bg-gold', delay: '0.5s', h: '65%' },
            ].map((s, i) => (
              <div
                key={i}
                className={`hero-shape rounded-t-[60px] md:rounded-t-[120px] overflow-hidden ${s.bg} ${s.extra || ''}`}
                style={{ height: s.h, animationDelay: s.delay }}
              />
            ))}
          </div>
        </motion.div>
      </section>

      <Marquee text="Transparency • Authenticity • Quality • Heritage" />

      {/* ─── MISSION ─── */}
      <section className="py-24 px-4 md:px-12 bg-background">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <span className="block w-10 h-0.5 bg-primary mb-4" />
              <h3 className="font-heading text-xl uppercase mb-3">The Vision</h3>
              <p className="font-body text-sm text-secondary/60 leading-relaxed">
                Connecting the ancient wisdom of Ayurveda with modern digital trust.
              </p>
            </div>
          </div>
          <div className="lg:col-span-8" ref={missionRef}>
            <p
              className={`font-heading uppercase leading-tight transition-all duration-1000 ${missionInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2.8rem)' }}
            >
              A comprehensive digital platform ensuring{' '}
              <span className="text-primary">transparency</span> and{' '}
              <span className="text-gold">authenticity</span> across the entire
              medicinal plant supply chain, from the soil of the farm to the hands of the consumer.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'For The Government', desc: 'Real-time oversight and data-driven policy making for the AYUSH sector.' },
                { title: 'For The People', desc: 'Guaranteed safety and authenticity of Ayurvedic medicines.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="border-t-2 border-secondary/10 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={missionInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
                >
                  <h4 className="font-heading text-sm uppercase mb-2">{item.title}</h4>
                  <p className="font-body text-xs text-secondary/60 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PORTALS ─── */}
      <section className="py-20 px-4 md:px-8 bg-secondary relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(185,176,74,0.07) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="max-w-[1400px] mx-auto" ref={portalsRef}>
          <div className={`mb-12 transition-all duration-700 ${portalsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-block px-3 py-1 border border-white/15 rounded-full font-heading text-[0.6rem] uppercase tracking-[0.18em] text-white/40 mb-3">
              Access Your Dashboard
            </span>
            <h2 className="font-heading font-extrabold uppercase text-white leading-[0.88] tracking-tight"
              style={{ fontSize: 'clamp(2.5rem,5vw,4.5rem)' }}>
              Stakeholder<br />Portals
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
            {PORTALS.map((p, i) => (
              <Link
                key={p.id}
                to={`/${p.id}`}
                className={`portal-card ${p.cls}`}
                style={{
                  opacity: portalsInView ? 1 : 0,
                  transform: portalsInView ? 'none' : 'translateY(50px)',
                  transition: `opacity 0.7s ${i * 0.1}s ease, transform 0.7s ${i * 0.1}s ease`,
                }}
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center">
                      <p.icon size={26} strokeWidth={1.5} />
                    </div>
                    <div className="arrow-btn">
                      <ArrowRight size={18} className="-rotate-45" />
                    </div>
                  </div>
                  <h3 className="font-heading font-extrabold text-2xl md:text-3xl uppercase leading-none mb-3">
                    {p.title}
                  </h3>
                  <p className="font-body text-sm opacity-75 leading-relaxed max-w-md">{p.desc}</p>
                </div>
                <div className="mt-5 pt-5 border-t border-current flex flex-wrap gap-2" style={{borderColor: 'color-mix(in srgb, currentColor 15%, transparent)'}}>
                  {p.chips.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 bg-white/10 rounded-full font-heading text-[0.58rem] uppercase tracking-widest"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SYSTEM OVERVIEW ─── */}
      <section className="py-24 px-4 md:px-12 bg-background">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-32">
              <h2
                className="font-heading font-extrabold uppercase leading-[0.88] mb-6 tracking-tight"
                style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
              >
                System<br /><span className="text-primary">Architecture</span>
              </h2>
              <p className="font-body text-sm text-secondary/60 leading-relaxed mb-8">
                Our integrated platform connects every stakeholder in the Ayurvedic supply chain,
                ensuring complete transparency through advanced digital tracking.
              </p>
              <Link to="/contact">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn-dark"
                >
                  Request Demo
                </motion.button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-5" ref={overviewRef}>
            {OVERVIEW.map((item, i) => (
              <motion.div
                key={i}
                className="overview-card"
                initial={{ opacity: 0, x: 40 }}
                animate={overviewInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.7 }}
              >
                <div className="absolute top-5 right-5 opacity-5">
                  <item.icon size={80} />
                </div>
                <div className="flex flex-col md:flex-row gap-5 items-start md:items-center mb-5">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    className="w-14 h-14 bg-gold/15 rounded-full flex items-center justify-center shrink-0"
                  >
                    <item.icon size={26} className="text-secondary" />
                  </motion.div>
                  <div>
                    <h3 className="font-heading text-xl uppercase">{item.title}</h3>
                    <motion.div
                      className="h-0.5 w-14 bg-primary mt-1.5 group-hover:w-full transition-all duration-500"
                    />
                  </div>
                </div>
                <p className="font-body text-sm text-secondary/60 leading-relaxed mb-5">{item.desc}</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading font-extrabold text-4xl text-primary">{item.stat}</span>
                  <span className="font-body text-[0.65rem] uppercase tracking-[0.15em] text-secondary/50">{item.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BENEFITS ─── */}
      <section className="py-24 bg-primary text-white overflow-hidden" ref={benefitsRef}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 mb-14 text-center">
          <h2
            className="font-heading font-extrabold uppercase text-white leading-[0.88] tracking-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}
          >
            Why Traceability Matters
          </h2>
        </div>
        <Marquee text="Trust • Safety • Purity • Ethics • Quality" reverse />
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={benefitsInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex items-center gap-3 p-5 border border-white/15 hover:bg-white/8 transition-colors"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.15 }}
                className="w-6 h-6 bg-gold rounded-full flex items-center justify-center shrink-0"
              >
                <CheckCircle2 size={13} className="text-secondary" />
              </motion.div>
              <p className="font-heading text-sm uppercase leading-snug">{b}</p>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={benefitsInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col items-center justify-center p-5 bg-gold text-secondary gap-3"
          >
            <Globe size={36} className="animate-spin-slow" />
            <p className="font-heading text-sm uppercase text-center">Global Standards Compliant</p>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-32 px-4 bg-secondary text-center relative overflow-hidden">
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{ fontSize: 'clamp(6rem,18vw,14rem)', color: 'rgba(255,255,255,0.025)', fontFamily: 'Syne', fontWeight: 800, lineHeight: 1 }}
        >
          AYURVEDA
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2
              className="font-heading font-extrabold uppercase text-white leading-[0.85] tracking-tight mb-6"
              style={{ fontSize: 'clamp(2.5rem,8vw,7rem)' }}
            >
              Join The<br />Revolution
            </h2>
            <p className="font-body text-sm text-white/60 leading-relaxed mb-10">
              Whether you're a farmer, processor, laboratory, or consumer, our platform provides
              the tools you need to participate in a transparent, trustworthy Ayurvedic supply chain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn-gold">
                  Get Started Today
                </motion.button>
              </Link>
              <Link to="/farmer-portal">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn border-2 border-white/25 text-white hover:bg-white/10"
                >
                  Explore Portals
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
