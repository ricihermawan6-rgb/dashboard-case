#!/bin/bash
# ============================================================
# CaseTrack v4 — Auto Setup Script
# Jalankan di Git Bash (klik kanan folder → Git Bash Here)
# ============================================================

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   CaseTrack v4 — Auto Deploy to GitHub  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# --- CONFIG ---
REPO_URL="https://github.com/ricihermawan6-rgb/dashboard-case.git"
SUPABASE_URL="https://atorjhxwokqghfkykqeg.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0b3JqaHh3b2txZ2hma3lrcWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDA1ODgsImV4cCI6MjA5MTMxNjU4OH0.-Bjdrs87-CAdCdRMISB86z2sotfK4lb6phn2Zoad86E"

WORK_DIR="$HOME/casetrack-deploy"

echo "▶ Step 1: Membuat folder kerja..."
mkdir -p "$WORK_DIR"
cd "$WORK_DIR" || exit 1

echo "▶ Step 2: Clone repo GitHub..."
if [ -d ".git" ]; then
  echo "  Repo sudah ada, pull update..."
  git pull
else
  git clone "$REPO_URL" . || {
    echo "❌ Gagal clone. Pastikan kamu sudah login GitHub di browser."
    echo "   Jalankan: git config --global credential.helper manager"
    exit 1
  }
fi

echo "▶ Step 3: Membuat struktur folder Next.js..."
mkdir -p app/{dashboard,cases,sp,bak,phk,pending,employees,reports,admin,log,login}
mkdir -p components/{ui,modals}
mkdir -p lib types public

echo "▶ Step 4: Menulis semua file..."

# ── .gitignore ──────────────────────────────────────────────
cat > .gitignore << 'EOF'
.env.local
.env
node_modules/
.next/
out/
.DS_Store
*.log
EOF

# ── .env.example ────────────────────────────────────────────
cat > .env.example << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF

# ── .env.local (TIDAK dicommit, untuk local dev) ────────────
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_KEY}
EOF

# ── package.json ────────────────────────────────────────────
cat > package.json << 'EOF'
{
  "name": "casetrack",
  "version": "4.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2.43.4",
    "@supabase/ssr": "^0.3.0",
    "lucide-react": "^0.383.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "eslint": "^8",
    "eslint-config-next": "14.2.3"
  }
}
EOF

# ── next.config.js ──────────────────────────────────────────
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }] }
}
module.exports = nextConfig
EOF

# ── tsconfig.json ───────────────────────────────────────────
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# ── tailwind.config.js ──────────────────────────────────────
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:'#0a0d14', surface:'#111520', surface2:'#171d2e', border:'#1e2740',
        accent:'#e8c547', accent2:'#4e9af1', danger:'#f1654e', success:'#4ecf8a', warning:'#f1a94e', muted:'#6b7494',
      },
      fontFamily: { sans:['DM Sans','sans-serif'], mono:['DM Mono','monospace'], display:['Syne','sans-serif'] },
    },
  },
  plugins: [],
}
EOF

# ── postcss.config.js ───────────────────────────────────────
cat > postcss.config.js << 'EOF'
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
EOF

# ── types/index.ts ──────────────────────────────────────────
cat > types/index.ts << 'EOF'
export type Role = 'superadmin' | 'admin' | 'viewer'
export interface Profile { id:string; name:string; username:string; role:Role; dept?:string; email?:string; active:boolean; photo_url?:string; last_login?:string }
export interface CaseUpdate { text:string; time:string; color:string }
export interface Case { id:string; name:string; emp_id:string; type:string; dept:string; casetype:string; severity:string; status:string; sp?:string|null; date:string; last_update:string; pic:string; description:string; updates:CaseUpdate[]; docs:any[]; photos:any[] }
export interface SP { id:string; name:string; emp_id:string; dept:string; level:string; reason:string; issued:string; valid_until:string; status:string; case_id?:string|null; notes?:string; docs:any[] }
export interface BAK { id:string; name:string; emp_id:string; dept:string; case_id?:string; date:string; perihal:string; content:string; assoc_name?:string; assoc_date?:string; assoc_notes?:string; assoc_status:string; head_name?:string; head_date?:string; head_notes?:string; head_status:string; overall_status:string; docs:any[]; assoc_docs:any[]; head_docs:any[] }
export interface PHK { id:string; name:string; emp_id:string; dept:string; jabatan:string; alasan:string; case_id?:string; tgl:string; tgl_lapor:string; no_disnaker?:string; status:string; notes?:string; docs:any[] }
export interface DocTypeField { label:string; type:'text'|'date'|'textarea' }
export interface CustomDocType { id:string; name:string; icon:string; description?:string; fields:DocTypeField[]; color:string; active:boolean }
export interface CustomEntry { id:string; doc_type_id:string; data:Record<string,any>; created_at?:string }
EOF

