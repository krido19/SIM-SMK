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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
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
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="animate-pulse space-y-8">...</div>;

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Total Siswa" value={stats.totalStudents.toLocaleString()} icon={Users} trend="+12%" color="bg-blue-600" />
                <StatCard title="Total Guru" value={stats.totalTeachers.toString()} icon={UserCircle} color="bg-indigo-600" />
                <StatCard title="Mata Pelajaran" value={stats.totalSubjects.toString()} icon={BookOpen} color="bg-emerald-600" />
                <StatCard title="Rata-rata Nilai" value={stats.avgGrade.toString()} icon={TrendingUp} trend="+2.4%" color="bg-violet-600" />
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

export default AdminDashboard;
