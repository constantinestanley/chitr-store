import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { artwork_id, image_url, title, medium } = await req.json()

  try {
    const prompt = `Analyse this artwork and return a JSON object with these fields:
{
  "tags": ["tag1","tag2",...],       // 5-10 descriptive tags (style, theme, mood, colour, technique)
  "mood": "string",                  // one word mood (e.g. serene, vibrant, melancholic)
  "dominant_colors": ["color1",...], // 2-4 dominant color names
  "style": "string",                 // artistic style (e.g. impressionist, realistic, abstract)
  "subject": "string"                // main subject (e.g. landscape, portrait, abstract)
}
Artwork: "${title}" — Medium: ${medium}
Return ONLY valid JSON. No preamble, no markdown.`

    const messages: Anthropic.MessageParam[] = [{
      role: 'user',
      content: image_url
        ? [
            { type: 'image', source: { type: 'url', url: image_url } },
            { type: 'text', text: prompt }
          ]
        : prompt,
    }]

    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages,
    })

    const raw  = (response.content[0] as Anthropic.TextBlock).text
    const data = JSON.parse(raw.replace(/```json|```/g, '').trim())

    // Update artwork with AI-generated tags if artwork_id provided
    if (artwork_id && data.tags) {
      await supabase.from('artworks')
        .update({ tags: data.tags })
        .eq('id', artwork_id)
        .eq('artist_id', user.id)
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
