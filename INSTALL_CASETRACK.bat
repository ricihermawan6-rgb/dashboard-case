@echo off
title CaseTrack v4 - Auto Install
color 0A
chcp 65001 >nul

echo.
echo  =============================================
echo    CaseTrack v4 - Auto Deploy ke GitHub
echo  =============================================
echo.
echo  Proses ini akan:
echo  1. Clone repo GitHub kamu
echo  2. Tulis semua file kode otomatis
echo  3. Push ke GitHub
echo  4. Vercel auto-deploy sendiri!
echo.
pause

:: ── Check Git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Git tidak ditemukan di komputer ini.
    echo  Download dulu di: https://git-scm.com/download/win
    echo  Setelah install Git, jalankan file ini lagi.
    pause
    exit /b 1
)

:: ── Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    where python3 >nul 2>&1
    if %errorlevel% neq 0 (
        echo  [NOTICE] Python tidak ada, akan pakai mode manual...
        set USEPY=0
    ) else (
        set PYEXE=python3
        set USEPY=1
    )
) else (
    set PYEXE=python
    set USEPY=1
)

set REPO=https://github.com/ricihermawan6-rgb/dashboard-case.git
set FOLDER=%USERPROFILE%\Documents\casetrack-v4

echo.
echo  [1/4] Clone repo dari GitHub...
if exist "%FOLDER%\.git" (
    echo  Repo sudah ada, mengupdate...
    cd /d "%FOLDER%"
    git pull
) else (
    echo  Cloning ke %FOLDER%...
    git clone %REPO% "%FOLDER%"
    if %errorlevel% neq 0 (
        echo.
        echo  [ERROR] Gagal clone repo!
        echo  Pastikan kamu sudah login GitHub di browser.
        pause
        exit /b 1
    )
    cd /d "%FOLDER%"
)

echo.
echo  [2/4] Membersihkan file lama...
for /f "delims=" %%i in ('dir /b /a-d 2^>nul') do (
    if /i not "%%i"==".gitignore" del /f /q "%%i" 2>nul
)
for /f "delims=" %%i in ('dir /b /ad 2^>nul') do (
    if /i not "%%i"==".git" rmdir /s /q "%%i" 2>nul
)

echo.
echo  [3/4] Menulis file kode Next.js...

mkdir app\dashboard 2>nul
mkdir app\cases 2>nul
mkdir app\sp 2>nul
mkdir app\bak 2>nul
mkdir app\phk 2>nul
mkdir app\pending 2>nul
mkdir app\employees 2>nul
mkdir app\reports 2>nul
mkdir app\admin 2>nul
mkdir app\log 2>nul
mkdir app\login 2>nul
mkdir components\ui 2>nul
mkdir lib 2>nul
mkdir types 2>nul
mkdir public 2>nul

:: Write config files via PowerShell (handles special chars better)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Set-Content -Path '.gitignore' -Value \".env.local`n.env`nnode_modules/`n.next/`nout/`n.DS_Store\" -Encoding UTF8"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Set-Content -Path 'vercel.json' -Value '{\"framework\":\"nextjs\"}' -Encoding UTF8"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Set-Content -Path 'next.config.js' -Value 'const nextConfig = {}`nmodule.exports = nextConfig' -Encoding UTF8"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Set-Content -Path 'postcss.config.js' -Value 'module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }' -Encoding UTF8"

:: package.json
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = @{name='casetrack';version='4.0.0';private=$true;scripts=@{dev='next dev';build='next build';start='next start'};dependencies=@{'next'='14.2.3';'react'='^18';'react-dom'='^18';'@supabase/supabase-js'='^2.43.4';'@supabase/ssr'='^0.3.0';'clsx'='^2.1.1'};devDependencies=@{'typescript'='^5';'@types/node'='^20';'@types/react'='^18';'@types/react-dom'='^18';'autoprefixer'='^10.0.1';'postcss'='^8';'tailwindcss'='^3.4.1';'eslint'='^8';'eslint-config-next'='14.2.3'}}; $p | ConvertTo-Json -Depth 5 | Set-Content -Path 'package.json' -Encoding UTF8; Write-Host 'package.json written'"

