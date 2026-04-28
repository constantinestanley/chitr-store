import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Award, Truck, RotateCcw, Share2 } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BuyButton from '@/components/artwork/BuyButton'
import { createServerSupabaseClient } from '@/lib/supabase'
import { formatCurrency, artworkDimensions, formatDate } from '@/lib/utils'
import type { Artwork } from '@/types'

interface Props { params: { id: string } }

async function getArtwork(id: string): Promise<Artwork | null> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('artworks')
    .select('*, artist:profiles(*), category:categories(*)')
    .eq('id', id)
    .single()
  return data as Artwork | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artwork = await getArtwork(params.id)
  if (!artwork) return { title: 'Artwork Not Found' }
  return {
    title: artwork.title,
    description: artwork.description.slice(0, 160),
    openGraph: {
      title:  artwork.title,
      images: [{ url: artwork.thumbnail }],
    },
  }
}

export default async function ArtworkPage({ params }: Props) {
  const artwork = await getArtwork(params.id)
  if (!artwork) notFound()

  // Increment view count
  const supabase = createServerSupabaseClient()
  await supabase.from('artworks').update({ views: artwork.views + 1 }).eq('id', artwork.id)

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            {/* Images */}
            <div className="space-y-4 sticky top-24">
              <div className="relative bg-[var(--brand-light)] rounded-2xl overflow-hidden aspect-[4/3]">
                <Image
                  src={artwork.thumbnail}
                  alt={artwork.title}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                {artwork.certificate_id && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 text-xs font-medium text-[var(--teal)] shadow-sm">
                    <Award size={13} />
                    Blockchain Certified
                  </div>
                )}
              </div>
              {/* Thumbnail strip */}
              {artwork.images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {artwork.images.map((img, i) => (
                    <div key={i} className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--brand-light)]">
                      <Image src={img} alt={`View ${i+1}`} fill className="object-cover" sizes="80px" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <Link href="/gallery" className="hover:text-[var(--brand)]">Gallery</Link>
                <span>/</span>
                <span className="capitalize">{artwork.medium}</span>
              </div>

              {/* Title */}
              <div>
                <h1 className="font-display text-4xl lg:text-5xl text-[var(--dark)] mb-2">
                  {artwork.title}
                </h1>
                <Link href={`/artist/${artwork.artist_id}`}
                  className="text-[var(--brand)] font-medium hover:underline">
                  by {artwork.artist?.full_name}
                </Link>
              </div>

              {/* Price */}
              <div className="bg-[var(--brand-light)] rounded-2xl p-6">
                <p className="text-sm text-[var(--muted)] mb-1">Original Price</p>
                <p className="font-display text-4xl text-[var(--brand)] font-bold mb-1">
                  {formatCurrency(artwork.price)}
                </p>
                {artwork.is_print_available && artwork.print_price && (
                  <p className="text-sm text-[var(--muted)]">
                    Prints available from {formatCurrency(artwork.print_price)}
                  </p>
                )}
                <div className="mt-4 space-y-2">
                  <BuyButton artwork={artwork} />
                  {artwork.is_print_available && (
                    <button className="chitr-btn-secondary w-full">
                      Order a Print
                    </button>
                  )}
                </div>
              </div>

              {/* Artwork details */}
              <div className="border border-[var(--border)] rounded-2xl p-6 space-y-4">
                <h2 className="font-semibold text-[var(--dark)]">Artwork Details</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Medium',     value: artwork.medium },
                    { label: 'Size',       value: artworkDimensions(artwork.width_cm, artwork.height_cm) },
                    { label: 'Year',       value: artwork.year_created },
                    { label: 'Original',   value: artwork.is_original ? 'Yes (1 of 1)' : 'Limited Edition' },
                    { label: 'Category',   value: artwork.category?.name || '—' },
                    { label: 'Listed',     value: formatDate(artwork.created_at) },
                  ].map(d => (
                    <div key={d.label}>
                      <p className="text-[var(--muted)] text-xs mb-0.5">{d.label}</p>
                      <p className="font-medium text-[var(--dark)] capitalize">{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="font-semibold text-[var(--dark)] mb-2">About This Work</h2>
                <p className="text-[var(--muted)] leading-relaxed">{artwork.description}</p>
              </div>

              {/* Tags */}
              {artwork.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {artwork.tags.map(tag => (
                    <span key={tag} className="bg-[var(--brand-light)] text-[var(--brand)] text-xs font-medium px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs text-[var(--muted)]">
                {[
                  { icon: <Award size={20} />, label: 'Certified Authentic' },
                  { icon: <Truck size={20} />, label: 'Worldwide Shipping' },
                  { icon: <RotateCcw size={20} />, label: '7-Day Returns' },
                ].map(b => (
                  <div key={b.label} className="bg-[var(--brand-light)] rounded-xl p-3 flex flex-col items-center gap-1.5">
                    <span className="text-[var(--brand)]">{b.icon}</span>
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
