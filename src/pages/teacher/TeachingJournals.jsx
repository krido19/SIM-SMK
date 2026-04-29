import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Search, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TeachingJournals() {
    const [journals, setJournals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJournals = async () => {
            setIsLoading(true);
            const teacherName = localStorage.getItem('userName') || '';

            // Fetch journals for this teacher
            const { data, error } = await supabase
                .from('teaching_journals')
                .select(`
                    *,
                    classes:class_id (name)
                `)
                .eq('teacher_name', teacherName)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) {
                console.error(error);
            } else {
                setJournals(data || []);
            }
            setIsLoading(false);
        };

        fetchJournals();
    }, []);

    const handleExport = () => {
        if (journals.length === 0) return;

        const exportData = journals.map((j, index) => ({
            'No': index + 1,
            'Tanggal': new Date(j.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            'Kelas': j.classes?.name || '-',
            'Mata Pelajaran': j.subject,
            'Jam Ke': j.jam_ke,
            'Materi': j.materi,
            'Sakit (S)': j.absent_s,
            'Izin (I)': j.absent_i,
            'Alpa (A)': j.absent_a,
            'Catatan': j.catatan || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Jurnal Mengajar');

        const colWidths = [
            { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, 
            { wch: 10 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, 
            { wch: 10 }, { wch: 30 }
        ];
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, `Jurnal_Mengajar_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="space-y-6 flex-1">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Akademik
                            </span>
                        </div>
                        <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight leading-none mb-2">Riwayat Jurnal</h1>
                        <p className="font-sans text-sm font-medium text-gray-500">Log Jurnal Mengajar Anda</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-6 xl:mt-0">
                    <button
                        onClick={handleExport}
                        disabled={journals.length === 0}
                        className="flex items-center space-x-2 bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        <Download size={16} strokeWidth={2.5} />
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                     <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest">Memuat Riwayat Jurnal...</div>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 font-sans text-[10px] uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-6 py-5 font-bold">Tanggal</th>
                                    <th className="px-6 py-5 font-bold">Kelas & Mapel</th>
                                    <th className="px-6 py-5 font-bold text-center">Jam Ke</th>
                                    <th className="px-6 py-5 font-bold">Materi</th>
                                    <th className="px-6 py-5 font-bold text-center">Absensi</th>
                                    <th className="px-6 py-5 font-bold">Catatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {journals.map((journal) => (
                                    <tr key={journal.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-5 font-sans font-bold text-gray-900">
                                            {new Date(journal.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-sans font-black text-gray-900 tracking-tight">{journal.classes?.name || 'Kelas'}</p>
                                            <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">{journal.subject}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center font-sans font-bold text-gray-600">
                                            {journal.jam_ke}
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-sans text-sm font-medium text-gray-700 line-clamp-2">{journal.materi}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex gap-3 justify-center">
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">S: {journal.absent_s}</span>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">I: {journal.absent_i}</span>
                                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">A: {journal.absent_a}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-sans text-sm font-medium text-gray-500 italic line-clamp-2">
                                                {journal.catatan || '-'}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                                {journals.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center font-sans font-medium text-gray-400">
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