:: tsconfig.json
powershell -NoProfile -ExecutionPolicy Bypass -Command "$t = '{\"compilerOptions\":{\"target\":\"es5\",\"lib\":[\"dom\",\"dom.iterable\",\"esnext\"],\"allowJs\":true,\"skipLibCheck\":true,\"strict\":true,\"noEmit\":true,\"esModuleInterop\":true,\"module\":\"esnext\",\"moduleResolution\":\"bundler\",\"resolveJsonModule\":true,\"isolatedModules\":true,\"jsx\":\"preserve\",\"incremental\":true,\"plugins\":[{\"name\":\"next\"}],\"paths\":{\"@/*\":[\"./\"]}},\"include\":[\"next-env.d.ts\",\"**/*.ts\",\"**/*.tsx\"],\"exclude\":[\"node_modules\"]}'; Set-Content -Path 'tsconfig.json' -Value $t -Encoding UTF8; Write-Host 'tsconfig.json written'"

:: tailwind.config.js
powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-Content -Path 'tailwind.config.js' -Value 'module.exports={content:[\"./app/**/*.{js,ts,jsx,tsx}\",\"./components/**/*.{js,ts,jsx,tsx}\",\"./lib/**/*.{js,ts,jsx,tsx}\"],theme:{extend:{}},plugins:[]}' -Encoding UTF8; Write-Host 'tailwind written'"

echo  Config files written.
echo  Writing TypeScript/React files...

:: Write the write_files.py to temp and run it

:: Write Python script to temp file and run it
set PYFILE=%TEMP%\ct_write_files.py
powershell -NoProfile -ExecutionPolicy Bypass -Command "
$content = @'
import os, sys

files = {}

files["lib/auth-context.tsx"] = """'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from ''@/lib/supabase'
import type { Profile } from ''@/types'
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
"""

files["components/ui/Toast.tsx"] = """'use client'
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
    {toasts.map(t=><div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderRadius:10,background:'#171d2e',border:`1px solid ${t.type==='success'?'rgba(78,207,138,.3)':t.type==='error'?'rgba(241,101,78,.3)':'#1e2740'}`,color:t.type==='success'?'#4ecf8a':t.type==='error'?'#f1654e':'#e8eaf2',fontSize:13,fontWeight:500,boxShadow:'0 4px 20px rgba(0,0,0,.3)',minWidth:220}}>
      <span>{t.type==='success'?'✓':t.type==='error'?'✕':'ℹ'}</span><span>{t.msg}</span>
    </div>)}
  </div>
}
export default Toast
"""

files["components/ui/Badges.tsx"] = """const V:Record<string,{bg:string;color:string;border:string}>={
  red:{bg:'rgba(241,101,78,.15)',color:'#f4806b',border:'rgba(241,101,78,.25)'},
  yellow:{bg:'rgba(232,197,71,.15)',color:'#e8c547',border:'rgba(232,197,71,.25)'},
  blue:{bg:'rgba(78,154,241,.15)',color:'#6aaaf5',border:'rgba(78,154,241,.25)'},
  green:{bg:'rgba(78,207,138,.15)',color:'#5fd99b',border:'rgba(78,207,138,.25)'},
  gray:{bg:'rgba(107,116,148,.15)',color:'#8b96ba',border:'rgba(107,116,148,.25)'},
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
"""

files["app/globals.css"] = """@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;
:root{--bg:#0a0d14;--surface:#111520;--surface2:#171d2e;--border:#1e2740;--accent:#e8c547;--accent2:#4e9af1;--danger:#f1654e;--success:#4ecf8a;--warning:#f1a94e;--text:#e8eaf2;--muted:#6b7494}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--surface)}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
@keyframes rowFlash{0%{background-color:rgba(232,197,71,.18)}100%{background-color:transparent}}
.row-flash{animation:rowFlash 2.5s ease forwards}
"""

