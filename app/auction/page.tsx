import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AuctionCard from '@/components/auction/AuctionCard'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Auction } from '@/types'

export const metadata: Metadata = {
  title: 'Live Auctions',
  description: 'Bid on original Kerala artworks in live timed auctions. Reserve prices, proxy bidding, and real-time updates.',
}

export const revalidate = 30

async function getAuctions(): Promise<{ active: Auction[]; upcoming: Auction[]; ended: Auction[] }> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('auctions')
    .select('*, artwork:artworks(*, artist:profiles(*))')
    .in('status', ['active', 'upcoming', 'ended'])
    .order('ends_at', { ascending: true })
    .limit(40)

  const all = (data as Auction[]) || []
  return {
    active:   all.filter(a => a.status === 'active'),
    upcoming: all.filter(a => a.status === 'upcoming'),
    ended:    all.filter(a => a.status === 'ended').slice(0, 8),
  }
}

export default async function AuctionPage() {
  const { active, upcoming, ended } = await getAuctions()

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        {/* Hero */}
        <div className="bg-[var(--brand-dark)] py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
              <span className="text-red-400 font-medium text-sm uppercase tracking-widest">Live Auctions</span>
            </div>
            <h1 className="font-display text-5xl text-white mb-3">Bid on Kerala Art</h1>
            <p className="text-white/60 text-lg max-w-xl">
              Timed auctions with reserve prices, proxy bidding, and real-time updates.
              Every lot comes with a blockchain certificate on purchase.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
          {/* Active */}
          {active.length > 0 && (
            <section>
              <h2 className="font-display text-3xl text-[var(--dark)] mb-6">
                Active Now <span className="text-base text-[var(--muted)] font-sans font-normal ml-2">({active.length})</span>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {active.map(a => <AuctionCard key={a.id} auction={a} />)}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="font-display text-3xl text-[var(--dark)] mb-6">
                Coming Soon <span className="text-base text-[var(--muted)] font-sans font-normal ml-2">({upcoming.length})</span>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {upcoming.map(a => <AuctionCard key={a.id} auction={a} />)}
              </div>
            </section>
          )}

          {/* Empty state */}
          {active.length === 0 && upcoming.length === 0 && (
            <div className="text-center py-24">
              <p className="text-6xl mb-4">🔨</p>
              <p className="font-display text-3xl text-[var(--dark)] mb-3">No Live Auctions</p>
              <p className="text-[var(--muted)]">Check back soon — new auctions launch every week.</p>
            </div>
          )}

          {/* Past auctions */}
          {ended.length > 0 && (
            <section>
              <h2 className="font-display text-3xl text-[var(--dark)] mb-6 text-[var(--muted)]">
                Recently Ended
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 opacity-70">
                {ended.map(a => <AuctionCard key={a.id} auction={a} />)}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
