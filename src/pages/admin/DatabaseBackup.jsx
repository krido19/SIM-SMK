import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database, Download, AlertTriangle, CheckCircle2, Loader2, ShieldCheck, Terminal, ExternalLink, FileCode, Settings } from 'lucide-react';

export default function DatabaseBackup() {
    const [isExporting, setIsExporting] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [error, setError] = useState(null);

    const tables = [
        'profiles',
        'classes',
        'subjects',
        'teachers',
        'students',
        'schedules',
        'grades',
        'attendance',
        'announcements',
        'assignments',
        'settings'
    ];

    const formatValue = (val) => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') {
            // Escape single quotes for SQL
            return `'${val.replace(/'/g, "''")}'`;
        }
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        return val;
    };

    const generateSQL = async () => {
        setIsExporting(true);
        setStatus('loading');
        setError(null);

        try {
            const { data: schoolData } = await supabase.from('settings').select('value').eq('key', 'school_name').maybeSingle();
            const schoolName = schoolData?.value || 'SIM SMKN 4';

            let fullSQL = `-- ==========================================\n`;
            fullSQL += `-- FULL BACKUP DATABASE ${schoolName.toUpperCase()}\n`;
            fullSQL += `-- Includes: Schema, RLS, and Data\n`;
            fullSQL += `-- Generated on: ${new Date().toLocaleString('id-ID')}\n`;
            fullSQL += `-- ==========================================\n\n`;

            fullSQL += `SET statement_timeout = 0;\n`;
            fullSQL += `SET client_encoding = 'UTF8';\n\n`;

            fullSQL += `-- 1. SCHEMA DEFINITIONS\n`;
            fullSQL += `\n-- Create profiles table\nCREATE TABLE IF NOT EXISTS public.profiles (\n    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,\n    full_name TEXT,\n    role TEXT CHECK (role IN ('admin', 'guru', 'siswa', 'orang_tua')),\n    avatar_url TEXT,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n`;
            fullSQL += `\n-- Create classes table\nCREATE TABLE IF NOT EXISTS public.classes (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    name TEXT NOT NULL,\n    homeroom TEXT,\n    level TEXT,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n`;
            fullSQL += `\n-- Create subjects table\nCREATE TABLE IF NOT EXISTS public.subjects (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    name TEXT NOT NULL,\n    kkm INTEGER DEFAULT 75,\n    jurusan TEXT,\n    teachers TEXT,\n    color TEXT,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n`;
            fullSQL += `\n-- Create teachers table\nCREATE TABLE IF NOT EXISTS public.teachers (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,\n    nip TEXT UNIQUE,\n    name TEXT,\n    email TEXT,\n    specialty TEXT,\n    wa_number TEXT,\n    status TEXT DEFAULT 'Aktif',\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n`;
            fullSQL += `\n-- Create students table\nCREATE TABLE IF NOT EXISTS public.students (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,\n    nis TEXT UNIQUE,\n    full_name TEXT,\n    email TEXT,\n    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,\n    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,\n    wa_student TEXT,\n    wa_parent TEXT,\n    status TEXT DEFAULT 'Aktif',\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n`;
            fullSQL += `\n-- Create schedules table\nCREATE TABLE IF NOT EXISTS public.schedules (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,\n    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,\n    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,\n    subject_name TEXT,\n    teacher_name TEXT,\n    class_name TEXT,\n    day TEXT NOT NULL,\n    jam_ke INTEGER,\n    week_type TEXT DEFAULT 'Minggu Ganjil',\n    start_time TIME NOT NULL,\n    end_time TIME NOT NULL\n);\n`;
            fullSQL += `\n-- Create grades table\nCREATE TABLE IF NOT EXISTS public.grades (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,\n    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,\n    semester INTEGER DEFAULT 1,\n    tugas INTEGER DEFAULT 0,\n    uts INTEGER DEFAULT 0,\n    uas INTEGER DEFAULT 0,\n    score INTEGER DEFAULT 0,\n    teacher_id UUID REFERENCES public.teachers(id),\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n`;
            fullSQL += `\n-- Create attendance table\nCREATE TABLE IF NOT EXISTS public.attendance (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,\n    date DATE DEFAULT CURRENT_DATE,\n    status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpa')),\n    notes TEXT,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n`;
            fullSQL += `\n-- Create announcements table\nCREATE TABLE IF NOT EXISTS public.announcements (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    title TEXT NOT NULL,\n    content TEXT NOT NULL,\n    category TEXT,\n    date TEXT,\n    image_url TEXT,\n    author_id UUID REFERENCES public.profiles(id),\n    target_role TEXT,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n`;
            fullSQL += `\n-- Create assignments table\nCREATE TABLE IF NOT EXISTS public.assignments (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,\n    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,\n    subject_name TEXT,\n    title TEXT NOT NULL,\n    description TEXT,\n    due_date TIMESTAMP WITH TIME ZONE,\n    file_url TEXT,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n`;
            fullSQL += `\n-- Create settings table\nCREATE TABLE IF NOT EXISTS public.settings (\n    key TEXT PRIMARY KEY,\n    value TEXT,\n    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n\n`;

            fullSQL += `-- 2. SECURITY & RLS\n`;
            tables.forEach(table => {
                fullSQL += `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;\n`;
                fullSQL += `DROP POLICY IF EXISTS "Enable all for everyone" ON public.${table};\n`;
                fullSQL += `CREATE POLICY "Enable all for everyone" ON public.${table} FOR ALL USING (true) WITH CHECK (true);\n`;
            });
            fullSQL += `\n`;

            fullSQL += `-- 3. DATA INSERTS\n\n`;
            for (const table of tables) {
                const { data, error: tableError } = await supabase
                    .from(table)
                    .select('*');

                if (tableError) throw new Error(`Gagal mengambil data tabel ${table}: ${tableError.message}`);

                if (data && data.length > 0) {
                    fullSQL += `-- Data for table: ${table}\n`;
                    const columns = Object.keys(data[0]);

                    data.forEach(row => {
                        const values = columns.map(col => formatValue(row[col])).join(', ');
                        fullSQL += `INSERT INTO public.${table} (${columns.join(', ')}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
                    });
                    fullSQL += `\n`;
                }
            }

            fullSQL += `-- 4. ADDITIONAL SETUPS & CONSTRAINTS\n\n`;

            // Storage Setup
            fullSQL += `-- Create 'assignments' bucket if it doesn't exist\n`;
            fullSQL += `INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', true) ON CONFLICT (id) DO NOTHING;\n\n`;

            fullSQL += `-- Storage Policies for assignments\n`;
            fullSQL += `DROP POLICY IF EXISTS "Assignments Read Access" ON storage.objects;\n`;
            fullSQL += `CREATE POLICY "Assignments Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'assignments');\n\n`;

            fullSQL += `DROP POLICY IF EXISTS "Assignments Upload Access" ON storage.objects;\n`;
            fullSQL += `CREATE POLICY "Assignments Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assignments');\n\n`;

            fullSQL += `DROP POLICY IF EXISTS "Assignments Delete Access" ON storage.objects;\n`;
            fullSQL += `CREATE POLICY "Assignments Delete Access" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'assignments' AND auth.uid() = owner);\n\n`;

            // Unique Constraints
            fullSQL += `-- Advanced Constraints\n`;
            fullSQL += `ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS unique_attendance_student_date;\n`;
            fullSQL += `ALTER TABLE public.attendance ADD CONSTRAINT unique_attendance_student_date UNIQUE (student_id, date);\n\n`;

            fullSQL += `ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_student_id_subject_id_key;\n`;
            fullSQL += `ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_student_subject_semester_unique;\n`;
            fullSQL += `ALTER TABLE public.grades ADD CONSTRAINT grades_student_subject_semester_unique UNIQUE (student_id, subject_id, semester);\n\n`;

            // Additional RLS for assignments
            fullSQL += `-- Revised Policies for assignments table\n`;
            fullSQL += `DROP POLICY IF EXISTS "Authenticated users can insert" ON public.assignments;\n`;
            fullSQL += `CREATE POLICY "Authenticated users can insert" ON public.assignments FOR INSERT TO authenticated WITH CHECK (true);\n\n`;

            fullSQL += `DROP POLICY IF EXISTS "Authenticated users can update" ON public.assignments;\n`;
            fullSQL += `CREATE POLICY "Authenticated users can update" ON public.assignments FOR UPDATE TO authenticated USING (true);\n\n`;

            // Create and download file
            const blob = new Blob([fullSQL], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

            a.href = url;
            a.download = `backup_sim_smk_${timestamp}.sql`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setStatus('success');
        } catch (err) {
            console.error('Export Error:', err);
            setError(err.message);
            setStatus('error');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-paper p-10 border-2 border-ink shadow-[8px_8px_0px_0px_#111111] relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex p-4 bg-paper border-2 border-ink text-ink shadow-[4px_4px_0px_0px_#111111] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#111111]">
                            <Database size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-ink font-serif tracking-tight uppercase">DATABASE BACKUP</h1>
                            <p className="text-ink font-mono font-bold uppercase tracking-widest mt-2 block">EXPORT SELURUH DATA SISTEM KE DALAM FORMAT SQL (.SQL)</p>
                        </div>
                    </div>

                    <button
                        onClick={generateSQL}
                        disabled={isExporting}
                        className={`
                            group relative flex items-center justify-center space-x-3 px-8 py-5 font-mono font-bold uppercase tracking-widest transition-all border-2 border-ink shadow-[8px_8px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#111111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                            ${isExporting
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-dashed'
                                : 'bg-ink hover:bg-paper text-paper hover:text-ink'}
                        `}
                    >
                        {isExporting ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <Download size={24} className="group-hover:-translate-y-1 transition-transform" />
                        )}
                        <span>
                            {isExporting ? 'PROSES EXPORT...' : 'MULAI BACKUP (SQL)'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Info and Status Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Warning Card */}
                <div className="bg-editorial text-paper p-8 border-2 border-ink shadow-[4px_4px_0px_0px_#111111] space-y-4">
                    <div className="flex items-center space-x-3 text-paper">
                        <AlertTriangle size={24} />
                        <h3 className="font-mono font-black uppercase tracking-widest text-sm">PERINGATAN PENTING</h3>
                    </div>
                    <p className="text-paper/90 font-mono font-bold text-xs uppercase leading-relaxed">
                        FITUR INI AKAN MENGAMBIL SELURUH BARIS DATA DARI SEMUA TABEL.
                        PASTIKAN KONEKSI INTERNET ANDA STABIL. SIMPAN FILE HASIL BACKUP DI TEMPAT YANG AMAN.
                    </p>
                </div>

                {/* Scope Card */}
                <div className="bg-paper p-8 border-2 border-ink shadow-[4px_4px_0px_0px_#111111] space-y-4">
                    <div className="flex items-center space-x-3 text-ink">
                        <ShieldCheck size={24} />
                        <h3 className="font-mono font-black uppercase tracking-widest text-sm">CAKUPAN BACKUP</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {tables.map(t => (
                            <span key={t} className="px-3 py-1 bg-gray-50 text-ink text-[10px] font-mono font-bold uppercase tracking-widest border-2 border-ink">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Messages */}
            {status === 'success' && (
                <div className="bg-paper p-6 border-2 border-ink shadow-[4px_4px_0px_0px_#111111] flex items-center space-x-4 animate-in fade-in duration-300">
                    <div className="p-2 bg-ink text-paper border-2 border-ink">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h4 className="text-ink font-serif font-black uppercase text-lg tracking-tight">BACKUP SELESAI!</h4>
                        <p className="text-ink font-mono font-bold uppercase tracking-widest text-xs">FILE SQL TELAH DIUNDUH KE KOMPUTER ANDA.</p>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="bg-editorial p-6 border-2 border-ink shadow-[4px_4px_0px_0px_#111111] flex items-center space-x-4 animate-in fade-in duration-300">
                    <div className="p-2 bg-paper text-editorial border-2 border-ink">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h4 className="text-paper font-serif font-black uppercase text-lg tracking-tight">BACKUP GAGAL</h4>
                        <p className="text-paper font-mono font-bold uppercase tracking-widest text-xs">{error}</p>
                    </div>
                </div>
            )}

            {/* Migration Tutorial Section */}
            <div className="bg-paper p-10 border-2 border-ink shadow-[8px_8px_0px_0px_#111111] space-y-8">
                <div className="flex items-center space-x-4 border-b-2 border-ink pb-6">
                    <div className="p-3 bg-paper border-2 border-ink text-ink shadow-[4px_4px_0px_0px_#111111]">
                        <Terminal size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-ink font-serif uppercase tracking-tight">TUTORIAL MIGRASI SUPABASE</h2>
                        <p className="text-xs text-ink font-mono font-bold uppercase tracking-widest mt-1">CARA MEMINDAHKAN DATA KE PROJECT SUPABASE BARU</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Step 1 */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-ink border-2 border-ink text-paper text-xs font-mono font-black shadow-[2px_2px_0px_0px_#111111]">1</span>
                            <h3 className="font-mono font-black uppercase tracking-widest text-ink">EXPORT SQL</h3>
                        </div>
                        <p className="text-xs text-ink font-mono font-bold leading-relaxed uppercase">
                            KLIK TOMBOL <b>"MULAI BACKUP"</b> DI ATAS. ANDA AKAN MENDAPATKAN FILE BERFORMAT <code className="bg-gray-100 px-1 border border-ink">.SQL</code> YANG BERISI SELURUH DATA DAN STRUKTUR WEB INI.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-ink border-2 border-ink text-paper text-xs font-mono font-black shadow-[2px_2px_0px_0px_#111111]">2</span>
                            <h3 className="font-mono font-black uppercase tracking-widest text-ink">SQL EDITOR</h3>
                        </div>
                        <p className="text-xs text-ink font-mono font-bold leading-relaxed uppercase">
                            BUKA DASHBOARD SUPABASE BARU ANDA, PILIH MENU <b>"SQL EDITOR"</b>, LALU BUAT <b>"NEW QUERY"</b>. PASTE SELURUH ISI FILE SQL TADI KE DALAMNYA.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-ink border-2 border-ink text-paper text-xs font-mono font-black shadow-[2px_2px_0px_0px_#111111]">3</span>
                            <h3 className="font-mono font-black uppercase tracking-widest text-ink">RUN & REFRESH</h3>
                        </div>
                        <p className="text-xs text-ink font-mono font-bold leading-relaxed uppercase">
                            KLIK TOMBOL <b>"RUN"</b>. SETELAH SUKSES, SELURUH TABEL DAN DATA ANDA AKAN MUNCUL SECARA AJAIB DI PROJECT SUPABASE BARU.
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 border-2 border-ink shadow-[4px_4px_0px_0px_#111111] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-paper border-2 border-ink shadow-[2px_2px_0px_0px_#111111] text-ink">
                            <Settings size={20} />
                        </div>
                        <p className="text-xs text-ink font-mono font-bold uppercase tracking-widest">
                            <b>CATATAN:</b> JANGAN LUPA BUAT BUCKET <b>"ANNOUNCEMENTS"</b> SECARA MANUAL DI MENU STORAGE AGAR GAMBAR BISA TAMPIL.
                        </p>
                    </div>
                    <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-2 text-editorial text-xs font-mono font-black uppercase tracking-widest hover:underline"
                    >
                        <span>BUKA SUPABASE</span>
                        <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
}
