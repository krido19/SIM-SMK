import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TeachingJournals() {
    const [journals, setJournals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJournals = async () => {
            setIsLoading(true);
            const teacherName = localStorage.getItem('userName') || '';
            const { data, error } = await supabase
                .from('teaching_journals')
                .select(`*, classes:class_id (name)`)
                .eq('teacher_name', teacherName)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });
            if (!error) setJournals(data || []);
            setIsLoading(false);
        };
        fetchJournals();
    }, []);

    const handleExport = () => {
        if (journals.length === 0) return;
        const exportData = journals.map((j, index) => ({
            'No': index + 1,
            'Tanggal': new Date(j.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            'Kelas': j.classes?.name || '-', 'Mata Pelajaran': j.subject, 'Jam Ke': j.jam_ke,
            'Materi': j.materi, 'Sakit (S)': j.absent_s, 'Izin (I)': j.absent_i,
            'Alpa (A)': j.absent_a, 'Catatan': j.catatan || '-'
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Jurnal Mengajar');
        ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 30 }];
        XLSX.writeFile(wb, `Jurnal_Mengajar_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b-4 border-black">
                <div>
                    <span className="inline-block bg-neo-muted border-4 border-black text-[10px] font-black px-3 py-1 uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] mb-3">
                        Akademik
                    </span>
                    <h1 className="text-4xl font-black text-black uppercase tracking-tight leading-none mb-1">Riwayat Jurnal</h1>
                    <p className="font-bold text-black/50 text-sm">Log Jurnal Mengajar Anda</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={journals.length === 0}
                    className="flex items-center gap-2 bg-neo-secondary border-4 border-black font-black text-xs uppercase tracking-widest px-6 py-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Download size={16} strokeWidth={3} />
                    <span>Export Excel</span>
                </button>
            </div>

            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-black border-t-neo-accent animate-spin" />
                    <p className="font-black text-sm text-black/40 uppercase tracking-widest">Memuat Jurnal...</p>
                </div>
            ) : (
                <div className="border-4 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-neo-secondary border-b-4 border-black text-[10px] uppercase tracking-widest font-black text-black">
                                    <th className="px-5 py-4">Tanggal</th>
                                    <th className="px-5 py-4">Kelas & Mapel</th>
                                    <th className="px-5 py-4 text-center">Jam Ke</th>
                                    <th className="px-5 py-4">Materi</th>
                                    <th className="px-5 py-4 text-center">Absensi</th>
                                    <th className="px-5 py-4">Catatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {journals.map((journal) => (
                                    <tr key={journal.id} className="border-b-2 border-black/10 hover:bg-neo-muted/20 transition-colors">
                                        <td className="px-5 py-4 font-black text-black text-sm">
                                            {new Date(journal.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-black text-black tracking-tight">{journal.classes?.name || 'Kelas'}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mt-0.5">{journal.subject}</p>
                                        </td>
                                        <td className="px-5 py-4 text-center font-black text-black">{journal.jam_ke}</td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-black/70 line-clamp-2">{journal.materi}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-2 justify-center">
                                                <span className="text-[10px] font-black border-2 border-black bg-neo-secondary px-2 py-0.5">S: {journal.absent_s}</span>
                                                <span className="text-[10px] font-black border-2 border-black bg-neo-muted px-2 py-0.5">I: {journal.absent_i}</span>
                                                <span className="text-[10px] font-black border-2 border-black bg-neo-accent px-2 py-0.5">A: {journal.absent_a}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-black/50 italic line-clamp-2">{journal.catatan || '-'}</p>
                                        </td>
                                    </tr>
                                ))}
                                {journals.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center font-black text-black/30 uppercase tracking-widest">
                                            Belum ada jurnal yang tercatat.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
