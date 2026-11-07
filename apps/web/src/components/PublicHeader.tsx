import React from 'react';
import Link from 'next/link';
import { Terminal, Shield, Cpu, BookOpen, ArrowRight, Lock } from 'lucide-react';

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Terminal className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 tracking-tight leading-none text-base">
              AIsoftware
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
              Autonomous Systems & Engineering
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Home
          </Link>
          <Link href="/articles" className="hover:text-indigo-600 transition-colors">
            Technical Articles
          </Link>
          <Link href="/products" className="hover:text-indigo-600 transition-colors">
            Products
          </Link>
          <Link href="/about" className="hover:text-indigo-600 transition-colors">
            About Us
          </Link>
          <Link href="/contact" className="hover:text-indigo-600 transition-colors">
            Contact
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>Owner Portal</span>
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-indigo-200"
          >
            <span>Get Blueprint</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

