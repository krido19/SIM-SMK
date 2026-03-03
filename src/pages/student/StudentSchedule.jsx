import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, BookOpen, User, Info, Grid, List as ListIcon } from 'lucide-react';

const Days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const WeekTypes = ['Minggu Ganjil', 'Minggu Genap'];

export default function StudentSchedule() {
    const [schedules, setSchedules] = useState([]);
    const [selectedDay, setSelectedDay] = useState(() => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = days[new Date().getDay()];
        return Days.includes(today) ? today : 'Senin';
    });
    const [selectedWeek, setSelectedWeek] = useState('Minggu Ganjil');
    const [viewMode, setViewMode] = useState('list');
    const [isLoading, setIsLoading] = useState(true);
    const [studentClass, setStudentClass] = useState(null);
    const [schoolStartTime, setSchoolStartTime] = useState("07:15");

    const role = localStorage.getItem('userRole') || 'siswa';
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchData();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const { data: startTimeData } = await supabase.from('settings').select('value').eq('key', 'school_start_time').maybeSingle();
        if (startTimeData?.value) setSchoolStartTime(startTimeData.value);

        const { data: weekData } = await supabase.from('settings').select('value').eq('key', 'current_week_type').maybeSingle();
        if (weekData?.value) setSelectedWeek(weekData.value || 'Minggu Ganjil');
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            // Get student class
            const { data: student } = await supabase
                .from('students')
                .select('class_id, classes(name)')
                .eq('id', userId)
                .maybeSingle();

            if (student) {
                setStudentClass(student.classes?.name);

                // Get schedules for this class
                const { data: sch } = await supabase
                    .from('schedules')
                    .select('*')
                    .eq('class_id', student.class_id)
                    .order('jam_ke', { ascending: true });

                setSchedules(sch || []);
            }
        } catch (error) {
            console.error('Error fetching student schedule:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const timeSlots = useMemo(() => {
        const slots = [];
        let current = new Date(`2000-01-01T${schoolStartTime}:00`);
        const SESSION_DURATION = 45;
        const BREAK1_AFTER = 4;
        const BREAK1_DURATION = 15;
        const BREAK2_AFTER = 6;
        const BREAK2_DURATION = 45;

        for (let i = 1; i <= 12; i++) {
            const start = current.toTimeString().substring(0, 5);
            current.setMinutes(current.getMinutes() + SESSION_DURATION);
            const end = current.toTimeString().substring(0, 5);

            slots.push({ id: i, start, end, type: 'lesson' });

            if (i === BREAK1_AFTER) {
                const bStart = current.toTimeString().substring(0, 5);
                current.setMinutes(current.getMinutes() + BREAK1_DURATION);
                const bEnd = current.toTimeString().substring(0, 5);
                slots.push({ id: `b1`, label: 'Istirahat 1', start: bStart, end: bEnd, type: 'break' });
            } else if (i === BREAK2_AFTER) {
                const bStart = current.toTimeString().substring(0, 5);
                current.setMinutes(current.getMinutes() + BREAK2_DURATION);
                const bEnd = current.toTimeString().substring(0, 5);
                slots.push({ id: `b2`, label: 'ISHOMA', start: bStart, end: bEnd, type: 'break' });
            }
        }
        return slots;
    }, [schoolStartTime]);

    const filteredSchedules = schedules.filter(s => {
        return s.day === selectedDay && s.week_type === selectedWeek;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="font-mono text-[10px] uppercase tracking-widest animate-pulse">Menyiapkan Jadwal Akademik...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="border-b-4 border-ink pb-8">
                <div className="flex items-center gap-2 mb-4">
                    <span className="bg-newsprint-red text-white text-[10px] font-mono font-bold px-2 py-1 uppercase tracking-widest">
                        Akademik Siswa
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">
                        Ref: SCHK/{new Date().getFullYear()}
                    </span>
                </div>
                <h1 className="text-6xl font-serif font-black text-ink tracking-tighter leading-none">
                    Jadwal Pelajaran
                </h1>
                <p className="font-body text-xl text-ink/70 mt-4 leading-relaxed">
                    Jadwal harian untuk kelas <span className="text-ink font-black underline decoration-newsprint-red decoration-2 underline-offset-4">{studentClass || 'Pribadi'}</span>.
                </p>
            </div>

            {/* Selectors */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex border-2 border-ink shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] inline-flex">
                    {WeekTypes.map((week) => (
                        <button
                            key={week}
                            onClick={() => setSelectedWeek(week)}
                            className={`px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${selectedWeek === week
                                ? 'bg-ink text-paper'
                                : 'bg-paper text-ink hover:bg-neutral-100'
                                }`}
                        >
                            {week}
                        </button>
                    ))}
                </div>

                <div className="flex border-2 border-ink shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex-1 overflow-x-auto no-scrollbar">
                    {Days.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`flex-1 min-w-[100px] py-2 px-4 font-mono font-bold text-[10px] uppercase tracking-widest transition-all ${selectedDay === day
                                ? 'bg-ink text-paper'
                                : 'bg-paper text-ink hover:bg-neutral-100'
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Schedule List */}
            <div className="grid grid-cols-1 gap-4">
                {timeSlots.map((slot) => {
                    const entry = filteredSchedules.find(s => s.jam_ke === slot.id);

                    if (slot.type === 'break') {
                        return (
                            <div key={slot.id} className="bg-neutral-50 border-2 border-dashed border-ink/20 p-4 flex items-center justify-center space-x-4">
                                <Clock size={16} className="text-ink/40" />
                                <span className="text-[10px] font-mono font-bold text-ink/40 uppercase tracking-widest">{slot.label}</span>
                                <span className="h-px w-20 bg-ink/10" />
                                <span className="text-[10px] font-mono font-bold text-ink/40">{slot.start} - {slot.end}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={slot.id} className={`group relative bg-paper border-2 p-6 transition-all duration-300 ${entry ? 'border-ink shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]' : 'border-ink/10 opacity-40'}`}>
                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                                {/* Jam Ke */}
                                <div className={`flex flex-col items-center justify-center w-20 h-20 border-2 transition-colors font-mono ${entry ? 'bg-ink border-ink text-paper' : 'bg-neutral-50 border-ink/10 text-ink/20'}`}>
                                    <span className="text-[8px] font-mono font-bold uppercase tracking-widest leading-none mb-1 text-center">JAM KE</span>
                                    <span className="text-3xl font-black leading-none">{slot.id}</span>
                                </div>

                                {/* Waktu */}
                                <div className="text-center md:text-left min-w-[110px]">
                                    <p className="text-[9px] font-mono font-bold text-ink/40 uppercase tracking-widest mb-1">WAKTU</p>
                                    <p className="text-lg font-mono font-black text-ink leading-none">{slot.start} - {slot.end}</p>
                                </div>

                                {/* Matakuliah / Pelajaran */}
                                <div className="flex-1 text-center md:text-left">
                                    {entry ? (
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-serif font-black text-ink tracking-tight uppercase">{entry.subject_name}</h3>
                                            <div className="flex items-center justify-center md:justify-start text-sm font-mono font-bold text-ink/60 uppercase">
                                                <User size={16} className="mr-2 text-newsprint-red" strokeWidth={2.5} />
                                                {entry.teacher_name || 'GURU BELUM DIPILIH'}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-mono font-bold text-ink/20 uppercase tracking-[0.2em]">KOSONG</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Note */}
            <div className="border-t-2 border-ink pt-6 flex items-start gap-4 text-ink/60">
                <Info size={20} className="shrink-0 mt-1" />
                <p className="font-mono text-[10px] uppercase tracking-widest leading-relaxed">
                    Jadwal dapat berubah sewaktu-waktu sesuai kebijakan sekolah. <br />
                    Silakan hubungi bagian kurikulum jika terdapat ketidaksesuaian data.
                </p>
            </div>
        </div>
    );
}
