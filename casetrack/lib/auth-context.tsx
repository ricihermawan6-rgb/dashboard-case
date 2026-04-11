'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthCtx {
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  hasPermission: (key: string) => boolean
}

const PERMISSIONS: Record<string, Record<string, boolean>> = {
  superadmin: { dashboard:true, cases:true, sp:true, pending:true, employees:true,
    reports:true, admin:true, log:true, bak:true, phk:true, addCase:true,
    editCase:true, deleteCase:true, addSP:true, editSP:true, deleteSP:true,
    addBAK:true, editBAK:true, deleteBAK:true, addPHK:true, editPHK:true,
    deletePHK:true, addUser:true, editSettings:true },
  admin: { dashboard:true, cases:true, sp:true, pending:true, employees:true,
    reports:true, admin:false, log:true, bak:true, phk:true, addCase:true,
    editCase:true, deleteCase:false, addSP:true, editSP:true, deleteSP:false,
    addBAK:true, editBAK:true, deleteBAK:false, addPHK:true, editPHK:true,
    deletePHK:false, addUser:false, editSettings:false },
  viewer: { dashboard:true, cases:true, sp:false, pending:false, employees:false,
    reports:true, admin:false, log:false, bak:false, phk:false, addCase:false,
    editCase:false, deleteCase:false, addSP:false, editSP:false, deleteSP:false,
    addBAK:false, editBAK:false, deleteBAK:false, addPHK:false, editPHK:false,
    deletePHK:false, addUser:false, editSettings:false },
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      setProfile(data)
      // Update last_login
      await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', userId)
    }
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  function hasPermission(key: string) {
    if (!profile) return false
    return PERMISSIONS[profile.role]?.[key] ?? false
  }

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signOut, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