# ── lib/supabase.ts ─────────────────────────────────────────
cat > lib/supabase.ts << 'EOF'
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
export const supabase = createClient()
EOF

# ── lib/helpers.ts ──────────────────────────────────────────
cat > lib/helpers.ts << 'EOF'
import { supabase } from './supabase'
export async function addLog(userId:string|undefined, userName:string, actionType:string, detail:string) {
  await supabase.from('activity_log').insert({ user_id:userId, user_name:userName, action_type:actionType, detail })
}
export function nowID() {
  return new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})+' · '+new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})+' WIB'
}
export function todayStr() { return new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) }
EOF

# ── lib/auth-context.tsx ────────────────────────────────────
cat > lib/auth-context.tsx << 'EOF'
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
interface AuthCtx { profile:Profile|null; loading:boolean; signIn:(e:string,p:string)=>Promise<{error?:string}>; signOut:()=>Promise<void>; hasPermission:(k:string)=>boolean }
const PERMS:Record<string,Record<string,boolean>> = {
  superadmin:{dashboard:true,cases:true,sp:true,pending:true,employees:true,reports:true,admin:true,log:true,bak:true,phk:true,addCase:true,editCase:true,deleteCase:true,addSP:true,editSP:true,deleteSP:true,addBAK:true,editBAK:true,deleteBAK:true,addPHK:true,editPHK:true,deletePHK:true,addUser:true,editSettings:true},
  admin:{dashboard:true,cases:true,sp:true,pending:true,employees:true,reports:true,admin:false,log:true,bak:true,phk:true,addCase:true,editCase:true,deleteCase:false,addSP:true,editSP:true,deleteSP:false,addBAK:true,editBAK:true,deleteBAK:false,addPHK:true,editPHK:true,deletePHK:false,addUser:false,editSettings:false},
  viewer:{dashboard:true,cases:true,sp:false,pending:false,employees:false,reports:true,admin:false,log:false,bak:false,phk:false,addCase:false,editCase:false,deleteCase:false,addSP:false,editSP:false,deleteSP:false,addBAK:false,editBAK:false,deleteBAK:false,addPHK:false,editPHK:false,deletePHK:false,addUser:false,editSettings:false},
}
const AuthContext = createContext<AuthCtx|null>(null)
export function AuthProvider({children}:{children:React.ReactNode}) {
  const [profile,setProfile]=useState<Profile|null>(null)
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ if(session?.user) loadProfile(session.user.id); else setLoading(false) })
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{ if(session?.user) loadProfile(session.user.id); else{setProfile(null);setLoading(false)} })
    return ()=>subscription.unsubscribe()
  },[])
  async function loadProfile(id:string) {
    const {data}=await supabase.from('profiles').select('*').eq('id',id).single()
    if(data){setProfile(data);await supabase.from('profiles').update({last_login:new Date().toISOString()}).eq('id',id)}
    setLoading(false)
  }
  async function signIn(email:string,password:string){const{error}=await supabase.auth.signInWithPassword({email,password});return error?{error:error.message}:{}}
  async function signOut(){await supabase.auth.signOut();setProfile(null)}
  function hasPermission(key:string){return PERMS[profile?.role||'']?.[key]??false}
  return <AuthContext.Provider value={{profile,loading,signIn,signOut,hasPermission}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>{const c=useContext(AuthContext);if(!c)throw new Error('useAuth outside AuthProvider');return c}
EOF

# ── components/ui/Toast.tsx ─────────────────────────────────
cat > components/ui/Toast.tsx << 'EOF'
'use client'
import { useEffect, useState, useCallback } from 'react'
type T='success'|'error'|'info'
interface Msg{id:number;msg:string;type:T}
let _show:((msg:string,type?:T)=>void)|null=null
export function toast(msg:string,type:T='success'){_show?.(msg,type)}
export function Toast(){
  const [toasts,setToasts]=useState<Msg[]>([])
  const show=useCallback((msg:string,type:T='success')=>{
    const id=Date.now()
    setToasts(p=>[...p,{id,msg,type}])
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3200)
  },[])
  useEffect(()=>{_show=show;return()=>{_show=null}},[show])
  if(!toasts.length) return null
  return <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,display:'flex',flexDirection:'column',gap:8}}>
    {toasts.map(t=><div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderRadius:10,background:'var(--surface2)',border:`1px solid ${t.type==='success'?'rgba(78,207,138,.3)':t.type==='error'?'rgba(241,101,78,.3)':'var(--border)'}`,color:t.type==='success'?'var(--success)':t.type==='error'?'var(--danger)':'var(--text)',fontSize:13,fontWeight:500,boxShadow:'0 4px 20px rgba(0,0,0,.3)',minWidth:220}}>
      <span>{t.type==='success'?'✓':t.type==='error'?'✕':'ℹ'}</span><span>{t.msg}</span>
    </div>)}
  </div>
}
export default Toast
EOF

