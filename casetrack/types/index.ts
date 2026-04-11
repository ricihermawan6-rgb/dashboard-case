export type Role = 'superadmin' | 'admin' | 'viewer'

export interface Profile {
  id: string
  name: string
  username: string
  role: Role
  dept?: string
  email?: string
  active: boolean
  photo_url?: string
  last_login?: string
  created_at?: string
}

export interface CaseUpdate {
  text: string
  time: string
  color: string
}

export interface Case {
  id: string
  name: string
  emp_id: string
  type: string
  dept: string
  casetype: string
  severity: 'Kritis' | 'Tinggi' | 'Sedang'
  status: 'Aktif' | 'Dalam Proses' | 'Pending' | 'Selesai' | 'Ditutup'
  sp?: string | null
  date: string
  last_update: string
  pic: string
  description: string
  updates: CaseUpdate[]
  docs: any[]
  photos: any[]
  created_by?: string
  created_at?: string
}

export interface SP {
  id: string
  name: string
  emp_id: string
  dept: string
  level: 'SP-1' | 'SP-2' | 'SP-3'
  reason: string
  issued: string
  valid_until: string
  status: 'Aktif' | 'Selesai' | 'Dibatalkan'
  case_id?: string | null
  notes?: string
  docs: any[]
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface BAK {
  id: string
  name: string
  emp_id: string
  dept: string
  case_id?: string
  date: string
  perihal: string
  content: string
  assoc_name?: string
  assoc_date?: string
  assoc_notes?: string
  assoc_status: string
  head_name?: string
  head_date?: string
  head_notes?: string
  head_status: string
  overall_status: string
  docs: any[]
  assoc_docs: any[]
  head_docs: any[]
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface PHK {
  id: string
  name: string
  emp_id: string
  dept: string
  jabatan: string
  alasan: string
  case_id?: string
  tgl: string
  tgl_lapor: string
  no_disnaker?: string
  status: string
  notes?: string
  docs: any[]
  created_by?: string
  created_at?: string
}

export interface ActivityLog {
  id: string
  user_id?: string
  user_name?: string
  action_type: string
  detail: string
  created_at: string
}

export interface DocTypeField {
  label: string
  type: 'text' | 'date' | 'textarea' | 'select'
  options?: string[]
}

export interface CustomDocType {
  id: string
  name: string
  icon: string
  description?: string
  fields: DocTypeField[]
  color: string
  active: boolean
  created_by?: string
  created_at?: string
}

export interface CustomEntry {
  id: string
  doc_type_id: string
  data: Record<string, any>
  created_by?: string
  created_at?: string
  updated_at?: string
}
