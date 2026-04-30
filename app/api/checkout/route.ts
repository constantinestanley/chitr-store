import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { artwork_id, type = 'original', print_size } = await req.json()

  // Fetch artwork
  const { data: artwork, error } = await supabase
    .from('artworks')
    .select('*, artist:profiles(*)')
    .eq('id', artwork_id)
    .eq('status', 'active')
    .single()

  if (error || !artwork) return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })

  const price    = type === 'print' ? artwork.print_price : artwork.price
  const gstRate  = 0.05 // 5% GST on fine art
  const gstAmt   = Math.round(price * gstRate)
  const total    = price + gstAmt

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'inr',
        product_data: {
          name:        `${artwork.title}${type === 'print' ? ' (Print)' : ''} by ${artwork.artist?.full_name}`,
          description: artwork.description.slice(0, 500),
          images:      [artwork.thumbnail],
          metadata:    { artwork_id, type, artist_id: artwork.artist_id },
        },
        unit_amount: total * 100, // paise
      },
      quantity: 1,
    }],
    metadata: {
      artwork_id,
      buyer_id:  user.id,
      artist_id: artwork.artist_id,
      type,
      price:     price.toString(),
      gst_amt:   gstAmt.toString(),
      print_size: print_size || '',
    },
    customer_email: user.email,
    success_url:    `${appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:     `${appUrl}/artwork/${artwork_id}`,
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: ['IN','AE','GB','US','AU','CA','SG','MY'],
    },
  })

  return NextResponse.json({ url: session.url })
}
