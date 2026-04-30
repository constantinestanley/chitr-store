'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { Loader2, Mail, Lock, User, Palette } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState<'buyer' | 'artist'>('buyer')
  const [loading, setLoading]   = useState(false)
  const router      = useRouter()
  const searchParams = useSearchParams()
  const redirect    = searchParams.get('redirect') || '/'
  const defaultRole = searchParams.get('role') as 'buyer' | 'artist' | null
  const supabase    = createClient()

  if (defaultRole && defaultRole !== role) setRole(defaultRole)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      // Update role in profiles table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await (supabaseb as any).from('profiles').update({ role }).eq('id', user.id)
      toast.success('Account created! Check your email to confirm.')
      router.push(role === 'artist' ? '/artist/dashboard' : redirect)
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?redirect=${redirect}&role=${role}` },
    })
  }

  return (
    <div className="min-h-screen bg-[var(--brand-light)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="chitr-card p-8">
          <div className="text-center mb-8">
            <Link href="/" className="font-display text-3xl font-bold text-[var(--brand)]">
              Chitr<span className="text-[var(--amber)]">.store</span>
            </Link>
            <p className="text-[var(--muted)] mt-2 text-sm">Create your free account</p>
          </div>

          {/* Role toggle */}
          <div className="flex rounded-xl border border-[var(--border)] overflow-hidden mb-6">
            {([['buyer', 'I\'m a Buyer', <User size={15} />], ['artist', 'I\'m an Artist', <Palette size={15} />]] as const).map(([r, label, icon]) => (
              <button key={r} type="button" onClick={() => setRole(r as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  role === r ? 'bg-[var(--brand)] text-white' : 'bg-white text-[var(--muted)] hover:bg-[var(--brand-light)]'
                }`}>
                {icon}{label}
              </button>
            ))}
          </div>

          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-[var(--border)] rounded-xl py-3 text-sm font-medium hover:bg-[var(--brand-light)] transition-colors mb-6">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--muted)]">or email</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="chitr-label">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  required placeholder="Your full name" className="chitr-input pl-9" />
              </div>
            </div>
            <div>
              <label className="chitr-label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="you@example.com" className="chitr-input pl-9" />
              </div>
            </div>
            <div>
              <label className="chitr-label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={8} placeholder="Min 8 characters" className="chitr-input pl-9" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="chitr-btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating account…' : `Join as ${role === 'artist' ? 'Artist' : 'Collector'}`}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--muted)] mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[var(--brand)] font-medium hover:underline">Sign in</Link>
          </p>
          <p className="text-center text-xs text-[var(--muted)] mt-3">
            By joining you agree to our{' '}
            <Link href="/terms" className="underline">Terms</Link> and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
