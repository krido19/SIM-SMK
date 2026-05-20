import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Download, FileText, Plus, X, Save } from 'lucide-react';
import { useFeedback } from '../../context/FeedbackContext';
import * as XLSX from 'xlsx';

export default function TeachingJournals() {
    const [journals, setJournals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useFeedback();

    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
    const [journalData, setJournalData] = useState({ subject: '', jam_ke: '', materi: '', catatan: '', s: 0, i: 0, a: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const [activeSchedule, setActiveSchedule] = useState(null);

    useEffect(() => {
        fetchJournals();
        checkActiveSchedule();
        
        const interval = setInterval(() => {
            checkActiveSchedule();
        }, 60000);
        return () => clearInterval(interval);
    }, []);
    
    const checkActiveSchedule = async () => {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        if (!userId && !userName) return;

        let schedules = [];
        if (userId) {
            const { data: s1 } = await supabase.from('schedules').select('*').eq('teacher_id', userId);
            if (s1) schedules.push(...s1);
        }
        if (userName) {
            const { data: s2 } = await supabase.from('schedules').select('*').eq('teacher_name', userName);
            if (s2) schedules.push(...s2);
        }

        const Days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = Days[new Date().getDay()];
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

        const todaySchedules = schedules.filter(s => s.day === todayName);
        
        const currentActive = todaySchedules.find(s => {
            const startTime = s.start_time;
            if (!startTime || !s.end_time) return false;
            
            const [endH, endM, endS] = s.end_time.split(':').map(Number);
            const endObj = new Date();
            endObj.setHours(endH, endM, endS || 0);
            endObj.setMinutes(endObj.getMinutes() + 15);
            const bufferedEndTime = `${endObj.getHours().toString().padStart(2, '0')}:${endObj.getMinutes().toString().padStart(2, '0')}:00`;
            
            return currentTime >= startTime && currentTime <= bufferedEndTime;
        });

        setActiveSchedule(currentActive || null);
    };

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

    const handleOpenModal = () => {
        if (!activeSchedule) {
            showToast('Tidak ada jadwal mengajar yang aktif saat ini.', 'warning');
            return;
        }
        setJournalData({
            subject: activeSchedule.subject_name || '',
            jam_ke: activeSchedule.jam_ke?.toString() || '',
            materi: '',
            catatan: '',
            s: 0, i: 0, a: 0
        });
        setIsJournalModalOpen(true);
    };

    const submitJournal = async () => {
        if (!journalData.subject || !journalData.jam_ke || !journalData.materi) {
            showToast('Mata Pelajaran, Jam Ke-, dan Materi wajib diisi.', 'warning');
            return;
        }

        setIsSaving(true);
        const teacherName = localStorage.getItem('userName') || 'Guru';
        const todayDate = new Date().toISOString().split('T')[0];

        const { error } = await supabase
            .from('teaching_journals')
            .insert({
                teacher_name: teacherName,
                class_id: activeSchedule.class_id,
                subject: journalData.subject,
                date: todayDate,
                jam_ke: journalData.jam_ke,
                materi: journalData.materi,
                catatan: journalData.catatan || '',
                absent_s: Number(journalData.s) || 0,
                absent_i: Number(journalData.i) || 0,
                absent_a: Number(journalData.a) || 0
            });

        if (error) {
            showToast('Gagal menyimpan jurnal: ' + error.message, 'error');
        } else {
            showToast('Jurnal berhasil disimpan!', 'success');
            setIsJournalModalOpen(false);
            fetchJournals();
        }
        setIsSaving(false);
    };

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
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleOpenModal}
                        disabled={!activeSchedule}
                        className={`flex items-center gap-2 border-4 border-black font-black text-xs uppercase tracking-widest px-6 py-3 transition-all duration-100 ${
                            activeSchedule
                            ? 'bg-neo-accent text-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-70'
                        }`}
                        title={!activeSchedule ? 'Hanya dapat diisi saat jadwal mengajar aktif (+15 menit)' : ''}
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span>Tulis Jurnal</span>
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={journals.length === 0}
                        className="flex items-center gap-2 bg-neo-secondary border-4 border-black font-black text-xs uppercase tracking-widest px-6 py-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download size={16} strokeWidth={3} />
                        <span>Export Excel</span>
                    </button>
                </div>
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

            {isJournalModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] flex flex-col max-h-[90vh]">
                        <div className="bg-neo-accent border-b-4 border-black p-5 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-black">Jurnal Mengajar</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-black/70 mt-1">Kelas: {activeSchedule?.class_name || '-'}</p>
                            </div>
                            <button onClick={() => setIsJournalModalOpen(false)} className="border-4 border-black p-1 bg-white hover:bg-neo-secondary shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto min-h-0 flex-1 bg-neo-cream neo-grid-bg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/60">Mata Pelajaran <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Matematika"
                                        className="w-full bg-white border-4 border-black px-4 py-3 text-sm font-bold text-black focus:outline-none focus:bg-neo-cream shadow-[4px_4px_0px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#000] transition-all"
                                        value={journalData.subject}
                                        onChange={e => setJournalData({ ...journalData, subject: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/60">Jam Ke- <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 1-2"
                                        className="w-full bg-white border-4 border-black px-4 py-3 text-sm font-bold text-black focus:outline-none focus:bg-neo-cream shadow-[4px_4px_0px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#000] transition-all"
                                        value={journalData.jam_ke}
                                        onChange={e => setJournalData({ ...journalData, jam_ke: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/60">Materi Pembelajaran <span className="text-red-500">*</span></label>
                                <textarea
                                    rows="3"
                                    placeholder="Deskripsikan materi yang diajarkan..."
                                    className="w-full bg-white border-4 border-black px-4 py-3 text-sm font-bold text-black focus:outline-none focus:bg-neo-cream shadow-[4px_4px_0px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#000] transition-all resize-none"
                                    value={journalData.materi}
                                    onChange={e => setJournalData({ ...journalData, materi: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/60">Catatan (Opsional)</label>
                                <textarea
                                    rows="2"
                                    placeholder="Catatan tambahan kejadian di kelas..."
                                    className="w-full bg-white border-4 border-black px-4 py-3 text-sm font-bold text-black focus:outline-none focus:bg-neo-cream shadow-[4px_4px_0px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#000] transition-all resize-none"
                                    value={journalData.catatan}
                                    onChange={e => setJournalData({ ...journalData, catatan: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="border-4 border-black bg-white p-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2 block">Rekap Absensi (Manual)</span>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-black">Sakit (S)</label>
                                        <input type="number" min="0" value={journalData.s} onChange={e => setJournalData({ ...journalData, s: e.target.value })} className="w-full border-2 border-black bg-neo-secondary/30 px-2 py-1 text-sm font-bold text-center" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-black">Izin (I)</label>
                                        <input type="number" min="0" value={journalData.i} onChange={e => setJournalData({ ...journalData, i: e.target.value })} className="w-full border-2 border-black bg-neo-muted/30 px-2 py-1 text-sm font-bold text-center" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-black">Alpa (A)</label>
                                        <input type="number" min="0" value={journalData.a} onChange={e => setJournalData({ ...journalData, a: e.target.value })} className="w-full border-2 border-black bg-neo-accent/30 px-2 py-1 text-sm font-bold text-center" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t-4 border-black bg-white flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setIsJournalModalOpen(false)}
                                className="px-6 py-2.5 font-black text-xs uppercase tracking-widest text-black/60 hover:text-black transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={submitJournal}
                                disabled={isSaving}
                                className="flex items-center space-x-2 bg-neo-secondary border-4 border-black text-black px-6 py-2.5 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Menyimpan...' : (
                                    <>
                                        <Save size={16} strokeWidth={3} />
                                        <span>Simpan Jurnal</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
