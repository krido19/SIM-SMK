import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Calendar,
    Clock,
    BookOpen,
    Filter,
    ChevronDown
} from 'lucide-react';

const Days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const WeekTypes = ['Minggu Ganjil', 'Minggu Genap'];

export default function TeacherSchedule() {
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedWeekType, setSelectedWeekType] = useState('Minggu Ganjil');
    const [currentWeekType, setCurrentWeekType] = useState('Minggu Ganjil');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');

        try {
            // Get current week type setting
            const { data: weekData } = await supabase.from('settings').select('value').eq('key', 'current_week_type').maybeSingle();
            if (weekData?.value) {
                setCurrentWeekType(weekData.value);
                setSelectedWeekType(weekData.value);
            }

            // Fetch teacher's schedules
            let allSchedules = [];

            if (userId) {
                const { data: s1 } = await supabase
                    .from('schedules')
                    .select('*')
                    .eq('teacher_id', userId)
                    .order('jam_ke', { ascending: true });
                if (s1) allSchedules.push(...s1);
            }

            if (userName) {
                const { data: s2 } = await supabase
                    .from('schedules')
                    .select('*')
                    .eq('teacher_name', userName)
                    .order('jam_ke', { ascending: true });
                if (s2) allSchedules.push(...s2);
            }

            // Deduplicate by id
            const seen = new Set();
            const unique = allSchedules.filter(s => {
                if (seen.has(s.id)) return false;
                seen.add(s.id);
                return true;
            });

            setSchedules(unique);
        } catch (error) {
            console.error('Error fetching schedule:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter schedules
    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => {
            if (selectedWeekType && s.week_type !== selectedWeekType) return false;
            if (selectedDay && s.day !== selectedDay) return false;
            return true;
        }).sort((a, b) => {
            const dayOrder = Days.indexOf(a.day) - Days.indexOf(b.day);
            if (dayOrder !== 0) return dayOrder;
            return (a.jam_ke || 0) - (b.jam_ke || 0);
        });
    }, [schedules, selectedDay, selectedWeekType]);

    // Group by day
    const groupedByDay = useMemo(() => {
        const groups = {};
        filteredSchedules.forEach(s => {
            if (!groups[s.day]) groups[s.day] = [];
            groups[s.day].push(s);
        });
        return groups;
    }, [filteredSchedules]);

    // Stats
    const totalClasses = new Set(schedules.map(s => s.class_id).filter(Boolean)).size;
    const totalSubjects = new Set(schedules.map(s => s.subject_name).filter(Boolean)).size;
    const todayName = Days[new Date().getDay() - 1] || '';

    if (isLoading) {
        return (
            <div className="p-8 text-center font-sans text-xs font-bold uppercase tracking-widest bg-gray-50 rounded-3xl border border-gray-100 shadow-sm animate-pulse text-gray-500">
                Memuat jadwal mengajar...
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-gray-100">
                <div>
                     <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Akademik
                        </span>
                    </div>
                    <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight leading-none">Jadwal Mengajar</h1>
                    <p className="font-sans text-sm font-medium text-gray-500 mt-2">
                        Jadwal mengajar resmi · Siklus aktif: <span className="font-bold text-gray-700">{currentWeekType}</span>
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-max self-start">
                        <BookOpen size={20} strokeWidth={2.5} />
                    </div>
                    <p className="text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest mt-2">Total Kelas</p>
                    <p className="text-3xl font-sans font-black text-gray-900">{totalClasses}</p>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-max self-start">
                        <Calendar size={20} strokeWidth={2.5} />
                    </div>
                    <p className="text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest mt-2">Mata Pelajaran</p>
                    <p className="text-3xl font-sans font-black text-gray-900">{totalSubjects}</p>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-2xl w-max self-start">
                        <Clock size={20} strokeWidth={2.5} />
                    </div>
                    <p className="text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest mt-2">Jadwal Hari Ini</p>
                    <p className="text-3xl font-sans font-black text-gray-900">
                        {schedules.filter(s => s.day === todayName && s.week_type === currentWeekType).length}
                    </p>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-max self-start">
                        <Filter size={20} strokeWidth={2.5} />
                    </div>
                    <p className="text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest mt-2">Total Sesi/Minggu</p>
                    <p className="text-3xl font-sans font-black text-gray-900">
                        {schedules.filter(s => s.week_type === currentWeekType).length}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="hidden sm:flex p-3 bg-gray-50 rounded-xl">
                    <Filter size={20} className="text-gray-400" strokeWidth={2.5} />
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <select
                        value={selectedWeekType}
                        onChange={e => setSelectedWeekType(e.target.value)}
                        className="w-full bg-gray-50 border border-transparent rounded-xl px-5 py-3.5 pr-10 font-sans font-bold text-xs text-gray-700 uppercase tracking-widest outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
                    >
                        {WeekTypes.map(w => (
                            <option key={w} value={w}>{w.toUpperCase()}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <select
                        value={selectedDay}
                        onChange={e => setSelectedDay(e.target.value)}
                        className="w-full bg-gray-50 border border-transparent rounded-xl px-5 py-3.5 pr-10 font-sans font-bold text-xs text-gray-700 uppercase tracking-widest outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">SEMUA HARI</option>
                        {Days.map(d => (
                            <option key={d} value={d}>{d.toUpperCase()}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Schedule Grid */}
            {Object.keys(groupedByDay).length > 0 ? (
                <div className="space-y-6">
                    {Days.filter(day => groupedByDay[day]).map(day => (
                        <div key={day} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all">
                            {/* Day Header */}
                            <div className={`px-6 py-5 border-b border-gray-100 flex items-center justify-between ${day === todayName ? 'bg-blue-600 text-white' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <Calendar size={20} strokeWidth={2.5} className={day === todayName ? 'text-blue-100' : 'text-gray-400'} />
                                    <h3 className={`text-xl font-sans font-black uppercase tracking-tight ${day === todayName ? 'text-white' : 'text-gray-900'}`}>{day}</h3>
                                    {day === todayName && (
                                        <span className="px-2 py-1 bg-white text-blue-600 text-[10px] font-sans font-black uppercase tracking-widest rounded-full shadow-sm ml-2">
                                            HARI INI
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] font-sans font-black uppercase tracking-widest ${day === todayName ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {groupedByDay[day].length} Sesi
                                </span>
                            </div>

                            {/* Sessions */}
                            <div className="divide-y divide-gray-50 flex-1 flex flex-col">
                                {groupedByDay[day].map((sched, i) => (
                                    <div key={sched.id} className="px-6 py-5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-blue-50/30 transition-colors flex-1">
                                        {/* Time */}
                                        <div className="flex items-center gap-4 md:w-52 shrink-0">
                                            <div className="p-3 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm transition-all border border-gray-100">
                                                <Clock size={16} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="font-sans font-black text-gray-900 text-sm tracking-tight">
                                                    {sched.start_time?.substring(0, 5)} — {sched.end_time?.substring(0, 5)}
                                                </p>
                                                {sched.jam_ke && (
                                                    <p className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                        Jam ke-{sched.jam_ke}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-sans font-black text-gray-900 text-lg uppercase tracking-tight">
                                                    {sched.subject_name || '-'}
                                                </h4>
                                            </div>
                                        </div>

                                        {/* Class */}
                                        <div className="shrink-0 flex items-center gap-3">
                                            <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-sans font-black uppercase tracking-widest border border-gray-200">
                                                {sched.class_name || '-'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                         <Calendar size={32} className="text-gray-300" strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-sans font-black text-gray-900 tracking-tight">Tidak Ada Jadwal</h3>
                    <p className="text-sm font-sans font-medium text-gray-500 mt-2 max-w-sm">
                        {selectedDay ? `Tidak ada jadwal mengajar yang dimuat untuk hari ${selectedDay}` : 'Jadwal mengajar Anda belum tersedia untuk siklus ini.'}
                    </p>
                </div>
            )}
        </div>
    );
}
