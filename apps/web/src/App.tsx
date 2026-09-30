import React, { useState, useEffect } from 'react';
import { Gem, ShieldCheck, Database, RefreshCw, Smartphone, Layers, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      const startTime = Date.now();
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/v1/health`);
        if (res.ok) {
          setApiStatus('connected');
          setLatency(Date.now() - startTime);
        } else {
          setApiStatus('disconnected');
        }
      } catch {
        setApiStatus('disconnected');
      }
    };
    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Gem className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
                Kumkum Payal
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs uppercase tracking-widest text-slate-400 font-mono">
                v1.0
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                apiStatus === 'connected'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : apiStatus === 'checking'
                  ? 'bg-amber-950/60 border-amber-800 text-amber-300 animate-pulse'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  apiStatus === 'connected'
                    ? 'bg-emerald-400'
                    : apiStatus === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              {apiStatus === 'connected'
                ? `API Online (${latency}ms)`
                : apiStatus === 'checking'
                ? 'Pinging API...'
                : 'API Standby'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-6">
            <ShieldCheck className="h-4 w-4" />
            Accounting & Inventory Enterprise Engine
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Jewellery Trading & Job Work System
          </h1>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            High-integrity web accounting for gold & silver ornament trading, Polish & Meena job work,
            append-only ledger tracking, real-time inventory balances, and automated WhatsApp dues reminders.
          </p>

          {/* Module Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition">
              <Layers className="h-5 w-5 text-amber-400 mb-2" />
              <div className="text-sm font-semibold text-slate-200">17 Tables</div>
              <div className="text-xs text-slate-500">PostgreSQL Schema</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition">
              <ShieldCheck className="h-5 w-5 text-emerald-400 mb-2" />
              <div className="text-sm font-semibold text-slate-200">Double RLS</div>
              <div className="text-xs text-slate-500">Staff Isolation</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition">
              <Database className="h-5 w-5 text-blue-400 mb-2" />
              <div className="text-sm font-semibold text-slate-200">Atomic Tx</div>
              <div className="text-xs text-slate-500">Ledger & Stock</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition">
              <Smartphone className="h-5 w-5 text-purple-400 mb-2" />
              <div className="text-sm font-semibold text-slate-200">WhatsApp</div>
              <div className="text-xs text-slate-500">Cloud API & Bills</div>
            </div>
          </div>

          {/* Foundation Stage Status */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Stage 1: Foundation & Infrastructure Ready
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Monorepo: <code className="text-xs font-mono text-amber-300">/apps/api</code> (NestJS) + <code className="text-xs font-mono text-amber-300">/apps/web</code> (React + Vite)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>PostgreSQL 16 with 17 relational tables, sequences, and immutable triggers</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Multi-stage Dockerfiles with unprivileged non-root security</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Docker Compose orchestration with health checks for PostgreSQL and Redis</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        Kumkum Payal &copy; {new Date().getFullYear()} &bull; Built with NestJS, React + Vite, PostgreSQL 16, Redis BullMQ
      </footer>
    </div>
  );
}
