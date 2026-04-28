import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { ArtworkFilters } from '@/types'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { searchParams } = new URL(req.url)

  const filters: ArtworkFilters = {
    search:   searchParams.get('search') || undefined,
    medium:   searchParams.get('medium') as any || undefined,
    min_price: searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : undefined,
    max_price: searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined,
    sort:     searchParams.get('sort') as any || 'newest',
    page:     parseInt(searchParams.get('page') || '1'),
    per_page: parseInt(searchParams.get('per_page') || '12'),
  }

  let query = supabase
    .from('artworks')
    .select('*, artist:profiles(id, full_name, avatar_url)', { count: 'exact' })
    .eq('status', 'active')

  if (filters.search)    query = query.ilike('title', `%${filters.search}%`)
  if (filters.medium)    query = query.eq('medium', filters.medium)
  if (filters.min_price) query = query.gte('price', filters.min_price)
  if (filters.max_price) query = query.lte('price', filters.max_price)

  switch (filters.sort) {
    case 'price_asc':  query = query.order('price', { ascending: true });  break
    case 'price_desc': query = query.order('price', { ascending: false }); break
    case 'popular':    query = query.order('views', { ascending: false });  break
    default:           query = query.order('created_at', { ascending: false })
  }

  const from = ((filters.page || 1) - 1) * (filters.per_page || 12)
  query = query.range(from, from + (filters.per_page || 12) - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    total: count || 0,
    page: filters.page,
    per_page: filters.per_page,
    total_pages: Math.ceil((count || 0) / (filters.per_page || 12)),
  })
}
