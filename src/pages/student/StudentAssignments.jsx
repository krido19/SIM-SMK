import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Clock, BookOpen, AlertCircle, CheckCircle2, Download } from 'lucide-react';

export default function StudentAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { fetchStudentData(); }, []);

    const fetchStudentData = async () => {
        setIsLoading(true);
        const userId = localStorage.getItem('userId');
        if (userId) {
            const { data: student } = await supabase.from('students').select('class_id').eq('id', userId).maybeSingle();
            if (student?.class_id) {
                const { data: asgs } = await supabase.from('assignments').select(`*, teachers (name)`).eq('class_id', student.class_id).order('due_date', { ascending: true });
                setAssignments(asgs || []);
            }
        }
        setIsLoading(false);
    };

    if (isLoading) return (
        <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-black border-t-neo-accent animate-spin" />
            <p className="font-black text-sm text-black/40 uppercase tracking-widest">Memuat Tugas...</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-12">
            <div className="pb-4 border-b-4 border-black">
                <span className="inline-block bg-neo-accent border-4 border-black text-[10px] font-black px-3 py-1 uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] mb-3">Akademik</span>
                <h1 className="text-4xl font-black text-black uppercase tracking-tight leading-none">TUGAS SAYA</h1>
                <p className="font-bold text-black/50 text-sm mt-1">Daftar tugas yang harus dikerjakan.</p>
            </div>

            <div className="space-y-4">
                {assignments.length > 0 ? assignments.map((asg) => {
                    const isOverdue = new Date(asg.due_date) < new Date();
                    return (
                        <div key={asg.id} className={`border-4 border-black shadow-[6px_6px_0px_0px_#000] flex flex-col md:flex-row overflow-hidden ${isOverdue ? 'shadow-[6px_6px_0px_0px_#FF6B6B]' : ''}`}>
                            {/* Accent stripe */}
                            <div className={`w-full md:w-3 shrink-0 ${isOverdue ? 'bg-neo-accent' : 'bg-neo-secondary'}`} />

                            <div className="flex-1 p-5">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="border-2 border-black bg-neo-cream px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
                                        <BookOpen size={10} strokeWidth={3} />{asg.subject_name}
                                    </span>
                                    {isOverdue && (
                                        <span className="border-2 border-neo-accent bg-neo-accent px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                                            <AlertCircle size={10} strokeWidth={3} />Terlewat
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">{asg.title}</h3>
                                <p className="text-sm font-bold text-black/60 leading-relaxed border-l-4 border-black pl-3 mb-3">{asg.description}</p>
                                <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Guru: <span className="text-black">{asg.teachers?.name}</span></p>
                                {asg.file_url && (
                                    <a href={asg.file_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 border-4 border-black bg-neo-muted px-4 py-2.5 font-black text-[10px] uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all">
                                        <Download size={14} strokeWidth={3} />Unduh Materi
                                    </a>
                                )}
                            </div>

                            <div className={`flex flex-col justify-center min-w-[180px] border-t-4 md:border-t-0 md:border-l-4 border-black p-5 ${isOverdue ? 'bg-neo-accent' : 'bg-neo-cream'}`}>
                                <p className="text-[9px] font-black uppercase tracking-widest text-black/50 mb-1">Batas Waktu</p>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} strokeWidth={3} />
                                    <span className="font-black text-base">{new Date(asg.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-16 text-center border-4 border-dashed border-black/20 bg-white flex flex-col items-center">
                        <div className="border-4 border-black bg-neo-secondary p-4 shadow-[4px_4px_0px_0px_#000] mb-4">
                            <CheckCircle2 size={28} strokeWidth={3} />
                        </div>
                        <h3 className="font-black text-black uppercase">Tidak Ada Tugas</h3>
                        <p className="font-bold text-black/40 text-sm mt-1">Semua tugas sudah selesai!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