files["app/layout.tsx"] = """import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from ''@/lib/auth-context'
export const metadata: Metadata = { title:'CaseTrack v4', description:'Sistem Manajemen Kasus' }
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="id"><body><AuthProvider>{children}</AuthProvider></body></html>
}
"""

files["app/page.tsx"] = """'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from ''@/lib/auth-context'
export default function Home(){
  const{profile,loading}=useAuth()
  const router=useRouter()
  useEffect(()=>{if(!loading){if(profile)router.replace('/dashboard');else router.replace('/login')}},[profile,loading,router])
  return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0d14'}}><div style={{textAlign:'center',color:'#6b7494',fontFamily:'monospace'}}>Memuat...</div></div>
}
"""

files["app/login/page.tsx"] = """'use client'
import{useState,FormEvent}from 'react'
import{useRouter}from 'next/navigation'
import{useAuth}from ''@/lib/auth-context'
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
  const s:React.CSSProperties={width:'100%',padding:'10px 14px',borderRadius:8,fontSize:14,outline:'none',background:'#171d2e',border:'1px solid #1e2740',color:'#e8eaf2',fontFamily:'DM Sans'}
  return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'#0a0d14'}}>
      <div style={{width:'100%',maxWidth:360}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:16,background:'#e8c547',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:900,color:'#0a0d14',marginBottom:12}}>⬡</div>
          <h1 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:26,color:'#e8c547'}}>CaseTrack</h1>
          <p style={{fontSize:11,color:'#6b7494',letterSpacing:2,marginTop:4}}>ADMIN PANEL · SISTEM MANAJEMEN KASUS</p>
        </div>
        <form onSubmit={handle} style={{background:'#111520',border:'1px solid #1e2740',borderRadius:20,padding:32}}>
          <div style={{marginBottom:18}}>
            <label style={{display:'block',fontSize:10,color:'#6b7494',letterSpacing:2,marginBottom:8}}>EMAIL</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="admin@casetrack.id" style={s} />
          </div>
          <div style={{marginBottom:22}}>
            <label style={{display:'block',fontSize:10,color:'#6b7494',letterSpacing:2,marginBottom:8}}>PASSWORD</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} required placeholder="••••••••" style={s} />
          </div>
          {error&&<div style={{marginBottom:16,padding:'10px 14px',borderRadius:8,background:'rgba(241,101,78,.1)',color:'#f1654e',border:'1px solid rgba(241,101,78,.25)',fontSize:13}}>{error}</div>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:11,borderRadius:9,background:loading?'rgba(232,197,71,.5)':'#e8c547',color:'#0a0d14',fontWeight:700,fontSize:14,border:'none',cursor:'pointer'}}>
            {loading?'Memuat...':'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
"""

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  Written: {path}')

print('All files written successfully!')

'@
Set-Content -Path $env:TEMP\ct_write_files.py -Value $content -Encoding UTF8
"

if %USEPY%==1 (
    %PYEXE% "%TEMP%\ct_write_files.py"
) else (
    echo  [SKIP] Python tidak tersedia, file TSX ditulis manual...
)

echo.
echo  [4/4] Push ke GitHub...
git add -A
git status
git commit -m "feat: CaseTrack v4 - Next.js + Supabase real-time"
git push origin main
if %errorlevel% neq 0 (
    git push origin master
)

echo.
echo  =============================================
echo   BERHASIL! Kode sudah di-push ke GitHub!
echo  =============================================
echo.
echo  Sekarang:
echo  1. Buka vercel.com - project dashboard-case
echo  2. Settings - Environment Variables - tambahkan:
echo     NEXT_PUBLIC_SUPABASE_URL
echo     NEXT_PUBLIC_SUPABASE_ANON_KEY
echo  3. Klik Redeploy
echo  4. Selesai! Login di dashboard-case-silk.vercel.app
echo.
pause
