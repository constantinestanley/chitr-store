import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// GET /api/auctions
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { searchParams } = new URL(req.url)
  const status   = searchParams.get('status') || 'active'
  const limit    = parseInt(searchParams.get('limit') || '20')

  const { data, error } = await supabase
    .from('auctions')
    .select('*, artwork:artworks(*, artist:profiles(*))')
    .eq('status', status)
    .order('ends_at', { ascending: true })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/auctions — create auction (artist only)
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Verify artist role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'artist' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Only artists can create auctions' }, { status: 403 })
  }

  const { artwork_id, starting_price, reserve_price, starts_at, ends_at } = await req.json()

  // Verify artist owns the artwork
  const { data: artwork } = await supabase
    .from('artworks')
    .select('id, status, artist_id')
    .eq('id', artwork_id)
    .eq('artist_id', user.id)
    .single()

  if (!artwork) return NextResponse.json({ error: 'Artwork not found or not owned by you' }, { status: 404 })
  if (artwork.status !== 'active') return NextResponse.json({ error: 'Artwork must be active to auction' }, { status: 400 })

  const now        = new Date()
  const startDate  = new Date(starts_at || now)
  const auctionStatus = startDate <= now ? 'active' : 'upcoming'

  const { data: auction, error } = await supabase.from('auctions').insert({
    artwork_id,
    artist_id:     user.id,
    starting_price,
    reserve_price: reserve_price || null,
    current_bid:   0,
    bid_count:     0,
    status:        auctionStatus,
    starts_at:     startDate.toISOString(),
    ends_at:       new Date(ends_at).toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: auction }, { status: 201 })
}
