import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { Terminal, Shield, Cpu, Layers, CheckCircle2, HeartHandshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — AIsoftware Autonomous Systems',
  description:
    'Learn about AIsoftware, our engineering philosophy of sovereign local inference, zero-marginal-cost automation, and deterministic human-in-the-loop safety.',
  alternates: {
    canonical: 'https://ai-software-theta.vercel.app/about'
  }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-12">
        <div className="space-y-4">
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
            About AIsoftware
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineering Sovereign, Zero-Cost Autonomous Infrastructure
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            AIsoftware is an independent technology project and engineering laboratory focused on building production-grade autonomous agent systems without reliance on expensive per-token cloud APIs.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Our Mission
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We believe that the future of artificial intelligence software should not be constrained by recurring token bills and cloud gatekeepers. Small engineering teams, independent agencies, and solo founders should have the sovereignty to execute recursive AI tasks, deep market research, and multi-department operations entirely on their own compute infrastructure.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Core Architectural Tenets
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-600 font-bold">
                  <Cpu className="h-4 w-4" />
                  <span>Sovereign Local Compute</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  We champion quantized open-weights models (Ollama, vLLM, llama.cpp) running on local hardware or sovereign cloud VMs, ensuring zero marginal inference expenditure.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-600 font-bold">
                  <Shield className="h-4 w-4" />
                  <span>Non-Bypassable Safety</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  We reject black-box autonomous systems. All critical operational actions—publishing, payments, infrastructure changes—must pass through cryptographic human approval gates.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center space-x-2 text-violet-600 font-bold">
                  <Layers className="h-4 w-4" />
                  <span>Queue-Centric Reliability</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  We build distributed architectures backed by Redis, BullMQ, and Fastify, ensuring resilient retries, fault isolation, and deterministic execution timelines.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center space-x-2 text-amber-600 font-bold">
                  <HeartHandshake className="h-4 w-4" />
                  <span>Open Educational Standards</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  We document actual implementations honestly. We do not publish exaggerated income claims, fabricated client testimonials, or speculative benchmarks.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Technology Stack
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our core command platform is implemented in modern TypeScript within a monorepo architecture:
            </p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-700 pt-1">
              <li className="p-2 rounded bg-slate-50 border border-slate-200/60">• Node.js 22 LTS</li>
              <li className="p-2 rounded bg-slate-50 border border-slate-200/60">• Next.js 15 (App Router)</li>
              <li className="p-2 rounded bg-slate-50 border border-slate-200/60">• Fastify REST & SSE</li>
              <li className="p-2 rounded bg-slate-50 border border-slate-200/60">• BullMQ & Redis</li>
              <li className="p-2 rounded bg-slate-50 border border-slate-200/60">• MongoDB Atlas</li>
              <li className="p-2 rounded bg-slate-50 border border-slate-200/60">• Ollama Local Engine</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Contact &amp; Editorial Inquiries
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              For research correspondence, feedback on published technical field guides, or partnership inquiries, reach out directly to our editorial staff at{' '}
              <a href="mailto:support@ai-software.com" className="text-indigo-600 underline font-mono">support@ai-software.com</a> or visit our{' '}
              <Link href="/contact" className="text-indigo-600 underline font-semibold">Contact Page</Link>.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

