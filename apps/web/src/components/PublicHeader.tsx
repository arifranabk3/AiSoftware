'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Terminal, Lock, Menu, X, ArrowRight, BookOpen, Layers } from 'lucide-react';

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-orange-950/50 group-hover:scale-105 transition-transform">
            <Terminal className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-white tracking-tight leading-none text-base group-hover:text-amber-400 transition-colors">
              AIsoftware
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              Engineering &amp; Systems Architecture
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            Home
          </Link>
          <Link href="/articles" className="hover:text-amber-400 transition-colors">
            Articles
          </Link>
          <Link href="/#topics" className="hover:text-amber-400 transition-colors">
            Topics
          </Link>
          <Link href="/products" className="hover:text-amber-400 transition-colors">
            Blueprint
          </Link>
          <Link href="/about" className="hover:text-amber-400 transition-colors">
            About
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden sm:flex items-center space-x-3">
          <Link
            href="/login"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 bg-slate-900/60 transition-colors"
          >
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/articles"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-sm shadow-orange-950/50"
          >
            <span>Read Publication</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center space-x-2">
          <Link
            href="/login"
            className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            aria-label="Owner Dashboard"
          >
            <Lock className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-slate-300">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-amber-400 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/articles"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-amber-400 transition-colors"
            >
              Technical Articles (9)
            </Link>
            <Link
              href="/#topics"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-amber-400 transition-colors"
            >
              Editorial Topics
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-amber-400 transition-colors"
            >
              The Architecture Blueprint
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-amber-400 transition-colors"
            >
              About the Publication
            </Link>
          </nav>
          <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
            <Link
              href="/articles"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all"
            >
              Browse All 9 Deep-Dives
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              Enter Dashboard Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
