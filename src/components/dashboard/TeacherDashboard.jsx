import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Hash, Users, ClipboardList, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';
import AnalyticsChart from './AnalyticsChart';

const TeacherDashboard = ({ userName }) => {
    const [stats, setStats] = useState({
        classesTaught: 0,
        totalStudents: 0,
        pendingTasks: 0,
        attendance: '0%'
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        let userId = localStorage.getItem('userId');
        const userNIP = localStorage.getItem('userNIP');

        try {
            // Fallback 1: Try NIP
            if (!userId && userNIP) {
                const { data: teacher } = await supabase.from('teachers').select('id').eq('nip', userNIP).maybeSingle();
                if (teacher) {
                    userId = teacher.id;
                    localStorage.setItem('userId', userId);
                }
            }

            // Fallback 2: Try Name
            if (!userId && userName) {
                const { data: teacher } = await supabase.from('teachers').select('id').eq('name', userName).maybeSingle();
                if (teacher) {
                    userId = teacher.id;
                    localStorage.setItem('userId', userId);
                }
            }

            if (userId) {
                // Get classes taught
                const { data: schedules } = await supabase
                    .from('schedules')
                    .select('class_id')
                    .or(`teacher_id.eq.${userId},teacher_name.eq."${userName}",teacher_name.ilike."%${userName}%"`);

                const uniqueClasses = [...new Set(schedules?.map(s => s.class_id) || [])];

                // Count students
                let studentCount = 0;
                let studentIds = [];
                if (uniqueClasses.length > 0) {
                    const { data: students, count } = await supabase
                        .from('students')
                        .select('id', { count: 'exact' })
                        .in('class_id', uniqueClasses);
                    studentCount = count || 0;
                    studentIds = students?.map(s => s.id) || [];
                }

                // Calculate Attendance
                let attendancePercentage = 0;
                if (studentIds.length > 0) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const { count: presentCount } = await supabase
                        .from('attendance')
                        .select('*', { count: 'exact', head: true })
                        .in('student_id', studentIds)
                        .eq('date', todayStr)
                        .eq('status', 'Hadir');

                    if (studentCount > 0) {
                        attendancePercentage = Math.round((presentCount / studentCount) * 100);
                    }
                }

                // Get assignments count
                const { count: taskCount } = await supabase
                    .from('assignments')
                    .select('*', { count: 'exact', head: true })
                    .eq('teacher_id', userId);

                setStats({
                    classesTaught: uniqueClasses.length,
                    totalStudents: studentCount,
                    pendingTasks: taskCount || 0,
                    attendance: `${attendancePercentage}%`
                });
            }
        } catch (error) {
            console.error('Error fetching teacher dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="animate-pulse">...</div>;

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Kelas Diampu" value={stats.classesTaught?.toString() || "0"} icon={Hash} color="bg-blue-600" />
                <StatCard title="Jumlah Siswa" value={stats.totalStudents?.toString() || "0"} icon={Users} color="bg-indigo-600" />
                <StatCard title="Tugas Menunggu" value={stats.pendingTasks?.toString() || "0"} icon={ClipboardList} color="bg-orange-600" />
                <StatCard title="Kehadiran" value={stats.attendance} icon={TrendingUp} color="bg-emerald-600" />
            </div>

            <AnalyticsChart
                title="Kehadiran Mingguan"
                subtitle="Persentase kehadiran seluruh tingkatan"
                data={[75, 82, 90, 85, 95, 88]}
                labels={['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']}
            />
        </div>
    );
};

export default TeacherDashboard;
