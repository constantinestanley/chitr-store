import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Package, Award, ExternalLink } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Order } from '@/types'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700' },
  paid:      { label: 'Paid',      color: 'bg-blue-100 text-blue-700' },
  shipped:   { label: 'Shipped',   color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600' },
}

export default async function BuyerOrdersPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('*, artwork:artworks(id, title, thumbnail, artist:profiles(full_name))')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 bg-[var(--bg)]">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="font-display text-4xl text-[var(--dark)]">My Orders</h1>
            <p className="text-[var(--muted)] mt-1">Welcome back, {(profile as any)?.full_name?.split(' ')[0]}</p>
          </div>

          {!orders || orders.length === 0 ? (
            <div className="chitr-card p-16 text-center">
              <Package size={48} className="mx-auto text-[var(--muted)] mb-4 opacity-40" />
              <p className="font-display text-2xl text-[var(--dark)] mb-2">No orders yet</p>
              <p className="text-[var(--muted)] mb-6">Start browsing Kerala art and make your first purchase.</p>
              <Link href="/gallery" className="chitr-btn-primary">Browse Gallery</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {(orders as Order[]).map(order => {
                const art    = order.artwork as any
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                return (
                  <div key={order.id} className="chitr-card p-5 flex items-start gap-5">
                    {/* Thumbnail */}
                    <div className="w-20 h-16 rounded-xl overflow-hidden bg-[var(--brand-light)] flex-shrink-0">
                      {art?.thumbnail && (
                        <Image src={art.thumbnail} alt={art.title} width={80} height={64} className="object-cover w-full h-full" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div>
                          <Link href={`/artwork/${art?.id}`}
                            className="font-medium text-[var(--dark)] hover:text-[var(--brand)] transition-colors line-clamp-1">
                            {art?.title}
                          </Link>
                          <p className="text-sm text-[var(--muted)]">by {art?.artist?.full_name}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        <p className="font-bold text-[var(--brand)]">{formatCurrency(order.amount)}</p>
                        <p className="text-xs text-[var(--muted)]">{formatDate(order.created_at)}</p>
                        {order.is_print && (
                          <span className="text-xs bg-[var(--amber-light)] text-[var(--amber)] px-2 py-0.5 rounded-full">Print</span>
                        )}
                      </div>

                      {order.tracking_number && (
                        <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-1">
                          <Package size={11} /> Tracking: <span className="font-mono">{order.tracking_number}</span>
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {order.invoice_url && (
                        <a href={order.invoice_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[var(--brand)] hover:underline">
                          <ExternalLink size={12} /> Invoice
                        </a>
                      )}
                      <Link href={`/certificate/${order.artwork_id}`}
                        className="flex items-center gap-1 text-xs text-[var(--teal)] hover:underline">
                        <Award size={12} /> Certificate
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
