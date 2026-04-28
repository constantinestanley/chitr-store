'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import ArtworkCard from '@/components/artwork/ArtworkCard'
import { createClient } from '@/lib/supabase'
import type { Artwork, ArtworkFilters, Medium } from '@/types'

const MEDIUMS: { value: Medium | 'all'; label: string }[] = [
  { value: 'all',        label: 'All Mediums' },
  { value: 'oil',        label: 'Oil' },
  { value: 'acrylic',    label: 'Acrylic' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'charcoal',   label: 'Charcoal' },
  { value: 'digital',    label: 'Digital' },
  { value: 'mixed',      label: 'Mixed Media' },
  { value: 'print',      label: 'Print' },
  { value: 'sculpture',  label: 'Sculpture' },
]

const SORTS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular',    label: 'Most Popular' },
]

export default function GalleryClient() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [medium, setMedium]     = useState<string>('all')
  const [sort, setSort]         = useState('newest')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const PER_PAGE = 12

  const supabase = createClient()

  const fetchArtworks = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('artworks')
      .select('*, artist:profiles(*)', { count: 'exact' })
      .eq('status', 'active')

    if (search)            query = query.ilike('title', `%${search}%`)
    if (medium !== 'all')  query = query.eq('medium', medium)
    if (minPrice)          query = query.gte('price', parseInt(minPrice))
    if (maxPrice)          query = query.lte('price', parseInt(maxPrice))

    switch (sort) {
      case 'price_asc':  query = query.order('price', { ascending: true });  break
      case 'price_desc': query = query.order('price', { ascending: false }); break
      case 'popular':    query = query.order('views', { ascending: false });  break
      default:           query = query.order('created_at', { ascending: false })
    }

    const from = (page - 1) * PER_PAGE
    query = query.range(from, from + PER_PAGE - 1)

    const { data, count } = await query
    setArtworks((data as Artwork[]) || [])
    setTotal(count || 0)
    setLoading(false)
  }, [search, medium, sort, minPrice, maxPrice, page])

  useEffect(() => {
    const t = setTimeout(fetchArtworks, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchArtworks])

  const clearFilters = () => {
    setSearch(''); setMedium('all'); setSort('newest')
    setMinPrice(''); setMaxPrice(''); setPage(1)
  }
  const hasFilters = search || medium !== 'all' || minPrice || maxPrice

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center mb-8">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search artworks..."
            className="chitr-input pl-9 py-2.5 text-sm"
          />
        </div>

        {/* Medium */}
        <select value={medium} onChange={e => { setMedium(e.target.value); setPage(1) }}
          className="chitr-input py-2.5 text-sm w-auto">
          {MEDIUMS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        {/* Sort */}
        <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
          className="chitr-input py-2.5 text-sm w-auto">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* Price filter toggle */}
        <button onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 chitr-btn-secondary py-2.5 text-sm px-4">
          <SlidersHorizontal size={15} />
          Price
        </button>

        {hasFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-red-500 transition-colors">
            <X size={15} /> Clear
          </button>
        )}
      </div>

      {/* Price range */}
      {showFilters && (
        <div className="flex gap-3 mb-6 items-center">
          <span className="text-sm text-[var(--muted)]">Price (₹):</span>
          <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
            placeholder="Min" className="chitr-input py-2 text-sm w-28" />
          <span className="text-[var(--muted)]">—</span>
          <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
            placeholder="Max" className="chitr-input py-2 text-sm w-28" />
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-[var(--muted)] mb-6">
        {loading ? 'Loading…' : `${total.toLocaleString()} artwork${total !== 1 ? 's' : ''} found`}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="artwork-grid">
          {Array.from({ length: PER_PAGE }).map((_, i) => (
            <div key={i} className="chitr-card overflow-hidden">
              <div className="skeleton aspect-[4/3]" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-5 w-40" />
                <div className="skeleton h-6 w-20 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : artworks.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🎨</p>
          <p className="font-display text-2xl text-[var(--dark)] mb-2">No artworks found</p>
          <p className="text-[var(--muted)]">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="artwork-grid">
          {artworks.map(a => <ArtworkCard key={a.id} artwork={a} />)}
        </div>
      )}

      {/* Pagination */}
      {total > PER_PAGE && (
        <div className="flex justify-center gap-2 mt-12">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="chitr-btn-secondary px-5 py-2.5 text-sm disabled:opacity-40">
            Previous
          </button>
          <span className="flex items-center px-4 text-sm text-[var(--muted)]">
            Page {page} of {Math.ceil(total / PER_PAGE)}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / PER_PAGE)}
            className="chitr-btn-secondary px-5 py-2.5 text-sm disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
