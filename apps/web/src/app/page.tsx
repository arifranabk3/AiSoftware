import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { ARTICLES } from '@/lib/articles';
import {
  Cpu,
  Shield,
  Zap,
  ArrowRight,
  BookOpen,
  Terminal,
  Layers,
  CheckCircle,
  Clock,
  Sparkles,
  Lock
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AIsoftware — Autonomous Enterprise Systems & Open Engineering Standards',
  description:
    'Sovereign multi-agent engineering, zero-marginal-cost automation methodologies, and production-tested architectures for autonomous software businesses.',
  alternates: {
    canonical: 'https://ai-software-theta.vercel.app/'
  }
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200/80 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Open Engineering & Sovereign Agent Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Sovereign Multi-Agent Systems. Zero Marginal Cost.
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed font-normal">
              AIsoftware builds open-source architectures, educational guides, and production toolsets for running autonomous digital enterprises without recurring cloud API fees or vendor lock-in.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-200"
              >
                <span>Explore The Blueprint</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-sm"
              >
                <BookOpen className="h-4 w-4 text-slate-500" />
                <span>Read Technical Guides</span>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-1.5 px-4 py-3.5 rounded-xl text-slate-500 hover:text-slate-800 font-medium text-xs transition-colors"
              >
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>Command Center Dashboard</span>
              </Link>
            </div>

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>100% Sovereign Local Inference</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>Deterministic Safety Gates</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>Fault-Tolerant Queue Backing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Engineering Pillars */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
              System Capabilities
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Architected for Reliability and Cost Control
            </h3>
            <p className="text-sm text-slate-600">
              Modern agent frameworks fail when they run in unconstrained loops. We design deterministic pipelines that prioritize human oversight and predictable compute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Cpu className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Zero-Cost Inference</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect directly to local quantized models (Qwen 2.5 7B, Llama 3.2 3B) via Ollama. Eliminate $500+/month in unpredictable per-token API subscriptions.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Deterministic Approval Gates</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Critical operations (deployments, financial events, public content distribution) pause automatically in storage until verified by an authorized human operator.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Distributed Job Queues</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Powered by Fastify, BullMQ, and Redis. Protect your infrastructure against memory spikes and timeouts with isolated worker pools and atomic retry logic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
                Engineering Library
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Latest Technical Deep-Dives
              </h2>
            </div>
            <Link
              href="/articles"
              className="mt-4 md:mt-0 inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>View all articles</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ARTICLES.map((article) => (
              <article
                key={article.slug}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      {article.category}
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{article.readTime}</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    <Link
                      href={`/articles/${article.slug}`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      {article.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {article.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {article.author}
                  </span>
                  <Link
                    href={`/articles/${article.slug}`}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <span>Read</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Digital Product Banner */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="space-y-4 max-w-xl">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold">
                Comprehensive Technical Field Guide
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                The Zero-Cost Autonomous Agency Blueprint
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                A 15-chapter master guide detailing production Docker setups, local model quantization, Fastify-BullMQ pipelines, and 55 specialist agent prompt architectures.
              </p>
              <div className="flex items-center space-x-4 text-xs text-slate-400 pt-2">
                <span>• 15 Complete Chapters</span>
                <span>• Instant PDF + Markdown</span>
                <span>• Launch Price: $19</span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <Link
                href="/products"
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/30"
              >
                <span>View Product Details</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
