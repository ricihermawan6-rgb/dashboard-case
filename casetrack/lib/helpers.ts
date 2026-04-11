import { supabase } from './supabase'

export async function addLog(userId: string | undefined, userName: string, actionType: string, detail: string) {
  await supabase.from('activity_log').insert({
    user_id: userId,
    user_name: userName,
    action_type: actionType,
    detail,
  })
}

export function nowID() {
  return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
}

export function todayStr() {
  return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function generateId(prefix: string, count: number) {
  return `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`
}
