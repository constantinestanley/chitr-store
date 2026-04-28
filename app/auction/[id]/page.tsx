'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Gavel, Clock, TrendingUp, Award, AlertCircle, Loader2, ChevronUp } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase'
import { formatCurrency, countdown, formatDate, timeAgo } from '@/lib/utils'
import type { Auction, Bid, Profile } from '@/types'

export default function AuctionDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = createClient()

  const [auction, setAuction]       = useState<Auction | null>(null)
  const [bids, setBids]             = useState<Bid[]>([])
  const [user, setUser]             = useState<Profile | null>(null)
  const [loading, setLoading]       = useState(true)
  const [bidAmount, setBidAmount]   = useState('')
  const [isProxy, setIsProxy]       = useState(false)
  const [maxProxy, setMaxProxy]     = useState('')
  const [placing, setPlacing]       = useState(false)
  const [time, setTime]             = useState({ days: 0, hours: 0, mins: 0, secs: 0, expired: false })

  // Load auction
  const loadAuction = useCallback(async () => {
    const { data } = await supabase
      .from('auctions')
      .select('*, artwork:artworks(*, artist:profiles(*))')
      .eq('id', id)
      .single()
    if (data) {
      setAuction(data as Auction)
      setTime(countdown((data as Auction).ends_at))
    }
    setLoading(false)
  }, [id])

  // Load bids
  const loadBids = useCallback(async () => {
    const { data } = await supabase
      .from('bids')
      .select('*, bidder:profiles(id, full_name, avatar_url)')
      .eq('auction_id', id)
      .order('amount', { ascending: false })
      .limit(20)
    if (data) setBids(data as Bid[])
  }, [id])

  useEffect(() => {
    loadAuction()
    loadBids()
    // Get current user
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) supabase.from('profiles').select('*').eq('id', u.id).single()
        .then(({ data }) => setUser(data as Profile))
    })
  }, [loadAuction, loadBids])

  // Countdown timer
  useEffect(() => {
    if (!auction) return
    const t = setInterval(() => setTime(countdown(auction.ends_at)), 1000)
    return () => clearInterval(t)
  }, [auction])

  // Real-time bid subscription
  useEffect(() => {
    const channel = supabase
      .channel(`auction:${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'bids',
        filter: `auction_id=eq.${id}`,
      }, async (payload) => {
        // Reload bids and auction on new bid
        loadBids()
        loadAuction()
        const newBid = payload.new as Bid
        if (newBid.bidder_id !== user?.id) {
          toast('New bid placed!', { icon: '🔨' })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, user?.id, loadBids, loadAuction])

  const minBid = auction ? (auction.current_bid || auction.starting_price) + 100 : 0

  const placeBid = async () => {
    if (!user) { router.push(`/auth/login?redirect=/auction/${id}`); return }
    const amount = parseInt(bidAmount)
    if (isNaN(amount) || amount < minBid) {
      toast.error(`Minimum bid is ${formatCurrency(minBid)}`); return
    }
    setPlacing(true)
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auction_id: id, amount,
          is_proxy: isProxy,
          max_proxy_amount: isProxy ? parseInt(maxProxy) : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Bid placed successfully! 🎨')
        setBidAmount('')
        setMaxProxy('')
      } else {
        toast.error(data.error || 'Bid failed')
      }
    } catch {
      toast.error('Failed to place bid')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--brand)]" />
      </div>
    </>
  )

  if (!auction) return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔨</p>
          <h1 className="font-display text-3xl mb-2">Auction Not Found</h1>
          <Link href="/auction" className="chitr-btn-primary mt-4 inline-block">Browse Auctions</Link>
        </div>
      </div>
    </>
  )

  const artwork  = auction.artwork
  const isActive = auction.status === 'active' && !time.expired
  const isOwner  = user?.id === auction.artist_id

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* Left — Artwork */}
            <div className="space-y-4 sticky top-24">
              <div className="relative bg-[var(--brand-light)] rounded-2xl overflow-hidden aspect-[4/3]">
                {artwork?.thumbnail && (
                  <Image src={artwork.thumbnail} alt={artwork.title}
                    fill className="object-contain p-4" sizes="(max-width:1024px) 100vw, 50vw" priority />
                )}
                {/* Live badge */}
                {isActive && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE AUCTION
                  </div>
                )}
              </div>

              {/* Artwork info */}
              <div className="chitr-card p-5">
                <Link href={`/artwork/${artwork?.id}`} className="font-display text-2xl hover:text-[var(--brand)] transition-colors">
                  {artwork?.title}
                </Link>
                <p className="text-[var(--muted)] text-sm mt-1">
                  by{' '}
                  <Link href={`/artist/${artwork?.artist_id}`} className="text-[var(--brand)] hover:underline">
                    {artwork?.artist?.full_name}
                  </Link>
                </p>
                <p className="text-sm text-[var(--muted)] mt-2 capitalize">
                  {artwork?.medium} · {artwork?.width_cm}×{artwork?.height_cm} cm · {artwork?.year_created}
                </p>
                <p className="text-sm text-[var(--muted)] mt-3 leading-relaxed line-clamp-3">
                  {artwork?.description}
                </p>
              </div>
            </div>

            {/* Right — Bidding panel */}
            <div className="space-y-5">
              {/* Countdown */}
              <div className={`rounded-2xl p-6 ${isActive ? 'bg-[var(--brand-dark)]' : 'bg-gray-100'}`}>
                {isActive ? (
                  <>
                    <p className="text-white/60 text-sm mb-3 flex items-center gap-2">
                      <Clock size={14} /> Auction ends in
                    </p>
                    <div className="flex gap-4">
                      {[
                        { val: time.days,  label: 'Days' },
                        { val: time.hours, label: 'Hours' },
                        { val: time.mins,  label: 'Mins' },
                        { val: time.secs,  label: 'Secs' },
                      ].map(t => (
                        <div key={t.label} className="text-center flex-1">
                          <p className="font-display text-4xl font-bold text-white">
                            {String(t.val).padStart(2, '0')}
                          </p>
                          <p className="text-white/40 text-xs mt-1">{t.label}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="text-[var(--muted)]" />
                    <p className="font-medium text-[var(--dark)]">
                      {auction.status === 'ended' ? `Auction ended ${formatDate(auction.ends_at)}` : 'Auction not active'}
                    </p>
                  </div>
                )}
              </div>

              {/* Current bid */}
              <div className="chitr-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-[var(--muted)] flex items-center gap-1 mb-1">
                      <TrendingUp size={12} /> Current Bid
                    </p>
                    <p className="font-display text-5xl text-[var(--brand)] font-bold">
                      {formatCurrency(auction.current_bid || auction.starting_price)}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''} placed
                    </p>
                  </div>
                  {auction.reserve_price && (
                    <div className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                      (auction.current_bid || 0) >= auction.reserve_price
                        ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {(auction.current_bid || 0) >= auction.reserve_price ? '✓ Reserve met' : 'Reserve not met'}
                    </div>
                  )}
                </div>

                {/* Bid input */}
                {isActive && !isOwner && (
                  <div className="space-y-3">
                    <div>
                      <label className="chitr-label">
                        Your Bid (₹) — Min {formatCurrency(minBid)}
                      </label>
                      <input type="number" value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        min={minBid} step={100}
                        placeholder={formatCurrency(minBid).replace('₹','')}
                        className="chitr-input" />
                    </div>

                    {/* Proxy bid toggle */}
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={isProxy} onChange={e => setIsProxy(e.target.checked)}
                        className="w-4 h-4 accent-[var(--brand)]" />
                      <span className="text-[var(--muted)]">Enable proxy bidding (auto-bid up to a max)</span>
                    </label>

                    {isProxy && (
                      <div>
                        <label className="chitr-label">Maximum Proxy Amount (₹)</label>
                        <input type="number" value={maxProxy}
                          onChange={e => setMaxProxy(e.target.value)}
                          min={bidAmount || minBid}
                          placeholder="50000"
                          className="chitr-input" />
                      </div>
                    )}

                    <button onClick={placeBid} disabled={placing || !bidAmount}
                      className="chitr-btn-amber w-full flex items-center justify-center gap-2 py-4 text-base">
                      {placing ? <Loader2 size={18} className="animate-spin" /> : <Gavel size={18} />}
                      {placing ? 'Placing Bid…' : `Bid ${bidAmount ? formatCurrency(parseInt(bidAmount)) : 'Now'}`}
                    </button>

                    {!user && (
                      <p className="text-xs text-center text-[var(--muted)]">
                        <Link href={`/auth/login?redirect=/auction/${id}`} className="text-[var(--brand)] font-medium hover:underline">
                          Sign in
                        </Link>{' '}to place a bid
                      </p>
                    )}
                  </div>
                )}

                {isOwner && (
                  <div className="bg-[var(--brand-light)] rounded-xl p-4 text-sm text-[var(--brand)]">
                    This is your auction — you cannot bid on your own artwork.
                  </div>
                )}

                {!isActive && auction.status === 'ended' && auction.winner_id && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-green-800 font-medium flex items-center gap-2">
                      <Award size={16} /> Auction Ended — Sold for {formatCurrency(auction.winner_bid!)}
                    </p>
                  </div>
                )}
              </div>

              {/* Bid history */}
              <div className="chitr-card overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--dark)] flex items-center gap-2">
                    <ChevronUp size={16} className="text-[var(--brand)]" />
                    Bid History ({bids.length})
                  </h3>
                </div>
                {bids.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[var(--muted)] text-sm">
                    No bids yet — be the first to bid!
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)] max-h-64 overflow-y-auto">
                    {bids.map((bid, i) => (
                      <div key={bid.id} className={`px-5 py-3 flex items-center justify-between ${i === 0 ? 'bg-[var(--brand-light)]' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--brand)] flex items-center justify-center text-white text-xs font-bold">
                            {(bid.bidder as any)?.full_name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--dark)]">
                              {(bid.bidder as any)?.full_name || 'Anonymous'}
                              {i === 0 && <span className="ml-2 text-xs bg-[var(--brand)] text-white px-2 py-0.5 rounded-full">Leading</span>}
                            </p>
                            <p className="text-xs text-[var(--muted)]">{timeAgo(bid.created_at)}</p>
                          </div>
                        </div>
                        <p className="font-bold text-[var(--brand)]">{formatCurrency(bid.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certificate info */}
              <div className="flex items-start gap-3 bg-[var(--brand-light)] rounded-xl p-4 text-sm text-[var(--brand)]">
                <Award size={16} className="flex-shrink-0 mt-0.5" />
                <p>Winner receives a blockchain provenance certificate with artwork hash, artist signature, and sale details.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
