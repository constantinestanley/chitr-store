import { Suspense } from 'react'
import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GalleryClient from './GalleryClient'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Browse original Kerala paintings, watercolors, acrylics, and prints from verified Kerala artists.',
}

export default function GalleryPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        {/* Header */}
        <div className="bg-[var(--brand-light)] py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-display text-5xl text-[var(--dark)] mb-3">The Gallery</h1>
            <p className="text-[var(--muted)] text-lg">
              Original works from Kerala&apos;s finest artists — verified, certified, and ready to ship worldwide.
            </p>
          </div>
        </div>
        <Suspense fallback={<GalleryLoading />}>
          <GalleryClient />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}

function GalleryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="artwork-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="chitr-card overflow-hidden">
            <div className="skeleton aspect-[4/3]" />
            <div className="p-4 space-y-2">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-6 w-20 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
