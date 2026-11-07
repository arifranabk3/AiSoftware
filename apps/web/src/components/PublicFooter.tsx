import React from 'react';
import Link from 'next/link';
import { Terminal, Shield, Mail, FileText, CheckCircle2, BookOpen, Layers } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-950/50">
                <Terminal className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight">AIsoftware</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Open engineering standards, sovereign multi-agent architectures, and zero-marginal-cost automation methodologies.
            </p>
            <div className="pt-1 flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Independent Self-Hosted Technology</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-2.5">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Navigation</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/" className="hover:text-orange-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-orange-400 transition-colors">
                  Technical Articles (9)
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-orange-400 transition-colors">
                  The Blueprint
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-orange-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-orange-400 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Editorial & Topics */}
          <div className="space-y-2.5">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Featured Deep-Dives</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/articles/zero-cost-local-llm-architecture" className="hover:text-orange-400 transition-colors">
                  Local LLM Architectures
                </Link>
              </li>
              <li>
                <Link href="/articles/sliding-window-token-buffer-management-ai-agents" className="hover:text-orange-400 transition-colors">
                  Token Buffer Management
                </Link>
              </li>
              <li>
                <Link href="/articles/sandboxed-execution-ai-agents" className="hover:text-orange-400 transition-colors">
                  Sandboxed Agent Execution
                </Link>
              </li>
              <li>
                <Link href="/articles/secure-human-approval-workflows-high-risk-ai-actions" className="hover:text-orange-400 transition-colors">
                  Human Approval Workflows
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-orange-400 transition-colors">
                  Command Center Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div className="space-y-2.5">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Legal &amp; Privacy</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/privacy" className="hover:text-orange-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-orange-400 transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-orange-400 transition-colors">
                  Security Disclosures
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} AIsoftware. All rights reserved. Sovereign engineering publication.
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-slate-400 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
