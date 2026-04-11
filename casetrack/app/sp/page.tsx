'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/components/ui/Toast'
import { SPBadge, StatusBadge } from '@/components/ui/Badges'
import { addLog } from '@/lib/helpers'
import type { SP } from '@/types'

const inp = (s?: object): React.CSSProperties => ({ width:'100%', padding:'9px 12px', borderRadius:8, fontSize:13, outline:'none', background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:'DM Sans', ...s })
const lbl: React.CSSProperties = { display:'block', fontSize:11, color:'var(--muted)', fontFamily:'DM Mono', letterSpacing:1, marginBottom:6, textTransform:'uppercase' }
const btnSec: React.CSSProperties = { padding:'7px 16px', borderRadius:7, background:'transparent', border:'1px solid var(--border)', color:'var(--muted)', fontSize:13, cursor:'pointer' }
const modalS = (w: number): React.CSSProperties => ({ width:'100%', maxWidth:w, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', maxHeight:'90vh', overflowY:'auto' })

function Wrap({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {children}
    </div>
  )
}
function MHead({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) {
  return (
    <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:16 }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'DM Mono', marginTop:2 }}>{sub}</div>}
      </div>
      <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'var(--muted)' }}>×</button>
    </div>
  )
}
function MFoot({ onCancel, onSave, saving, label }: { onCancel: () => void; onSave: () => void; saving: boolean; label: string }) {
  return (
    <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }}>
      <button onClick={onCancel} style={btnSec}>Batal</button>
      <button onClick={onSave} disabled={saving} style={{ padding:'8px 20px', borderRadius:7, background:saving?'rgba(232,197,71,.5)':'var(--accent)', color:'#0a0d14', fontWeight:700, fontSize:13, border:'none', cursor:saving?'not-allowed':'pointer' }}>
        {saving ? 'Menyimpan...' : label}
      </button>
    </div>
  )
}

