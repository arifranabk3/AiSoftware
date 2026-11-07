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
  Bookmark,
  FileCheck2,
  Compass,
  Server,
  Zap,
  ShieldAlert,
  Database,
  Code2
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
  // Primary Lead Featured Article (Hero)
  const leadArticle = ARTICLES[0]; // Zero-Cost Local LLM Architecture

  // Exactly 9 Article Showcase entries
  const showcaseArticles = ARTICLES.slice(0, 9);

  // Editor's Selected Field Guides (Task 1: 1 Featured on Left + 3 Stacked on Right)
  const editorsMain = ARTICLES[1]; // Human-in-the-Loop Safety Gates
  const editorsSecondary1 = ARTICLES[4]; // Merkle Trees & Audit Trails
  const editorsSecondary2 = ARTICLES[8]; // Sliding-Window Token Buffer Management
  const editorsSecondary3 = ARTICLES[5]; // Sandboxed Execution for AI Agents

  // Distinct Categories derived from real articles
  const categoriesWithCounts = [
    {
      name: 'Architecture',
      description: 'Sovereign agent memory, local quantized model hosting, and context buffer topologies.',
      count: ARTICLES.filter((a) => a.category === 'Architecture').length,
    },
    {
      name: 'Security',
      description: 'MicroVM sandboxing, RFC 9106 Argon2id credential protection, and tamper-evident Merkle logs.',
      count: ARTICLES.filter((a) => a.category === 'Security').length,
    },
    {
      name: 'Engineering',
      description: 'Fastify admission controllers, BullMQ distributed Redis streams, and real-time SSE telemetry.',
      count: ARTICLES.filter((a) => a.category === 'Engineering').length,
    },
    {
      name: 'AI Safety',
      description: 'Dual-LLM quarantine pipelines, tool call parameter validation, and prompt injection mitigation.',
      count: ARTICLES.filter((a) => a.category === 'AI Safety').length,
    },
    {
      name: 'Governance',
      description: 'Cryptographic multi-signature quorum gates, TTL expiration, and human-in-the-loop state machines.',
      count: ARTICLES.filter((a) => a.category === 'Governance').length,
    }
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 flex flex-col font-sans selection:bg-orange-500 selection:text-white antialiased">
      <PublicHeader />

      {/* ========================================================================= */}
      {/* SECTION 1 — PREMIUM HERO (DARK)                                           */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#070b14] via-[#0d1322] to-[#070b14] py-16 sm:py-24 text-slate-200">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Publication Mission & Headline */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-orange-400 text-xs font-semibold tracking-wide shadow-sm">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>INDEPENDENT ENGINEERING EDITORIAL PUBLICATION</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
                Sovereign Agent Systems. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                  Zero Marginal Cost.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
                A rigorous, peer-reviewed engineering magazine dedicated to self-hosted multi-agent topologies, local quantized inference, cryptographic auditability, and resilient backend systems.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href="/articles"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-all shadow-lg shadow-orange-950/40"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Explore All 9 Articles</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#topics"
                  className="inline-flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all"
                >
                  <Compass className="h-4 w-4 text-slate-400" />
                  <span>Explore Disciplines</span>
                </a>
              </div>

              {/* Verified Editorial Guarantees */}
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
              <div className="relative group rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-700/80 p-5 shadow-2xl transition-all hover:border-orange-500/50">
                <div className="flex items-center justify-between text-[11px] font-semibold text-orange-400 mb-3">
                  <span className="uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Featured Lead Editorial</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                    {leadArticle.readTime}
                  </span>
                </div>

                <Link href={`/articles/${leadArticle.slug}`} className="block overflow-hidden rounded-xl border border-slate-700/60 mb-4 bg-slate-950">
                  <img
                    src={leadArticle.featuredImage.src}
                    alt={leadArticle.featuredImage.alt}
                    className="w-full aspect-[1200/630] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                      {leadArticle.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {leadArticle.publishDate}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white leading-snug group-hover:text-orange-400 transition-colors">
                    <Link href={`/articles/${leadArticle.slug}`}>
                      {leadArticle.title}
                    </Link>
                  </h2>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {leadArticle.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    By {leadArticle.author}
                  </span>
                  <Link
                    href={`/articles/${leadArticle.slug}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-orange-400 hover:text-orange-300"
                  >
                    <span>Read Deep-Dive</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 — EXPLORE TOPICS (LIGHT)                                        */}
      {/* ========================================================================= */}
      <section id="topics" className="py-20 bg-slate-50 border-b border-slate-200 text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-orange-600 tracking-wider uppercase flex items-center space-x-1.5">
              <Bookmark className="h-3.5 w-3.5" />
              <span>Disciplines &amp; Research Areas</span>
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Explore Our Core Engineering Disciplines
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Every topic is grounded in verifiable code, RFC cryptographic standards, and production-tested topologies across sovereign infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {categoriesWithCounts.map((cat) => (
              <Link
                key={cat.name}
                href={`/articles?category=${encodeURIComponent(cat.name)}`}
                className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-500 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 flex items-center justify-center font-bold text-xs">
                      {cat.count}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                      {cat.count === 1 ? '1 Guide' : `${cat.count} Guides`}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {cat.description}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-orange-600 group-hover:text-orange-700">
                  <span>Browse Category</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — LATEST ENGINEERING INSIGHTS (DARK)                            */}
      {/* ========================================================================= */}
      <section id="insights" className="py-24 bg-[#070b14] border-b border-slate-800/80 text-slate-200">
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
              <span>View Filterable Catalog in Articles Index</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Exactly 9 Distinct Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {showcaseArticles.map((article) => (
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

      {/* ========================================================================= */}
      {/* SECTION 4 — EDITOR'S SELECTED FIELD GUIDES (LIGHT: 1 LEFT + 3 RIGHT)      */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-100/80 border-b border-slate-200 text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-orange-600 tracking-wider uppercase flex items-center space-x-1.5">
              <Zap className="h-3.5 w-3.5" />
              <span>Editorial Curation</span>
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Editor’s Selected Field Guides
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Curated by our systems architecture staff for their immediate practical impact on securing, isolating, and budgeting autonomous software systems.
            </p>
          </div>

          {/* Two-Column Editorial Grid: Left Large Featured + Right Exactly 3 Stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* LEFT COLUMN: One large featured article card (7 Cols) */}
            <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-orange-300 transition-all">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-orange-600 mb-4">
                  <span className="uppercase tracking-wider">PRIMARY ARCHITECTURAL SELECTION</span>
                  <span className="text-slate-500 font-medium">{editorsMain.readTime}</span>
                </div>
                <Link href={`/articles/${editorsMain.slug}`} className="block overflow-hidden rounded-xl border border-slate-200 mb-6 bg-slate-950">
                  <img
                    src={editorsMain.featuredImage.src}
                    alt={editorsMain.featuredImage.alt}
                    className="w-full aspect-[1200/630] object-cover hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded bg-orange-50 text-orange-700 text-xs font-bold uppercase tracking-wider border border-orange-100">
                    {editorsMain.category}
                  </span>
                  <span className="text-xs text-slate-500">{editorsMain.publishDate}</span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-2 hover:text-orange-600 transition-colors leading-snug">
                  <Link href={`/articles/${editorsMain.slug}`}>
                    {editorsMain.title}
                  </Link>
                </h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  {editorsMain.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">By {editorsMain.author}</span>
                <Link
                  href={`/articles/${editorsMain.slug}`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-all shadow-sm"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: Exactly THREE vertically stacked article cards (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              {/* Stacked Card 1: Merkle Trees & Audit Trails */}
              <div className="flex-1 rounded-2xl bg-white border border-slate-200/90 p-5 flex flex-col justify-between shadow-sm hover:border-orange-300 hover:shadow-md transition-all">
                <div className="flex items-start space-x-4">
                  <Link
                    href={`/articles/${editorsSecondary1.slug}`}
                    className="flex-shrink-0 w-28 sm:w-32 aspect-[1200/630] rounded-lg overflow-hidden border border-slate-200 bg-slate-950 block"
                  >
                    <img
                      src={editorsSecondary1.featuredImage.src}
                      alt={editorsSecondary1.featuredImage.alt}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </Link>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-orange-600 font-bold uppercase tracking-wider">{editorsSecondary1.category}</span>
                      <span className="text-slate-400">{editorsSecondary1.readTime}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 hover:text-orange-600 transition-colors leading-snug line-clamp-2">
                      <Link href={`/articles/${editorsSecondary1.slug}`}>
                        {editorsSecondary1.title}
                      </Link>
                    </h4>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">{editorsSecondary1.publishDate}</span>
                  <Link
                    href={`/articles/${editorsSecondary1.slug}`}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center space-x-1"
                  >
                    <span>Read</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Stacked Card 2: Sliding-Window Token Buffer Management */}
              <div className="flex-1 rounded-2xl bg-white border border-slate-200/90 p-5 flex flex-col justify-between shadow-sm hover:border-orange-300 hover:shadow-md transition-all">
                <div className="flex items-start space-x-4">
                  <Link
                    href={`/articles/${editorsSecondary2.slug}`}
                    className="flex-shrink-0 w-28 sm:w-32 aspect-[1200/630] rounded-lg overflow-hidden border border-slate-200 bg-slate-950 block"
                  >
                    <img
                      src={editorsSecondary2.featuredImage.src}
                      alt={editorsSecondary2.featuredImage.alt}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </Link>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-orange-600 font-bold uppercase tracking-wider">{editorsSecondary2.category}</span>
                      <span className="text-slate-400">{editorsSecondary2.readTime}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 hover:text-orange-600 transition-colors leading-snug line-clamp-2">
                      <Link href={`/articles/${editorsSecondary2.slug}`}>
                        {editorsSecondary2.title}
                      </Link>
                    </h4>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">{editorsSecondary2.publishDate}</span>
                  <Link
                    href={`/articles/${editorsSecondary2.slug}`}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center space-x-1"
                  >
                    <span>Read</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Stacked Card 3: Sandboxed Execution for AI Agents */}
              <div className="flex-1 rounded-2xl bg-white border border-slate-200/90 p-5 flex flex-col justify-between shadow-sm hover:border-orange-300 hover:shadow-md transition-all">
                <div className="flex items-start space-x-4">
                  <Link
                    href={`/articles/${editorsSecondary3.slug}`}
                    className="flex-shrink-0 w-28 sm:w-32 aspect-[1200/630] rounded-lg overflow-hidden border border-slate-200 bg-slate-950 block"
                  >
                    <img
                      src={editorsSecondary3.featuredImage.src}
                      alt={editorsSecondary3.featuredImage.alt}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </Link>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-orange-600 font-bold uppercase tracking-wider">{editorsSecondary3.category}</span>
                      <span className="text-slate-400">{editorsSecondary3.readTime}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 hover:text-orange-600 transition-colors leading-snug line-clamp-2">
                      <Link href={`/articles/${editorsSecondary3.slug}`}>
                        {editorsSecondary3.title}
                      </Link>
                    </h4>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">{editorsSecondary3.publishDate}</span>
                  <Link
                    href={`/articles/${editorsSecondary3.slug}`}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center space-x-1"
                  >
                    <span>Read</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5 — DEVELOPER KNOWLEDGE HUB (DARK)                                */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#070b14] border-b border-slate-800/80 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-orange-500 tracking-wider uppercase flex items-center space-x-1.5">
              <Code2 className="h-3.5 w-3.5" />
              <span>Full-Stack Curriculum</span>
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">
              Developer Knowledge Hub &amp; Architectural Coverage
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Explore the six engineering domains actively researched, architected, and published in our technical literature.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Domain 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950/60 border border-orange-800/60 text-orange-400 flex items-center justify-center">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">AI Architecture &amp; Local Inference</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operating quantized foundation weights (Qwen 2.5 7B, Llama 3.2 3B) using Ollama and vLLM with zero cloud token overhead.
              </p>
              <Link
                href="/articles/zero-cost-local-llm-architecture"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-orange-400 hover:text-orange-300 pt-2"
              >
                <span>Read Local LLM Guide →</span>
              </Link>
            </div>

            {/* Domain 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Secure AI Agents &amp; Sandboxing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Firecracker microVMs, gVisor syscall virtualization, and network namespace firewalls that block SSRF and container breakouts.
              </p>
              <Link
                href="/articles/sandboxed-execution-ai-agents"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-orange-400 hover:text-orange-300 pt-2"
              >
                <span>Read Sandboxing Guide →</span>
              </Link>
            </div>

            {/* Domain 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400 flex items-center justify-center">
                <Server className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Backend Engineering &amp; Fastify</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-throughput Node.js microservices, memory-efficient streaming, and schema-enforced API gateways capable of high concurrency.
              </p>
              <Link
                href="/articles/distributed-queues-bullmq-agents"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-orange-400 hover:text-orange-300 pt-2"
              >
                <span>Read Fastify Architecture →</span>
              </Link>
            </div>

            {/* Domain 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-800/60 text-violet-400 flex items-center justify-center">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Database &amp; Queue Architecture</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Atomic Redis concurrency reservation, BullMQ exponential backoff queues, and persistent MongoDB Atlas event stores.
              </p>
              <Link
                href="/articles/distributed-queues-bullmq-agents"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-orange-400 hover:text-orange-300 pt-2"
              >
                <span>Read Queue Architecture →</span>
              </Link>
            </div>

            {/* Domain 5 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Cryptographic State &amp; Auth</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                RFC 9106 Argon2id password derivation, constant-time verification, and Merkle tree inclusion proofs for forensic non-repudiation.
              </p>
              <Link
                href="/articles/argon2id-authentication-secure-password-storage"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-orange-400 hover:text-orange-300 pt-2"
              >
                <span>Read Argon2id Guide →</span>
              </Link>
            </div>

            {/* Domain 6 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">AI Safety &amp; Prompt Defense</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dual-LLM quarantine pipelines, deterministic Zod schema validation, and mitigation techniques against indirect prompt injections.
              </p>
              <Link
                href="/articles/preventing-prompt-injection-tool-using-agents"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-orange-400 hover:text-orange-300 pt-2"
              >
                <span>Read Prompt Safety Guide →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 — EDITORIAL STANDARDS (LIGHT)                                   */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-50 border-b border-slate-200 text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-orange-600 tracking-wider uppercase flex items-center space-x-1.5">
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Editorial Governance</span>
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Our Technical Editorial Standards
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              We operate under strict publishing governance (`STD-ED-2026-01`). Every guide is evaluated against rigorous technical criteria before publication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <span className="text-xs font-mono font-bold text-orange-600">01 / TOPIC SELECTION</span>
              <h4 className="text-base font-bold text-slate-900">Problem-Driven Engineering</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Topics are selected exclusively to solve concrete engineering bottlenecks—memory overflow, token billing spikes, non-deterministic model failures, and socket timeouts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <span className="text-xs font-mono font-bold text-orange-600">02 / CODE REPRODUCIBILITY</span>
              <h4 className="text-base font-bold text-slate-900">Verifiable Code Examples</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                All code samples are syntactically valid TypeScript or Docker configurations tested against modern LTS versions (Node 22, Redis 7.2, Ollama 0.5+).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <span className="text-xs font-mono font-bold text-orange-600">03 / NEGATIVE SCENARIOS</span>
              <h4 className="text-base font-bold text-slate-900">Explicit &quot;When NOT to Use&quot;</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every article contains an explicit section detailing when the architecture is inappropriate or counter-productive, preventing architectural over-engineering.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <span className="text-xs font-mono font-bold text-orange-600">04 / STATUS DISCLOSURE</span>
              <h4 className="text-base font-bold text-slate-900">Truthful Review Tagging</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Articles awaiting final human peer review are transparently tagged `AI-assisted, pending human review`. We never falsely claim human sign-off without actual review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 — ABOUT THE PUBLICATION (DARK)                                  */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#070b14] border-b border-slate-800/80 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-12 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-8 space-y-4">
                <span className="text-xs font-bold text-orange-500 tracking-wider uppercase">
                  About AIsoftware Publication
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Democratizing Autonomous Software Engineering
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  AIsoftware was founded on a simple premise: autonomous systems should not be gated behind proprietary cloud subscriptions, vendor lock-in, and unpredictable per-token invoices. We research, document, and open-source architectures that allow software engineers, solo founders, and technical agencies to run autonomous multi-agent networks sovereignly.
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                  <span>• Target Audience: Software Architects &amp; Engineers</span>
                  <span>• Core Focus: Self-Hosted Sovereign Systems</span>
                  <span>• Commercial Stance: No Paid Ads, No Sponsored Reviews</span>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
                <Link
                  href="/about"
                  className="w-full text-center py-3.5 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all shadow-md shadow-orange-950/40"
                >
                  Read Full Mission Statement
                </Link>
                <Link
                  href="/contact"
                  className="w-full text-center py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all"
                >
                  Contact Editorial Staff
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8 — ANNOUNCEMENT (LIGHT) & FOOTER (DARK)                           */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-100/90 border-b border-slate-200 text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
            <div className="space-y-4 max-w-2xl">
              <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold uppercase tracking-wider">
                Comprehensive Technical Field Manual
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                The Zero-Cost Autonomous Agency Blueprint
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Our flagship 15-chapter architecture handbook detailing Docker Compose orchestrations, local quantized Ollama inference, Fastify-BullMQ async pipelines, and 55 specialist agent configurations.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 font-mono">
                <span>• 15 Complete Chapters</span>
                <span>• Instant PDF + Markdown</span>
                <span>• Verified Zero-Cost Topology</span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <Link
                href="/products"
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm transition-all shadow-md shadow-orange-200"
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
