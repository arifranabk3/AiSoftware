import React, { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { ARTICLES } from '@/lib/articles';
import { BookOpen, Clock, ArrowRight, Tag, Filter } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Technical Articles & Engineering Guides — AIsoftware',
  description:
    'In-depth technical guides on sovereign multi-agent architecture, local quantized inference, human-in-the-loop safety gates, and queue-backed execution systems.',
  alternates: {
    canonical: 'https://ai-software-theta.vercel.app/articles'
  }
};

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function ArticlesIndexPage({ searchParams }: Props) {
  const { category } = await searchParams;

  const categories = Array.from(new Set(ARTICLES.map((a) => a.category)));
  const filteredArticles = category
    ? ARTICLES.filter((a) => a.category.toLowerCase() === category.toLowerCase())
    : ARTICLES;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <PublicHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="max-w-3xl space-y-4 mb-8">
          <span className="text-xs font-bold text-orange-600 tracking-wider uppercase">
            Engineering Documentation
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Technical Articles &amp; Field Guides
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Practical architectural documentation, implementation patterns, and cost-control strategies for building sovereign autonomous agent infrastructure.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-10 flex flex-wrap items-center gap-2 pb-4 border-b border-slate-200">
          <Link
            href="/articles"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !category
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            All Disciplines ({ARTICLES.length})
          </Link>
          {categories.map((cat) => {
            const count = ARTICLES.filter((a) => a.category === cat).length;
            const active = category?.toLowerCase() === cat.toLowerCase();
            return (
              <Link
                key={cat}
                href={`/articles?category=${encodeURIComponent(cat)}`}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {cat} ({count})
              </Link>
            );
          })}
        </div>

        {filteredArticles.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-600 font-medium">No articles found in this category.</p>
            <Link href="/articles" className="mt-4 inline-block text-xs font-bold text-orange-600 hover:underline">
              View all articles →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <article
                key={article.slug}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg hover:border-orange-200 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 font-semibold border border-orange-100">
                      {article.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] border border-slate-200">
                      {article.editorialStatus}
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{article.readTime}</span>
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 leading-snug">
                    <Link
                      href={`/articles/${article.slug}`}
                      className="hover:text-orange-600 transition-colors"
                    >
                      {article.title}
                    </Link>
                  </h2>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {article.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {article.keywords.slice(0, 3).map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    <div className="font-semibold text-slate-700">{article.author}</div>
                    <div className="text-[10px] text-slate-400">{article.publishDate}</div>
                  </div>
                  <Link
                    href={`/articles/${article.slug}`}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-orange-600 hover:text-orange-800"
                  >
                    <span>Read Guide</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
