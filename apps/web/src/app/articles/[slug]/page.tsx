import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { ARTICLES, Article } from '@/lib/articles';
import { ArrowLeft, Clock, Calendar, User, Tag, BookOpen, ShieldCheck } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ARTICLES.map((article) => ({
    slug: article.slug
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return {};

  return {
    title: `${article.title} — AIsoftware Engineering`,
    description: article.description,
    keywords: article.keywords,
    alternates: {
      canonical: `https://ai-software-theta.vercel.app/articles/${article.slug}`
    },
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.publishDate,
      authors: [article.author]
    }
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  // Schema.org Article Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Organization',
      name: article.author
    },
    datePublished: article.publishDate,
    publisher: {
      '@type': 'Organization',
      name: 'AIsoftware',
      url: 'https://ai-software-theta.vercel.app/'
    },
    keywords: article.keywords.join(', ')
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
        <div className="mb-8">
          <Link
            href="/articles"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Technical Articles</span>
          </Link>
        </div>

        <article className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-sm space-y-10">
          <header className="space-y-4 border-b border-slate-100 pb-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                {article.category}
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{article.publishDate}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{article.readTime}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {article.title}
            </h1>

            <div className="flex items-center space-x-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{article.author}</div>
                <div className="text-[11px] text-slate-500">{article.authorRole} • AIsoftware</div>
              </div>
            </div>
          </header>

          <div className="space-y-12 text-slate-700">
            {article.sections.map((section, sIdx) => (
              <section key={sIdx} className="space-y-5">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {section.heading}
                </h2>

                {section.image && (
                  <figure className="my-6 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm">
                    {/* Responsive SVG diagram */}
                    <img
                      src={section.image.src}
                      alt={section.image.alt}
                      className="w-full h-auto block"
                      loading="lazy"
                    />
                    <figcaption className="p-3.5 bg-slate-900/95 border-t border-slate-800 text-xs text-slate-400 text-center leading-relaxed font-sans">
                      {section.image.caption}
                    </figcaption>
                  </figure>
                )}

                <div className="space-y-4 text-sm sm:text-base leading-relaxed">
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Topics & Semantic Keywords
            </h4>
            <div className="flex flex-wrap gap-2">
              {article.keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start space-x-4">
            <ShieldCheck className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                Engineering Standard Note
              </h4>
              <p className="text-xs text-indigo-800 leading-relaxed">
                This guide represents real technical implementation from the open-source AI Command Center architecture. AIsoftware does not publish fabricated benchmarks or theoretical prompt claims.
              </p>
            </div>
          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}
