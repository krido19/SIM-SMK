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
            // 1. Get Global Settings
            const { data: settingsData } = await supabase.from('settings').select('key, value').in('key', ['current_week_type', 'current_semester', 'current_academic_year']);
            
            const weekType = settingsData?.find(s => s.key === 'current_week_type')?.value || 'Minggu Ganjil';
            const semester = settingsData?.find(s => s.key === 'current_semester')?.value || 'Semester Ganjil';
            const academicYear = settingsData?.find(s => s.key === 'current_academic_year')?.value || '23/24';
            
            setCurrentWeekType(weekType);
            setAcademicPeriod(`${semester} ${academicYear}`);

            // 2. Fetch Announcements
            const { data: ann } = await supabase
                .from('announcements')
                .select('id, title, date, content, image_url, category')
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
            {/* Modern Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Pusat Informasi
                        </span>
                        <span className="text-[10px] font-sans font-medium text-gray-400 uppercase tracking-widest">
                            {new Date().getFullYear()} • AKADEMIK
                        </span>
                    </div>
                    <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight">
                        Dashboard Utama
                    </h1>
                    <p className="font-sans text-gray-500 mt-2 max-w-2xl">
                        Selamat datang kembali, <span className="text-blue-600 font-bold">{userName}</span>. Berikut ringkasan aktivitas akademik Anda hari ini.
                    </p>
                </div>
                <div className="shrink-0">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm min-w-[200px]">
                        <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            Sistem Aktif
                        </p>
                        <p className="text-base font-sans font-bold text-gray-800">{currentWeekType}</p>
                        <p className="text-xs font-sans text-gray-500 mt-1">{academicPeriod}</p>
                    </div>
                </div>
            </div>

            {/* Next Class Notification (Guru & Siswa only) */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-blue-100">
                <ScheduleNotification nextClass={nextClass} role={role} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8">
                    {role === 'admin' && <AdminDashboard />}
                    {role === 'guru' && <TeacherDashboard userName={userName} />}
                    {(role === 'siswa' || role === 'parent') && <StudentDashboard userName={userName} />}
                </div>

                {/* Right Sidebar - Announcements */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                            <h2 className="text-lg font-sans font-bold text-gray-900 flex items-center gap-2">
                                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                    <Bell size={18} />
                                </span>
                                Pengumuman
                            </h2>
                            <button className="text-xs font-bold text-blue-600 hover:underline">Lihat Semua</button>
                        </div>
                        <Announcements announcements={announcements} />
                    </div>
                </div>
            </div>
        </div >
    );
}
