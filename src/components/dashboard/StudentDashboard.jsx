import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Award, BookOpen, Calendar, ClipboardList, CheckCircle2, ArrowRight } from 'lucide-react';
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
        <div className="flex items-center gap-2 text-xs font-black text-black/40 uppercase tracking-widest">
            <div className="w-4 h-4 border-2 border-black border-t-neo-accent animate-spin"></div>
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

            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-black">
                    <div>
                        <h3 className="text-lg font-black text-black uppercase tracking-tight">Tenggat Waktu</h3>
                        <p className="text-[10px] font-black text-black/40 mt-0.5 uppercase tracking-widest">Agenda & Tugas Mendatang</p>
                    </div>
                </div>

                {stats.pendingTasks > 0 ? (
                    <div className="border-4 border-black shadow-[4px_4px_0px_0px_#000] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neo-cream hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] transition-all">
                        <div className="flex gap-4 items-start">
                            <div className="border-4 border-black p-3 bg-neo-accent shadow-[2px_2px_0px_0px_#000] shrink-0">
                                <ClipboardList size={20} strokeWidth={3} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-neo-accent mb-1 border border-neo-accent px-2 py-0.5 w-fit">⚡ Segera</p>
                                <h4 className="text-base font-black text-black uppercase tracking-tight">Tinjau Tugas Belum Selesai</h4>
                                <p className="text-xs font-bold text-black/50 mt-1">Ada <span className="font-black text-black">{stats.pendingTasks} tugas</span> aktif yang perlu diselesaikan.</p>
                            </div>
                        </div>
                        <Link to="/student/assignments" className="shrink-0 px-5 py-3 bg-black text-white border-4 border-black font-black text-[11px] uppercase tracking-widest shadow-[4px_4px_0px_0px_#FF6B6B] hover:bg-neo-accent hover:text-black active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 flex items-center gap-2">
                            Buka Tugas <ArrowRight size={14} strokeWidth={3} />
                        </Link>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center border-4 border-dashed border-black/20 bg-white">
                        <div className="border-4 border-black p-4 bg-neo-secondary shadow-[4px_4px_0px_0px_#000] mb-4">
                            <CheckCircle2 size={28} strokeWidth={3} />
                        </div>
                        <p className="font-black text-black text-lg uppercase tracking-tight">Semua Beres!</p>
                        <p className="font-bold text-black/40 text-sm mt-1 uppercase tracking-wider">Tidak ada tenggat waktu mendatang.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
