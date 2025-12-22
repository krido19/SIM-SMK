
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Calendar,
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
        const userId = localStorage.getItem('userId'); // Assuming userId is student ID

        // 1. Get Student Class info
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
            // Show future due dates first
            .order('due_date', { ascending: true });

        setAssignments(asgs || []);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tugas Saya</h1>
                <p className="text-sm text-gray-500 font-medium mt-1">Daftar tugas yang harus dikerjakan.</p>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-400 font-bold animate-pulse">Memuat Tugas...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {assignments.length > 0 ? assignments.map((asg) => {
                        const isOverdue = new Date(asg.due_date) < new Date();
                        return (
                            <div key={asg.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden group">
                                {/* Decor */}
                                <div className={`absolute left-0 top-0 bottom-0 w-2 ${isOverdue ? 'bg-red-500' : 'bg-blue-500'}`} />

                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center space-x-3">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center">
                                            <BookOpen size={12} className="mr-2" />
                                            {asg.subject_name}
                                        </span>
                                        {isOverdue && (
                                            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center">
                                                <AlertCircle size={12} className="mr-2" />
                                                Terlewat
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {asg.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                                        {asg.description}
                                    </p>
                                    <div className="flex items-center text-xs font-bold text-gray-400 pt-2">
                                        <span className="mr-1">Guru:</span>
                                        <span className="text-gray-600">{asg.teachers?.name}</span>
                                    </div>
                                    {asg.file_url && (
                                        <div className="pt-4">
                                            <a
                                                href={asg.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2.5 rounded-xl transition-colors border border-blue-100"
                                            >
                                                <Download size={14} />
                                                <span>Download Materi/Tugas</span>
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-end justify-center min-w-[200px] text-right border-l border-gray-50 pl-6 border-dashed">
                                    <div className="mb-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Batas Waktu</p>
                                        <div className={`flex items-center justify-end space-x-2 font-black text-lg ${isOverdue ? 'text-red-500' : 'text-gray-800'}`}>
                                            <Clock size={16} />
                                            <span>{new Date(asg.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
                            <h3 className="text-lg font-black text-gray-400">Tidak Ada Tugas</h3>
                            <p className="text-sm text-gray-400">Anda sudah menyelesaikan semua tugas!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
