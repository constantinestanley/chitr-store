'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Eye, Award } from 'lucide-react'
import { formatCurrency, truncate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Artwork } from '@/types'

interface Props {
  artwork: Artwork
  className?: string
}

export default function ArtworkCard({ artwork, className }: Props) {
  const [wishlisted, setWishlisted] = useState(false)
  const [imgError, setImgError]     = useState(false)

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    setWishlisted(w => !w)
    // TODO: persist via API
  }

  return (
    <Link href={`/artwork/${artwork.id}`} className={cn('group chitr-card block overflow-hidden', className)}>
      {/* Image */}
      <div className="artwork-image-wrap relative bg-[var(--brand-light)] aspect-[4/3]">
        {!imgError && artwork.thumbnail ? (
          <Image
            src={artwork.thumbnail}
            alt={artwork.title}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-20">🎨</span>
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow transition-transform hover:scale-110 z-10"
        >
          <Heart
            size={16}
            className={wishlisted ? 'fill-red-500 text-red-500' : 'text-[var(--muted)]'}
          />
        </button>

        {/* Certificate badge */}
        {artwork.certificate_id && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-[var(--teal)] z-10">
            <Award size={11} />
            Certified
          </div>
        )}

        {/* Print available badge */}
        {artwork.is_print_available && (
          <div className="absolute bottom-3 left-3 bg-[var(--amber)] text-white text-xs font-medium px-2 py-1 rounded-full z-10">
            Print Available
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Artist */}
        <p className="text-xs text-[var(--muted)] mb-1">
          {artwork.artist?.full_name || 'Unknown Artist'}
        </p>

        {/* Title */}
        <h3 className="font-display text-lg leading-snug mb-2 group-hover:text-[var(--brand)] transition-colors">
          {truncate(artwork.title, 50)}
        </h3>

        {/* Medium & dimensions */}
        <p className="text-xs text-[var(--muted)] capitalize mb-3">
          {artwork.medium} · {artwork.width_cm}×{artwork.height_cm} cm · {artwork.year_created}
        </p>

        {/* Price row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-[var(--brand)]">
              {formatCurrency(artwork.price)}
            </p>
            {artwork.is_print_available && artwork.print_price && (
              <p className="text-xs text-[var(--muted)]">
                Prints from {formatCurrency(artwork.print_price)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
            <Eye size={13} />
            {artwork.views}
          </div>
        </div>
      </div>
    </Link>
  )
}
