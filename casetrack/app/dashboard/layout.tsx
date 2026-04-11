'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Toast from '@/components/ui/Toast'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, signOut, hasPermission } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)
  const [spActiveCount, setSpActiveCount] = useState(0)

  useEffect(() => {
    if (!loading && !profile) router.replace('/login')
  }, [profile, loading, router])

  useEffect(() => {
    if (!profile) return
    // Fetch badge counts
    supabase.from('cases').select('id', { count: 'exact' }).eq('status', 'Pending').then(({ count }) => setPendingCount(count || 0))
    supabase.from('sp_list').select('id', { count: 'exact' }).eq('status', 'Aktif').then(({ count }) => setSpActiveCount(count || 0))
  }, [profile])

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg" style={{ background: 'var(--accent)', color: '#0a0d14' }}>⬡</div>
          <div className="text-xs font-mono" style={{ color: 'var(--muted)' }}>Memuat...</div>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: '/dashboard',  icon: '⬡', label: 'Dashboard',   key: 'dashboard' },
    { href: '/cases',      icon: '📁', label: 'Semua Kasus', key: 'cases',    badge: null },
    { href: '/sp',         icon: '⚠️', label: 'Tracker SP',  key: 'sp',       badge: spActiveCount > 0 ? spActiveCount : null },
    { href: '/bak',        icon: '📋', label: 'Dokumen BAK', key: 'bak' },
    { href: '/phk',        icon: '⚖️', label: 'PHK Disnaker',key: 'phk' },
    { href: '/pending',    icon: '⏳', label: 'Pending',     key: 'pending',  badge: pendingCount > 0 ? pendingCount : null },
    { href: '/employees',  icon: '👥', label: 'Karyawan',    key: 'employees' },
    { href: '/reports',    icon: '📊', label: 'Laporan',     key: 'reports' },
    { href: '/admin',      icon: '⚙️', label: 'Admin Master',key: 'admin' },
    { href: '/log',        icon: '📜', label: 'Log Aktivitas',key: 'log' },
  ]

  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }

  const avatarColors = ['#f1654e','#e8c547','#4e9af1','#4ecf8a','#a78bfa','#f1a94e']
  function getColor(str: string) {
    let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % avatarColors.length
    return avatarColors[h]
  }

  const rolePillStyle: Record<string, string> = {
    superadmin: 'rgba(232,197,71,.2)',
    admin:      'rgba(78,154,241,.2)',
    viewer:     'rgba(107,116,148,.2)',
  }
  const rolePillColor: Record<string, string> = {
    superadmin: '#e8c547',
    admin:      '#4e9af1',
    viewer:     '#6b7494',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* SIDEBAR */}
      <aside style={{ width: 240, minHeight: '100vh', background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100, overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#0a0d14', fontFamily: 'Syne' }}>⬡</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--accent)', letterSpacing: '-0.5px' }}>CaseTrack</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'DM Mono', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>Admin Panel v4.0</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 2.5, color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'DM Mono', padding: '10px 12px 6px' }}>Menu Utama</div>
          {navItems.map(item => {
            if (!hasPermission(item.key)) return null
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 13.5, fontWeight: 400, marginBottom: 2,
                  textDecoration: 'none', transition: 'all .15s',
                  background: isActive ? 'rgba(232,197,71,.1)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--muted)',
                }}>
                <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{ background: 'var(--danger)', color: '#fff', fontSize: 10, fontFamily: 'DM Mono', padding: '1px 6px', borderRadius: 20, fontWeight: 500 }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User card */}
        <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, background: 'var(--surface2)', cursor: 'pointer' }}
            onClick={() => { if (confirm('Keluar dari CaseTrack?')) signOut().then(() => router.replace('/login')) }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: getColor(profile.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0a0d14', flexShrink: 0 }}>
              {getInitials(profile.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'DM Mono', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span style={{ padding: '1px 6px', borderRadius: 10, fontSize: 9, fontWeight: 600, background: rolePillStyle[profile.role] || 'rgba(107,116,148,.2)', color: rolePillColor[profile.role] || '#6b7494' }}>
                  {profile.role.toUpperCase()}
                </span>
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>↗</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {children}
      </main>

      <Toast />
    </div>
  )
}
