'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { StatusBadge, SeverityDot, TypeBadge, SPBadge } from '@/components/ui/Badges'
import type { Case } from '@/types'

export default function DashboardPage() {
  const { profile } = useAuth()
  const [cases, setCases]     = useState<Case[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('cases').select('*').order('created_at',{ascending:false}).limit(8)
    setCases(data||[])
    setLoading(false)
  },[])

  useEffect(()=>{load()},[load])

  const statCard=(label:string,val:number,color:string,icon:string,accent:string)=>(
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:20,position:'relative',overflow:'hidden',borderTop:`2px solid ${accent}`}}>
      <div style={{position:'absolute',top:16,right:16,fontSize:22,opacity:.15}}>{icon}</div>
      <div style={{fontSize:11,color:'var(--muted)',fontFamily:'DM Mono',textTransform:'uppercase',letterSpacing:1.5}}>{label}</div>
      <div style={{fontFamily:'Syne',fontSize:36,fontWeight:800,margin:'8px 0 4px',color}}>{val}</div>
    </div>
  )

  const active   = cases.filter(c=>c.status==='Aktif').length
  const process  = cases.filter(c=>c.status==='Dalam Proses').length
  const pending  = cases.filter(c=>c.status==='Pending').length
  const done     = cases.filter(c=>c.status==='Selesai').length

  return (
    <div>
      <div style={{padding:'18px 32px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--surface)',position:'sticky',top:0,zIndex:50}}>
        <div>
          <div style={{fontFamily:'Syne',fontWeight:700,fontSize:18}}>Dashboard Kasus</div>
          <div style={{fontSize:12,color:'var(--muted)',fontFamily:'DM Mono',marginTop:2}}>Selamat datang, {profile?.name} · {new Date().toLocaleDateString('id-ID',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:'var(--success)',animation:'pulse 2s infinite'}}></div>
          <span style={{fontSize:11.5,color:'var(--success)',fontFamily:'DM Mono'}}>Real-time · Supabase</span>
        </div>
      </div>
      <div style={{padding:'28px 32px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28}}>
          {statCard('Kasus Aktif',active,'var(--danger)','🔴','rgba(241,101,78,.4)')}
          {statCard('Dalam Proses',process,'var(--warning)','🟡','rgba(241,169,78,.4)')}
          {statCard('Pending Review',pending,'var(--accent2)','⏳','rgba(78,154,241,.4)')}
          {statCard('Selesai',done,'var(--success)','✓','rgba(78,207,138,.4)')}
        </div>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontFamily:'Syne',fontWeight:700,fontSize:14}}>Kasus Terbaru</div>
            <a href="/cases" style={{fontSize:12,color:'var(--accent)',textDecoration:'none',fontFamily:'DM Mono'}}>Lihat semua →</a>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['ID','Nama','Tipe','Jenis Kasus','Tingkat','Status','SP','Update'].map(h=>(
                <th key={h} style={{textAlign:'left',padding:'10px 14px',fontSize:10,letterSpacing:1.8,textTransform:'uppercase',color:'var(--muted)',fontFamily:'DM Mono',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap'}}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {loading?<tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--muted)'}}>Memuat...</td></tr>
                :cases.map(c=>(
                  <tr key={c.id} style={{borderBottom:'1px solid rgba(30,39,64,.5)',transition:'background .1s'}} onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.02)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <td style={{padding:'12px 14px',fontFamily:'DM Mono',fontSize:11.5,color:'var(--accent)'}}>{c.id}</td>
                    <td style={{padding:'12px 14px'}}><div style={{fontWeight:500}}>{c.name}</div><div style={{fontSize:10.5,color:'var(--muted)',fontFamily:'DM Mono'}}>{c.emp_id}</div></td>
                    <td style={{padding:'12px 14px'}}><TypeBadge type={c.type} /></td>
                    <td style={{padding:'12px 14px',fontSize:12.5}}>{c.casetype}</td>
                    <td style={{padding:'12px 14px'}}><SeverityDot severity={c.severity} /></td>
                    <td style={{padding:'12px 14px'}}><StatusBadge status={c.status} /></td>
                    <td style={{padding:'12px 14px'}}>{c.sp?<SPBadge level={c.sp} />:<span style={{color:'var(--muted)',fontSize:11}}>—</span>}</td>
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
