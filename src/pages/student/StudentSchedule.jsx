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
            <div className="py-24 text-center">
                 <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest">Menyiapkan Jadwal Akademik...</p>
            </div>
        );
    }
    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="border-b border-gray-100 pb-6 text-center">
                <div className="inline-flex items-center gap-2 mb-4 bg-blue-50 px-3 py-1.5 rounded-full">
                    <span className="bg-blue-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Akademik Siswa
                    </span>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-blue-600 mr-1">
                        Tahun {new Date().getFullYear()}
                    </span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-sans font-black text-gray-900 tracking-tight leading-none">
                    Jadwal Pelajaran
                </h1>
                <p className="font-sans text-base text-gray-500 mt-4 max-w-2xl mx-auto">
                    Jadwal harian untuk kelas <span className="text-blue-600 font-black">{studentClass || 'Pribadi'}</span>. Silakan gunakan tab di bawah untuk melihat hari dan minggu yang berbeda.
                </p>
            </div>

            {/* Selectors */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {WeekTypes.map((week) => (
                        <button
                            key={week}
                            onClick={() => setSelectedWeek(week)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-sans font-bold uppercase tracking-widest transition-all ${selectedWeek === week
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105 z-10 relative'
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {week}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-center flex-wrap gap-2">
                    {Days.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-sans font-bold uppercase tracking-widest transition-all ${selectedDay === day
                                ? 'bg-gray-900 text-white shadow-md scale-105 z-10 relative'
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Schedule List */}
            <div className="grid grid-cols-1 gap-3 relative mt-6">
                <div className="absolute left-[39px] top-0 bottom-0 w-px bg-gray-200 hidden md:block" />
                {timeSlots.map((slot) => {
                    const entry = filteredSchedules.find(s => s.jam_ke === slot.id);

                    if (slot.type === 'break') {
                        return (
                            <div key={slot.id} className="relative bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 flex items-center justify-center space-x-4 md:ml-20">
                                <Clock size={16} className="text-gray-400" strokeWidth={2.5} />
                                <span className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest">{slot.label}</span>
                                <span className="h-px w-12 sm:w-20 bg-gray-300" />
                                <span className="text-[10px] font-sans font-bold text-gray-500">{slot.start} - {slot.end}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={slot.id} className={`group relative bg-white border rounded-2xl p-6 transition-all duration-300 ${entry ? 'border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 hover:ring-4 hover:ring-blue-50/50' : 'border-gray-100 opacity-60'}`}>
                            {/* Timeline Dot (Desktop Only) */}
                            <div className={`absolute -left-[54px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-white ${entry ? 'bg-blue-600 shadow-md' : 'bg-gray-200'} hidden md:flex items-center justify-center z-10`}></div>

                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                {/* Jam Ke */}
                                <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-colors font-sans ${entry ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                                    <span className="text-[8px] font-sans font-black uppercase tracking-widest leading-none mb-1 text-center">JAM KE</span>
                                    <span className="text-2xl font-black leading-none">{slot.id}</span>
                                </div>

                                {/* Waktu */}
                                <div className="text-center md:text-left min-w-[100px]">
                                    <p className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center justify-center md:justify-start gap-1">
                                        <Clock size={10} strokeWidth={3} />
                                        <span>Waktu</span>
                                    </p>
                                    <p className="text-sm font-sans font-black text-gray-900 tracking-tight leading-none">{slot.start} - {slot.end}</p>
                                </div>

                                {/* Matakuliah / Pelajaran */}
                                <div className="flex-1 text-center md:text-left w-full">
                                    {entry ? (
                                        <div className="space-y-1.5 bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                                            <h3 className="text-xl font-sans font-black text-gray-900 tracking-tight">{entry.subject_name}</h3>
                                            <div className="flex items-center justify-center md:justify-start text-[11px] font-sans font-bold text-gray-500 uppercase tracking-widest mt-2">
                                                <User size={14} className="mr-2 text-blue-500" strokeWidth={2.5} />
                                                {entry.teacher_name || 'GURU BELUM DIPILIH'}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center md:justify-start h-full">
                                             <span className="text-[10px] font-sans font-bold text-gray-300 uppercase tracking-[0.2em] bg-gray-50 px-4 py-2 rounded-lg">Kosong</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Note */}
            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-blue-800">
                <div className="bg-white p-2 rounded-xl shrink-0">
                    <Info size={24} className="text-blue-500" strokeWidth={2.5} />
                </div>
                <p className="font-sans text-xs font-medium leading-relaxed max-w-3xl">
                    Jadwal dapat berubah sewaktu-waktu sesuai kebijakan sekolah. <br className="hidden sm:block" />
                    Silakan hubungi bagian kurikulum atau wali kelas jika terdapat ketidaksesuaian data.
                </p>
            </div>
        </div>
    );
}
