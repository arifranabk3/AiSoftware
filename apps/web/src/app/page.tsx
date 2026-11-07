import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { ARTICLES } from '@/lib/articles';
import {
  Terminal,
  Shield,
  Layers,
  Cpu,
  ArrowRight,
  BookOpen,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  CheckCircle2,
  Bookmark
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AIsoftware — Engineering Architecture & Autonomous Systems Publication',
  description:
    'Independent technology editorial publication documenting sovereign multi-agent architectures, zero-marginal-cost local inference, and cryptographic governance for production software systems.',
  alternates: {
    canonical: 'https://ai-software-theta.vercel.app/'
  }
};

export default function HomePage() {
  // Sort or prioritize the featured article
  const featuredArticle = ARTICLES[0]; // Zero-Cost Local LLM Architecture
  // The exactly 9 article showcase
  const allArticles = ARTICLES.slice(0, 9);

  // Group topics from actual categories
  const categories = Array.from(new Set(ARTICLES.map((a) => a.category)));

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-200 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <PublicHeader />

      {/* Hero Section: Premium Dark Architectural Publication Style */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#0a0f1d] via-[#0f172a] to-[#0a0f1d] py-16 sm:py-24">
        {/* Subtle grid texture overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Publication Mission & Headline */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-orange-400 text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>INDEPENDENT ENGINEERING EDITORIAL</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
                Sovereign Agent Systems. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                  Zero Marginal Cost.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
                A rigorous engineering publication dedicated to autonomous multi-agent topologies, local quantized inference, cryptographic auditability, and self-hosted software infrastructure.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href="/articles"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-all shadow-lg shadow-orange-950/40"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Explore 9 Articles</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#topics"
                  className="inline-flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 hover:bg-slate-800/80 text-slate-200 font-semibold text-sm transition-all"
                >
                  <Layers className="h-4 w-4 text-slate-400" />
                  <span>Browse Topics</span>
                </a>
              </div>

              {/* Verified Editorial Safeguards */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-800/90 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>100% Peer-Level Technical Depth</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>No Fabricated Claims or Ads</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Original Architecture SVGs</span>
                </div>
              </div>
            </div>

            {/* Right Column: Lead Editorial Feature Card */}
            <div className="lg:col-span-5">
              <div className="relative group rounded-2xl bg-gradient-to-b from-slate-800/80 via-slate-900/90 to-slate-950 border border-slate-700/80 p-5 shadow-2xl transition-all hover:border-orange-500/50">
                <div className="flex items-center justify-between text-[11px] font-semibold text-orange-400 mb-3">
                  <span className="uppercase tracking-wider">Featured Lead Editorial</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {featuredArticle.readTime}
                  </span>
                </div>

                <Link href={`/articles/${featuredArticle.slug}`} className="block overflow-hidden rounded-xl border border-slate-700/60 mb-4 bg-slate-950">
                  <img
                    src={featuredArticle.featuredImage.src}
                    alt={featuredArticle.featuredImage.alt}
                    className="w-full aspect-[1200/630] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {featuredArticle.category}
                  </span>
                  <h2 className="text-xl font-extrabold text-white leading-snug group-hover:text-orange-400 transition-colors">
                    <Link href={`/articles/${featuredArticle.slug}`}>
                      {featuredArticle.title}
                    </Link>
                  </h2>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {featuredArticle.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    By {featuredArticle.author}
                  </span>
                  <Link
                    href={`/articles/${featuredArticle.slug}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-orange-400 hover:text-orange-300"
                  >
                    <span>Read Guide</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Topic Filter Navigation Strip */}
      <section id="topics" className="py-8 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Bookmark className="h-4 w-4 text-orange-500" />
              <span>Publication Curated Topics:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/articles?category=${encodeURIComponent(cat)}`}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-orange-500/60 hover:text-orange-300 text-slate-300 text-xs font-medium transition-all"
                >
                  {cat}
                </Link>
              ))}
              <Link
                href="/articles"
                className="px-3 py-1.5 rounded-lg bg-orange-950/40 border border-orange-800/50 text-orange-300 hover:bg-orange-900/60 text-xs font-bold transition-all"
              >
                All Categories →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Engineering Disciplines Showcase */}
      <section className="py-16 bg-[#0a0f1d] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-orange-500 tracking-wider uppercase">
              Core Technical Focus
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Architectural Pillars for Sovereign Software
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Every technical field guide in this publication is built around three uncompromising operational principles: zero marginal inference cost, cryptographic non-repudiation, and queue-backed resilience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950/60 border border-orange-800/60 text-orange-400 flex items-center justify-center">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Zero-Cost Local Inference</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                How to configure quantized local open-weights models (Qwen 2.5, Llama 3.2) via Ollama and vLLM to eliminate per-token cloud billing entirely.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Cryptographic Safety Gates</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Non-bypassable human approval state machines, Argon2id storage, and Merkle-tree audit trails that prevent runaway AI agent actions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Distributed Queue Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Decoupling web admission from background AI execution using Fastify, BullMQ, and Redis to guarantee fault-tolerant retry mechanics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exactly 9 Article Showcase */}
      <section className="py-20 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-orange-500 tracking-wider uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>The Engineering Library</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
                9 Peer-Reviewed Technical Field Guides
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl">
                Explore our complete active catalog of comprehensive guides, each exceeding 1,400 body words with original architectural diagrams and reproducible code.
              </p>
            </div>

            <Link
              href="/articles"
              className="mt-4 md:mt-0 inline-flex items-center space-x-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
            >
              <span>View Full Catalog in Articles Index</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* 9 Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allArticles.map((article, idx) => (
              <article
                key={article.slug}
                className="group rounded-2xl bg-[#0f172a] border border-slate-800/90 hover:border-orange-500/50 hover:bg-slate-900/90 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg"
              >
                <div>
                  {/* Featured Illustration Aspect Container */}
                  <Link
                    href={`/articles/${article.slug}`}
                    className="block relative aspect-[1200/630] overflow-hidden bg-slate-950 border-b border-slate-800/80"
                  >
                    <img
                      src={article.featuredImage.src}
                      alt={article.featuredImage.alt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                        {article.category}
                      </span>
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{article.readTime}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                        {article.editorialStatus}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors leading-snug">
                      <Link href={`/articles/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {article.description}
                    </p>
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="p-6 pt-0 border-t border-slate-800/50 mt-4 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400">
                    <span>{article.publishDate}</span>
                  </div>
                  <Link
                    href={`/articles/${article.slug}`}
                    className="inline-flex items-center space-x-1 font-semibold text-orange-400 group-hover:text-orange-300 text-xs transition-colors"
                  >
                    <span>Read Deep-Dive</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Announcement Banner: The Blueprint */}
      <section className="py-16 bg-[#0a0f1d] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-orange-950/40 to-slate-900 border border-slate-800 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="space-y-4 max-w-2xl">
              <span className="px-3 py-1 rounded-full bg-orange-900/60 text-orange-300 border border-orange-700/60 text-xs font-semibold uppercase tracking-wider">
                Comprehensive Technical Field Manual
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                The Zero-Cost Autonomous Agency Blueprint
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Our flagship 15-chapter architecture handbook detailing Docker Compose orchestrations, local quantized Ollama inference, Fastify-BullMQ async pipelines, and 55 specialist agent configurations.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 font-mono">
                <span>• 15 Complete Chapters</span>
                <span>• Instant PDF + Markdown</span>
                <span>• Verified Zero-Cost Topology</span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <Link
                href="/products"
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-all shadow-lg shadow-orange-950/50"
              >
                <span>Inspect The Blueprint</span>
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
