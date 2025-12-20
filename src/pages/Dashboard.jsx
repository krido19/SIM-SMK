import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    GraduationCap,
    BookOpen,
    TrendingUp,
    Clock,
    Bell,
    Calendar,
    ChevronRight,
    ArrowUpRight,
    AlertCircle,
    UserCircle,
    Award,
    ClipboardList
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-transform ${color}`} />
        <div className="flex items-start justify-between relative z-10">
            <div className={`p-4 rounded-2xl ${color.replace('bg-', 'bg-').replace('600', '50')} ${color.replace('bg-', 'text-')}`}>
                <Icon size={24} />
            </div>
            {trend && (
                <div className={`flex items-center space-x-1 text-xs font-black ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                    <span>{trend}</span>
                    <ArrowUpRight size={14} className={trend.startsWith('-') ? 'rotate-90' : ''} />
                </div>
            )}
        </div>
        <div className="mt-6 relative z-10">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</h3>
            <p className="text-4xl font-black text-gray-900 mt-1">{value}</p>
        </div>
    </div>
);

export default function Dashboard() {
    const role = localStorage.getItem('userRole') || 'admin';
    const userName = localStorage.getItem('userName') || (role === 'admin' ? 'Admin Utama' : role === 'guru' ? 'Ibu Guru Siti' : role === 'siswa' ? 'Ahmad Fauzi' : 'Orang Tua Ahmad');

    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalSubjects: 0,
        avgGrade: 84.2
    });
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        const [std, tea, sub, ann] = await Promise.all([
            supabase.from('students').select('*', { count: 'exact', head: true }),
            supabase.from('teachers').select('*', { count: 'exact', head: true }),
            supabase.from('subjects').select('*', { count: 'exact', head: true }),
            supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(4)
        ]);

        setStats({
            totalStudents: std.count || 0,
            totalTeachers: tea.count || 0,
            totalSubjects: sub.count || 0,
            avgGrade: 84.2 // Mock for now
        });
        setAnnouncements(ann.data || []);
        setIsLoading(false);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">Beranda</h1>
                    <p className="text-gray-500 font-medium mt-3">Selamat datang kembali, <span className="text-blue-600 font-bold">{userName}</span>. Berikut ringkasan Anda.</p>
                </div>
                <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-2">
                    <div className="h-10 px-4 flex items-center bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest">
                        Semester Ganjil 2023/2024
                    </div>
                </div>
            </div>

            {/* Adaptive Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {role === 'admin' ? (
                    <>
                        <StatCard title="Total Siswa" value={stats.totalStudents.toLocaleString()} icon={Users} trend="+12%" color="bg-blue-600" />
                        <StatCard title="Total Guru" value={stats.totalTeachers.toString()} icon={UserCircle} color="bg-indigo-600" />
                        <StatCard title="Mata Pelajaran" value={stats.totalSubjects.toString()} icon={BookOpen} color="bg-emerald-600" />
                        <StatCard title="Rata-rata Nilai" value={stats.avgGrade.toString()} icon={TrendingUp} trend="+2.4%" color="bg-violet-600" />
                    </>
                ) : role === 'guru' ? (
                    <>
                        <StatCard title="Kelas Diampu" value="4" icon={Hash} color="bg-blue-600" />
                        <StatCard title="Jumlah Siswa" value="142" icon={Users} color="bg-indigo-600" />
                        <StatCard title="Tugas Menunggu" value="12" icon={ClipboardList} color="bg-orange-600" />
                        <StatCard title="Kehadiran Hari Ini" value="98%" icon={TrendingUp} color="bg-emerald-600" />
                    </>
                ) : (
                    <>
                        <StatCard title="Rata-rata Nilai" value="88.5" icon={Award} trend="+5%" color="bg-blue-600" />
                        <StatCard title="Jumlah Mapel" value="12" icon={BookOpen} color="bg-indigo-600" />
                        <StatCard title="Presensi Semester" value="96%" icon={Calendar} color="bg-emerald-600" />
                        <StatCard title="Peringkat Kelas" value="3" icon={TrendingUp} color="bg-violet-600" />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Analytics Section */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden relative">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900">{role === 'siswa' || role === 'parent' ? 'Performa Akademik' : 'Kehadiran Mingguan'}</h3>
                            <p className="text-sm text-gray-400 font-bold mt-1">
                                {role === 'siswa' || role === 'parent' ? 'Tren nilai dalam 6 bulan terakhir' : 'Persentase kehadiran seluruh tingkatan'}
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <span className="w-3 h-3 rounded-full bg-blue-600" />
                            <span className="w-3 h-3 rounded-full bg-indigo-200" />
                        </div>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-4 mt-4">
                        {(role === 'siswa' || role === 'parent' ? [82, 85, 84, 88, 92, 88] : [75, 82, 90, 85, 95, 88]).map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer">
                                <div
                                    className="w-full bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-all relative overflow-hidden flex flex-col justify-end"
                                    style={{ height: '100%' }}
                                >
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-2xl shadow-lg shadow-blue-100 transition-all duration-1000 ease-out"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-10 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {h}{role === 'siswa' ? '' : '%'}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-widest">
                                    {role === 'siswa' || role === 'parent' ? ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'][i] : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Announcements */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black text-gray-900">Informasi</h3>
                        <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <Bell size={18} />
                        </div>
                    </div>

                    <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-2">
                        {announcements.length > 0 ? announcements.map((news, i) => (
                            <div key={news.id} className="flex items-start space-x-4 group cursor-pointer">
                                <div className={`mt-2 w-2 h-2 rounded-full ${['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500'][i % 4]} shadow-lg shadow-blue-200 shrink-0 group-hover:scale-150 transition-transform`} />
                                <div className="flex-1 pb-4 border-b border-gray-50 group-last:border-0">
                                    <h4 className="text-sm font-black text-gray-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{news.title}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{news.date}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-400 text-sm font-bold">Belum ada pengumuman.</p>
                        )}
                    </div>

                    <button className="mt-8 w-full py-4 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-2xl font-black text-sm transition-all flex items-center justify-center space-x-2 group">
                        <span>Lihat Semua</span>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Fixed import for Hash
import { Hash } from 'lucide-react';
