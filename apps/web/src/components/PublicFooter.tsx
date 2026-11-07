import React from 'react';
import Link from 'next/link';
import { Terminal, Shield, Mail, FileText, CheckCircle2 } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Terminal className="h-4 w-4" />
              </div>
              <span className="font-bold text-base tracking-tight">AIsoftware</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Open engineering standards, sovereign multi-agent architectures, and zero-marginal-cost automation methodologies.
            </p>
            <div className="pt-1 flex items-center space-x-1.5 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Independent Self-Hosted Technology</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Navigation</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-white transition-colors">
                  Technical Articles
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Digital Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Editorial & Topics</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/articles/zero-cost-local-llm-architecture" className="hover:text-white transition-colors">
                  Local LLM Architectures
                </Link>
              </li>
              <li>
                <Link href="/articles/human-in-the-loop-agent-safety" className="hover:text-white transition-colors">
                  Human-in-the-Loop Safety
                </Link>
              </li>
              <li>
                <Link href="/articles/distributed-queues-bullmq-agents" className="hover:text-white transition-colors">
                  Queue-Driven Agent Workflows
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Executive Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Compliance & Legal</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Support & Inquiries
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} AIsoftware. All rights reserved. Zero-cost autonomous enterprise platform.</p>
          <div className="mt-3 sm:mt-0 flex items-center space-x-4">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

