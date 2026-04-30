'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Search, Heart, User, Gavel } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

export default function Navbar() {
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser]       = useState<Profile | null>(null)
  const pathname              = usePathname()
  const supabase              = createClient()
  const isHome                = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setUser(data as unknown as Profile))
      }
    })
  }, [])

  const navLinks = [
    { href: '/gallery', label: 'Gallery' },
    { href: '/auction', label: 'Auctions' },
    { href: '/artists', label: 'Artists' },
  ]

  const transparent = isHome && !scrolled

  return (
    <header className={cn(
      'fixed top-0 inset-x-0 z-50 transition-all duration-300',
      transparent
        ? 'bg-transparent'
        : 'bg-white/95 backdrop-blur-md border-b border-[var(--border)] shadow-sm'
    )}>
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className={cn(
            'font-display text-2xl font-bold tracking-tight transition-colors',
            transparent ? 'text-white' : 'text-[var(--brand)]'
          )}>
            Chitr<span className={transparent ? 'text-[var(--amber)]' : 'text-[var(--amber)]'}>.store</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-[var(--brand)]',
                transparent ? 'text-white/90' : 'text-[var(--text)]',
                pathname === l.href && 'text-[var(--brand)] font-semibold'
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/search" className={cn(
            'p-2 rounded-lg transition-colors',
            transparent ? 'text-white hover:bg-white/10' : 'text-[var(--muted)] hover:bg-[var(--brand-light)]'
          )}>
            <Search size={20} />
          </Link>
          {user ? (
            <>
              <Link href="/wishlist" className={cn(
                'p-2 rounded-lg transition-colors',
                transparent ? 'text-white hover:bg-white/10' : 'text-[var(--muted)] hover:bg-[var(--brand-light)]'
              )}>
                <Heart size={20} />
              </Link>
              <Link
                href={user.role === 'artist' ? '/artist/dashboard' : '/buyer/dashboard'}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors',
                  transparent
                    ? 'text-white border border-white/30 hover:bg-white/10'
                    : 'bg-[var(--brand-light)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white'
                )}
              >
                <User size={16} />
                {user.full_name?.split(' ')[0]}
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={cn(
                'text-sm font-medium px-4 py-2 rounded-xl transition-colors',
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-[var(--brand)] hover:bg-[var(--brand-light)]'
              )}>
                Sign In
              </Link>
              <Link href="/auth/register" className="chitr-btn-amber text-sm px-5 py-2.5">
                Join Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className={cn('md:hidden p-2 rounded-lg', transparent ? 'text-white' : 'text-[var(--text)]')}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-white border-t border-[var(--border)] px-6 py-4 space-y-3 shadow-lg">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block py-2 text-[var(--text)] font-medium hover:text-[var(--brand)]">
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[var(--border)] flex gap-3">
            {user ? (
              <Link href={user.role === 'artist' ? '/artist/dashboard' : '/buyer/dashboard'}
                className="chitr-btn-primary text-sm flex-1 text-center py-2.5">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setOpen(false)}
                  className="chitr-btn-secondary text-sm flex-1 text-center py-2.5">Sign In</Link>
                <Link href="/auth/register" onClick={() => setOpen(false)}
                  className="chitr-btn-primary text-sm flex-1 text-center py-2.5">Join Free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
