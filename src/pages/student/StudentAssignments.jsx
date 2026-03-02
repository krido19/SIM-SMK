
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    FileText,
    Clock,
    BookOpen,
    AlertCircle,
    CheckCircle2,
    Download
} from 'lucide-react';

export default function StudentAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [studentClassId, setStudentClassId] = useState(null);

    useEffect(() => {
        fetchStudentData();
    }, []);

    const fetchStudentData = async () => {
        setIsLoading(true);
        const userId = localStorage.getItem('userId');

        if (userId) {
            const { data: student } = await supabase
                .from('students')
                .select('class_id')
                .eq('id', userId)
                .maybeSingle();

            if (student) {
                setStudentClassId(student.class_id);
                fetchAssignments(student.class_id);
            }
        }
        setIsLoading(false);
    };

    const fetchAssignments = async (classId) => {
        const { data: asgs } = await supabase
            .from('assignments')
            .select(`
                *,
                teachers (name)
            `)
            .eq('class_id', classId)
            .order('due_date', { ascending: true });

        setAssignments(asgs || []);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="border-b-4 border-ink pb-6">
                <h1 className="text-4xl font-serif font-black text-ink uppercase tracking-tighter leading-none mb-1">TUGAS SAYA</h1>
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-60 mt-2">Daftar tugas yang harus dikerjakan.</p>
            </div>

            {isLoading ? (
                <div className="py-20 text-center font-mono text-[10px] uppercase tracking-widest">Memuat Tugas...</div>
            ) : (
                <div className="space-y-4">
                    {assignments.length > 0 ? assignments.map((asg) => {
                        const isOverdue = new Date(asg.due_date) < new Date();
                        return (
                            <div key={asg.id} className="bg-paper border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:shadow-[8px_8px_0px_0px_#111111] transition-all flex flex-col md:flex-row relative overflow-hidden group">
                                {/* Left accent bar */}
                                <div className={`w-full md:w-2 h-2 md:h-auto shrink-0 ${isOverdue ? 'bg-newsprint-red' : 'bg-ink'}`} />

                                <div className="flex-1 p-6 space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <span className="px-2 py-1 bg-paper border-2 border-ink text-ink text-[10px] font-mono font-black uppercase tracking-widest flex items-center">
                                            <BookOpen size={12} className="mr-2" />
                                            {asg.subject_name}
                                        </span>
                                        {isOverdue && (
                                            <span className="px-2 py-1 bg-newsprint-red text-paper text-[10px] font-mono font-black uppercase tracking-widest flex items-center border-2 border-ink">
                                                <AlertCircle size={12} className="mr-2" />
                                                Terlewat
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-serif font-black text-ink uppercase tracking-tight leading-tight group-hover:text-newsprint-red transition-colors">
                                        {asg.title}
                                    </h3>
                                    <p className="text-sm text-ink/70 font-body leading-relaxed max-w-2xl border-l-2 border-ink/20 pl-4">
                                        {asg.description}
                                    </p>
                                    <div className="flex items-center text-[10px] font-mono font-bold text-ink/60 uppercase tracking-widest pt-2">
                                        <span className="mr-1">Guru:</span>
                                        <span className="text-ink font-black">{asg.teachers?.name}</span>
                                    </div>
                                    {asg.file_url && (
                                        <div className="pt-4">
                                            <a
                                                href={asg.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-2 text-[10px] font-mono font-bold text-ink uppercase tracking-widest border-2 border-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors"
                                            >
                                                <Download size={14} />
                                                <span>Unduh Materi/Tugas</span>
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-end justify-center min-w-[200px] text-right border-l-2 border-ink p-6">
                                    <p className="text-[10px] font-mono font-black text-ink/40 uppercase tracking-widest mb-1">Batas Waktu</p>
                                    <div className={`flex items-center justify-end space-x-2 font-mono font-black text-lg ${isOverdue ? 'text-newsprint-red' : 'text-ink'}`}>
                                        <Clock size={16} />
                                        <span>{new Date(asg.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="py-20 text-center border-2 border-dashed border-ink/20 bg-paper">
                            <CheckCircle2 size={48} className="mx-auto text-ink/20 mb-4" strokeWidth={1} />
                            <h3 className="text-lg font-serif font-black text-ink/40 uppercase">Tidak Ada Tugas</h3>
                            <p className="text-sm font-mono text-ink/30 uppercase tracking-widest mt-2">Anda sudah menyelesaikan semua tugas!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
