import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import {
  BookOpen,
  FileText,
  CheckCircle2,
  Download,
  Shield,
  Layers,
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Digital Products & Technical Toolkits — AIsoftware',
  description:
    'Verified zero-marginal-cost technical guides, Docker orchestration blueprints, and prompt architectures for autonomous software operations.',
  alternates: {
    canonical: 'https://ai-software-theta.vercel.app/products'
  }
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <PublicHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="max-w-3xl space-y-4 mb-14">
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
            Official Publications
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Verified Digital Products & Engineering Blueprints
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Practical implementation packages created for developers, architects, and agency founders who require fully sovereign, zero-token-cost autonomous operations.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-100 pb-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Production Master Edition • v1.0</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                The Zero-Cost Autonomous Agency Blueprint
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                A 15-chapter technical master manual detailing how to run multi-department AI specialist teams powered completely by quantized local open-weights models, Fastify, and BullMQ.
              </p>
            </div>

            <div className="sm:text-right flex-shrink-0">
              <div className="text-3xl font-extrabold text-slate-900">$19.00</div>
              <div className="text-xs text-slate-500 font-medium">One-time purchase</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">Instant Digital Download</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Included Deliverables in Package:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2.5">
                <FileText className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-900">15-Chapter PDF Master Guide</span>
                  <span className="text-slate-500">12 typeset pages with diagrams and checklists.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2.5">
                <FileText className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-900">Editable Markdown Source</span>
                  <span className="text-slate-500">Complete raw markdown for personal customization.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2.5">
                <Layers className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-900">Docker Orchestration</span>
                  <span className="text-slate-500">Production docker-compose stack for Caddy, Fastify, and Ollama.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2.5">
                <Shield className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-900">55 Specialist Prompts</span>
                  <span className="text-slate-500">JSON prompts for SEO, research, copywriting, and security.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
            <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Storefront Merchant Verification Notice</span>
              <p className="leading-relaxed">
                The primary Lemon Squeezy storefront listing specification is prepared. In compliance with owner authorization protocols, actual transaction processing goes live upon owner merchant account activation.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Published by AIsoftware • Digital Goods Tax Compliant via Merchant of Record
            </div>
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <span>Inquire & Request Access</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

