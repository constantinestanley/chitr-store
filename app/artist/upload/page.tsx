'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Upload, X, Sparkles, Loader2, ImageIcon } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase'
import type { Medium } from '@/types'

const MEDIUMS: Medium[] = ['oil','acrylic','watercolor','charcoal','digital','mixed','sculpture','print','other']

export default function UploadPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [files, setFiles]         = useState<File[]>([])
  const [previews, setPreviews]   = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', price: '',
    print_price: '', medium: 'oil' as Medium,
    width_cm: '', height_cm: '', year_created: new Date().getFullYear().toString(),
    is_print_available: false, tags: '',
  })

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles = [...files, ...accepted].slice(0, 5)
    setFiles(newFiles)
    setPreviews(newFiles.map(f => URL.createObjectURL(f)))
  }, [files])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg','.jpeg','.png','.webp','.heic'] },
    maxSize: 20 * 1024 * 1024, maxFiles: 5,
  })

  const removeFile = (idx: number) => {
    setFiles(f => f.filter((_, i) => i !== idx))
    setPreviews(p => p.filter((_, i) => i !== idx))
  }

  const generateAIDescription = async () => {
    if (!form.title) { toast.error('Enter a title first'); return }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, medium: form.medium }),
      })
      const data = await res.json()
      if (data.description) {
        setForm(f => ({ ...f, description: data.description }))
        toast.success('AI description generated!')
      }
    } catch {
      toast.error('AI generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) { toast.error('Please upload at least one image'); return }
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      // Upload images to Supabase Storage
      const imageUrls: string[] = []
      for (const file of files) {
        const ext  = file.name.split('.').pop()
        const path = `artworks/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage.from('artwork-images').upload(path, file)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('artwork-images').getPublicUrl(path)
        imageUrls.push(publicUrl)
      }

      // Create artwork record
      const { error } = await supabase.from('artworks').insert({
        artist_id:          user.id,
        title:              form.title,
        description:        form.description,
        price:              parseInt(form.price),
        print_price:        form.is_print_available ? parseInt(form.print_price) : null,
        medium:             form.medium,
        width_cm:           parseFloat(form.width_cm),
        height_cm:          parseFloat(form.height_cm),
        year_created:       parseInt(form.year_created),
        is_original:        true,
        is_print_available: form.is_print_available,
        images:             imageUrls,
        thumbnail:          imageUrls[0],
        tags:               form.tags.split(',').map(t => t.trim()).filter(Boolean),
        status:             'pending_review',
      })

      if (error) throw error
      toast.success('Artwork submitted for review!')
      router.push('/artist/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 bg-[var(--bg)]">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="font-display text-4xl text-[var(--dark)] mb-2">Upload Artwork</h1>
            <p className="text-[var(--muted)]">Your work will be reviewed within 24 hours before going live.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image upload */}
            <div className="chitr-card p-6">
              <h2 className="font-semibold text-[var(--dark)] mb-4">Artwork Images <span className="text-red-500">*</span></h2>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[var(--brand)] bg-[var(--brand-light)]' : 'border-[var(--border)] hover:border-[var(--brand-mid)]'}`}>
                <input {...getInputProps()} />
                <Upload size={32} className="mx-auto text-[var(--muted)] mb-3" />
                <p className="text-[var(--dark)] font-medium mb-1">
                  {isDragActive ? 'Drop here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-[var(--muted)]">JPG, PNG, WEBP, HEIC · Max 20MB each · Up to 5 images</p>
              </div>
              {previews.length > 0 && (
                <div className="flex gap-3 mt-4 flex-wrap">
                  {previews.map((p, i) => (
                    <div key={i} className="relative w-24 h-20 rounded-lg overflow-hidden bg-[var(--brand-light)]">
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        <X size={10} />
                      </button>
                      {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-[var(--brand)] text-white text-[9px] text-center py-0.5">Cover</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="chitr-card p-6 space-y-5">
              <h2 className="font-semibold text-[var(--dark)]">Artwork Details</h2>

              <div>
                <label className="chitr-label">Title <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  required placeholder="e.g. Monsoon Reflections" className="chitr-input" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="chitr-label mb-0">Description <span className="text-red-500">*</span></label>
                  <button type="button" onClick={generateAIDescription} disabled={aiLoading}
                    className="flex items-center gap-1.5 text-xs text-[var(--brand)] font-medium hover:underline disabled:opacity-50">
                    {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Generate with AI
                  </button>
                </div>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  required rows={4} placeholder="Describe your artwork, inspiration, technique…"
                  className="chitr-input resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="chitr-label">Medium <span className="text-red-500">*</span></label>
                  <select value={form.medium} onChange={e => setForm(f => ({...f, medium: e.target.value as Medium}))}
                    className="chitr-input">
                    {MEDIUMS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="chitr-label">Year Created</label>
                  <input type="number" value={form.year_created} onChange={e => setForm(f => ({...f, year_created: e.target.value}))}
                    min="1900" max={new Date().getFullYear()} className="chitr-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="chitr-label">Width (cm) <span className="text-red-500">*</span></label>
                  <input type="number" value={form.width_cm} onChange={e => setForm(f => ({...f, width_cm: e.target.value}))}
                    required placeholder="60" className="chitr-input" />
                </div>
                <div>
                  <label className="chitr-label">Height (cm) <span className="text-red-500">*</span></label>
                  <input type="number" value={form.height_cm} onChange={e => setForm(f => ({...f, height_cm: e.target.value}))}
                    required placeholder="90" className="chitr-input" />
                </div>
              </div>

              <div>
                <label className="chitr-label">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))}
                  placeholder="landscape, kerala, monsoon, nature" className="chitr-input" />
              </div>
            </div>

            {/* Pricing */}
            <div className="chitr-card p-6 space-y-5">
              <h2 className="font-semibold text-[var(--dark)]">Pricing</h2>
              <div>
                <label className="chitr-label">Original Price (₹) <span className="text-red-500">*</span></label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))}
                  required min="500" placeholder="25000" className="chitr-input" />
                <p className="text-xs text-[var(--muted)] mt-1">You receive 88% after 12% platform commission</p>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_print_available}
                    onChange={e => setForm(f => ({...f, is_print_available: e.target.checked}))}
                    className="w-4 h-4 accent-[var(--brand)]" />
                  <span className="chitr-label mb-0">Offer prints of this artwork</span>
                </label>
              </div>

              {form.is_print_available && (
                <div>
                  <label className="chitr-label">Print Starting Price (₹)</label>
                  <input type="number" value={form.print_price} onChange={e => setForm(f => ({...f, print_price: e.target.value}))}
                    min="299" placeholder="1500" className="chitr-input" />
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={uploading}
              className="chitr-btn-primary w-full flex items-center justify-center gap-2 py-4 text-base">
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
              {uploading ? 'Uploading…' : 'Submit for Review'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
