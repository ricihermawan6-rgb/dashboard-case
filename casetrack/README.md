# CaseTrack v4 — Next.js + Supabase

## Setup

### 1. Supabase
Jalankan `supabase_schema.sql` di Supabase SQL Editor.

Buat user di Supabase → Authentication → Users → Add User:
- Email: admin@casetrack.id
- Password: (sesuaikan)

Setelah user dibuat, jalankan SQL:
```sql
INSERT INTO profiles (id, name, username, role, dept, email)
VALUES ('UUID-DARI-AUTH-USERS', 'Admin Utama', 'admin', 'superadmin', 'Manajemen', 'admin@casetrack.id');
```

### 2. Environment Variables
Copy `.env.example` ke `.env.local` dan isi dengan kredensial Supabase Anda.

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Deploy ke Vercel
1. Push ke GitHub
2. Connect repo di vercel.com
3. Tambahkan environment variables di Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Fitur
- ✅ Auth Supabase (login aman)
- ✅ Real-time updates semua data
- ✅ Cases, SP, BAK, PHK management
- ✅ Update status SP dengan modal khusus (⟳ Status)
- ✅ Update review BAK dua tahap (IR Associate + Head IR)
- ✅ Row Level Security
- ✅ Activity log
- ✅ Role-based access (superadmin, admin, viewer)
