import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const query    = new URL(req.url).searchParams.get('q')
  if (!query) return NextResponse.json({ error: 'q param required' }, { status: 400 })

  try {
    // Generate embedding for the search query
    const embeddingRes = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Extract 5 key search terms from this art search query for a Kerala art marketplace: "${query}"
Return only a comma-separated list of terms. No other text.`,
      }],
    })

    const terms = (embeddingRes.content[0] as Anthropic.TextBlock).text
      .split(',').map(t => t.trim()).filter(Boolean)

    // Build full-text search query from extracted terms
    const tsQuery = terms.map(t => `${t}:*`).join(' | ')

    const { data, error } = await supabase
      .from('artworks')
      .select('*, artist:profiles(id, full_name, avatar_url)')
      .eq('status', 'active')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${terms[0]}}`)
      .order('views', { ascending: false })
      .limit(20)

    if (error) throw error
    return NextResponse.json({ data, terms })
  } catch (err: any) {
    // Fallback to basic search
    const { data } = await supabase
      .from('artworks')
      .select('*, artist:profiles(id, full_name, avatar_url)')
      .eq('status', 'active')
      .ilike('title', `%${query}%`)
      .limit(20)

    return NextResponse.json({ data: data || [] })
  }
}
