'use client';

import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Invalid credentials');
      }

      window.location.href = '/';
    } catch (err: unknown) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-graphite-950 flex flex-col justify-center items-center p-6 text-graphite-200">
      <div className="w-full max-w-md bg-graphite-900 border border-graphite-700 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-orange-subtle border border-orange-accent/30 text-orange-accent mb-2">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">OWNER AUTHENTICATION</h2>
          <p className="text-xs text-graphite-400">
            Sign in to access the Enterprise AI Command Center
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-graphite-400">Email Address</label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3 top-3 text-graphite-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@ai-command-center.local"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-graphite-700 bg-graphite-850 text-sm text-white focus:outline-none focus:border-orange-accent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-graphite-400">
              Argon2id Master Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-3 text-graphite-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-graphite-700 bg-graphite-850 text-sm text-white focus:outline-none focus:border-orange-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-orange-accent hover:bg-orange-hover text-white font-medium text-xs tracking-wider flex items-center justify-center space-x-2 transition-colors shadow-lg"
          >
            <span>{loading ? 'AUTHENTICATING...' : 'ENTER CONTROL CENTER'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-graphite-700/60 flex items-center justify-between text-xs text-graphite-400">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Zero-Cost Guarded</span>
          </span>
          <span className="font-mono text-graphite-400">HTTP-Only / SameSite</span>
        </div>
      </div>
    </div>
  );
}
