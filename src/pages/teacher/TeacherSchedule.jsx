import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, BookOpen, Filter } from 'lucide-react';

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

    if (isLoading) return (
        <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-black border-t-neo-accent animate-spin" />
            <p className="font-black text-sm text-black/40 uppercase tracking-widest">Memuat Jadwal Mengajar...</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b-4 border-black">
                <div>
                    <span className="inline-block bg-neo-muted border-4 border-black text-[10px] font-black px-3 py-1 uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] mb-3">Akademik</span>
                    <h1 className="text-4xl font-black text-black uppercase tracking-tight leading-none">Jadwal Mengajar</h1>
                    <p className="font-bold text-black/50 text-sm mt-1">Siklus aktif: <span className="font-black text-black">{currentWeekType}</span></p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Kelas', value: totalClasses, icon: BookOpen, bg: 'bg-neo-muted' },
                    { label: 'Mata Pelajaran', value: totalSubjects, icon: Calendar, bg: 'bg-neo-secondary' },
                    { label: 'Jadwal Hari Ini', value: schedules.filter(s => s.day === todayName && s.week_type === currentWeekType).length, icon: Clock, bg: 'bg-neo-cream' },
                    { label: 'Sesi/Minggu', value: schedules.filter(s => s.week_type === currentWeekType).length, icon: Filter, bg: 'bg-white' },
                ].map(({ label, value, icon: Icon, bg }) => (
                    <div key={label} className={`${bg} border-4 border-black shadow-[6px_6px_0px_0px_#000] p-5`}>
                        <div className="border-4 border-black p-2 bg-white shadow-[2px_2px_0px_0px_#000] w-max mb-3">
                            <Icon size={16} strokeWidth={3} />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-black/40">{label}</p>
                        <p className="text-4xl font-black text-black">{value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center border-4 border-black shadow-[4px_4px_0px_0px_#000] bg-white p-4">
                <Filter size={16} strokeWidth={3} className="text-black/40" />
                <select value={selectedWeekType} onChange={e => setSelectedWeekType(e.target.value)}
                    className="flex-1 min-w-[180px] bg-neo-cream border-4 border-black font-black text-xs text-black uppercase tracking-widest px-4 py-2.5 focus:bg-neo-secondary focus:shadow-[4px_4px_0px_0px_#000] transition-all">
                    {WeekTypes.map(w => <option key={w} value={w}>{w.toUpperCase()}</option>)}
                </select>
                <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)}
                    className="flex-1 min-w-[180px] bg-neo-cream border-4 border-black font-black text-xs text-black uppercase tracking-widest px-4 py-2.5 focus:bg-neo-secondary focus:shadow-[4px_4px_0px_0px_#000] transition-all">
                    <option value="">SEMUA HARI</option>
                    {Days.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                </select>
            </div>

            {/* Schedule Grid */}
            {Object.keys(groupedByDay).length > 0 ? (
                <div className="space-y-5">
                    {Days.filter(day => groupedByDay[day]).map(day => (
                        <div key={day} className="border-4 border-black shadow-[6px_6px_0px_0px_#000] overflow-hidden">
                            {/* Day Header */}
                            <div className={`px-5 py-3 border-b-4 border-black flex items-center justify-between ${day === todayName ? 'bg-black text-white' : 'bg-neo-secondary text-black'}`}>
                                <div className="flex items-center gap-3">
                                    <Calendar size={16} strokeWidth={3} />
                                    <h3 className="text-lg font-black uppercase tracking-tight">{day}</h3>
                                    {day === todayName && <span className="border-2 border-neo-secondary text-neo-secondary text-[9px] font-black uppercase px-2 py-0.5">HARI INI</span>}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{groupedByDay[day].length} Sesi</span>
                            </div>

                            {/* Sessions */}
                            <div className="divide-y-2 divide-black/10">
                                {groupedByDay[day].map((sched) => (
                                    <div key={sched.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-neo-cream/50 transition-colors">
                                        <div className="flex items-center gap-3 md:w-48 shrink-0">
                                            <div className="border-4 border-black p-2 bg-neo-cream shadow-[2px_2px_0px_0px_#000]">
                                                <Clock size={14} strokeWidth={3} />
                                            </div>
                                            <div>
                                                <p className="font-black text-black text-sm">{sched.start_time?.substring(0, 5)} — {sched.end_time?.substring(0, 5)}</p>
                                                {sched.jam_ke && <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mt-0.5">Jam ke-{sched.jam_ke}</p>}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-black text-base uppercase tracking-tight">{sched.subject_name || '-'}</h4>
                                        </div>
                                        <div className="shrink-0">
                                            <span className="border-4 border-black bg-neo-muted px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]">{sched.class_name || '-'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-16 text-center border-4 border-dashed border-black/20 bg-white flex flex-col items-center">
                    <Calendar size={32} className="mb-3 text-black/20" strokeWidth={2} />
                    <h3 className="font-black text-black uppercase">Tidak Ada Jadwal</h3>
                    <p className="font-bold text-black/40 text-sm mt-1">{selectedDay ? `Tidak ada jadwal untuk ${selectedDay}` : 'Jadwal belum tersedia.'}</p>
                </div>
            )}
        </div>
    );
}
