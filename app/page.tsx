import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ArtworkCard from '@/components/artwork/ArtworkCard'
import AuctionCard from '@/components/auction/AuctionCard'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Artwork, Auction } from '@/types'

async function getFeaturedArtworks(): Promise<Artwork[]> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('artworks')
    .select('*, artist:profiles(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(8)
  return (data as Artwork[]) || []
}

async function getActiveAuctions(): Promise<Auction[]> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('auctions')
    .select('*, artwork:artworks(*, artist:profiles(*))')
    .eq('status', 'active')
    .order('ends_at', { ascending: true })
    .limit(4)
  return (data as Auction[]) || []
}

export default async function HomePage() {
  const [artworks, auctions] = await Promise.all([
    getFeaturedArtworks(),
    getActiveAuctions(),
  ])

  return (
    <>
      <Navbar />
      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[var(--brand-dark)]">
          {/* Background gradient mesh */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--brand)] opacity-30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--amber)] opacity-15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
            <div className="page-enter">
              <p className="text-[var(--amber)] font-medium tracking-widest text-sm uppercase mb-4">
                Kerala · India · The World
              </p>
              <h1 className="font-display text-6xl lg:text-7xl text-white leading-[1.05] mb-6">
                Where Kerala&apos;s Art
                <br />
                <em className="text-[var(--brand-mid)]">Finds Its Stage</em>
              </h1>
              <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-lg">
                Buy and auction original paintings, prints, and sculptures
                from Kerala&apos;s finest artists. Every piece comes with a
                certified provenance — authenticity guaranteed.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/gallery" className="chitr-btn-amber text-base px-8 py-4">
                  Browse Gallery
                </Link>
                <Link href="/auction" className="chitr-btn-secondary border-white/40 text-white hover:bg-white/10 text-base px-8 py-4">
                  Live Auctions
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-10 mt-12 pt-8 border-t border-white/10">
                {[
                  { val: '500+', label: 'Artists' },
                  { val: '2,400+', label: 'Artworks' },
                  { val: '12%', label: 'Commission' },
                ].map(s => (
                  <div key={s.label}>
                    <p className="font-display text-3xl text-white font-bold">{s.val}</p>
                    <p className="text-white/50 text-sm">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero art collage */}
            <div className="hidden lg:grid grid-cols-2 gap-4 page-enter">
              {[
                { bg: 'bg-[var(--brand-mid)]', h: 'h-64' },
                { bg: 'bg-[var(--amber)]',     h: 'h-48' },
                { bg: 'bg-teal-600',            h: 'h-48' },
                { bg: 'bg-[var(--brand)]',     h: 'h-64' },
              ].map((b, i) => (
                <div key={i} className={`${b.bg} ${b.h} rounded-2xl opacity-60`} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Live Auctions ─────────────────────────────────────── */}
        {auctions.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 py-20">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="flex items-center gap-2 text-red-500 font-medium text-sm mb-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Live Now
                </span>
                <h2 className="font-display text-4xl text-[var(--dark)]">Active Auctions</h2>
              </div>
              <Link href="/auction" className="chitr-btn-secondary text-sm px-5 py-2.5">
                View All
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {auctions.map(a => <AuctionCard key={a.id} auction={a} />)}
            </div>
          </section>
        )}

        {/* ── Featured Artworks ─────────────────────────────────── */}
        <section className="bg-[var(--brand-light)] py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-display text-4xl text-[var(--dark)]">
                New Arrivals
              </h2>
              <Link href="/gallery" className="chitr-btn-secondary text-sm px-5 py-2.5">
                See All
              </Link>
            </div>
            <div className="artwork-grid">
              {artworks.map(a => <ArtworkCard key={a.id} artwork={a} />)}
            </div>
          </div>
        </section>

        {/* ── How It Works ──────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="font-display text-4xl text-center text-[var(--dark)] mb-4">
            How Chitr.store Works
          </h2>
          <p className="text-center text-[var(--muted)] mb-16 max-w-xl mx-auto">
            A transparent marketplace that puts artists first
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '🎨', title: 'Artist Uploads', desc: 'Verified Kerala artists upload original work with AI-assisted descriptions and automatic tagging.' },
              { step: '02', icon: '🛒', title: 'Buy or Bid',    desc: 'Collectors buy at fixed price or join a live auction. Multi-currency support for NRI buyers.' },
              { step: '03', icon: '📜', title: 'Certified & Shipped', desc: 'Every sale includes a blockchain provenance certificate. Secure international shipping included.' },
            ].map(item => (
              <div key={item.step} className="chitr-card p-8 text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <p className="text-[var(--brand)] font-bold text-sm tracking-widest mb-2">{item.step}</p>
                <h3 className="font-display text-xl mb-3">{item.title}</h3>
                <p className="text-[var(--muted)] leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA for Artists ───────────────────────────────────── */}
        <section className="bg-[var(--brand-dark)] py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="font-display text-5xl text-white mb-6">
              Are You a Kerala Artist?
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
              Join 500+ artists already selling on Chitr.store.
              Just 12% commission — the lowest in India. Free for your first year.
            </p>
            <Link href="/auth/register?role=artist" className="chitr-btn-amber text-base px-10 py-4">
              Start Selling Today
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
