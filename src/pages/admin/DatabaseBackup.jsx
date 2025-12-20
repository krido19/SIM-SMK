import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database, Download, AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

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
            let fullSQL = `-- ==========================================\n`;
            fullSQL += `-- FULL BACKUP DATABASE SIM SMKN 4\n`;
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
            fullSQL += `\n-- Create schedules table\nCREATE TABLE IF NOT EXISTS public.schedules (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,\n    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,\n    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,\n    subject_name TEXT,\n    teacher_name TEXT,\n    class_name TEXT,\n    day TEXT NOT NULL,\n    jam_ke INTEGER,\n    start_time TIME NOT NULL,\n    end_time TIME NOT NULL\n);\n`;
            fullSQL += `\n-- Create grades table\nCREATE TABLE IF NOT EXISTS public.grades (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,\n    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,\n    semester INTEGER DEFAULT 1,\n    tugas INTEGER DEFAULT 0,\n    uts INTEGER DEFAULT 0,\n    uas INTEGER DEFAULT 0,\n    score INTEGER DEFAULT 0,\n    teacher_id UUID REFERENCES public.teachers(id),\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n`;
            fullSQL += `\n-- Create attendance table\nCREATE TABLE IF NOT EXISTS public.attendance (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,\n    date DATE DEFAULT CURRENT_DATE,\n    status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpa')),\n    notes TEXT,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n`;
            fullSQL += `\n-- Create announcements table\nCREATE TABLE IF NOT EXISTS public.announcements (\n    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n    title TEXT NOT NULL,\n    content TEXT NOT NULL,\n    category TEXT,\n    date TEXT,\n    image_url TEXT,\n    author_id UUID REFERENCES public.profiles(id),\n    target_role TEXT,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n);\n`;
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
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-40" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex p-4 rounded-3xl bg-blue-50 text-blue-600 shadow-inner">
                            <Database size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Database Backup</h1>
                            <p className="text-gray-500 font-medium mt-2">Export seluruh data sistem ke dalam format SQL (.sql)</p>
                        </div>
                    </div>

                    <button
                        onClick={generateSQL}
                        disabled={isExporting}
                        className={`
                            group relative flex items-center justify-center space-x-3 px-8 py-5 rounded-2xl font-black transition-all shadow-xl active:scale-95
                            ${isExporting
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 hover:shadow-blue-200'}
                        `}
                    >
                        {isExporting ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <Download size={24} className="group-hover:-translate-y-1 transition-transform" />
                        )}
                        <span className="uppercase tracking-widest text-sm">
                            {isExporting ? 'Proses Export...' : 'Mulai Backup (SQL)'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Info and Status Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Warning Card */}
                <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 space-y-4">
                    <div className="flex items-center space-x-3 text-amber-700">
                        <AlertTriangle size={24} />
                        <h3 className="font-black uppercase tracking-widest text-xs">Peringatan Penting</h3>
                    </div>
                    <p className="text-amber-800/70 text-sm leading-relaxed font-medium">
                        Fitur ini akan mengambil seluruh baris data dari semua tabel.
                        Pastikan koneksi internet Anda stabil. Simpan file hasil backup di tempat yang aman.
                    </p>
                </div>

                {/* Scope Card */}
                <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 space-y-4">
                    <div className="flex items-center space-x-3 text-indigo-700">
                        <ShieldCheck size={24} />
                        <h3 className="font-black uppercase tracking-widest text-xs">Cakupan Backup</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {tables.map(t => (
                            <span key={t} className="px-3 py-1 bg-white/50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100/50 capitalize">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Messages */}
            {status === 'success' && (
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center space-x-4 animate-in zoom-in-95 duration-300">
                    <div className="p-2 bg-emerald-500 text-white rounded-full">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <h4 className="text-emerald-900 font-bold">Backup Selesai!</h4>
                        <p className="text-emerald-700 text-sm">File SQL telah diunduh ke komputer Anda.</p>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center space-x-4 animate-in shake duration-500">
                    <div className="p-2 bg-red-500 text-white rounded-full">
                        <X size={20} />
                    </div>
                    <div>
                        <h4 className="text-red-900 font-bold">Backup Gagal</h4>
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
