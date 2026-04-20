
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
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="border-b border-gray-100 pb-6 text-center sm:text-left">
                 <div className="inline-flex items-center gap-2 mb-4 bg-indigo-50 px-3 py-1.5 rounded-full">
                    <span className="bg-indigo-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Akademik
                    </span>
                 </div>
                <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight leading-none mb-2">TUGAS SAYA</h1>
                <p className="font-sans text-sm font-medium text-gray-500 mt-2">Daftar tugas yang harus dikerjakan.</p>
            </div>

            {isLoading ? (
                <div className="py-24 text-center border border-gray-100 rounded-3xl bg-white shadow-sm">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest">Memuat Tugas...</div>
                </div>
            ) : (
                <div className="space-y-4">
                    {assignments.length > 0 ? assignments.map((asg) => {
                        const isOverdue = new Date(asg.due_date) < new Date();
                        return (
                            <div key={asg.id} className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row relative overflow-hidden group">
                                {/* Left accent bar */}
                                <div className={`w-full md:w-2 h-2 md:h-auto shrink-0 ${isOverdue ? 'bg-rose-500' : 'bg-indigo-600'}`} />

                                <div className="flex-1 p-6 md:p-8 space-y-4">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-gray-600 rounded-lg text-[10px] font-sans font-bold uppercase tracking-widest flex items-center w-max shadow-sm">
                                            <BookOpen size={14} className="mr-2 text-indigo-500" strokeWidth={2.5}/>
                                            {asg.subject_name}
                                        </span>
                                        {isOverdue && (
                                            <span className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[10px] font-sans font-bold uppercase tracking-widest flex items-center w-max shadow-sm animate-pulse">
                                                <AlertCircle size={14} className="mr-2" strokeWidth={2.5} />
                                                Terlewat
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-sans font-black text-gray-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                                        {asg.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 font-sans leading-relaxed max-w-3xl border-l-[3px] border-indigo-100 pl-4 py-1">
                                        {asg.description}
                                    </p>
                                    <div className="flex items-center text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest pt-2">
                                        <span className="mr-2 bg-gray-50 px-2 py-1 rounded border border-gray-100">Guru</span>
                                        <span className="text-gray-700">{asg.teachers?.name}</span>
                                    </div>
                                    {asg.file_url && (
                                        <div className="pt-4">
                                            <a
                                                href={asg.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center w-max space-x-2 text-[10px] font-sans font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 hover:bg-indigo-100 hover:shadow-sm transition-all"
                                            >
                                                <Download size={14} strokeWidth={2.5} />
                                                <span>Unduh Materi / Tugas</span>
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col md:items-end justify-center min-w-[200px] text-left md:text-right border-t md:border-t-0 md:border-l border-gray-100 p-6 md:p-8 bg-gray-50/50">
                                    <p className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mb-2">Batas Waktu</p>
                                    <div className={`flex items-center md:justify-end space-x-2 ${isOverdue ? 'text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl' : 'text-gray-900'}`}>
                                        <Clock size={18} className={isOverdue ? "text-rose-500" : "text-gray-400"} strokeWidth={2.5} />
                                        <span className="font-sans font-black text-lg tracking-tight">{new Date(asg.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 text-emerald-500">
                                <CheckCircle2 size={32} strokeWidth={2} />
                            </div>
                            <h3 className="text-xl font-sans font-black text-gray-900 tracking-tight">Tidak Ada Tugas</h3>
                            <p className="text-sm font-sans font-medium text-gray-500 mt-2 max-w-sm">Anda sudah menyelesaikan semua tugas! Selamat beristirahat.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
