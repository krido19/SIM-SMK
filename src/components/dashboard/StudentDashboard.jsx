import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Award, BookOpen, Calendar, ClipboardList } from 'lucide-react';
import StatCard from './StatCard';
import AnalyticsChart from './AnalyticsChart';

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

    if (isLoading) return <div className="animate-pulse">...</div>;

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Rata-rata Nilai" value={stats.avgGrade?.toString() || "0"} icon={Award} trend="+5%" color="bg-blue-600" to="/student/grades" />
                <StatCard title="Jumlah Mapel" value={stats.totalSubjects?.toString() || "0"} icon={BookOpen} color="bg-indigo-600" />
                <StatCard title="Presensi Semester" value={stats.attendance || "0%"} icon={Calendar} color="bg-emerald-600" to="/student/attendance" />
                <StatCard title="Tugas Menunggu" value={stats.pendingTasks?.toString() || "0"} icon={ClipboardList} color="bg-orange-600" to="/student/assignments" />
            </div>

            <AnalyticsChart
                title="Performa Akademik"
                subtitle="Tren nilai dalam 6 bulan terakhir"
                data={[82, 85, 84, 88, 92, 88]}
                labels={['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun']}
                type="score"
            />
        </div>
    );
};

export default StudentDashboard;
