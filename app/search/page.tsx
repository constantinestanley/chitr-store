'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Sparkles } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ArtworkCard from '@/components/artwork/ArtworkCard'
import type { Artwork } from '@/types'

export default function SearchPage() {
  const searchParams   = useSearchParams()
  const [query, setQuery]       = useState(searchParams.get('q') || '')
  const [results, setResults]   = useState<Artwork[]>([])
  const [loading, setLoading]   = useState(false)
  const [aiMode, setAiMode]     = useState(false)
  const [searched, setSearched] = useState(false)

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const endpoint = aiMode ? `/api/ai/search?q=${encodeURIComponent(q)}` : `/api/artworks?search=${encodeURIComponent(q)}&per_page=24`
      const res      = await fetch(endpoint)
      const data     = await res.json()
      setResults((data.data as Artwork[]) || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [aiMode])

  useEffect(() => {
    if (query) runSearch(query)
  }, []) // run once on mount if query in URL

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(query)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Search header */}
          <div className="max-w-2xl mx-auto mb-12">
            <h1 className="font-display text-4xl text-center text-[var(--dark)] mb-6">
              Search Artworks
            </h1>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search by title, artist, style, mood…"
                  className="chitr-input pl-12 py-4 text-base"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)] select-none">
                  <input type="checkbox" checked={aiMode} onChange={e => setAiMode(e.target.checked)}
                    className="w-4 h-4 accent-[var(--brand)]" />
                  <Sparkles size={14} className="text-[var(--brand)]" />
                  AI-powered semantic search
                </label>
                <button type="submit" disabled={loading || !query.trim()} className="chitr-btn-primary px-8 py-3 ml-auto">
                  {loading ? 'Searching…' : 'Search'}
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          {searched && !loading && (
            <p className="text-sm text-[var(--muted)] mb-6">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
              {aiMode && <span className="ml-2 text-[var(--brand)] text-xs">✨ AI search</span>}
            </p>
          )}

          {loading ? (
            <div className="artwork-grid">
              {Array.from({ length: 8 }).map((_, i) => (
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
          ) : searched && results.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-display text-2xl text-[var(--dark)] mb-2">No results found</p>
              <p className="text-[var(--muted)]">Try a different search term or enable AI search for better results</p>
            </div>
          ) : (
            <div className="artwork-grid">
              {results.map(a => <ArtworkCard key={a.id} artwork={a} />)}
            </div>
          )}

          {/* Suggestions if not searched yet */}
          {!searched && (
            <div className="max-w-2xl mx-auto">
              <p className="text-sm text-[var(--muted)] text-center mb-4">Try searching for:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Kerala landscape', 'monsoon painting', 'Kathakali', 'oil on canvas', 'abstract', 'portrait', 'watercolor', 'temple art'].map(s => (
                  <button key={s} onClick={() => { setQuery(s); runSearch(s) }}
                    className="bg-[var(--brand-light)] text-[var(--brand)] text-sm px-4 py-2 rounded-full hover:bg-[var(--brand)] hover:text-white transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
