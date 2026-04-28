'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ShoppingBag, Loader2 } from 'lucide-react'
import type { Artwork } from '@/types'

export default function BuyButton({ artwork }: { artwork: Artwork }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleBuy = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artwork_id: artwork.id, type: 'original' }),
      })
      const data = await res.json()
      if (data.url) {
        router.push(data.url) // redirect to Stripe Checkout
      } else if (data.error === 'unauthorized') {
        router.push('/auth/login?redirect=/artwork/' + artwork.id)
      } else {
        toast.error(data.error || 'Something went wrong')
      }
    } catch {
      toast.error('Failed to initiate purchase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleBuy} disabled={loading} className="chitr-btn-primary w-full flex items-center justify-center gap-2">
      {loading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} />}
      {loading ? 'Processing…' : 'Buy Now'}
    </button>
  )
}
