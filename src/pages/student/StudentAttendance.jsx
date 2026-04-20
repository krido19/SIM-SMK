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
        return (
            <div className="py-24 text-center">
                 <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest">Memuat data absensi...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                     <div className="inline-flex items-center gap-2 mb-4 bg-indigo-50 px-3 py-1.5 rounded-full">
                        <span className="bg-indigo-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Akademik
                        </span>
                    </div>
                    <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight leading-none mb-2">Rekap Kehadiran</h1>
                    <p className="font-sans text-sm text-gray-500 font-medium mt-2">Catatan kehadiran resmi siswa</p>
                </div>

                <div className="flex bg-gray-50 p-1 rounded-xl self-start md:self-auto border border-gray-100">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-sans font-bold uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                    >
                        <CalendarDays size={16} strokeWidth={2.5} />
                        <span>Kalender</span>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-sans font-bold uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                    >
                        <BarChart3 size={16} strokeWidth={2.5} />
                        <span>Daftar</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Hadir', value: stats.hadir, bgClass: 'bg-emerald-50', dotClass: 'bg-emerald-500', textClass: 'text-emerald-700' },
                    { label: 'Sakit', value: stats.sakit, bgClass: 'bg-amber-50', dotClass: 'bg-amber-500', textClass: 'text-amber-700' },
                    { label: 'Izin', value: stats.izin, bgClass: 'bg-blue-50', dotClass: 'bg-blue-500', textClass: 'text-blue-700' },
                    { label: 'Alpa', value: stats.alpa, bgClass: 'bg-rose-50', dotClass: 'bg-rose-500', textClass: 'text-rose-700' },
                ].map((stat) => (
                    <div key={stat.label} className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-transform hover:-translate-y-1 ${stat.bgClass}`}>
                        <div className="flex items-center space-x-3 mb-6">
                            <div className={`h-3 w-3 rounded-full ${stat.dotClass} shadow-sm`} />
                            <span className={`text-[10px] font-sans font-black uppercase tracking-widest ${stat.textClass}`}>{stat.label}</span>
                        </div>
                        <h2 className={`text-5xl font-sans font-black tracking-tight ${stat.textClass}`}>{stat.value}</h2>
                        <p className={`text-[10px] font-sans font-bold uppercase tracking-widest mt-6 pt-4 border-t border-black/10 ${stat.textClass} opacity-80`}>Total Hari</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Section */}
                <div className="lg:col-span-2 space-y-8">
                    {viewMode === 'calendar' ? (
                        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <h3 className="text-2xl font-sans font-black text-gray-900 tracking-tight">Kalender Akademik</h3>
                                <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 w-max border border-gray-100">
                                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white hover:text-indigo-600 text-gray-500 hover:shadow-sm transition-all">
                                        <Clock size={16} strokeWidth={2.5} className="rotate-180" />
                                    </button>
                                    <span className="text-sm font-sans font-bold text-gray-900 px-4 min-w-[140px] text-center">
                                        {currentMonth.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                    </span>
                                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white hover:text-indigo-600 text-gray-500 hover:shadow-sm transition-all">
                                        <Clock size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
                                    <div key={day} className="text-center font-sans text-[11px] font-bold text-gray-400 uppercase tracking-widest py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {getDaysInMonth(currentMonth).map((date, i) => {
                                    const att = getAttendanceStatus(date);
                                    const isToday = date && date.toDateString() === new Date().toDateString();

                                    if (!date) return <div key={`empty-${i}`} className="h-14 sm:h-20" />;

                                    let bgClass = 'bg-gray-50 hover:bg-gray-100 text-gray-400';
                                    let textClass = 'text-gray-400';
                                    let markerClass = '';

                                    if (att) {
                                        if (att.status === 'Hadir') { bgClass = 'bg-emerald-50 hover:bg-emerald-100'; textClass = 'text-emerald-700'; markerClass = 'bg-emerald-500'; }
                                        else if (att.status === 'Sakit') { bgClass = 'bg-amber-50 hover:bg-amber-100'; textClass = 'text-amber-700'; markerClass = 'bg-amber-500'; }
                                        else if (att.status === 'Izin') { bgClass = 'bg-blue-50 hover:bg-blue-100'; textClass = 'text-blue-700'; markerClass = 'bg-blue-500'; }
                                        else { bgClass = 'bg-rose-50 hover:bg-rose-100'; textClass = 'text-rose-700'; markerClass = 'bg-rose-500'; }
                                    }

                                    return (
                                        <div
                                            key={date.toISOString()}
                                            className={`h-14 sm:h-20 rounded-xl sm:rounded-2xl relative p-2 transition-colors ${bgClass} cursor-default ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2 z-10' : ''} group`}
                                        >
                                            <span className={`font-sans text-xs sm:text-sm font-black ${textClass}`}>{date.getDate()}</span>
                                            {att && (
                                                <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                                                    <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${markerClass}`} />
                                                </div>
                                            )}
                                            {/* Tooltip-like Info */}
                                            {att?.notes && (
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none w-max max-w-xs">
                                                    <div className="bg-gray-900 text-white rounded-lg font-sans text-[10px] font-bold px-3 py-2 shadow-lg whitespace-normal text-left max-w-[200px] leading-tight">
                                                        Catatan: {att.notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 border-t border-gray-100 pt-6">
                                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Hadir</span>
                                </div>
                                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Izin/Sakit</span>
                                </div>
                                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Alpa</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm overflow-hidden relative">
                            <div className="flex items-center justify-between mb-8 pb-4">
                                <h3 className="text-2xl font-sans font-black text-gray-900 tracking-tight">Riwayat Kehadiran</h3>
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                    <BarChart3 size={20} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {attendance.length === 0 ? (
                                    <div className="py-24 text-center rounded-2xl bg-gray-50 border border-gray-100 border-dashed">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-300">
                                            <CalendarDays size={24} strokeWidth={2.5} />
                                        </div>
                                        <p className="font-sans text-gray-500 font-bold uppercase tracking-widest text-xs">Belum ada riwayat kehadiran</p>
                                    </div>
                                ) : (
                                    attendance.map((item) => (
                                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 hover:shadow-sm transition-all group">
                                            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${item.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                    {item.status === 'Hadir' ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <AlertCircle size={24} strokeWidth={2.5} />}
                                                </div>
                                                <div>
                                                    <p className="font-sans text-lg font-black text-gray-900 tracking-tight leading-tight">{new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                    <p className="font-sans text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                                        <Clock size={12} />
                                                        {item.notes ? `Catatan: ${item.notes}` : 'Catatan Harian'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <span className={`px-4 py-2 rounded-lg text-xs font-sans font-bold uppercase tracking-widest ${item.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                                    item.status === 'Sakit' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                                        item.status === 'Izin' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                                            'bg-rose-50 text-rose-600 border border-rose-200'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </div>
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
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="text-center relative z-10 w-full mb-6">
                            <h3 className="text-2xl font-sans font-black text-gray-900 tracking-tight">
                                Rincian Metrik
                            </h3>
                            <p className="font-sans text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                                Rekap Kumulatif Total
                            </p>
                        </div>

                        <div className="relative h-44 w-44 my-4">
                            <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                                <circle
                                    cx="18" cy="18" r="15.9155"
                                    className="stroke-gray-100 fill-none"
                                    strokeWidth="3.5"
                                />
                                <circle
                                    cx="18" cy="18" r="15.9155"
                                    className="stroke-indigo-600 fill-none transition-all duration-1000 ease-out"
                                    strokeWidth="3.5"
                                    strokeDasharray={`${stats.totalRate}, 100`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white m-4 rounded-full shadow-sm border border-gray-50">
                                <span className="text-4xl font-sans font-black text-gray-900 tracking-tight leading-none">{stats.totalRate}<span className="text-lg text-gray-400 font-bold ml-0.5">%</span></span>
                                <span className="font-sans text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Kehadiran</span>
                            </div>
                        </div>

                        <div className="w-full pt-6 border-t border-gray-100 grid grid-cols-2 mt-6 gap-4">
                            <div className="text-center bg-gray-50 rounded-xl p-4">
                                <span className="text-2xl font-sans font-black text-gray-900">{attendance.length}</span>
                                <p className="font-sans text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Hari Dicatat</p>
                            </div>
                            <div className="text-center bg-emerald-50 rounded-xl p-4">
                                <span className="text-2xl font-sans font-black text-emerald-600">{stats.hadir}</span>
                                <p className="font-sans text-[9px] font-bold uppercase tracking-widest mt-1 text-emerald-600/80">Hadir</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-8 rounded-3xl border border-indigo-400/30 shadow-md text-white relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform duration-500">
                             <AlertCircle size={120} strokeWidth={1} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between pb-6 mb-6 border-b border-indigo-400/30">
                                <h4 className="font-sans text-xl font-black tracking-tight leading-tight max-w-[150px]">Laporkan Ketidakhadiran</h4>
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
                                    <Clock size={20} strokeWidth={2.5} className="text-white" />
                                </div>
                            </div>
                            <p className="font-sans text-sm font-medium leading-relaxed mb-8 opacity-90">
                                Wajib menghubungi wali kelas sebelum pukul 08:00 WIB untuk status izin atau sakit yang sah.
                            </p>
                            <button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-sans font-bold py-4 rounded-xl shadow-sm hover:shadow-md transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                Hubungi Koordinator
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

