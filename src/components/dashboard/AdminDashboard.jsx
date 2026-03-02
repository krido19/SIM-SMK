import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, UserCircle, BookOpen, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';
import AnalyticsChart from './AnalyticsChart';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalSubjects: 0,
        avgGrade: 84.2
    });
    const [attendanceData, setAttendanceData] = useState([0, 0, 0, 0, 0, 0]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
        fetchAttendanceData();
    }, []);

    const fetchData = async () => {
        try {
            const [std, tea, sub] = await Promise.all([
                supabase.from('students').select('*', { count: 'exact', head: true }),
                supabase.from('teachers').select('*', { count: 'exact', head: true }),
                supabase.from('subjects').select('*', { count: 'exact', head: true })
            ]);

            setStats({
                totalStudents: std.count || 0,
                totalTeachers: tea.count || 0,
                totalSubjects: sub.count || 0,
                avgGrade: 84.2
            });
        } catch (error) {
            console.error('Error fetching admin dashboard data:', error);
        }
    };

    const fetchAttendanceData = async () => {
        try {
            // Get dates for Mon-Sat of current week
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

            const dates = [];
            for (let i = 0; i < 6; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + diffToMonday + i);
                dates.push(date.toISOString().split('T')[0]);
            }

            const { data, error } = await supabase
                .from('attendance')
                .select('status, date')
                .in('date', dates);

            if (error) throw error;

            const weeklyStats = dates.map(date => {
                const dayRecords = data.filter(r => r.date === date);
                if (dayRecords.length === 0) return 0;

                const present = dayRecords.filter(r => r.status === 'Hadir').length;
                return Math.round((present / dayRecords.length) * 100);
            });

            setAttendanceData(weeklyStats);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="animate-pulse font-mono text-[10px] uppercase">Compiling Statistics...</div>;

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Total Enrollment" value={stats.totalStudents.toLocaleString()} icon={Users} trend="+12%" />
                <StatCard title="Active Faculty" value={stats.totalTeachers.toString()} icon={UserCircle} />
                <StatCard title="Course Catalog" value={stats.totalSubjects.toString()} icon={BookOpen} />
                <StatCard title="District Avg" value={stats.avgGrade.toString()} icon={TrendingUp} trend="+2.4%" />
            </div>

            <AnalyticsChart
                title="System-Wide Attendance"
                subtitle="Percentage of active daily attendance across all sections"
                data={attendanceData}
                labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
            />
        </div>
    );
};

export default AdminDashboard;
