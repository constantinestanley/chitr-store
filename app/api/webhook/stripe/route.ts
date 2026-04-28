import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object as Stripe.CheckoutSession
    const meta     = session.metadata!
    const shipping = session.shipping_details

    // 1. Create order
    const { data: order } = await supabase.from('orders').insert({
      buyer_id:                 meta.buyer_id,
      artwork_id:               meta.artwork_id,
      amount:                   parseInt(meta.price),
      currency:                 'INR',
      status:                   'paid',
      stripe_payment_intent_id: session.payment_intent as string,
      is_print:                 meta.type === 'print',
      print_size:               meta.print_size || null,
      shipping_address: shipping ? {
        full_name:     shipping.name,
        address_line1: shipping.address?.line1,
        address_line2: shipping.address?.line2,
        city:          shipping.address?.city,
        state:         shipping.address?.state,
        postal_code:   shipping.address?.postal_code,
        country:       shipping.address?.country,
        phone:         session.customer_details?.phone || '',
      } : {},
    }).select().single()

    // 2. Mark artwork as sold (if original)
    if (meta.type === 'original') {
      await supabase.from('artworks').update({ status: 'sold' }).eq('id', meta.artwork_id)
    }

    // 3. Generate provenance certificate
    const certNumber = `CHT-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`
    await supabase.from('certificates').insert({
      artwork_id:         meta.artwork_id,
      artist_id:          meta.artist_id,
      buyer_id:           meta.buyer_id,
      certificate_number: certNumber,
      image_hash:         '', // populated by background job
      issued_at:          new Date().toISOString(),
      metadata:           { order_id: order?.id, session_id: session.id, price: meta.price },
    })

    // 4. Update artwork certificate_id
    const { data: cert } = await supabase.from('certificates')
      .select('id').eq('certificate_number', certNumber).single()
    if (cert) await supabase.from('artworks').update({ certificate_id: cert.id }).eq('id', meta.artwork_id)

    // 5. Email buyer
    const { data: artwork } = await supabase.from('artworks').select('title').eq('id', meta.artwork_id).single()
    const { data: buyer }   = await supabase.from('profiles').select('full_name, email').eq('id', meta.buyer_id).single()

    if (buyer?.email) {
      await resend.emails.send({
        from:    `Chitr.store <${process.env.RESEND_FROM_EMAIL}>`,
        to:      buyer.email,
        subject: `Your purchase is confirmed — ${artwork?.title}`,
        html: `
          <h2>Thank you, ${buyer.full_name}!</h2>
          <p>Your purchase of <strong>${artwork?.title}</strong> is confirmed.</p>
          <p>Certificate Number: <strong>${certNumber}</strong></p>
          <p>We'll notify you once your artwork is shipped.</p>
          <p>— Chitr.store Team</p>
        `,
      })
    }

    // 6. Email artist
    const { data: artist } = await supabase.from('profiles')
      .select('full_name, email').eq('id', meta.artist_id).single()
    if (artist?.email) {
      const payout = Math.round(parseInt(meta.price) * 0.88)
      await resend.emails.send({
        from:    `Chitr.store <${process.env.RESEND_FROM_EMAIL}>`,
        to:      artist.email,
        subject: `Congratulations! Your artwork "${artwork?.title}" has sold`,
        html: `
          <h2>Congratulations, ${artist.full_name}!</h2>
          <p>Your artwork <strong>${artwork?.title}</strong> has been sold for ₹${parseInt(meta.price).toLocaleString('en-IN')}.</p>
          <p>Your payout of <strong>₹${payout.toLocaleString('en-IN')}</strong> will be processed in 7 days.</p>
          <p>— Chitr.store Team</p>
        `,
      })
    }
  }

  return NextResponse.json({ received: true })
}

export const config = { api: { bodyParser: false } }
