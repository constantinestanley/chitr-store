import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title:       { default: 'Chitr.store — Kerala Art Marketplace', template: '%s | Chitr.store' },
  description: 'Buy and auction original Kerala paintings, contemporary Indian art, and exclusive prints. Supporting Kerala artists directly.',
  keywords:    ['Kerala art', 'buy paintings online', 'Indian art marketplace', 'Kerala artists', 'art auction India'],
  authors:     [{ name: 'Akani Enterprises' }],
  creator:     'Akani Enterprises',
  openGraph: {
    type:        'website',
    locale:      'en_IN',
    url:         'https://chitr.store',
    siteName:    'Chitr.store',
    title:       'Chitr.store — Kerala Art Marketplace',
    description: 'Buy and auction original Kerala and Indian art. Support artists directly.',
    images:      [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Chitr.store' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Chitr.store — Kerala Art Marketplace',
    description: 'Buy and auction original Kerala and Indian art.',
    images:      ['/og-image.jpg'],
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#5B2D8E',
  width:      'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-body)',
              borderRadius: '12px',
              border: '1px solid #E5E0ED',
            },
            success: { iconTheme: { primary: '#00897B', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#C62828', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
