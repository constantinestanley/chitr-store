import Link from 'next/link'
import { CheckCircle, Award, Package, ArrowRight } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

export default function OrderSuccessPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 bg-[var(--brand-light)] flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="chitr-card p-10 text-center">
            {/* Success icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>

            <h1 className="font-display text-4xl text-[var(--dark)] mb-3">
              Congratulations!
            </h1>
            <p className="text-[var(--muted)] leading-relaxed mb-8">
              Your purchase is confirmed. You&apos;ll receive a confirmation email shortly,
              along with your provenance certificate once the artwork ships.
            </p>

            {/* Info cards */}
            <div className="space-y-3 mb-8 text-left">
              {[
                {
                  icon: <Award size={18} className="text-[var(--brand)]" />,
                  title: 'Provenance Certificate',
                  desc: 'Your blockchain certificate of authenticity will be emailed within 24 hours.',
                },
                {
                  icon: <Package size={18} className="text-[var(--amber)]" />,
                  title: 'Shipping',
                  desc: 'Your artwork will be carefully packaged and shipped within 5–7 business days.',
                },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3 bg-[var(--brand-light)] rounded-xl p-4">
                  <span className="mt-0.5">{item.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-[var(--dark)]">{item.title}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/gallery" className="chitr-btn-primary flex items-center justify-center gap-2">
                Continue Browsing <ArrowRight size={16} />
              </Link>
              <Link href="/buyer/orders" className="chitr-btn-secondary">
                View My Orders
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
