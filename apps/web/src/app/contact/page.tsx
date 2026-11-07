import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { Mail, MessageSquare, Terminal, ShieldAlert, Clock, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us — AIsoftware Technical Support & Business Inquiries',
  description:
    'Get in touch with the AIsoftware team for technical questions, educational materials, and enterprise architecture consultations.',
  alternates: {
    canonical: 'https://ai-software-theta.vercel.app/contact'
  }
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-12">
        <div className="space-y-4">
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
            Communication & Inquiries
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Contact AIsoftware
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Have questions regarding our sovereign agent architectures, digital publications, or open-source tooling? We welcome engineering feedback and business inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Direct Inquiries</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For technical questions, merchant inquiries, or editorial correspondence:
              </p>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-mono text-xs text-slate-800 font-semibold break-all">
                contact@ai-software.local
              </div>
              <p className="text-[11px] text-slate-400">
                [Owner Note: Replace with active public support inbox prior to public advertising.]
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm text-xs text-slate-600">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span>Response Time</span>
              </div>
              <p className="leading-relaxed">
                Engineering and customer inquiries are reviewed within 24 to 48 business hours.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Send an Inquiry
            </h2>
            <p className="text-xs text-slate-500">
              Fill out this form to connect with our engineering and editorial team.
            </p>

            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Subject</label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all">
                  <option value="technical">Technical Architecture Question</option>
                  <option value="blueprint">Digital Blueprint Inquiry</option>
                  <option value="feedback">Editorial & Documentation Feedback</option>
                  <option value="other">General Inquiries</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your inquiry or question..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                />
              </div>

              <button
                type="button"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Submit Message
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 flex items-center space-x-2 text-[11px] text-slate-500">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span>We respect your privacy. No data is shared with third parties.</span>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

