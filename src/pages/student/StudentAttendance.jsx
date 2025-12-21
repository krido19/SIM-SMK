import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    CalendarDays,
    PieChart,
    BarChart3
} from 'lucide-react';

export default function StudentAttendance() {
    const userId = localStorage.getItem('userId');
    const [attendance, setAttendance] = useState([]);
    const [stats, setStats] = useState({
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        totalRate: 0
    });
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (userId) {
            fetchAttendance();
        }
    }, [userId]);

    const fetchAttendance = async () => {
        try {
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('student_id', userId)
                .order('date', { ascending: false });

            if (error) throw error;

            setAttendance(data || []);
            calculateStats(data || []);
        } catch (err) {
            console.error('Error fetching attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const counts = {
            hadir: data.filter(a => a.status === 'Hadir').length,
            sakit: data.filter(a => a.status === 'Sakit').length,
            izin: data.filter(a => a.status === 'Izin').length,
            alpa: data.filter(a => a.status === 'Alpa').length,
        };

        const total = data.length;
        const rate = total > 0 ? ((counts.hadir / total) * 100).toFixed(0) : 0;

        setStats({ ...counts, totalRate: rate });
    };

    // Calendar Logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Fill empty days for previous month (Monday as first day)
        const startDayOffset = (firstDay === 0 ? 6 : firstDay - 1);
        for (let i = 0; i < startDayOffset; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const getAttendanceStatus = (date) => {
        if (!date) return null;
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        const dateStr = localDate.toISOString().split('T')[0];
        return attendance.find(a => a.date === dateStr);
    };

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

    const attendanceStats = [
        { label: 'Hadir', value: stats.hadir, color: 'bg-emerald-500', text: 'text-emerald-600' },
        { label: 'Sakit', value: stats.sakit, color: 'bg-orange-500', text: 'text-orange-600' },
        { label: 'Izin', value: stats.izin, color: 'bg-blue-500', text: 'text-blue-600' },
        { label: 'Alpa', value: stats.alpa, color: 'bg-red-500', text: 'text-red-600' },
    ];

    if (loading) {
        return <div className="p-8 text-center bg-white rounded-[3rem] shadow-xl animate-pulse font-black text-gray-400">Loading data absensi...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Rekap Kehadiran</h1>
                    <p className="text-gray-500 font-medium mt-1">Pantau kedisiplinan dan riwayat kehadiran Anda.</p>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm self-start">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <CalendarDays size={16} />
                        <span>Kalender</span>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <PieChart size={16} />
                        <span>Daftar</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {attendanceStats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-5 group-hover:scale-150 transition-transform ${stat.color}`} />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={`h-1.5 w-8 rounded-full ${stat.color}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${stat.text}`}>{stat.label}</span>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 relative z-10">{stat.value}</h2>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider relative z-10">Hari ini</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Section */}
                <div className="lg:col-span-2 space-y-8">
                    {viewMode === 'calendar' ? (
                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <h3 className="text-xl font-black text-gray-900">Kalender Absensi</h3>
                                <div className="flex items-center space-x-4">
                                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                        <Clock size={18} className="rotate-180" />
                                    </button>
                                    <span className="text-sm font-black uppercase tracking-widest text-blue-600">
                                        {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                        <Clock size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-2 mb-4">
                                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
                                    <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {getDaysInMonth(currentMonth).map((date, i) => {
                                    const att = getAttendanceStatus(date);
                                    const isToday = date && date.toDateString() === new Date().toDateString();

                                    if (!date) return <div key={`empty-${i}`} className="h-16 rounded-2xl bg-gray-50/50" />;

                                    return (
                                        <div
                                            key={date.toISOString()}
                                            className={`h-16 rounded-2xl relative flex items-center justify-center group transition-all border-2 ${att ? (
                                                    att.status === 'Hadir' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                                        att.status === 'Sakit' ? 'bg-orange-50 border-orange-100 text-orange-700' :
                                                            'bg-red-50 border-red-100 text-red-700'
                                                ) : 'bg-gray-50 border-transparent text-gray-400'
                                                } ${isToday ? 'ring-2 ring-blue-500 ring-offset-2 scale-105 z-10' : ''}`}
                                        >
                                            <span className="text-sm font-black">{date.getDate()}</span>
                                            {att && (
                                                <div className="absolute top-1 right-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${att.status === 'Hadir' ? 'bg-emerald-500' :
                                                            att.status === 'Sakit' ? 'bg-orange-500' : 'bg-red-500'
                                                        }`} />
                                                </div>
                                            )}
                                            {/* Tooltip-like Info */}
                                            {att?.notes && (
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                                    <div className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                                                        {att.notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-10 flex items-center justify-center space-x-6">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Hadir</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Izin/Sakit</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Alpa</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden relative">
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <h3 className="text-xl font-black text-gray-900">Daftar Kehadiran</h3>
                                <BarChart3 size={20} className="text-blue-500" />
                            </div>
                            <div className="space-y-3">
                                {attendance.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <XCircle size={48} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Belum ada data</p>
                                    </div>
                                ) : (
                                    attendance.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all group">
                                            <div className="flex items-center space-x-4">
                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${item.status === 'Hadir' ? 'bg-emerald-100 text-emerald-600' :
                                                        item.status === 'Sakit' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {item.status === 'Hadir' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-gray-900">{new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                        {item.notes ? `Catatan: ${item.notes}` : 'Laporan Kehadiran Harian'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${item.status === 'Hadir' ? 'bg-white text-emerald-600 border border-emerald-100' :
                                                    item.status === 'Sakit' ? 'bg-white text-orange-600 border border-orange-100' :
                                                        'bg-white text-red-600 border border-red-100'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Ringkasan & Grafik */}
                <div className="space-y-8">
                    {/* Attendance Percentage Card */}
                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col items-center justify-center space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-700" />

                        <div className="relative h-48 w-48">
                            <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                                <circle
                                    cx="18" cy="18" r="15.9155"
                                    className="stroke-gray-100 fill-none"
                                    strokeWidth="3.5"
                                />
                                <circle
                                    cx="18" cy="18" r="15.9155"
                                    className="stroke-blue-600 fill-none transition-all duration-1000"
                                    strokeWidth="3.5"
                                    strokeDasharray={`${stats.totalRate}, 100`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-gray-900 tracking-tighter">{stats.totalRate}%</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Hadir</span>
                            </div>
                        </div>

                        <div className="text-center relative z-10">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">
                                {stats.totalRate >= 90 ? '🔥 Sangat Disiplin!' :
                                    stats.totalRate >= 75 ? '👍 Tetap Semangat' : '⚠️ Tingkatkan Lagi'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-2 px-6 leading-relaxed">
                                {stats.totalRate >= 90 ? 'Pertahankan kedisiplinan luar biasa Anda di sekolah.' :
                                    'Ayo datang lebih rajin lagi untuk hasil belajar maksimal!'}
                            </p>
                        </div>

                        <div className="w-full pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <span className="text-xs font-black text-gray-900">{attendance.length}</span>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Hari</p>
                            </div>
                            <div className="text-center border-l border-gray-50">
                                <span className="text-xs font-black text-gray-900">{stats.hadir}</span>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Aktif</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] shadow-xl shadow-blue-200 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                    <Clock size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">E-Presensi</span>
                            </div>
                            <h4 className="text-2xl font-black leading-tight mb-4">Ingin Izin atau Sakit?</h4>
                            <p className="text-blue-100 text-sm font-medium leading-relaxed mb-6 opacity-80">
                                Pastikan Anda menginformasikan kepada wali kelas jika berhalangan hadir tepat waktu.
                            </p>
                            <button className="w-full bg-white text-blue-600 font-black py-4 rounded-2xl shadow-lg transition-transform active:scale-95 uppercase tracking-widest text-xs">
                                Hubungi Wali Kelas
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

