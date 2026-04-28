import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, TrendingUp, Eye, ShoppingBag, Award } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import type { Artwork, Order } from '@/types'

async function getDashboardData(userId: string) {
  const supabase = createServerSupabaseClient()
  const [artworksRes, ordersRes] = await Promise.all([
    supabase.from('artworks').select('*').eq('artist_id', userId).order('created_at', { ascending: false }),
    supabase.from('orders').select('*, artwork:artworks(title, thumbnail)').eq('artwork_id', userId).limit(10),
  ])
  return {
    artworks: (artworksRes.data as Artwork[]) || [],
    orders:   (ordersRes.data as Order[])   || [],
  }
}

const STATUS_COLORS: Record<string, string> = {
  draft:          'bg-gray-100 text-gray-600',
  pending_review: 'bg-amber-100 text-amber-700',
  active:         'bg-green-100 text-green-700',
  sold:           'bg-[var(--brand-light)] text-[var(--brand)]',
  archived:       'bg-red-100 text-red-600',
}

export default async function ArtistDashboard() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'artist') redirect('/')

  const { artworks } = await getDashboardData(user.id)

  const totalViews    = artworks.reduce((s, a) => s + a.views, 0)
  const totalSold     = artworks.filter(a => a.status === 'sold').length
  const totalEarnings = artworks.filter(a => a.status === 'sold').reduce((s, a) => s + Math.round(a.price * 0.88), 0)
  const activeCount   = artworks.filter(a => a.status === 'active').length

  const stats = [
    { label: 'Active Listings', value: activeCount, icon: <ShoppingBag size={20} />, color: 'brand' },
    { label: 'Total Views',     value: totalViews.toLocaleString(), icon: <Eye size={20} />, color: 'teal' },
    { label: 'Sold',            value: totalSold,  icon: <Award size={20} />, color: 'amber' },
    { label: 'Earnings',        value: formatCurrency(totalEarnings), icon: <TrendingUp size={20} />, color: 'brand' },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-4xl text-[var(--dark)]">
                Welcome, {profile?.full_name?.split(' ')[0]}
              </h1>
              <p className="text-[var(--muted)] mt-1">Manage your artworks and track your sales</p>
            </div>
            <Link href="/artist/upload" className="chitr-btn-primary flex items-center gap-2">
              <Plus size={18} /> Upload Artwork
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {stats.map(s => (
              <div key={s.label} className="chitr-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[var(--muted)]">{s.icon}</span>
                </div>
                <p className="text-2xl font-bold text-[var(--dark)] mb-1">{s.value}</p>
                <p className="text-sm text-[var(--muted)]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Artworks table */}
          <div className="chitr-card overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-semibold text-[var(--dark)]">Your Artworks ({artworks.length})</h2>
            </div>
            {artworks.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">🎨</p>
                <p className="font-display text-2xl text-[var(--dark)] mb-2">No artworks yet</p>
                <p className="text-[var(--muted)] mb-6">Upload your first artwork to start selling</p>
                <Link href="/artist/upload" className="chitr-btn-primary">Upload Now</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)]">
                      <th className="px-6 py-3">Artwork</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Price</th>
                      <th className="px-6 py-3">Views</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {artworks.map(artwork => (
                      <tr key={artwork.id} className="hover:bg-[var(--brand-light)]/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-10 rounded-lg bg-[var(--brand-light)] overflow-hidden flex-shrink-0">
                              {artwork.thumbnail && (
                                <img src={artwork.thumbnail} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-[var(--dark)] line-clamp-1">{artwork.title}</p>
                              <p className="text-xs text-[var(--muted)] capitalize">{artwork.medium}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[artwork.status] || ''}`}>
                            {artwork.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">{formatCurrency(artwork.price)}</td>
                        <td className="px-6 py-4 text-sm text-[var(--muted)]">{artwork.views}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/artwork/${artwork.id}`}
                              className="text-xs text-[var(--brand)] hover:underline">View</Link>
                            {artwork.status === 'active' && (
                              <Link href={`/artist/artwork/${artwork.id}/edit`}
                                className="text-xs text-[var(--muted)] hover:text-[var(--brand)]">Edit</Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