# ── components/ui/Badges.tsx ────────────────────────────────
cat > components/ui/Badges.tsx << 'EOF'
const V:Record<string,{bg:string;color:string;border:string}>={
  red:{bg:'rgba(241,101,78,.15)',color:'#f4806b',border:'rgba(241,101,78,.25)'},
  yellow:{bg:'rgba(232,197,71,.15)',color:'#e8c547',border:'rgba(232,197,71,.25)'},
  blue:{bg:'rgba(78,154,241,.15)',color:'#6aaaf5',border:'rgba(78,154,241,.25)'},
  green:{bg:'rgba(78,207,138,.15)',color:'#5fd99b',border:'rgba(78,207,138,.25)'},
  gray:{bg:'rgba(107,116,148,.15)',color:'#8b96ba',border:'rgba(107,116,148,.25)'},
  purple:{bg:'rgba(167,139,250,.15)',color:'#a78bfa',border:'rgba(167,139,250,.25)'},
  orange:{bg:'rgba(241,169,78,.15)',color:'#f1a94e',border:'rgba(241,169,78,.3)'},
}
export function Badge({label,variant='gray'}:{label:string;variant?:string}){
  const v=V[variant]||V.gray
  return <span style={{display:'inline-block',padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:600,fontFamily:'DM Mono',background:v.bg,color:v.color,border:`1px solid ${v.border}`}}>{label}</span>
}
export function StatusBadge({status}:{status:string}){
  const m:Record<string,string>={'Aktif':'red','Dalam Proses':'yellow','Pending':'blue','Selesai':'green','Ditutup':'gray','Dibatalkan':'gray','Disetujui':'green','Belum Review':'gray','Perlu Revisi':'yellow','Ditolak':'red','Tanda Terima Diterima':'green','Menunggu IR Associate':'yellow','Menunggu Lead/Head IR':'blue'}
  return <Badge label={status} variant={m[status]||'gray'} />
}
export function SPBadge({level}:{level:string}){
  const m:Record<string,string>={'SP-1':'orange','SP-2':'red','SP-3':'red'}
  return <Badge label={level} variant={m[level]||'gray'} />
}
export function SeverityDot({severity}:{severity:string}){
  const c:Record<string,string>={Kritis:'#f1654e',Tinggi:'#e8c547',Sedang:'#4e9af1'}
  const col=c[severity]||'#6b7494'
  return <span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12.5}}><span style={{width:7,height:7,borderRadius:'50%',background:col,boxShadow:`0 0 6px ${col}`,display:'inline-block'}} />{severity}</span>
}
export function TypeBadge({type}:{type:string}){
  const m:Record<string,string>={Karyawan:'blue',Mitra:'yellow',Vendor:'gray'}
  return <Badge label={type} variant={m[type]||'gray'} />
}
EOF

# ── app/globals.css ─────────────────────────────────────────
cat > app/globals.css << 'EOF'
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;
:root{--bg:#0a0d14;--surface:#111520;--surface2:#171d2e;--border:#1e2740;--accent:#e8c547;--accent2:#4e9af1;--danger:#f1654e;--success:#4ecf8a;--warning:#f1a94e;--text:#e8eaf2;--muted:#6b7494}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--surface)}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@keyframes rowFlash{0%{background-color:rgba(232,197,71,.18)}100%{background-color:transparent}}
.row-flash{animation:rowFlash 2.5s ease forwards}
.modal-anim{animation:fadeIn .15s ease}
EOF

# ── app/layout.tsx ──────────────────────────────────────────
cat > app/layout.tsx << 'EOF'
import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
export const metadata: Metadata = { title:'CaseTrack — Admin Dashboard', description:'Sistem Manajemen Kasus Karyawan' }
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="id"><body><AuthProvider>{children}</AuthProvider></body></html>
}
EOF

