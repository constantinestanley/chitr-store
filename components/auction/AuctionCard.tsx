'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Gavel, Clock, TrendingUp } from 'lucide-react'
import { formatCurrency, countdown } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Auction } from '@/types'

interface Props {
  auction: Auction
  className?: string
}

export default function AuctionCard({ auction, className }: Props) {
  const [time, setTime] = useState(countdown(auction.ends_at))
  const [imgError, setImgError] = useState(false)
  const [prevBid, setPrevBid]   = useState(auction.current_bid)
  const [flash, setFlash]       = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(countdown(auction.ends_at)), 1000)
    return () => clearInterval(t)
  }, [auction.ends_at])

  // Flash when bid changes (real-time subscription would update this)
  useEffect(() => {
    if (auction.current_bid !== prevBid) {
      setFlash(true)
      setTimeout(() => setFlash(false), 800)
      setPrevBid(auction.current_bid)
    }
  }, [auction.current_bid])

  const artwork = auction.artwork

  return (
    <Link href={`/auction/${auction.id}`}
      className={cn('group chitr-card block overflow-hidden border-2 border-transparent hover:border-[var(--amber)] transition-all duration-300', className)}>

      {/* Image */}
      <div className="artwork-image-wrap relative bg-[var(--brand-light)] aspect-[4/3]">
        {!imgError && artwork?.thumbnail ? (
          <Image src={artwork.thumbnail} alt={artwork.title} fill
            className="object-cover" onError={() => setImgError(true)}
            sizes="(max-width: 640px) 100vw, 50vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-20">🎨</span>
          </div>
        )}

        {/* Live badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>

        {/* Bid count */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-[var(--muted)] z-10">
          <Gavel size={11} />
          {auction.bid_count} bids
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-[var(--muted)] mb-1">
          {artwork?.artist?.full_name}
        </p>
        <h3 className="font-display text-lg leading-snug mb-3 group-hover:text-[var(--brand)] transition-colors">
          {artwork?.title}
        </h3>

        {/* Current bid */}
        <div className={cn('rounded-lg p-3 mb-3 transition-colors', flash ? 'bid-updated bg-[var(--amber-light)]' : 'bg-[var(--brand-light)]')}>
          <p className="text-xs text-[var(--muted)] mb-0.5 flex items-center gap-1">
            <TrendingUp size={11} /> Current Bid
          </p>
          <p className="text-2xl font-bold text-[var(--brand)]">
            {formatCurrency(auction.current_bid || auction.starting_price)}
          </p>
        </div>

        {/* Countdown */}
        {!time.expired ? (
          <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
            <Clock size={13} className="text-[var(--amber)]" />
            <span className="font-medium text-[var(--amber)]">
              {time.days > 0 && `${time.days}d `}
              {String(time.hours).padStart(2,'0')}:{String(time.mins).padStart(2,'0')}:{String(time.secs).padStart(2,'0')}
            </span>
            <span>remaining</span>
          </div>
        ) : (
          <p className="text-xs text-red-500 font-medium">Auction Ended</p>
        )}
      </div>
    </Link>
  )
}