export default function SPPage() {
  const { profile, hasPermission } = useAuth()
  const [spList, setSpList]   = useState<SP[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')
  const [search, setSearch]   = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [showEdit, setShowEdit]     = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [current, setCurrent]       = useState<SP | null>(null)
  const [form, setForm]   = useState<Partial<SP>>({})
  const [statusNote, setStatusNote] = useState('')
  const [newStatus, setNewStatus]   = useState('Aktif')
  const [saving, setSaving]         = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('sp_list').select('*').order('created_at', { ascending: false })
    setSpList(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const ch = supabase.channel('sp_rt')
      .on('postgres_changes', { event:'*', schema:'public', table:'sp_list' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const filtered = spList.filter(s => {
    const mf = !filter || s.level === filter
    const q  = search.toLowerCase()
    const ms = !search || s.name.toLowerCase().includes(q) || s.emp_id.toLowerCase().includes(q) || (s.reason||'').toLowerCase().includes(q)
    return mf && ms
  })

  const sp1 = spList.filter(s => s.level==='SP-1' && s.status==='Aktif').length
  const sp2 = spList.filter(s => s.level==='SP-2' && s.status==='Aktif').length
  const sp3 = spList.filter(s => s.level==='SP-3' && s.status==='Aktif').length

  function parseDate(d: string) {
    try {
      const m: Record<string,string> = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',Mei:'05',Jun:'06',Jul:'07',Agu:'08',Sep:'09',Okt:'10',Nov:'11',Des:'12'}
      const p = d.split(' ')
      return p.length===3 ? `${p[2]}-${m[p[1]]||'01'}-${p[0].padStart(2,'0')}` : d
    } catch { return d }
  }
  function fmtDate(d: string) {
    try { return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) } catch { return d }
  }

  function openAdd() {
    const t = new Date(); const u = new Date(t); u.setMonth(u.getMonth()+6)
    setForm({ level:'SP-1', status:'Aktif', issued:t.toISOString().split('T')[0], valid_until:u.toISOString().split('T')[0] })
    setShowAdd(true)
  }
  async function submitAdd() {
    if (!form.name?.trim()||!form.emp_id?.trim()) { toast('Nama dan ID wajib diisi','error'); return }
    setSaving(true)
    const { count } = await supabase.from('sp_list').select('*',{count:'exact',head:true})
    const id = `SP-${new Date().getFullYear()}-${String((count||0)+1).padStart(3,'0')}`
    const { error } = await supabase.from('sp_list').insert({ id, ...form, issued:fmtDate(form.issued||''), valid_until:fmtDate(form.valid_until||''), docs:[], created_by:profile?.id })
    if (error) toast('Gagal: '+error.message,'error')
    else { toast(`${form.level} diterbitkan untuk ${form.name}`,'success'); await addLog(profile?.id,profile?.name||'','SP',`Terbitkan ${form.level} untuk ${form.name}`); setShowAdd(false) }
    setSaving(false)
  }

  function openEdit(sp: SP) {
    setForm({ ...sp, issued:parseDate(sp.issued), valid_until:parseDate(sp.valid_until) })
    setCurrent(sp); setShowEdit(true)
  }
  async function submitEdit() {
    if (!current||!form.name?.trim()||!form.emp_id?.trim()) { toast('Nama dan ID wajib diisi','error'); return }
    setSaving(true)
    const { error } = await supabase.from('sp_list').update({ name:form.name, emp_id:form.emp_id, dept:form.dept, level:form.level, reason:form.reason, status:form.status, notes:form.notes, issued:fmtDate(form.issued||''), valid_until:fmtDate(form.valid_until||'') }).eq('id',current.id)
    if (error) toast('Gagal: '+error.message,'error')
    else { toast('SP diperbarui','success'); await addLog(profile?.id,profile?.name||'','UPDATE',`Edit SP ${current.id}`); setShowEdit(false) }
    setSaving(false)
  }

  function openStatus(sp: SP) { setCurrent(sp); setNewStatus(sp.status); setStatusNote(''); setShowStatus(true) }
  async function submitStatus() {
    if (!current) return
    setSaving(true)
    const { error } = await supabase.from('sp_list').update({ status:newStatus }).eq('id',current.id)
    if (error) toast('Gagal: '+error.message,'error')
    else { toast(`Status SP → ${newStatus}`,'success'); await addLog(profile?.id,profile?.name||'','UPDATE',`Status SP ${current.id}: ${current.status} → ${newStatus}${statusNote?' · '+statusNote:''}`); setShowStatus(false) }
    setSaving(false)
  }

  async function deleteSP(sp: SP) {
    if (!confirm(`Hapus SP ${sp.id}?`)) return
    const { error } = await supabase.from('sp_list').delete().eq('id',sp.id)
    if (error) toast('Gagal hapus','error')
    else { toast('SP dihapus','success'); await addLog(profile?.id,profile?.name||'','DELETE',`Hapus SP ${sp.id}`) }
  }

  return (
    <div>
      {/* TOPBAR */}
      <div style={{ padding:'18px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface)', position:'sticky', top:0, zIndex:50 }}>
        <div>
          <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:18 }}>Tracker Surat Peringatan (SP)</div>
          <div style={{ fontSize:12, color:'var(--muted)', fontFamily:'DM Mono', marginTop:2 }}>Monitor & update status SP · Real-time Supabase</div>
        </div>
        {hasPermission('addSP') && <button onClick={openAdd} style={{ padding:'8px 18px', borderRadius:7, background:'var(--accent)', color:'#0a0d14', fontWeight:700, fontSize:13, border:'none', cursor:'pointer' }}>+ Terbitkan SP</button>}
      </div>

      <div style={{ padding:'28px 32px' }}>
        {/* STAT CARDS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
          {[{label:'SP-1 Aktif',val:sp1,color:'#f1a94e',icon:'⚠️',top:'rgba(241,169,78,.4)'},{label:'SP-2 Aktif',val:sp2,color:'#f1654e',icon:'⛔',top:'rgba(241,101,78,.4)'},{label:'SP-3 Terakhir',val:sp3,color:'#ef4444',icon:'🚫',top:'rgba(220,38,38,.45)'}].map(c=>(
            <div key={c.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, position:'relative', overflow:'hidden', borderTop:`2px solid ${c.top}` }}>
              <div style={{ position:'absolute', top:16, right:16, fontSize:22, opacity:.15 }}>{c.icon}</div>
              <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'DM Mono', textTransform:'uppercase', letterSpacing:1.5 }}>{c.label}</div>
              <div style={{ fontFamily:'Syne', fontSize:40, fontWeight:800, margin:'8px 0 4px', color:c.color }}>{c.val}</div>
            </div>
          ))}
        </div>

        {/* FILTER */}
        <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}>⌕</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama, ID, pelanggaran..." style={{ ...inp(), paddingLeft:36 }} />
          </div>
          <select value={filter} onChange={e=>setFilter(e.target.value)} style={inp({flex:'0 0 140px'})}>
            <option value="">Semua SP</option><option>SP-1</option><option>SP-2</option><option>SP-3</option>
          </select>
        </div>

        {/* TABLE */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:14 }}>Riwayat SP <span style={{ fontSize:11, color:'var(--muted)', fontFamily:'DM Mono', fontWeight:400 }}>· {filtered.length} data</span></div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>{['No. SP','Nama','ID','Dept','Level','Pelanggaran','Tgl Terbit','Berlaku','Status','Aksi'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:10, letterSpacing:1.8, textTransform:'uppercase', color:'var(--muted)', fontFamily:'DM Mono', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={10} style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Memuat...</td></tr>
                : filtered.length===0 ? <tr><td colSpan={10} style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Tidak ada data</td></tr>
                : filtered.map(sp=>(
                  <tr key={sp.id} style={{ borderBottom:'1px solid rgba(30,39,64,.5)', transition:'background .1s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.02)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <td style={{ padding:'12px 14px', fontFamily:'DM Mono', fontSize:11.5, color:'var(--accent)' }}>{sp.id}</td>
                    <td style={{ padding:'12px 14px', fontWeight:500, fontSize:13.5 }}>{sp.name}</td>
                    <td style={{ padding:'12px 14px', fontFamily:'DM Mono', fontSize:11, color:'var(--muted)' }}>{sp.emp_id}</td>
                    <td style={{ padding:'12px 14px', fontSize:13 }}>{sp.dept}</td>
                    <td style={{ padding:'12px 14px' }}><SPBadge level={sp.level} /></td>
                    <td style={{ padding:'12px 14px', fontSize:12, maxWidth:160, color:'#b0b8d8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sp.reason}</td>
                    <td style={{ padding:'12px 14px', fontFamily:'DM Mono', fontSize:11.5, color:'var(--muted)' }}>{sp.issued}</td>
                    <td style={{ padding:'12px 14px', fontFamily:'DM Mono', fontSize:11.5, color:'var(--muted)' }}>{sp.valid_until}</td>
                    <td style={{ padding:'12px 14px' }}><StatusBadge status={sp.status} /></td>
                    <td style={{ padding:'12px 14px', whiteSpace:'nowrap' }}>
                      <button onClick={()=>{setCurrent(sp);setShowDetail(true)}} style={{ ...btnSec, marginRight:4, fontSize:11.5 }}>Lihat</button>
                      {hasPermission('editSP')&&<>
                        <button onClick={()=>openStatus(sp)} style={{ marginRight:4, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(78,154,241,.4)', background:'rgba(78,154,241,.1)', color:'var(--accent2)', fontSize:11.5, cursor:'pointer', fontWeight:600 }}>⟳ Status</button>
                        <button onClick={()=>openEdit(sp)} style={{ ...btnSec, marginRight:4, fontSize:11.5 }}>✏️</button>
                      </>}
                      {hasPermission('deleteSP')&&<button onClick={()=>deleteSP(sp)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid rgba(241,101,78,.3)', background:'transparent', color:'var(--danger)', fontSize:11.5, cursor:'pointer' }}>🗑</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL UPDATE STATUS */}
      {showStatus&&current&&<Wrap onClose={()=>setShowStatus(false)}>
        <div style={modalS(460)}>
          <MHead title="⟳ Update Status SP" sub={`${current.id} — ${current.name} (${current.emp_id})`} onClose={()=>setShowStatus(false)} />
          <div style={{ padding:'20px 24px' }}>
            <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:9, padding:'12px 14px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:10 }}>
              Status saat ini: <StatusBadge status={current.status} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Status Baru *</label>
              <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={inp()}>
                <option value="Aktif">🟡 Aktif</option>
                <option value="Selesai">🟢 Selesai — Masa berlaku habis / dicabut</option>
                <option value="Dibatalkan">⛔ Dibatalkan</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Catatan Perubahan (opsional)</label>
              <textarea value={statusNote} onChange={e=>setStatusNote(e.target.value)} rows={3} placeholder="Alasan perubahan status..." style={{ ...inp(), resize:'vertical' as any }} />
            </div>
          </div>
          <MFoot onCancel={()=>setShowStatus(false)} onSave={submitStatus} saving={saving} label="✓ Simpan Status" />
        </div>
      </Wrap>}

      {/* MODAL DETAIL */}
      {showDetail&&current&&<Wrap onClose={()=>setShowDetail(false)}>
        <div style={modalS(540)}>
          <MHead title={`Detail SP — ${current.id}`} sub={`${current.name} (${current.emp_id})`} onClose={()=>setShowDetail(false)} />
          <div style={{ padding:'20px 24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              {[['Nama',current.name],['ID',current.emp_id],['Departemen',current.dept||'—'],['Level',current.level],['Tgl Terbit',current.issued],['Berlaku',current.valid_until]].map(([k,v])=>(
                <div key={k}><div style={{ fontSize:10.5, color:'var(--muted)', fontFamily:'DM Mono', marginBottom:3 }}>{k}</div><div style={{ fontSize:13.5, fontWeight:500 }}>{v}</div></div>
              ))}
            </div>
            <div style={{ marginBottom:12 }}><div style={{ fontSize:10.5, color:'var(--muted)', fontFamily:'DM Mono', marginBottom:6 }}>STATUS</div><StatusBadge status={current.status} /></div>
            {current.reason&&<div style={{ marginBottom:12 }}><div style={{ fontSize:10.5, color:'var(--muted)', fontFamily:'DM Mono', marginBottom:6 }}>PELANGGARAN</div><div style={{ fontSize:13 }}>{current.reason}</div></div>}
            {current.notes&&<div><div style={{ fontSize:10.5, color:'var(--muted)', fontFamily:'DM Mono', marginBottom:6 }}>CATATAN</div><div style={{ fontSize:13, background:'var(--surface2)', padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)' }}>{current.notes}</div></div>}
          </div>
          <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }}>
            {hasPermission('editSP')&&<button onClick={()=>{setShowDetail(false);openStatus(current)}} style={{ ...btnSec, color:'var(--accent2)', borderColor:'rgba(78,154,241,.4)' }}>⟳ Update Status</button>}
            {hasPermission('editSP')&&<button onClick={()=>{setShowDetail(false);openEdit(current)}} style={btnSec}>✏️ Edit</button>}
            <button onClick={()=>setShowDetail(false)} style={btnSec}>Tutup</button>
          </div>
        </div>
      </Wrap>}

      {/* MODAL ADD */}
      {showAdd&&<Wrap onClose={()=>setShowAdd(false)}>
        <div style={modalS(560)}>
          <MHead title="+ Terbitkan SP Baru" onClose={()=>setShowAdd(false)} />
          <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={lbl}>Nama Karyawan *</label><input value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inp()} placeholder="Nama lengkap" /></div>
              <div><label style={lbl}>ID Karyawan *</label><input value={form.emp_id||''} onChange={e=>setForm(f=>({...f,emp_id:e.target.value}))} style={inp()} placeholder="EMP-001" /></div>
              <div><label style={lbl}>Departemen</label><input value={form.dept||''} onChange={e=>setForm(f=>({...f,dept:e.target.value}))} style={inp()} placeholder="Departemen" /></div>
              <div><label style={lbl}>Level SP</label>
                <select value={form.level||'SP-1'} onChange={e=>setForm(f=>({...f,level:e.target.value as any}))} style={inp()}>
                  <option>SP-1</option><option>SP-2</option><option>SP-3</option>
                </select>
              </div>
              <div><label style={lbl}>Tgl Terbit</label><input type="date" value={form.issued||''} onChange={e=>setForm(f=>({...f,issued:e.target.value}))} style={inp()} /></div>
              <div><label style={lbl}>Berlaku Hingga</label><input type="date" value={form.valid_until||''} onChange={e=>setForm(f=>({...f,valid_until:e.target.value}))} style={inp()} /></div>
            </div>
            <div><label style={lbl}>Pelanggaran / Alasan</label><textarea value={form.reason||''} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} style={{ ...inp(), minHeight:72, resize:'vertical' as any }} placeholder="Uraikan pelanggaran..." /></div>
            <div><label style={lbl}>Catatan Tambahan</label><textarea value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{ ...inp(), minHeight:56, resize:'vertical' as any }} placeholder="Opsional..." /></div>
          </div>
          <MFoot onCancel={()=>setShowAdd(false)} onSave={submitAdd} saving={saving} label="💾 Terbitkan SP" />
        </div>
      </Wrap>}

      {/* MODAL EDIT */}
      {showEdit&&current&&<Wrap onClose={()=>setShowEdit(false)}>
        <div style={modalS(560)}>
          <MHead title={`✏️ Edit SP — ${current.id}`} sub={`${current.name}`} onClose={()=>setShowEdit(false)} />
          <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={lbl}>Nama *</label><input value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inp()} /></div>
              <div><label style={lbl}>ID *</label><input value={form.emp_id||''} onChange={e=>setForm(f=>({...f,emp_id:e.target.value}))} style={inp()} /></div>
              <div><label style={lbl}>Departemen</label><input value={form.dept||''} onChange={e=>setForm(f=>({...f,dept:e.target.value}))} style={inp()} /></div>
              <div><label style={lbl}>Level SP</label>
                <select value={form.level||'SP-1'} onChange={e=>setForm(f=>({...f,level:e.target.value as any}))} style={inp()}>
                  <option>SP-1</option><option>SP-2</option><option>SP-3</option>
                </select>
              </div>
              <div><label style={lbl}>Tgl Terbit</label><input type="date" value={form.issued||''} onChange={e=>setForm(f=>({...f,issued:e.target.value}))} style={inp()} /></div>
              <div><label style={lbl}>Berlaku Hingga</label><input type="date" value={form.valid_until||''} onChange={e=>setForm(f=>({...f,valid_until:e.target.value}))} style={inp()} /></div>
              <div><label style={lbl}>Status</label>
                <select value={form.status||'Aktif'} onChange={e=>setForm(f=>({...f,status:e.target.value as any}))} style={inp()}>
                  <option>Aktif</option><option>Selesai</option><option>Dibatalkan</option>
                </select>
              </div>
            </div>
            <div><label style={lbl}>Pelanggaran</label><textarea value={form.reason||''} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} style={{ ...inp(), minHeight:72, resize:'vertical' as any }} /></div>
            <div><label style={lbl}>Catatan</label><textarea value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{ ...inp(), minHeight:56, resize:'vertical' as any }} /></div>
          </div>
          <MFoot onCancel={()=>setShowEdit(false)} onSave={submitEdit} saving={saving} label="💾 Simpan Perubahan" />
        </div>
      </Wrap>}
    </div>
  )
}
