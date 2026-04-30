import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { title, medium, image_url } = await req.json()
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  try {
    const messages: Anthropic.MessageParam[] = [{
      role: 'user',
      content: image_url
        ? [
            { type: 'image', source: { type: 'url', url: image_url } },
            { type: 'text',  text: `Write a compelling, SEO-optimised description for this artwork titled "${title}" created in ${medium || 'mixed'} medium. 
              The description should:
              - Be 80-120 words
              - Describe the visual elements, mood, and artistic technique
              - Mention Kerala cultural context if relevant from the image
              - Be suitable for an art marketplace listing
              - End with a sentence about what makes it special for collectors
              Return only the description text, no preamble.` }
          ]
        : `Write a compelling, SEO-optimised description for an artwork titled "${title}" created in ${medium || 'mixed'} medium.
           The artwork is by a Kerala artist. The description should:
           - Be 80-120 words
           - Evoke the mood and artistic technique suggested by the title
           - Reference Kerala artistic traditions if relevant
           - Be suitable for an art marketplace listing
           Return only the description text, no preamble.`,
    }]

    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages,
    })

    const description = (response.content[0] as Anthropic.TextBlock).text

    return NextResponse.json({ description })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
