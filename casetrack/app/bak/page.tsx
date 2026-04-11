'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/components/ui/Toast'
import { StatusBadge } from '@/components/ui/Badges'
import { addLog } from '@/lib/helpers'
import type { BAK } from '@/types'

const inp = (s?: object): React.CSSProperties => ({ width:'100%',padding:'9px 12px',borderRadius:8,fontSize:13,outline:'none',background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',fontFamily:'DM Sans',...s })
const lbl: React.CSSProperties = { display:'block',fontSize:11,color:'var(--muted)',fontFamily:'DM Mono',letterSpacing:1,marginBottom:6,textTransform:'uppercase' }
const btnSec: React.CSSProperties = { padding:'7px 14px',borderRadius:7,background:'transparent',border:'1px solid var(--border)',color:'var(--muted)',fontSize:13,cursor:'pointer' }
const modalS = (w:number): React.CSSProperties => ({ width:'100%',maxWidth:w,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',maxHeight:'90vh',overflowY:'auto' })

function Wrap({children,onClose}:{children:React.ReactNode;onClose:()=>void}) {
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>{children}</div>
}
function MHead({title,sub,onClose}:{title:string;sub?:string;onClose:()=>void}) {
  return <div style={{padding:'18px 24px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}><div><div style={{fontFamily:'Syne',fontWeight:700,fontSize:16}}>{title}</div>{sub&&<div style={{fontSize:11,color:'var(--muted)',fontFamily:'DM Mono',marginTop:2}}>{sub}</div>}</div><button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'var(--muted)'}}>×</button></div>
}
function MFoot({onCancel,onSave,saving,label}:{onCancel:()=>void;onSave:()=>void;saving:boolean;label:string}) {
  return <div style={{padding:'14px 24px',borderTop:'1px solid var(--border)',display:'flex',gap:8,justifyContent:'flex-end'}}><button onClick={onCancel} style={btnSec}>Batal</button><button onClick={onSave} disabled={saving} style={{padding:'8px 20px',borderRadius:7,background:saving?'rgba(232,197,71,.5)':'var(--accent)',color:'#0a0d14',fontWeight:700,fontSize:13,border:'none',cursor:saving?'not-allowed':'pointer'}}>{saving?'Menyimpan...':label}</button></div>
}

function bakStatus(b: BAK) {
  if (b.head_status==='Disetujui') return 'Disetujui'
  if (b.head_status==='Ditolak') return 'Ditolak'
  if (b.assoc_status==='Disetujui') return 'Menunggu Lead/Head IR'
  return 'Menunggu IR Associate'
}

export default function BAKPage() {
  const { profile, hasPermission } = useAuth()
  const [list, setList]     = useState<BAK[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [showEdit, setShowEdit]     = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [current, setCurrent]       = useState<BAK | null>(null)
  const [form, setForm]   = useState<Partial<BAK>>({})
  const [saving, setSaving] = useState(false)
  // Status update fields
  const [sAssocStatus, setSAssocStatus] = useState('')
  const [sAssocNote, setSAssocNote]     = useState('')
  const [sHeadStatus, setSHeadStatus]   = useState('')
  const [sHeadNote, setSHeadNote]       = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('bak_list').select('*').order('created_at',{ascending:false})
    setList(data||[])
    setLoading(false)
  },[])

  useEffect(()=>{load()},[load])
  useEffect(()=>{
    const ch = supabase.channel('bak_rt').on('postgres_changes',{event:'*',schema:'public',table:'bak_list'},()=>load()).subscribe()
    return ()=>{supabase.removeChannel(ch)}
  },[load])

  const filtered = filter ? list.filter(b=>bakStatus(b)===filter) : list

  const total   = list.length
  const pending = list.filter(b=>bakStatus(b)==='Menunggu IR Associate').length
  const head    = list.filter(b=>bakStatus(b)==='Menunggu Lead/Head IR').length
  const done    = list.filter(b=>bakStatus(b)==='Disetujui').length

  function fmtDate(d:string){try{return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}catch{return d}}

  function openAdd(){
    setForm({assoc_status:'Belum Review',head_status:'Belum Review',date:new Date().toISOString().split('T')[0]})
    setShowAdd(true)
  }
  async function submitAdd(){
    if(!form.name?.trim()||!form.emp_id?.trim()){toast('Nama dan ID wajib diisi','error');return}
    setSaving(true)
    const {count}=await supabase.from('bak_list').select('*',{count:'exact',head:true})
    const id=`BAK-${new Date().getFullYear()}-${String((count||0)+1).padStart(3,'0')}`
    const os = form.head_status==='Disetujui'?'Disetujui':form.assoc_status==='Disetujui'?'Menunggu Lead/Head IR':'Menunggu IR Associate'
    const {error}=await supabase.from('bak_list').insert({id,...form,date:fmtDate(form.date||''),overall_status:os,docs:[],assoc_docs:[],head_docs:[],created_by:profile?.id})
    if(error)toast('Gagal: '+error.message,'error')
    else{toast('BAK berhasil disimpan','success');await addLog(profile?.id,profile?.name||'','BAK',`Buat BAK ${id} untuk ${form.name}`);setShowAdd(false)}
    setSaving(false)
  }

  function openEdit(b:BAK){
    try{
      const m:Record<string,string>={Jan:'01',Feb:'02',Mar:'03',Apr:'04',Mei:'05',Jun:'06',Jul:'07',Agu:'08',Sep:'09',Okt:'10',Nov:'11',Des:'12'}
      const p=b.date.split(' ')
      const d=p.length===3?`${p[2]}-${m[p[1]]||'01'}-${p[0].padStart(2,'0')}`:b.date
      setForm({...b,date:d})
    }catch{setForm({...b})}
    setCurrent(b);setShowEdit(true)
  }
  async function submitEdit(){
    if(!current)return
    setSaving(true)
    const os=form.head_status==='Disetujui'?'Disetujui':form.head_status==='Ditolak'?'Ditolak':form.assoc_status==='Disetujui'?'Menunggu Lead/Head IR':'Menunggu IR Associate'
    const {error}=await supabase.from('bak_list').update({...form,date:fmtDate(form.date||''),overall_status:os}).eq('id',current.id)
    if(error)toast('Gagal: '+error.message,'error')
    else{toast('BAK diperbarui','success');await addLog(profile?.id,profile?.name||'','UPDATE',`Edit BAK ${current.id}`);setShowEdit(false)}
    setSaving(false)
  }

  function openStatus(b:BAK){
    setCurrent(b)
    setSAssocStatus(b.assoc_status||'Belum Review')
    setSAssocNote(b.assoc_notes||'')
    setSHeadStatus(b.head_status||'Belum Review')
    setSHeadNote(b.head_notes||'')
    setShowStatus(true)
  }
  async function submitStatus(){
    if(!current)return
    setSaving(true)
    const os=sHeadStatus==='Disetujui'?'Disetujui':sHeadStatus==='Ditolak'?'Ditolak':sAssocStatus==='Disetujui'?'Menunggu Lead/Head IR':'Menunggu IR Associate'
    const {error}=await supabase.from('bak_list').update({
      assoc_status:sAssocStatus,assoc_notes:sAssocNote,
      head_status:sHeadStatus,head_notes:sHeadNote,
      overall_status:os
    }).eq('id',current.id)
    if(error)toast('Gagal: '+error.message,'error')
    else{toast('Status BAK diperbarui','success');await addLog(profile?.id,profile?.name||'','UPDATE',`Update status BAK ${current.id} → ${os}`);setShowStatus(false)}
    setSaving(false)
  }

  async function deleteBAK(b:BAK){
    if(!confirm(`Hapus BAK ${b.id}?`))return
    const {error}=await supabase.from('bak_list').delete().eq('id',b.id)
    if(error)toast('Gagal hapus','error')
    else{toast('BAK dihapus','success');await addLog(profile?.id,profile?.name||'','DELETE',`Hapus BAK ${b.id}`)}
  }

  const assocBadgeColor=(s:string)=>s==='Disetujui'?'green':s==='Belum Review'?'gray':'yellow'
  const headBadgeColor=(s:string)=>s==='Disetujui'?'green':s==='Ditolak'?'red':s==='Belum Review'?'gray':'yellow'

  return (
    <div>
      <div style={{padding:'18px 32px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--surface)',position:'sticky',top:0,zIndex:50}}>
        <div>
          <div style={{fontFamily:'Syne',fontWeight:700,fontSize:18}}>Dokumen BAK</div>
          <div style={{fontSize:12,color:'var(--muted)',fontFamily:'DM Mono',marginTop:2}}>Berita Acara Klarifikasi · Alur review IR Associate & Lead/Head IR</div>
        </div>
        {hasPermission('addBAK')&&<button onClick={openAdd} style={{padding:'8px 18px',borderRadius:7,background:'var(--accent)',color:'#0a0d14',fontWeight:700,fontSize:13,border:'none',cursor:'pointer'}}>+ Buat BAK Baru</button>}
      </div>

      <div style={{padding:'28px 32px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
          {[{l:'Total BAK',v:total,c:'var(--accent2)',i:'📋'},{l:'Menunggu IR Associate',v:pending,c:'var(--warning)',i:'⏳'},{l:'Menunggu Head IR',v:head,c:'var(--danger)',i:'⚠️'},{l:'Disetujui Final',v:done,c:'var(--success)',i:'✓'}].map(card=>(
            <div key={card.l} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:18,position:'relative'}}>
              <div style={{position:'absolute',top:14,right:14,fontSize:20,opacity:.15}}>{card.i}</div>
              <div style={{fontSize:10.5,color:'var(--muted)',fontFamily:'DM Mono',textTransform:'uppercase',letterSpacing:1.5}}>{card.l}</div>
              <div style={{fontFamily:'Syne',fontSize:36,fontWeight:800,margin:'6px 0 2px',color:card.c}}>{card.v}</div>
            </div>
          ))}
        </div>

        <div style={{marginBottom:16}}>
          <select value={filter} onChange={e=>setFilter(e.target.value)} style={inp({maxWidth:260})}>
            <option value="">Semua Status</option>
            <option value="Menunggu IR Associate">Menunggu IR Associate</option>
            <option value="Menunggu Lead/Head IR">Menunggu Lead/Head IR</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>

        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontFamily:'Syne',fontWeight:700,fontSize:14}}>Daftar BAK <span style={{fontSize:11,color:'var(--muted)',fontFamily:'DM Mono',fontWeight:400}}>· {filtered.length} dokumen</span></div>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['No. BAK','Nama Karyawan','Kasus','Tgl BAK','Perihal','IR Associate','Lead/Head IR','Status','Aksi'].map(h=>(
                <th key={h} style={{textAlign:'left',padding:'10px 14px',fontSize:10,letterSpacing:1.8,textTransform:'uppercase',color:'var(--muted)',fontFamily:'DM Mono',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap'}}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {loading?<tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'var(--muted)'}}>Memuat...</td></tr>
                :filtered.length===0?<tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'var(--muted)'}}>Tidak ada data</td></tr>
                :filtered.map(b=>(
                  <tr key={b.id} style={{borderBottom:'1px solid rgba(30,39,64,.5)',transition:'background .1s'}} onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.02)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <td style={{padding:'12px 14px',fontFamily:'DM Mono',fontSize:11.5,color:'var(--accent)'}}>{b.id}</td>
                    <td style={{padding:'12px 14px'}}><div style={{fontWeight:500,fontSize:13.5}}>{b.name}</div><div style={{fontSize:10.5,color:'var(--muted)',fontFamily:'DM Mono'}}>{b.emp_id}</div></td>
                    <td style={{padding:'12px 14px',fontFamily:'DM Mono',fontSize:11,color:'var(--accent2)'}}>{b.case_id||'—'}</td>
                    <td style={{padding:'12px 14px',fontFamily:'DM Mono',fontSize:11.5,color:'var(--muted)'}}>{b.date}</td>
                    <td style={{padding:'12px 14px',fontSize:12,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.perihal}</td>
                    <td style={{padding:'12px 14px'}}><StatusBadge status={b.assoc_status||'Belum Review'} /></td>
                    <td style={{padding:'12px 14px'}}><StatusBadge status={b.head_status||'Belum Review'} /></td>
                    <td style={{padding:'12px 14px'}}><StatusBadge status={bakStatus(b)} /></td>
                    <td style={{padding:'12px 14px',whiteSpace:'nowrap'}}>
                      <button onClick={()=>{setCurrent(b);setShowDetail(true)}} style={{...btnSec,marginRight:4,fontSize:11.5}}>Lihat</button>
                      {hasPermission('editBAK')&&<><button onClick={()=>openStatus(b)} style={{marginRight:4,padding:'4px 10px',borderRadius:6,border:'1px solid rgba(78,154,241,.4)',background:'rgba(78,154,241,.1)',color:'var(--accent2)',fontSize:11.5,cursor:'pointer',fontWeight:600}}>⟳ Review</button><button onClick={()=>openEdit(b)} style={{...btnSec,marginRight:4,fontSize:11.5}}>✏️</button></>}
                      {hasPermission('deleteBAK')&&<button onClick={()=>deleteBAK(b)} style={{padding:'4px 10px',borderRadius:6,border:'1px solid rgba(241,101,78,.3)',background:'transparent',color:'var(--danger)',fontSize:11.5,cursor:'pointer'}}>🗑</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL UPDATE REVIEW STATUS */}
      {showStatus&&current&&<Wrap onClose={()=>setShowStatus(false)}>
        <div style={modalS(580)}>
          <MHead title="⟳ Update Review BAK" sub={`${current.id} — ${current.name}`} onClose={()=>setShowStatus(false)} />
          <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:16}}>
            {/* IR Associate section */}
            <div style={{background:'var(--surface2)',border:'1px solid rgba(78,154,241,.25)',borderRadius:10,padding:16}}>
              <div style={{fontFamily:'Syne',fontWeight:700,fontSize:13,marginBottom:12,color:'var(--accent2)'}}>👤 Review IR Associate</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:10}}>
                <div><label style={lbl}>Nama IR Associate</label><input value={form.assoc_name||current.assoc_name||''} onChange={e=>setForm(f=>({...f,assoc_name:e.target.value}))} style={inp()} placeholder="Nama IR Associate" /></div>
                <div><label style={lbl}>Tanggal Review</label><input type="date" value={current.assoc_date||''} onChange={e=>setCurrent(c=>c?{...c,assoc_date:e.target.value}:c)} style={inp()} /></div>
              </div>
              <div style={{marginBottom:10}}><label style={lbl}>Status Review IR Associate *</label>
                <select value={sAssocStatus} onChange={e=>setSAssocStatus(e.target.value)} style={inp()}>
                  <option value="Belum Review">Belum Review</option>
                  <option value="Disetujui">✓ Disetujui — Lanjut ke Lead/Head IR</option>
                  <option value="Perlu Revisi">⚠ Perlu Revisi</option>
                </select>
              </div>
              <div><label style={lbl}>Catatan Review</label><textarea value={sAssocNote} onChange={e=>setSAssocNote(e.target.value)} rows={2} style={{...inp(),resize:'vertical' as any}} placeholder="Catatan IR Associate..." /></div>
            </div>
            {/* Lead/Head IR section */}
            <div style={{background:'var(--surface2)',border:'1px solid rgba(232,197,71,.25)',borderRadius:10,padding:16}}>
              <div style={{fontFamily:'Syne',fontWeight:700,fontSize:13,marginBottom:12,color:'var(--accent)'}}>👑 Review Lead / Head IR</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:10}}>
                <div><label style={lbl}>Nama Lead / Head IR</label><input value={form.head_name||current.head_name||''} onChange={e=>setForm(f=>({...f,head_name:e.target.value}))} style={inp()} placeholder="Nama Lead/Head IR" /></div>
                <div><label style={lbl}>Tanggal Review</label><input type="date" value={current.head_date||''} onChange={e=>setCurrent(c=>c?{...c,head_date:e.target.value}:c)} style={inp()} /></div>
              </div>
              <div style={{marginBottom:10}}><label style={lbl}>Keputusan Lead/Head IR *</label>
                <select value={sHeadStatus} onChange={e=>setSHeadStatus(e.target.value)} style={inp()}>
                  <option value="Belum Review">Belum Review</option>
                  <option value="Disetujui">✓ Disetujui — BAK Final</option>
                  <option value="Perlu Revisi">⚠ Perlu Revisi</option>
                  <option value="Ditolak">✕ Ditolak</option>
                </select>
              </div>
              <div><label style={lbl}>Catatan / Keputusan</label><textarea value={sHeadNote} onChange={e=>setSHeadNote(e.target.value)} rows={2} style={{...inp(),resize:'vertical' as any}} placeholder="Catatan Head IR..." /></div>
            </div>
          </div>
          <MFoot onCancel={()=>setShowStatus(false)} onSave={submitStatus} saving={saving} label="✓ Simpan Review" />
        </div>
      </Wrap>}

      {/* MODAL DETAIL */}
      {showDetail&&current&&<Wrap onClose={()=>setShowDetail(false)}>
        <div style={modalS(620)}>
          <MHead title={`Detail BAK — ${current.id}`} sub={`${current.name} (${current.emp_id}) · ${current.date}`} onClose={()=>setShowDetail(false)} />
          <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:16}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[['Nama',current.name],['ID',current.emp_id],['Dept',current.dept||'—'],['Terkait Kasus',current.case_id||'—'],['Tanggal BAK',current.date],['Perihal',current.perihal]].map(([k,v])=>(
                <div key={k}><div style={{fontSize:10.5,color:'var(--muted)',fontFamily:'DM Mono',marginBottom:3}}>{k}</div><div style={{fontSize:13.5,fontWeight:500}}>{v}</div></div>
              ))}
            </div>
            {current.content&&<div><div style={{fontSize:10,color:'var(--muted)',fontFamily:'DM Mono',letterSpacing:2,marginBottom:8,textTransform:'uppercase'}}>Isi / Kronologi</div><div style={{fontSize:13,lineHeight:1.6,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px'}} dangerouslySetInnerHTML={{__html:current.content}} /></div>}
            <div>
              <div style={{fontSize:10,color:'var(--muted)',fontFamily:'DM Mono',letterSpacing:2,marginBottom:12,textTransform:'uppercase',borderBottom:'1px solid var(--border)',paddingBottom:8}}>Alur Review</div>
              {[{num:1,label:'IR Associate',name:current.assoc_name,date:current.assoc_date,status:current.assoc_status,notes:current.assoc_notes,color:'var(--accent2)'},{num:2,label:'Lead / Head IR',name:current.head_name,date:current.head_date,status:current.head_status,notes:current.head_notes,color:'var(--accent)'}].map(step=>(
                <div key={step.num} style={{display:'flex',gap:14,marginBottom:14}}>
                  <div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:step.status==='Disetujui'?'rgba(78,207,138,.2)':'rgba(30,39,64,.8)',border:`1px solid ${step.status==='Disetujui'?'var(--success)':'var(--border)'}`,fontSize:12,fontWeight:700,color:step.status==='Disetujui'?'var(--success)':'var(--muted)'}}>{step.status==='Disetujui'?'✓':step.num}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{step.label}{step.name&&step.name!=='-'?' — '+step.name:''}</div>
                    {step.date&&<div style={{fontSize:11,color:'var(--muted)',fontFamily:'DM Mono',marginBottom:6}}>Tanggal review: {step.date}</div>}
                    <StatusBadge status={step.status||'Belum Review'} />
                    {step.notes&&step.notes!=='-'&&<div style={{fontSize:12.5,marginTop:8,background:'var(--surface2)',borderRadius:7,padding:'8px 10px',border:'1px solid var(--border)'}}>{step.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{padding:'14px 24px',borderTop:'1px solid var(--border)',display:'flex',gap:8,justifyContent:'flex-end'}}>
            {hasPermission('editBAK')&&<button onClick={()=>{setShowDetail(false);openStatus(current)}} style={{...btnSec,color:'var(--accent2)',borderColor:'rgba(78,154,241,.4)'}}>⟳ Update Review</button>}
            {hasPermission('editBAK')&&<button onClick={()=>{setShowDetail(false);openEdit(current)}} style={btnSec}>✏️ Edit</button>}
            <button onClick={()=>setShowDetail(false)} style={btnSec}>Tutup</button>
          </div>
        </div>
      </Wrap>}

      {/* MODAL ADD/EDIT */}
      {(showAdd||showEdit)&&<Wrap onClose={()=>{setShowAdd(false);setShowEdit(false)}}>
        <div style={modalS(680)}>
          <MHead title={showEdit?`✏️ Edit BAK — ${current?.id}`:'📋 Buat BAK Baru'} onClose={()=>{setShowAdd(false);setShowEdit(false)}} />
          <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div><label style={lbl}>Nama Karyawan *</label><input value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inp()} placeholder="Nama lengkap" /></div>
              <div><label style={lbl}>ID Karyawan *</label><input value={form.emp_id||''} onChange={e=>setForm(f=>({...f,emp_id:e.target.value}))} style={inp()} placeholder="EMP-001" /></div>
              <div><label style={lbl}>Departemen</label><input value={form.dept||''} onChange={e=>setForm(f=>({...f,dept:e.target.value}))} style={inp()} /></div>
              <div><label style={lbl}>Terkait Kasus ID</label><input value={form.case_id||''} onChange={e=>setForm(f=>({...f,case_id:e.target.value}))} style={inp()} placeholder="CSE-2026-001" /></div>
              <div><label style={lbl}>Tanggal BAK</label><input type="date" value={form.date||''} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp()} /></div>
              <div><label style={lbl}>Perihal / Topik</label><input value={form.perihal||''} onChange={e=>setForm(f=>({...f,perihal:e.target.value}))} style={inp()} placeholder="Topik klarifikasi" /></div>
            </div>
            <div><label style={lbl}>Isi / Kronologi Klarifikasi</label><textarea value={form.content||''} onChange={e=>setForm(f=>({...f,content:e.target.value}))} style={{...inp(),minHeight:90,resize:'vertical' as any}} placeholder="Kronologi klarifikasi..." /></div>
            <div style={{background:'var(--surface2)',border:'1px solid rgba(78,154,241,.2)',borderRadius:10,padding:14}}>
              <div style={{fontFamily:'Syne',fontWeight:700,fontSize:13,marginBottom:12,color:'var(--accent2)'}}>👤 Review IR Associate</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:10}}>
                <div><label style={lbl}>Nama IR Associate</label><input value={form.assoc_name||''} onChange={e=>setForm(f=>({...f,assoc_name:e.target.value}))} style={inp()} /></div>
                <div><label style={lbl}>Tgl Review</label><input type="date" value={form.assoc_date||''} onChange={e=>setForm(f=>({...f,assoc_date:e.target.value}))} style={inp()} /></div>
              </div>
              <div style={{marginBottom:10}}><label style={lbl}>Status Review</label>
                <select value={form.assoc_status||'Belum Review'} onChange={e=>setForm(f=>({...f,assoc_status:e.target.value}))} style={inp()}>
                  <option>Belum Review</option><option value="Disetujui">Disetujui — Lanjut ke Lead/Head IR</option><option>Perlu Revisi</option>
                </select>
              </div>
              <div><label style={lbl}>Catatan</label><textarea value={form.assoc_notes||''} onChange={e=>setForm(f=>({...f,assoc_notes:e.target.value}))} style={{...inp(),minHeight:56,resize:'vertical' as any}} /></div>
            </div>
            <div style={{background:'var(--surface2)',border:'1px solid rgba(232,197,71,.2)',borderRadius:10,padding:14}}>
              <div style={{fontFamily:'Syne',fontWeight:700,fontSize:13,marginBottom:12,color:'var(--accent)'}}>👑 Review Lead / Head IR</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:10}}>
                <div><label style={lbl}>Nama Lead / Head IR</label><input value={form.head_name||''} onChange={e=>setForm(f=>({...f,head_name:e.target.value}))} style={inp()} /></div>
                <div><label style={lbl}>Tgl Review</label><input type="date" value={form.head_date||''} onChange={e=>setForm(f=>({...f,head_date:e.target.value}))} style={inp()} /></div>
              </div>
              <div style={{marginBottom:10}}><label style={lbl}>Keputusan</label>
                <select value={form.head_status||'Belum Review'} onChange={e=>setForm(f=>({...f,head_status:e.target.value}))} style={inp()}>
                  <option>Belum Review</option><option value="Disetujui">Disetujui — BAK Final</option><option>Perlu Revisi</option><option>Ditolak</option>
                </select>
              </div>
              <div><label style={lbl}>Catatan / Keputusan</label><textarea value={form.head_notes||''} onChange={e=>setForm(f=>({...f,head_notes:e.target.value}))} style={{...inp(),minHeight:56,resize:'vertical' as any}} /></div>
            </div>
          </div>
          <MFoot onCancel={()=>{setShowAdd(false);setShowEdit(false)}} onSave={showEdit?submitEdit:submitAdd} saving={saving} label={showEdit?'💾 Simpan Perubahan':'💾 Simpan BAK'} />
        </div>
      </Wrap>}
    </div>
  )
}
