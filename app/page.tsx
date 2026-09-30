'use client'

import { useState } from 'react'
import { navItems, recentEntries, stats } from '@/lib/mock'
import { formatDate, formatRupee } from '@/lib/format'

const statusClass: Record<string, string> = { Open: 'status-open', Partial: 'status-partial', Paid: 'status-paid', Overdue: 'status-overdue' }

export default function Page() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState<'Owner' | 'Staff'>('Owner')
  const [active, setActive] = useState('Dashboard')
  const [language, setLanguage] = useState('EN')

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} language={language} setLanguage={setLanguage} />

  const visibleNav = role === 'Staff' ? [['Home', '⌂'], ['My Entries', '↗']] : navItems
  return <div className="app-shell">
    <aside className="sidebar">
      <Brand />
      <div className="role-switch"><span>Viewing as</span><button className={role === 'Owner' ? 'selected' : ''} onClick={() => setRole('Owner')}>Owner</button><button className={role === 'Staff' ? 'selected' : ''} onClick={() => setRole('Staff')}>Staff</button></div>
      <nav className="nav-list">{visibleNav.map(([label, icon]) => <button key={label} onClick={() => setActive(label)} className={active === label ? 'active' : ''}><b>{icon}</b>{label}</button>)}</nav>
      <button className="sign-out" onClick={() => setLoggedIn(false)}>↪ <span>Sign out</span></button>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">Tuesday, 1 October 2026</p><h1>Good morning, Anubhav</h1></div><div className="profile"><div className="avatar">AS</div><div><strong>Anubhav Sharma</strong><span>Owner</span></div><span className="chevron">⌄</span></div></header>
      <div className="mobile-role"><span>Demo role</span><button onClick={() => setRole(role === 'Owner' ? 'Staff' : 'Owner')}>{role} · Switch</button></div>
      <section className="welcome-row"><div><h2>{active === 'Dashboard' || active === 'Home' ? 'Your business at a glance' : active}</h2><p>Here&apos;s what&apos;s happening with Kumkum Payal today.</p></div><button className="primary-button">＋ New entry</button></section>
      <section className="stats-grid">{stats.map((stat) => <article className={`stat-card ${stat.tone}`} key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.note}</small></article>)}</section>
      <section className="content-grid"><article className="panel entries-panel"><div className="panel-heading"><div><h3>Recent entries</h3><p>Your latest sales, purchases and payments</p></div><button className="text-button">View all →</button></div><div className="entries-list">{recentEntries.map((entry) => <div className="entry-row" key={entry.party}><div className="entry-icon">{entry.type === 'Sale' ? '↗' : entry.type === 'Purchase' ? '↙' : '₹'}</div><div className="entry-name"><strong>{entry.party}</strong><span>{entry.type} · {formatDate(entry.date)}</span></div><strong className="entry-amount">{formatRupee(entry.amount)}</strong><span className={`status ${statusClass[entry.status]}`}>{entry.status}</span></div>)}</div></article><article className="panel reminders"><div className="panel-heading"><div><h3>Reminders</h3><p>Things that need your attention</p></div><span className="count">3</span></div><div className="reminder"><span className="dot red-dot"/><div><strong>Payment overdue</strong><p>Kohinoor Exports · ₹2,75,000</p></div><span>›</span></div><div className="reminder"><span className="dot gold-dot"/><div><strong>Stock count due</strong><p>Gold chains · 4 items</p></div><span>›</span></div><div className="reminder"><span className="dot blue-dot"/><div><strong>Job work expected</strong><p>Mehta Gold Works · Today</p></div><span>›</span></div></article></section>
      <p className="auto-note">Date and time are recorded automatically.</p>
    </main>
    <nav className="bottom-tabs">{visibleNav.slice(0, 4).map(([label, icon]) => <button key={label} onClick={() => setActive(label)} className={active === label ? 'active' : ''}><b>{icon}</b><span>{label}</span></button>)}</nav>
  </div>
}

function Brand() { return <div className="brand"><div className="brand-mark">K</div><div><strong>Kumkum Payal</strong><span>Jewellery accounts</span></div></div> }
function Login({ onLogin, language, setLanguage }: { onLogin: () => void, language: string, setLanguage: (v: string) => void }) { return <main className="login-page"><div className="login-card"><Brand /><div className="login-copy"><p className="eyebrow">Welcome back</p><h1>Run your business<br /><em>with clarity.</em></h1><p>Simple accounts and inventory, made for jewellery traders.</p></div><form onSubmit={(e) => { e.preventDefault(); onLogin() }}><label>Username<input required placeholder="Enter your username" defaultValue="anubhav" /></label><label>Password<input required type="password" placeholder="Enter your password" defaultValue="password" /></label><button className="primary-button" type="submit">Sign in <span>→</span></button></form><div className="login-footer"><span>© 2026 Kumkum Payal</span><div><button className={language === 'EN' ? 'lang-active' : ''} onClick={() => setLanguage('EN')} type="button">English</button><span>/</span><button className={language === 'HI' ? 'lang-active' : ''} onClick={() => setLanguage('HI')} type="button">हिन्दी</button></div></div></div></main> }
