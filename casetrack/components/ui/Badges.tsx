import { clsx } from 'clsx'

interface BadgeProps { label: string; variant?: string; className?: string }

const VARIANTS: Record<string, { bg: string; color: string; border: string }> = {
  red:    { bg: 'rgba(241,101,78,.15)',  color: '#f4806b', border: 'rgba(241,101,78,.25)' },
  yellow: { bg: 'rgba(232,197,71,.15)',  color: '#e8c547', border: 'rgba(232,197,71,.25)' },
  blue:   { bg: 'rgba(78,154,241,.15)',  color: '#6aaaf5', border: 'rgba(78,154,241,.25)' },
  green:  { bg: 'rgba(78,207,138,.15)',  color: '#5fd99b', border: 'rgba(78,207,138,.25)' },
  gray:   { bg: 'rgba(107,116,148,.15)', color: '#8b96ba', border: 'rgba(107,116,148,.25)' },
  purple: { bg: 'rgba(167,139,250,.15)', color: '#a78bfa', border: 'rgba(167,139,250,.25)' },
  orange: { bg: 'rgba(241,169,78,.15)',  color: '#f1a94e', border: 'rgba(241,169,78,.3)' },
}

export function Badge({ label, variant = 'gray', className }: BadgeProps) {
  const v = VARIANTS[variant] || VARIANTS.gray
  return (
    <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'DM Mono', letterSpacing: .3, background: v.bg, color: v.color, border: `1px solid ${v.border}` }}
      className={className}>
      {label}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Aktif': 'red', 'Dalam Proses': 'yellow', 'Pending': 'blue',
    'Selesai': 'green', 'Ditutup': 'gray', 'Dibatalkan': 'gray',
    'Disetujui': 'green', 'Belum Review': 'gray', 'Perlu Revisi': 'yellow',
    'Ditolak': 'red', 'Tanda Terima Diterima': 'green',
    'Menunggu IR Associate': 'yellow', 'Menunggu Lead/Head IR': 'blue',
  }
  return <Badge label={status} variant={map[status] || 'gray'} />
}

export function SPBadge({ level }: { level: string }) {
  const map: Record<string, string> = { 'SP-1': 'orange', 'SP-2': 'red', 'SP-3': 'red' }
  return <Badge label={level} variant={map[level] || 'gray'} />
}

export function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = { Kritis: '#f1654e', Tinggi: '#e8c547', Sedang: '#4e9af1' }
  const color = colors[severity] || '#6b7494'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, display: 'inline-block' }} />
      {severity}
    </span>
  )
}

export function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = { Karyawan: 'blue', Mitra: 'yellow', Vendor: 'gray' }
  return <Badge label={type} variant={map[type] || 'gray'} />
}
