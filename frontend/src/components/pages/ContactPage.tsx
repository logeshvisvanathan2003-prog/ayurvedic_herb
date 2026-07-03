import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Send } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="form-label">{label}</label>{children}</div>
}

export default function ContactPage() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', subject:'', message:'' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setSuccess(true); setLoading(false)
    setForm({ name:'', email:'', phone:'', subject:'', message:'' })
    setTimeout(() => setSuccess(false), 5000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-primary py-20 px-4 text-center">
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} className="max-w-[700px] mx-auto">
          <h1 className="font-heading font-extrabold uppercase text-white leading-[0.88] tracking-tight mb-4" style={{ fontSize:'clamp(2.5rem,7vw,5rem)' }}>
            Get In Touch
          </h1>
          <p className="font-body text-base text-white/75 leading-relaxed">
            Have questions about the National Ayurvedic Network? We're here to help.
          </p>
        </motion.div>
      </section>

      <section className="py-16 px-4 md:px-12">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info */}
          <div>
            <span className="section-tag">Contact Information</span>
            <h2 className="section-title mb-8" style={{ fontSize:'clamp(1.5rem,3vw,2.5rem)' }}>Reach<br />Out To Us</h2>
            {[
              { Icon: MapPin, label: 'Address',  val: 'Ministry of AYUSH, Ayush Bhawan, B Block, GPO Complex, INA, New Delhi – 110023' },
              { Icon: Phone,  label: 'Phone',    val: '+91-11-24651950' },
              { Icon: Mail,   label: 'Email',    val: 'info@ayush.gov.in' },
            ].map(({ Icon, label, val }, i) => (
              <motion.div key={i} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                className="flex gap-4 mb-6">
                <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-primary" />
                </div>
                <div>
                  <p className="font-heading text-[0.62rem] uppercase tracking-widest text-secondary/40 mb-1">{label}</p>
                  <p className="font-body text-sm leading-relaxed">{val}</p>
                </div>
              </motion.div>
            ))}

            <div className="mt-8 bg-secondary p-7">
              <p className="font-heading text-[0.68rem] uppercase tracking-widest text-gold mb-4">Official Hours</p>
              <p className="font-body text-sm text-white/60 leading-relaxed">
                Monday – Friday: 9:00 AM – 5:30 PM IST<br />
                Saturday: 9:00 AM – 1:00 PM IST<br />
                Sunday & Public Holidays: Closed
              </p>
            </div>
          </div>

          {/* Form */}
          <div>
            <span className="section-tag">Send a Message</span>
            <h2 className="section-title mb-8" style={{ fontSize:'clamp(1.5rem,3vw,2.5rem)' }}>We'd Love<br />To Hear From You</h2>
            {success && <div className="form-success">Message sent! We'll respond within 2 business days.</div>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <F label="Full Name *">
                <input className="form-input" type="text" placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </F>
              <F label="Email *">
                <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </F>
              <F label="Phone">
                <input className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </F>
              <F label="Subject *">
                <select className="form-input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required>
                  <option value="">Select topic</option>
                  {['Farmer Registration','Laboratory Partnership','Consumer Inquiry','Technical Support','Policy Questions','Other'].map(o => <option key={o}>{o}</option>)}
                </select>
              </F>
              <div className="md:col-span-2">
                <F label="Message *">
                  <textarea className="form-input" rows={6} placeholder="Describe your inquiry in detail…"
                    value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required style={{ resize:'vertical' }} />
                </F>
              </div>
              <div className="md:col-span-2">
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} type="submit" disabled={loading} className="btn-primary">
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Send size={15} /> Send Message</>}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}