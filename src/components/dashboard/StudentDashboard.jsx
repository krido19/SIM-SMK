import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Award, BookOpen, Calendar, ClipboardList, Clock, ChevronRight } from 'lucide-react';
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
                const { data: grades } = await supabase.from('grades').select('score').eq('student_id', studentId);
                let avg = 0;
                let subjectCount = 0;
                if (grades && grades.length > 0) {
                    const total = grades.reduce((sum, g) => sum + (g.score || 0), 0);
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

    if (isLoading) return <div className="animate-pulse font-mono text-[10px] uppercase">Memuat Data Akademik...</div>;

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Rata-Rata Nilai" value={stats.avgGrade?.toString() || "0"} icon={Award} to="/student/grades" />
                <StatCard title="Mata Pelajaran" value={stats.totalSubjects?.toString() || "0"} icon={BookOpen} />
                <StatCard title="Rekap Kehadiran" value={stats.attendance || "0%"} icon={Calendar} to="/student/attendance" />
                <StatCard title="Tugas Aktif" value={stats.pendingTasks?.toString() || "0"} icon={ClipboardList} to="/student/assignments" trend={stats.pendingTasks > 0 ? "Segera" : ""} />
            </div>

            <div className="bg-paper p-8 border-2 border-ink shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative newsprint-texture">
                <div className="flex items-center justify-between mb-8 border-b-2 border-ink pb-4">
                    <div className="flex items-center gap-3">
                        <Clock size={24} className="text-ink" strokeWidth={1.5} />
                        <h3 className="text-2xl font-serif font-black text-ink uppercase tracking-tight">Tenggat Waktu</h3>
                    </div>
                </div>

                {stats.pendingTasks > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between border-b border-ink/20 pb-4">
                            <div>
                                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-newsprint-red mb-1">Tenggat dalam 48 jam</p>
                                <h4 className="font-serif font-bold text-xl">Tinjau Tugas yang Belum Selesai</h4>
                                <p className="font-body text-sm opacity-70">Kamu punya {stats.pendingTasks} tugas yang perlu diselesaikan.</p>
                            </div>
                            <Link to="/student/assignments" className="py-2 px-4 border-2 border-ink font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-ink hover:text-paper transition-all">
                                Lihat Tugas
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center opacity-40">
                        <Award size={48} className="mb-4" strokeWidth={1} />
                        <p className="font-serif italic text-lg text-center">Tidak ada tenggat waktu mendatang. Semua tugas sudah selesai.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
