import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
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
    const [academicPeriod, setAcademicPeriod] = useState('Semester Ganjil 23/24');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchGlobalData();
    }, []);

    const fetchGlobalData = async () => {
        setIsLoading(true);
        try {
            const { data: settingsData } = await supabase.from('settings').select('key, value').in('key', ['current_week_type', 'current_semester', 'current_academic_year']);
            const weekType = settingsData?.find(s => s.key === 'current_week_type')?.value || 'Minggu Ganjil';
            const semester = settingsData?.find(s => s.key === 'current_semester')?.value || 'Semester Ganjil';
            const academicYear = settingsData?.find(s => s.key === 'current_academic_year')?.value || '23/24';
            setCurrentWeekType(weekType);
            setAcademicPeriod(`${semester} ${academicYear}`);

            const { data: ann } = await supabase.from('announcements').select('id, title, date, content, image_url, category').order('created_at', { ascending: false }).limit(4);
            setAnnouncements(ann || []);

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

            let query = supabase.from('schedules').select('subject_name, class_name, teacher_name, start_time, end_time, day, week_type').eq('day', today).eq('week_type', weekType).gte('end_time', currentTime).order('start_time', { ascending: true }).limit(1);

            if (role === 'guru') {
                const userId = localStorage.getItem('userId');
                if (userId) query = query.eq('teacher_id', userId);
                else return;
            } else if (role === 'siswa') {
                const userId = localStorage.getItem('userId');
                if (userId) {
                    const { data: s } = await supabase.from('students').select('class_id').eq('id', userId).maybeSingle();
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <span className="inline-block bg-neo-secondary border-4 border-black text-[10px] font-black px-3 py-1 uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] mb-3">
                        Pusat Informasi
                    </span>
                    <h1 className="text-4xl font-black text-black uppercase tracking-tight leading-none">
                        Dashboard Utama
                    </h1>
                    <p className="font-bold text-black/50 mt-2 max-w-xl text-sm">
                        Selamat datang, <span className="text-black font-black">{userName}</span>. Ringkasan aktivitas akademik hari ini.
                    </p>
                </div>
                <div className="shrink-0">
                    <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000] p-4 min-w-[180px]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-black/40 flex items-center gap-1.5 mb-2">
                            <span className="w-2 h-2 bg-neo-accent border border-black animate-pulse inline-block" />
                            Sistem Aktif
                        </p>
                        <p className="text-sm font-black text-black uppercase">{currentWeekType}</p>
                        <p className="text-[11px] font-bold text-black/50 mt-0.5">{academicPeriod}</p>
                    </div>
                </div>
            </div>

            {/* Schedule Notification */}
            <ScheduleNotification nextClass={nextClass} role={role} />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    {role === 'admin' && <AdminDashboard />}
                    {role === 'guru' && <TeacherDashboard userName={userName} />}
                    {(role === 'siswa' || role === 'parent') && <StudentDashboard userName={userName} />}
                </div>

                {/* Right — Announcements */}
                <div className="lg:col-span-4">
                    <div className="sticky top-20 border-4 border-black shadow-[8px_8px_0px_0px_#000] bg-white">
                        <div className="bg-neo-secondary border-b-4 border-black px-4 py-3 flex items-center justify-between">
                            <h2 className="text-sm font-black text-black uppercase tracking-tight flex items-center gap-2">
                                <Bell size={16} strokeWidth={3} />
                                Pengumuman
                            </h2>
                        </div>
                        <div className="p-4">
                            <Announcements announcements={announcements} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
