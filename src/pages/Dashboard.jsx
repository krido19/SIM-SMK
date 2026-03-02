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
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Editorial Header */}
            <div className="border-b-4 border-ink pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-newsprint-red text-white text-[10px] font-mono font-bold px-2 py-1 uppercase tracking-widest animate-pulse">
                            Live Bulletin
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">
                            Ref: SMK-SIM/DAILY/{new Date().getFullYear()}
                        </span>
                    </div>
                    <h1 className="text-6xl lg:text-8xl font-serif font-black text-ink tracking-tighter leading-[0.85]">
                        The Front Page
                    </h1>
                    <p className="font-body text-xl text-ink/70 mt-4 max-w-2xl leading-relaxed">
                        Welcome back, <span className="text-ink font-black underline decoration-newsprint-red decoration-2 underline-offset-4">{userName}</span>.
                        Your daily briefing and institutional overview are ready.
                    </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                    <div className="border-2 border-ink p-4 bg-white shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest border-b border-ink/10 pb-2 mb-2">Academic Cycle</p>
                        <p className="text-sm font-serif font-bold italic">{currentWeekType}</p>
                        <p className="text-[11px] font-mono opacity-60 mt-1 uppercase">Semester Ganjil 23/24</p>
                    </div>
                </div>
            </div>

            {/* Next Class Notification (Guru & Siswa only) */}
            <ScheduleNotification nextClass={nextClass} role={role} />

            {/* Role-Specific Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 border-r-2 border-ink lg:pr-12 last:border-0 last:pr-0">
                    {role === 'admin' && <AdminDashboard />}
                    {role === 'guru' && <TeacherDashboard userName={userName} />}
                    {(role === 'siswa' || role === 'parent') && <StudentDashboard userName={userName} />}
                </div>

                {/* Shared Right Sidebar */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24">
                        <h2 className="text-3xl font-serif font-black underline decoration-ink/10 underline-offset-8 mb-8 pb-2 border-b-2 border-ink uppercase tracking-tight">
                            The Gazette
                        </h2>
                        <Announcements announcements={announcements} />
                    </div>
                </div>
            </div>
        </div>
    );
}
