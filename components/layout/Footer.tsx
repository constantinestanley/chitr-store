import Link from 'next/link'
import { Instagram, Youtube, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[var(--brand-dark)] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-2">
          <p className="font-display text-3xl font-bold mb-3">
            Chitr<span className="text-[var(--amber)]">.store</span>
          </p>
          <p className="text-white/60 leading-relaxed mb-6 max-w-sm">
            Kerala&apos;s premier online art marketplace. Connecting artists with
            collectors across India and the world since 2025.
          </p>
          <div className="flex gap-4">
            {[
              { href: 'https://instagram.com/chitrstore', icon: <Instagram size={18} /> },
              { href: 'https://youtube.com/@chitrstore',  icon: <Youtube size={18} /> },
              { href: 'mailto:hello@chitr.store',         icon: <Mail size={18} /> },
            ].map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-[var(--brand)] transition-colors">
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <p className="font-semibold text-sm tracking-widest uppercase text-white/40 mb-4">Explore</p>
          <ul className="space-y-2.5">
            {[
              { href: '/gallery',  label: 'Gallery' },
              { href: '/auction',  label: 'Auctions' },
              { href: '/artists',  label: 'Artists' },
              { href: '/prints',   label: 'Prints' },
              { href: '/corporate', label: 'Corporate' },
            ].map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/60 hover:text-white transition-colors text-sm">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-sm tracking-widest uppercase text-white/40 mb-4">Support</p>
          <ul className="space-y-2.5">
            {[
              { href: '/how-it-works', label: 'How It Works' },
              { href: '/shipping',     label: 'Shipping Info' },
              { href: '/artist-faq',   label: 'Artist FAQ' },
              { href: '/privacy',      label: 'Privacy Policy' },
              { href: '/terms',        label: 'Terms of Use' },
            ].map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/60 hover:text-white transition-colors text-sm">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/40 text-xs">© 2025 Chitr.store · Akani Enterprises · Thiruvananthapuram, Kerala</p>
          <p className="text-white/30 text-xs">GST: 32XXXXX · CIN: UXXXXX</p>
        </div>
      </div>
    </footer>
  )
}
