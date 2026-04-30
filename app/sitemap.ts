import { MetadataRoute } from 'next'

import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()
  const base     = 'https://chitr.store'

  // Fetch active artworks
  const { data: artworks } = await supabase
    .from('artworks')
    .select('id, updated_at')
    .eq('status', 'active')
    .limit(1000)

  // Fetch artist profiles
  const { data: artists } = await supabase
    .from('profiles')
    .select('id, updated_at')
    .eq('role', 'artist')
    .limit(500)

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/gallery`, lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/auction`, lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/artists`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/search`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const artworkRoutes: MetadataRoute.Sitemap = (artworks || []).map(a => ({
    url:              `${base}/artwork/${a.id}`,
    lastModified:     new Date(a.updated_at),
    changeFrequency:  'weekly' as const,
    priority:         0.8,
  }))

  const artistRoutes: MetadataRoute.Sitemap = (artists || []).map(a => ({
    url:              `${base}/artist/${a.id}`,
    lastModified:     new Date(a.updated_at),
    changeFrequency:  'weekly' as const,
    priority:         0.7,
  }))

  return [...staticRoutes, ...artworkRoutes, ...artistRoutes]
}
