import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

export const metadata: Metadata = {
  title: 'Terms and Conditions — AIsoftware',
  description:
    'AIsoftware Terms and Conditions governing website usage, digital product purchases, intellectual property, and liability limitations.',
  alternates: {
    canonical: 'https://ai-software-theta.vercel.app/terms'
  }
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-12">
        <div className="space-y-4">
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
            Legal & Terms
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Terms and Conditions
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: November 7, 2026
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this website (<code>https://ai-software-theta.vercel.app/</code>) or purchasing digital educational materials published by AIsoftware, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Intellectual Property Rights</h2>
            <p>
              All original content, technical documentation, design layouts, and software architectures published on AIsoftware are the intellectual property of AIsoftware unless otherwise noted. You may read, reference, and quote our educational articles with appropriate attribution. You may not republish, resell, or distribute our complete digital publications without written consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Digital Products & Refund Policy</h2>
            <p>
              Digital educational materials (such as The Zero-Cost Autonomous Agency Blueprint) are delivered immediately via digital download upon confirmed payment.
            </p>
            <p>
              Because digital downloads cannot be revoked once delivered, refund requests are evaluated on a case-by-case basis through our Merchant of Record platform for non-working, corrupted, or misdescribed deliverables within 14 days of purchase.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. Disclaimer of Warranties & Financial Disclaimers</h2>
            <p>
              The materials, code snippets, and operational configurations published by AIsoftware are provided on an &quot;as-is&quot; basis for educational and technical guidance. While our architectures are rigorously tested, we make no guarantees regarding specific commercial outcomes, income levels, or business profitability.
            </p>
            <p>
              Users are solely responsible for testing software configurations, securing their local environments, managing their own database backups, and maintaining appropriate system oversight.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">5. Limitation of Liability</h2>
            <p>
              In no event shall AIsoftware or its contributors be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our website, technical guides, or open-source software tools.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">6. Modifications to Terms</h2>
            <p>
              We reserve the right to revise these Terms and Conditions at any time. Changes will be posted to this page with an updated revision date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">7. Contact & Inquiries</h2>
            <p>
              For legal questions regarding these terms, please contact us via our{' '}
              <Link href="/contact" className="text-indigo-600 underline">
                Contact Page
              </Link>{' '}
              or email <code>contact@ai-software.local</code>.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

