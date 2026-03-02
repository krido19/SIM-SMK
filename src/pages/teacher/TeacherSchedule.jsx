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
            <div className="p-8 text-center font-mono text-[10px] uppercase tracking-widest bg-paper border-2 border-ink shadow-[4px_4px_0px_0px_#111111] animate-pulse font-bold text-ink">
                Memuat jadwal mengajar...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="border-b-4 border-ink pb-6">
                <h1 className="text-4xl font-serif font-black text-ink uppercase tracking-tighter leading-none">JADWAL MENGAJAR</h1>
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-60 mt-2">
                    Jadwal mengajar resmi · Siklus aktif: {currentWeekType}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-paper border-2 border-ink p-4 shadow-[3px_3px_0px_0px_#111111]">
                    <p className="text-[9px] font-mono font-bold text-ink/40 uppercase tracking-widest">Total Kelas</p>
                    <p className="text-3xl font-serif font-black text-ink">{totalClasses}</p>
                </div>
                <div className="bg-paper border-2 border-ink p-4 shadow-[3px_3px_0px_0px_#111111]">
                    <p className="text-[9px] font-mono font-bold text-ink/40 uppercase tracking-widest">Mata Pelajaran</p>
                    <p className="text-3xl font-serif font-black text-ink">{totalSubjects}</p>
                </div>
                <div className="bg-paper border-2 border-ink p-4 shadow-[3px_3px_0px_0px_#111111]">
                    <p className="text-[9px] font-mono font-bold text-ink/40 uppercase tracking-widest">Jadwal Hari Ini</p>
                    <p className="text-3xl font-serif font-black text-ink">
                        {schedules.filter(s => s.day === todayName && s.week_type === currentWeekType).length}
                    </p>
                </div>
                <div className="bg-paper border-2 border-ink p-4 shadow-[3px_3px_0px_0px_#111111]">
                    <p className="text-[9px] font-mono font-bold text-ink/40 uppercase tracking-widest">Total Sesi/Minggu</p>
                    <p className="text-3xl font-serif font-black text-ink">
                        {schedules.filter(s => s.week_type === currentWeekType).length}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center bg-paper border-2 border-ink p-4 shadow-[4px_4px_0px_0px_#111111]">
                <Filter size={16} className="text-ink" strokeWidth={2.5} />
                <div className="relative">
                    <select
                        value={selectedWeekType}
                        onChange={e => setSelectedWeekType(e.target.value)}
                        className="bg-paper border-2 border-ink px-4 py-2 pr-8 font-mono font-bold text-[10px] text-ink uppercase tracking-widest outline-none appearance-none cursor-pointer"
                    >
                        {WeekTypes.map(w => (
                            <option key={w} value={w}>{w.toUpperCase()}</option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink pointer-events-none" />
                </div>
                <div className="relative">
                    <select
                        value={selectedDay}
                        onChange={e => setSelectedDay(e.target.value)}
                        className="bg-paper border-2 border-ink px-4 py-2 pr-8 font-mono font-bold text-[10px] text-ink uppercase tracking-widest outline-none appearance-none cursor-pointer"
                    >
                        <option value="">SEMUA HARI</option>
                        {Days.map(d => (
                            <option key={d} value={d}>{d.toUpperCase()}</option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink pointer-events-none" />
                </div>
            </div>

            {/* Schedule Grid */}
            {Object.keys(groupedByDay).length > 0 ? (
                <div className="space-y-8">
                    {Days.filter(day => groupedByDay[day]).map(day => (
                        <div key={day} className="bg-paper border-2 border-ink shadow-[4px_4px_0px_0px_#111111] overflow-hidden newsprint-texture">
                            {/* Day Header */}
                            <div className={`px-6 py-4 border-b-4 border-ink flex items-center justify-between ${day === todayName ? 'bg-ink text-paper' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} strokeWidth={2.5} />
                                    <h3 className="text-lg font-serif font-black uppercase tracking-tight">{day}</h3>
                                    {day === todayName && (
                                        <span className="px-2 py-0.5 bg-newsprint-red text-white text-[8px] font-mono font-bold uppercase tracking-widest animate-pulse">
                                            HARI INI
                                        </span>
                                    )}
                                </div>
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-60">
                                    {groupedByDay[day].length} Sesi
                                </span>
                            </div>

                            {/* Sessions */}
                            <div className="divide-y-2 divide-ink/10">
                                {groupedByDay[day].map((sched, i) => (
                                    <div key={sched.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-neutral-50 transition-colors">
                                        {/* Time */}
                                        <div className="flex items-center gap-3 md:w-44 shrink-0">
                                            <div className="p-2 border-2 border-ink bg-white">
                                                <Clock size={14} className="text-ink" strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="font-mono font-black text-ink text-sm">
                                                    {sched.start_time?.substring(0, 5)} — {sched.end_time?.substring(0, 5)}
                                                </p>
                                                {sched.jam_ke && (
                                                    <p className="text-[9px] font-mono font-bold text-ink/40 uppercase tracking-widest">
                                                        Jam ke-{sched.jam_ke}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <BookOpen size={12} className="text-ink/50" strokeWidth={2} />
                                                <h4 className="font-serif font-black text-ink uppercase tracking-tight">
                                                    {sched.subject_name || '-'}
                                                </h4>
                                            </div>
                                        </div>

                                        {/* Class */}
                                        <div className="shrink-0">
                                            <span className="px-4 py-2 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest border-2 border-ink">
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
                <div className="py-20 text-center border-2 border-dashed border-ink/20 bg-paper">
                    <Calendar size={48} className="mx-auto text-ink/20 mb-4" strokeWidth={1} />
                    <h3 className="text-lg font-serif font-black text-ink/40 uppercase">Tidak Ada Jadwal</h3>
                    <p className="text-sm font-mono text-ink/30 uppercase tracking-widest mt-2">
                        {selectedDay ? `Tidak ada jadwal untuk hari ${selectedDay}` : 'Jadwal mengajar belum tersedia.'}
                    </p>
                </div>
            )}
        </div>
    );
}
