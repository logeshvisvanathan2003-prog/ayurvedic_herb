import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* About */}
        <div>
          <p className="font-heading text-[0.68rem] uppercase tracking-[0.18em] text-gold mb-4">
            About The System
          </p>
          <p className="font-body text-xs text-white/60 leading-relaxed mb-4">
            A Ministry of AYUSH initiative to ensure transparency, authenticity, and quality in
            the Ayurvedic medicinal plant supply chain.
          </p>
          <div className="w-10 h-0.5 bg-primary" />
        </div>

        {/* Quick Links */}
        <div>
          <p className="font-heading text-[0.68rem] uppercase tracking-[0.18em] text-gold mb-4">
            Quick Links
          </p>
          <ul className="space-y-2.5">
            {[
              ['/', 'Home'],
              ['/farmer-portal', 'Farmer Portal'],
              ['/processing-unit', 'Processing Unit'],
              ['/laboratory-testing', 'Laboratory Testing'],
              ['/consumer-portal', 'Consumer Portal'],
              ['/contact', 'Contact Us'],
            ].map(([path, label]) => (
              <li key={path}>
                <Link
                  to={path}
                  className="font-body text-xs text-white/55 hover:text-gold transition-colors flex items-center gap-2"
                >
                  <span className="w-1 h-1 bg-primary rounded-full" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="font-heading text-[0.68rem] uppercase tracking-[0.18em] text-gold mb-4">
            Contact Info
          </p>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
              <span className="font-body text-xs text-white/55 leading-relaxed">
                Ministry of AYUSH, Ayush Bhawan, B Block, GPO Complex, INA, New Delhi – 110023
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={14} className="text-primary shrink-0" />
              <span className="font-body text-xs text-white/55">+91-11-24651950</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={14} className="text-primary shrink-0" />
              <span className="font-body text-xs text-white/55">info@ayush.gov.in</span>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <p className="font-heading text-[0.68rem] uppercase tracking-[0.18em] text-gold mb-4">
            Resources
          </p>
          <ul className="space-y-2.5">
            {['Ministry of AYUSH','Quality Standards','User Guidelines','FAQs','Privacy Policy','Terms of Service'].map((r) => (
              <li key={r}>
                <a
                  href="#"
                  className="font-body text-xs text-white/55 hover:text-gold transition-colors flex items-center gap-2"
                >
                  <ExternalLink size={10} />
                  {r}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/8 max-w-[1400px] mx-auto px-6 md:px-12 py-5 flex flex-col md:flex-row justify-between items-center gap-3">
        <p className="font-body text-xs text-white/40">
          © 2026 Ministry of AYUSH, Government of India. All rights reserved.
        </p>
        <div className="flex gap-6">
          {['Accessibility','Disclaimer','Sitemap'].map((l) => (
            <a
              key={l}
              href="#"
              className="font-body text-xs text-white/40 hover:text-gold transition-colors"
            >
              {l}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-primary py-3 text-center">
        <p className="font-body text-xs text-white/85">
          This is an official website of the Government of India. Content owned and maintained by Ministry of AYUSH.
        </p>
      </div>
    </footer>
  )
}
