'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const { signIn, profile } = useAuth()
  const router = useRouter()
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  if (profile) { router.replace('/dashboard'); return null }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await signIn(email, pass)
    if (res.error) { setError('Email atau password salah'); setLoading(false) }
    else router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black mb-3"
            style={{ background: 'var(--accent)', color: '#0a0d14' }}>⬡</div>
          <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Syne', color: 'var(--accent)' }}>CaseTrack</h1>
          <p className="text-xs mt-1 tracking-widest font-mono" style={{ color: 'var(--muted)' }}>ADMIN PANEL · SISTEM MANAJEMEN KASUS</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit}
          className="rounded-2xl p-8 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

          <div className="mb-5">
            <label className="block text-xs font-mono tracking-widest mb-2" style={{ color: 'var(--muted)' }}>EMAIL</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@casetrack.id"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-mono tracking-widest mb-2" style={{ color: 'var(--muted)' }}>PASSWORD</label>
            <input
              type="password" value={pass} onChange={e => setPass(e.target.value)} required
              placeholder="••••••••"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'rgba(241,101,78,.12)', color: 'var(--danger)', border: '1px solid rgba(241,101,78,.25)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-sm transition-all"
            style={{ background: loading ? 'rgba(232,197,71,.5)' : 'var(--accent)', color: '#0a0d14' }}>
            {loading ? 'Memuat...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-xs mt-6 font-mono" style={{ color: 'var(--muted)' }}>
          © 2026 CaseTrack · Powered by Supabase
        </p>
      </div>
    </div>
  )
}
