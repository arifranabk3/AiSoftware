import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { Shield, Lock, Eye, Cookie, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — AIsoftware',
  description:
    'AIsoftware Privacy Policy detailing data collection, cookies, third-party advertising, Google AdSense disclosures, and user rights.',
  alternates: {
    canonical: 'https://ai-software-theta.vercel.app/privacy'
  }
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-12">
        <div className="space-y-4">
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
            Legal & Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: November 7, 2026
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Overview & Commitment</h2>
            <p>
              AIsoftware (&quot;we,&quot; &quot;our,&quot; or &quot;the Service&quot;) operates the public technology website and autonomous engineering platform at <code>https://ai-software-theta.vercel.app/</code>. We are committed to transparency regarding how information is handled when you interact with our website, read our technical documentation, or purchase digital publications.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Information We Collect</h2>
            <p>
              <strong>Directly Provided Information:</strong> When you submit an inquiry through our contact form or communicate with us, we collect the details you provide (such as your name, email address, and message content) solely to reply to your inquiry.
            </p>
            <p>
              <strong>Automatically Collected Log Data:</strong> Like most standard web platforms, our hosting infrastructure automatically logs basic technical data, including your IP address, browser type, operating system, referring URLs, and timestamps. This data is used exclusively for site reliability, security auditing, and server health.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Cookies and Advertising Technology Disclosures</h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <Cookie className="h-4 w-4 text-indigo-600" />
                <span>Google AdSense & Third-Party Advertising Disclosures</span>
              </div>
              <p>
                Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this website or other websites on the internet.
              </p>
              <p>
                Google&apos;s use of advertising cookies enables it and its partners to serve ads to users based on their visit to our sites and/or other sites on the Internet.
              </p>
              <p>
                Users may opt out of personalized advertising by visiting{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline"
                >
                  Google Ads Settings
                </a>
                . Alternatively, users can opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting{' '}
                <a
                  href="https://www.aboutads.info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline"
                >
                  www.aboutads.info
                </a>
                .
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. Merchant of Record & Payment Handling</h2>
            <p>
              When purchasing digital goods or educational blueprints from AIsoftware, transactions are processed through authorized Merchant of Record platforms (such as Lemon Squeezy). AIsoftware does not process, store, or have access to your full credit card numbers or banking information. Financial transactions are governed by the merchant platform&apos;s respective privacy terms and security certifications.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">5. Data Retention & Security</h2>
            <p>
              We implement industry-standard encryption, strict access controls, and security hygiene to prevent unauthorized access, alteration, or disclosure of user data. We do not sell, rent, or trade your personal contact information to any third party for marketing purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">6. User Rights</h2>
            <p>
              Depending on your jurisdiction (such as the European Union under GDPR or California under CCPA), you may have the right to request access to, correction of, or deletion of your personal contact information. To exercise any of these rights, please contact us via our official contact channel.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">7. Contact Information</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy, please reach out via our{' '}
              <Link href="/contact" className="text-indigo-600 underline">
                Contact Page
              </Link>{' '}
              or email <code>contact@ai-software.local</code>.
            </p>
            <p className="text-xs text-slate-400">
              [Owner Note: Update entity mailing address or physical jurisdiction in this section when registered corporate documentation is finalized.]
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

