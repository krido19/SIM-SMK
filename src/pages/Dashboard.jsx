import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import StatCard from '../components/dashboard/StatCard';
import ScheduleNotification from '../components/dashboard/ScheduleNotification';
import Announcements from '../components/dashboard/Announcements';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import TeacherDashboard from '../components/dashboard/TeacherDashboard';
import StudentDashboard from '../components/dashboard/StudentDashboard';

export default function Dashboard() {
    const role = localStorage.getItem('userRole') || 'admin';
    const userName = localStorage.getItem('userName') ||
        (role === 'admin' ? 'Admin Utama' : role === 'guru' ? 'Ibu Guru Siti' : 'Siswa');

    const [announcements, setAnnouncements] = useState([]);
    const [nextClass, setNextClass] = useState(null);
    const [currentWeekType, setCurrentWeekType] = useState('Minggu Ganjil');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchGlobalData();
    }, []);

    const fetchGlobalData = async () => {
        setIsLoading(true);
        try {
            // 1. Get Global Settings
            const { data: weekData } = await supabase.from('settings').select('value').eq('key', 'current_week_type').maybeSingle();
            const weekType = weekData?.value || 'Minggu Ganjil';
            setCurrentWeekType(weekType);

            // 2. Fetch Announcements
            const { data: ann } = await supabase
                .from('announcements')
                .select('id, title, date, content')
                .order('created_at', { ascending: false })
                .limit(4);
            setAnnouncements(ann || []);

            // 3. Fetch Next Class
            await fetchNextClass(weekType);

        } catch (error) {
            console.error('Error fetching global dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchNextClass = async (weekType) => {
        try {
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const today = days[new Date().getDay()];
            const currentTime = new Date().toTimeString().substring(0, 5);

            let query = supabase
                .from('schedules')
                .select('subject_name, class_name, teacher_name, start_time, end_time, day, week_type')
                .eq('day', today)
                .eq('week_type', weekType)
                .gte('end_time', currentTime)
                .order('start_time', { ascending: true })
                .limit(1);

            if (role === 'guru') {
                const userId = localStorage.getItem('userId');
                if (userId) query = query.eq('teacher_id', userId);
                else return;
            } else if (role === 'siswa') {
                const userId = localStorage.getItem('userId');
                if (userId) {
                    const { data: s } = await supabase
                        .from('students')
                        .select('class_id')
                        .eq('id', userId)
                        .maybeSingle();
                    if (s?.class_id) query = query.eq('class_id', s.class_id);
                    else return;
                } else return;
            } else return;

            const { data: schedules } = await query.maybeSingle();
            setNextClass(schedules || null);
        } catch (error) {
            console.error("Error fetching next class", error);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">Beranda</h1>
                    <p className="text-gray-500 font-medium mt-3">Selamat datang kembali, <span className="text-blue-600 font-bold">{userName}</span>. Berikut ringkasan Anda.</p>
                </div>
                <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-2">
                    <div className="h-10 px-4 flex items-center bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest">
                        {currentWeekType} | Semester Ganjil 2023/2024
                    </div>
                </div>
            </div>

            {/* Next Class Notification (Guru & Siswa only) */}
            <ScheduleNotification nextClass={nextClass} role={role} />

            {/* Role-Specific Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                    {role === 'admin' && <AdminDashboard />}
                    {role === 'guru' && <TeacherDashboard userName={userName} />}
                    {(role === 'siswa' || role === 'parent') && <StudentDashboard userName={userName} />}
                </div>

                {/* Shared Right Sidebar */}
                <div className="lg:col-span-1">
                    <Announcements announcements={announcements} />
                </div>
            </div>
        </div>
    );
}