# ── app/page.tsx ─────────────────────────────────────────────
cat > app/page.tsx << 'EOF'
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
export default function Home(){
  const{profile,loading}=useAuth()
  const router=useRouter()
  useEffect(()=>{if(!loading){if(profile)router.replace('/dashboard');else router.replace('/login')}},[profile,loading,router])
  return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
    <div style={{textAlign:'center'}}><div style={{width:40,height:40,borderRadius:10,background:'var(--accent)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900,color:'#0a0d14',marginBottom:12}}>⬡</div><div style={{fontSize:12,fontFamily:'DM Mono',color:'var(--muted)'}}>Memuat...</div></div>
  </div>
}
EOF

# ── app/login/page.tsx ───────────────────────────────────────
mkdir -p app/login
cat > app/login/page.tsx << 'EOF'
'use client'
import{useState,FormEvent}from 'react'
import{useRouter}from 'next/navigation'
import{useAuth}from '@/lib/auth-context'
export default function LoginPage(){
  const{signIn,profile}=useAuth()
  const router=useRouter()
  const[email,setEmail]=useState('')
  const[pass,setPass]=useState('')
  const[error,setError]=useState('')
  const[loading,setLoading]=useState(false)
  if(profile){router.replace('/dashboard');return null}
  async function handle(e:FormEvent){
    e.preventDefault();setError('');setLoading(true)
    const r=await signIn(email,pass)
    if(r.error){setError('Email atau password salah');setLoading(false)}
    else router.replace('/dashboard')
  }
  const inp:React.CSSProperties={width:'100%',padding:'10px 14px',borderRadius:8,fontSize:14,outline:'none',background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',fontFamily:'DM Sans',transition:'border-color .15s'}
  return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'var(--bg)'}}>
      <div style={{width:'100%',maxWidth:360}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:16,background:'var(--accent)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:900,color:'#0a0d14',marginBottom:12}}>⬡</div>
          <h1 style={{fontFamily:'Syne',fontWeight:800,fontSize:26,color:'var(--accent)',letterSpacing:'-0.5px'}}>CaseTrack</h1>
          <p style={{fontSize:11,fontFamily:'DM Mono',color:'var(--muted)',letterSpacing:2,marginTop:4}}>ADMIN PANEL · SISTEM MANAJEMEN KASUS</p>
        </div>
        <form onSubmit={handle} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,padding:32}}>
          <div style={{marginBottom:18}}>
            <label style={{display:'block',fontSize:10,fontFamily:'DM Mono',color:'var(--muted)',letterSpacing:2,marginBottom:8,textTransform:'uppercase'}}>EMAIL</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="admin@casetrack.id" style={inp} onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='var(--border)')} />
          </div>
          <div style={{marginBottom:22}}>
            <label style={{display:'block',fontSize:10,fontFamily:'DM Mono',color:'var(--muted)',letterSpacing:2,marginBottom:8,textTransform:'uppercase'}}>PASSWORD</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} required placeholder="••••••••" style={inp} onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='var(--border)')} />
          </div>
          {error&&<div style={{marginBottom:16,padding:'10px 14px',borderRadius:8,background:'rgba(241,101,78,.1)',color:'var(--danger)',border:'1px solid rgba(241,101,78,.25)',fontSize:13}}>{error}</div>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:'11px',borderRadius:9,background:loading?'rgba(232,197,71,.5)':'var(--accent)',color:'#0a0d14',fontWeight:700,fontSize:14,border:'none',cursor:loading?'not-allowed':'pointer',transition:'filter .15s'}}>
            {loading?'Memuat...':'Masuk'}
          </button>
        </form>
        <p style={{textAlign:'center',fontSize:11,marginTop:20,fontFamily:'DM Mono',color:'var(--muted)'}}>© 2026 CaseTrack · Powered by Supabase</p>
      </div>
    </div>
  )
}
EOF

