import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Award, BookOpen, Calendar, ClipboardList, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from './StatCard';

const StudentDashboard = ({ userName }) => {
    const [stats, setStats] = useState({
        avgGrade: 0,
        totalSubjects: 0,
        attendance: '0%',
        pendingTasks: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        let studentId = localStorage.getItem('userId');

        try {
            if (!studentId && userName) {
                const { data: student } = await supabase
                    .from('students')
                    .select('id')
                    .eq('full_name', userName)
                    .maybeSingle();
                if (student) {
                    studentId = student.id;
                    localStorage.setItem('userId', studentId);
                }
            }

            if (studentId) {
                const { data: studentData } = await supabase.from('students').select('class_id').eq('id', studentId).maybeSingle();

                // Grades
                const { data: grades } = await supabase.from('grades').select('tugas, uts, uas').eq('student_id', studentId);
                let avg = 0;
                let subjectCount = 0;
                if (grades && grades.length > 0) {
                    const total = grades.reduce((sum, g) => {
                        const final = Math.round(((g.tugas || 0) * 0.3) + ((g.uts || 0) * 0.3) + ((g.uas || 0) * 0.4));
                        return sum + final;
                    }, 0);
                    avg = (total / grades.length).toFixed(1);
                    subjectCount = grades.length;
                }
                if (subjectCount === 0) subjectCount = 12;

                // Attendance
                const [present, total] = await Promise.all([
                    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('student_id', studentId).eq('status', 'Hadir'),
                    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('student_id', studentId)
                ]);
                let attPct = total.count > 0 ? Math.round((present.count / total.count) * 100) : 0;

                // Assignments
                let pendingTaskCount = 0;
                if (studentData?.class_id) {
                    const { count } = await supabase
                        .from('assignments')
                        .select('*', { count: 'exact', head: true })
                        .eq('class_id', studentData.class_id)
                        .gt('due_date', new Date().toISOString());
                    pendingTaskCount = count || 0;
                }

                setStats({
                    avgGrade: avg,
                    totalSubjects: subjectCount,
                    attendance: `${attPct}%`,
                    pendingTasks: pendingTaskCount
                });
            }
        } catch (error) {
            console.error('Error fetching student dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <div className="flex items-center gap-2 font-sans text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
            Memuat Data Akademik...
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Rata-Rata Nilai" value={stats.avgGrade?.toString() || "0"} icon={Award} color="amber" to="/student/grades" />
                <StatCard title="Mata Pelajaran" value={stats.totalSubjects?.toString() || "0"} icon={BookOpen} color="purple" />
                <StatCard title="Kehadiran" value={stats.attendance || "0%"} icon={Calendar} color="emerald" to="/student/attendance" />
                <StatCard title="Tugas Aktif" value={stats.pendingTasks?.toString() || "0"} icon={ClipboardList} color="blue" to="/student/assignments" trend={stats.pendingTasks > 0 ? "Mendatang" : ""} />
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                            <Clock size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-sans font-black text-gray-900 leading-none">Tenggat Waktu</h3>
                            <p className="text-xs font-sans font-medium text-gray-400 mt-1 uppercase tracking-widest text-inherit">Agenda & Tugas Mendatang</p>
                        </div>
                    </div>
                </div>

                {stats.pendingTasks > 0 ? (
                    <div className="space-y-4">
                        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white hover:shadow-md hover:border-blue-100 transition-all duration-300 group">
                            <div className="flex gap-4 items-start">
                                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                                    <ClipboardList size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-rose-600 mb-1">Tenggat dalam 48 jam</p>
                                    <h4 className="text-lg font-sans font-black text-gray-900 leading-tight">Tinjau Tugas yang Belum Selesai</h4>
                                    <p className="text-sm font-sans font-medium text-gray-500 mt-1">Kamu memiliki <span className="font-bold text-gray-900">{stats.pendingTasks} tugas</span> aktif yang perlu diselesaikan segera.</p>
                                </div>
                            </div>
                            <Link 
                                to="/student/assignments" 
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-sans font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                            >
                                Buka Tugas <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="py-16 flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 italic">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <p className="text-gray-900 font-sans font-bold text-lg text-center leading-none">Semua Beres!</p>
                        <p className="text-gray-400 font-sans font-medium text-sm text-center mt-2">Tidak ada tenggat waktu mendatang. Nikmati waktu istirahatmu.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
