'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (profile) router.replace('/dashboard')
      else router.replace('/login')
    }
  }, [profile, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black" style={{ background: 'var(--accent)', color: '#0a0d14' }}>⬡</div>
        <div className="text-sm font-mono" style={{ color: 'var(--muted)' }}>Memuat...</div>
      </div>
    </div>
  )
}