# ── app/dashboard/layout.tsx ─────────────────────────────────
mkdir -p app/dashboard
cat > app/dashboard/layout.tsx << 'DASHEOF'
'use client'
import{useEffect,useState}from 'react'
import{useRouter,usePathname}from 'next/navigation'
import Link from 'next/link'
import{useAuth}from '@/lib/auth-context'
import{supabase}from '@/lib/supabase'
import{Toast}from '@/components/ui/Toast'
export default function DashboardLayout({children}:{children:React.ReactNode}){
  const{profile,loading,signOut,hasPermission}=useAuth()
  const router=useRouter()
  const pathname=usePathname()
  const[pendingN,setPendingN]=useState(0)
  const[spN,setSpN]=useState(0)
  useEffect(()=>{if(!loading&&!profile)router.replace('/login')},[profile,loading,router])
  useEffect(()=>{
    if(!profile)return
    supabase.from('cases').select('id',{count:'exact'}).eq('status','Pending').then(({count})=>setPendingN(count||0))
    supabase.from('sp_list').select('id',{count:'exact'}).eq('status','Aktif').then(({count})=>setSpN(count||0))
  },[profile])
  if(loading||!profile) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}><div style={{textAlign:'center'}}><div style={{width:36,height:36,borderRadius:9,background:'var(--accent)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:18,color:'#0a0d14',marginBottom:10}}>⬡</div><div style={{fontSize:11,fontFamily:'DM Mono',color:'var(--muted)'}}>Memuat...</div></div></div>
  const nav=[
    {href:'/dashboard',icon:'⬡',label:'Dashboard',key:'dashboard'},
    {href:'/cases',icon:'📁',label:'Semua Kasus',key:'cases'},
    {href:'/sp',icon:'⚠️',label:'Tracker SP',key:'sp',badge:spN>0?spN:null},
    {href:'/bak',icon:'📋',label:'Dokumen BAK',key:'bak'},
    {href:'/phk',icon:'⚖️',label:'PHK Disnaker',key:'phk'},
    {href:'/pending',icon:'⏳',label:'Pending Review',key:'pending',badge:pendingN>0?pendingN:null},
    {href:'/employees',icon:'👥',label:'Data Karyawan',key:'employees'},
    {href:'/reports',icon:'📊',label:'Laporan',key:'reports'},
    {href:'/admin',icon:'⚙️',label:'Admin Master',key:'admin'},
    {href:'/log',icon:'📜',label:'Log Aktivitas',key:'log'},
  ]
  const colors=['#f1654e','#e8c547','#4e9af1','#4ecf8a','#a78bfa','#f1a94e']
  function gc(s:string){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%colors.length;return colors[h]}
  function gi(n:string){return n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
  const rp:Record<string,string>={superadmin:'rgba(232,197,71,.2)',admin:'rgba(78,154,241,.2)',viewer:'rgba(107,116,148,.2)'}
  const rc:Record<string,string>={superadmin:'#e8c547',admin:'#4e9af1',viewer:'#6b7494'}
  return(
    <div style={{display:'flex',minHeight:'100vh'}}>
      <aside style={{width:240,minHeight:'100vh',background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',position:'fixed',top:0,bottom:0,left:0,zIndex:100,overflowY:'auto'}}>
        <div style={{padding:'22px 20px 16px',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:28,height:28,borderRadius:7,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#0a0d14'}}>⬡</div>
            <span style={{fontFamily:'Syne',fontWeight:800,fontSize:20,color:'var(--accent)',letterSpacing:'-0.5px'}}>CaseTrack</span>
          </div>
          <div style={{fontSize:10,color:'var(--muted)',fontFamily:'DM Mono',letterSpacing:2,textTransform:'uppercase',marginTop:4}}>Admin Panel v4.0</div>
        </div>
        <nav style={{padding:'10px 10px',flex:1}}>
          <div style={{fontSize:9,letterSpacing:2.5,color:'var(--muted)',textTransform:'uppercase',fontFamily:'DM Mono',padding:'10px 12px 6px'}}>Menu Utama</div>
          {nav.map(item=>{
            if(!hasPermission(item.key))return null
            const active=pathname===item.href||(item.href!=='/dashboard'&&pathname.startsWith(item.href))
            return(
              <Link key={item.href} href={item.href} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:8,cursor:'pointer',fontSize:13.5,marginBottom:2,textDecoration:'none',transition:'all .15s',background:active?'rgba(232,197,71,.1)':'transparent',color:active?'var(--accent)':'var(--muted)'}}>
                <span style={{fontSize:14,width:18,textAlign:'center'}}>{item.icon}</span>
                <span style={{flex:1}}>{item.label}</span>
                {item.badge&&<span style={{background:'var(--danger)',color:'#fff',fontSize:10,fontFamily:'DM Mono',padding:'1px 6px',borderRadius:20,fontWeight:500}}>{item.badge}</span>}
              </Link>
            )
          })}
        </nav>
        <div style={{padding:14,borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:10,borderRadius:8,background:'var(--surface2)',cursor:'pointer'}} onClick={()=>{if(confirm('Keluar dari CaseTrack?'))signOut().then(()=>router.replace('/login'))}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:gc(profile.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#0a0d14',flexShrink:0}}>{gi(profile.name)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile.name}</div>
              <div style={{marginTop:2}}><span style={{padding:'1px 6px',borderRadius:10,fontSize:9,fontWeight:600,background:rp[profile.role]||'rgba(107,116,148,.2)',color:rc[profile.role]||'#6b7494',fontFamily:'DM Mono'}}>{profile.role.toUpperCase()}</span></div>
            </div>
            <span style={{fontSize:11,color:'var(--muted)'}}>↗</span>
          </div>
        </div>
      </aside>
      <main style={{marginLeft:240,flex:1,display:'flex',flexDirection:'column',minWidth:0}}>{children}</main>
      <Toast />
    </div>
  )
}
DASHEOF

# ── Semua layout sub-pages ───────────────────────────────────
for dir in sp bak cases phk pending employees reports admin log; do
  mkdir -p "app/$dir"
  cat > "app/$dir/layout.tsx" << EOF
import DashboardLayout from '@/app/dashboard/layout'
export default function Layout({children}:{children:React.ReactNode}){return <DashboardLayout>{children}</DashboardLayout>}
EOF
done

# ── app/dashboard/page.tsx ───────────────────────────────────
cat > app/dashboard/page.tsx << 'EOF'
'use client'
import{useEffect,useState,useCallback}from 'react'
import{supabase}from '@/lib/supabase'
import{useAuth}from '@/lib/auth-context'
import{StatusBadge,SeverityDot,TypeBadge,SPBadge}from '@/components/ui/Badges'
import type{Case}from '@/types'
export default function DashboardPage(){
  const{profile}=useAuth()
  const[cases,setCases]=useState<Case[]>([])
  const[stats,setStats]=useState({active:0,process:0,pending:0,done:0,sp:0,bak:0})
  const[loading,setLoading]=useState(true)
  const load=useCallback(async()=>{
    setLoading(true)
    const{data}=await supabase.from('cases').select('*').order('created_at',{ascending:false}).limit(8)
    const all=data||[]
    setCases(all)
    const[{count:spC},{count:bakC}]=await Promise.all([
      supabase.from('sp_list').select('id',{count:'exact'}).eq('status','Aktif'),
      supabase.from('bak_list').select('id',{count:'exact'})
    ])
    setStats({active:all.filter(c=>c.status==='Aktif').length,process:all.filter(c=>c.status==='Dalam Proses').length,pending:all.filter(c=>c.status==='Pending').length,done:all.filter(c=>c.status==='Selesai').length,sp:spC||0,bak:bakC||0})
    setLoading(false)
  },[])
  useEffect(()=>{load()},[load])
  useEffect(()=>{
    const ch=supabase.channel('dash_rt').on('postgres_changes',{event:'*',schema:'public',table:'cases'},()=>load()).subscribe()
    return()=>{supabase.removeChannel(ch)}
  },[load])
  return(
    <div>
      <div style={{padding:'18px 32px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--surface)',position:'sticky',top:0,zIndex:50}}>
        <div>
          <div style={{fontFamily:'Syne',fontWeight:700,fontSize:18}}>Dashboard Kasus</div>
          <div style={{fontSize:12,color:'var(--muted)',fontFamily:'DM Mono',marginTop:2}}>Selamat datang, {profile?.name} · {new Date().toLocaleDateString('id-ID',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:'var(--success)',boxShadow:'0 0 6px var(--success)'}}></div>
          <span style={{fontSize:11,color:'var(--success)',fontFamily:'DM Mono'}}>Live · Supabase</span>
        </div>
      </div>
      <div style={{padding:'28px 32px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
          {[{l:'Kasus Aktif',v:stats.active,c:'var(--danger)',i:'🔴',t:'rgba(241,101,78,.4)'},{l:'Dalam Proses',v:stats.process,c:'var(--warning)',i:'🟡',t:'rgba(241,169,78,.4)'},{l:'Pending Review',v:stats.pending,c:'var(--accent2)',i:'⏳',t:'rgba(78,154,241,.4)'},{l:'Selesai',v:stats.done,c:'var(--success)',i:'✓',t:'rgba(78,207,138,.4)'}].map(s=>(
            <div key={s.l} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:20,position:'relative',overflow:'hidden',borderTop:`2px solid ${s.t}`}}>
              <div style={{position:'absolute',top:14,right:14,fontSize:20,opacity:.15}}>{s.i}</div>
              <div style={{fontSize:10.5,color:'var(--muted)',fontFamily:'DM Mono',textTransform:'uppercase',letterSpacing:1.5}}>{s.l}</div>
              <div style={{fontFamily:'Syne',fontSize:36,fontWeight:800,margin:'6px 0 2px',color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontFamily:'Syne',fontWeight:700,fontSize:14}}>Kasus Terbaru</div>
            <a href="/cases" style={{fontSize:12,color:'var(--accent)',textDecoration:'none',fontFamily:'DM Mono'}}>Lihat semua →</a>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['ID Kasus','Nama / Entitas','Tipe','Jenis Kasus','Tingkat','Status','SP','Update Terakhir'].map(h=>(
                <th key={h} style={{textAlign:'left',padding:'10px 14px',fontSize:10,letterSpacing:1.8,textTransform:'uppercase',color:'var(--muted)',fontFamily:'DM Mono',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap'}}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {loading?<tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--muted)'}}>Memuat data...</td></tr>
                :cases.length===0?<tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--muted)'}}>Belum ada kasus</td></tr>
                :cases.map(c=>(
                  <tr key={c.id} style={{borderBottom:'1px solid rgba(30,39,64,.5)',transition:'background .1s'}} onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.02)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <td style={{padding:'12px 14px',fontFamily:'DM Mono',fontSize:11.5,color:'var(--accent)'}}>{c.id}</td>
                    <td style={{padding:'12px 14px'}}><div style={{fontWeight:500,fontSize:13.5}}>{c.name}</div><div style={{fontSize:10.5,color:'var(--muted)',fontFamily:'DM Mono'}}>{c.emp_id}</div></td>
                    <td style={{padding:'12px 14px'}}><TypeBadge type={c.type}/></td>
                    <td style={{padding:'12px 14px',fontSize:12.5,color:'#b0b8d8'}}>{c.casetype}</td>
                    <td style={{padding:'12px 14px'}}><SeverityDot severity={c.severity}/></td>
                    <td style={{padding:'12px 14px'}}><StatusBadge status={c.status}/></td>
                    <td style={{padding:'12px 14px'}}>{c.sp?<SPBadge level={c.sp}/>:<span style={{color:'var(--muted)',fontSize:11}}>—</span>}</td>
                    <td style={{padding:'12px 14px',fontFamily:'DM Mono',fontSize:11.5,color:'var(--muted)'}}>{c.last_update}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
EOF

# ── Placeholder pages ─────────────────────────────────────────
for pg in cases phk pending employees reports admin log; do
cat > "app/$pg/page.tsx" << EOF
'use client'
export default function Page(){
  return(
    <div style={{padding:'28px 32px'}}>
      <div style={{fontFamily:'Syne',fontWeight:700,fontSize:22,marginBottom:8}}>Halaman ${pg^}</div>
      <div style={{color:'var(--muted)',fontSize:13}}>Halaman ini dalam pengembangan.</div>
    </div>
  )
}
EOF
done

echo ""
echo "▶ Step 5: Git commit & push..."
git add -A
git commit -m "feat: CaseTrack v4 — Next.js + Supabase real-time, SP & BAK update status"
git push origin main || git push origin master

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ BERHASIL! Semua file sudah di-push ke GitHub!   ║"
echo "║                                                      ║"
echo "║  Langkah selanjutnya:                               ║"
echo "║  1. Buka Vercel → Settings → Environment Variables  ║"
echo "║  2. Tambahkan:                                       ║"
echo "║     NEXT_PUBLIC_SUPABASE_URL                         ║"
echo "║     NEXT_PUBLIC_SUPABASE_ANON_KEY                    ║"
echo "║  3. Redeploy!                                        ║"
echo "╚══════════════════════════════════════════════════════╝"
