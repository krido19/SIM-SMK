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
    const [errorMsg, setErrorMsg] = useState('');

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
        setErrorMsg('');
        try {
            if (!userId) {
                setErrorMsg('Sesi tidak ditemukan. Silakan login ulang.');
                setIsLoading(false);
                return;
            }

            // Get student class
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('class_id, classes(name)')
                .eq('id', userId)
                .maybeSingle();

            if (studentError) throw studentError;

            if (!student) {
                setErrorMsg('Data siswa tidak ditemukan. Hubungi admin.');
                return;
            }

            setStudentClass(student.classes?.name);

            if (!student.class_id) {
                setErrorMsg('Kamu belum terdaftar di kelas manapun. Hubungi admin untuk mengatur kelas.');
                return;
            }

            // Get schedules for this class
            const { data: sch, error: schError } = await supabase
                .from('schedules')
                .select('*')
                .eq('class_id', student.class_id)
                .order('jam_ke', { ascending: true });

            if (schError) throw schError;
            setSchedules(sch || []);

            if ((sch || []).length === 0) {
                setErrorMsg('Belum ada jadwal untuk kelasmu. Hubungi admin.');
            }
        } catch (error) {
            console.error('Error fetching student schedule:', error);
            setErrorMsg('Gagal memuat jadwal: ' + error.message);
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
        const dayMatch = s.day === selectedDay;
        // Tampilkan juga jadwal yang week_type-nya null/kosong (hasil import PDF)
        const weekMatch = !s.week_type || s.week_type === selectedWeek;
        return dayMatch && weekMatch;
    });

    if (isLoading) return (
        <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-black border-t-neo-accent animate-spin" />
            <p className="font-black text-sm text-black/40 uppercase tracking-widest">Menyiapkan Jadwal...</p>
        </div>
    );

    if (errorMsg && schedules.length === 0) return (
        <div className="py-16 flex flex-col items-center">
            <div className="border-4 border-black shadow-[8px_8px_0px_0px_#FFD93D] bg-neo-secondary p-6 max-w-md text-center">
                <Info size={32} className="mx-auto mb-3" strokeWidth={3} />
                <h2 className="font-black text-xl uppercase mb-2">Jadwal Belum Tersedia</h2>
                <p className="font-bold text-black/60 text-sm">{errorMsg}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="pb-4 border-b-4 border-black">
                <span className="inline-block bg-neo-secondary border-4 border-black text-[10px] font-black px-3 py-1 uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] mb-3">Akademik Siswa</span>
                <h1 className="text-4xl font-black text-black uppercase tracking-tight leading-none">Jadwal Pelajaran</h1>
                <p className="font-bold text-black/50 text-sm mt-1">Kelas: <span className="font-black text-black">{studentClass || 'Pribadi'}</span></p>
            </div>

            {/* Selectors */}
            <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    {WeekTypes.map((week) => (
                        <button key={week} onClick={() => setSelectedWeek(week)}
                            className={`px-4 py-2 border-4 border-black font-black text-xs uppercase tracking-widest transition-all duration-100 ${selectedWeek === week ? 'bg-neo-secondary shadow-[3px_3px_0px_0px_#000]' : 'bg-white hover:bg-neo-cream shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}`}>
                            {week}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                    {Days.map((day) => (
                        <button key={day} onClick={() => setSelectedDay(day)}
                            className={`px-4 py-2 border-4 border-black font-black text-xs uppercase tracking-widest transition-all duration-100 ${selectedDay === day ? 'bg-black text-white shadow-[3px_3px_0px_0px_#FF6B6B]' : 'bg-white hover:bg-neo-cream shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}`}>
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Schedule List */}
            <div className="space-y-3">
                {timeSlots.map((slot) => {
                    const entry = filteredSchedules.find(s => parseInt(s.jam_ke) === slot.id);

                    if (slot.type === 'break') return (
                        <div key={slot.id} className="border-4 border-dashed border-black/20 p-3 flex items-center justify-center gap-4 bg-neo-cream">
                            <Clock size={14} className="text-black/30" strokeWidth={3} />
                            <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">{slot.label}</span>
                            <span className="text-[10px] font-black text-black/30">{slot.start} - {slot.end}</span>
                        </div>
                    );

                    return (
                        <div key={slot.id} className={`border-4 border-black p-4 flex items-center gap-4 transition-all ${entry ? 'bg-white shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000]' : 'bg-neo-cream/50 opacity-60'}`}>
                            <div className={`border-4 border-black w-14 h-14 flex flex-col items-center justify-center shrink-0 ${entry ? 'bg-neo-secondary' : 'bg-white'}`}>
                                <span className="text-[7px] font-black uppercase tracking-widest leading-none">JAM</span>
                                <span className="text-2xl font-black leading-tight">{slot.id}</span>
                            </div>
                            <div className="w-24 shrink-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-black/40 flex items-center gap-1"><Clock size={9} strokeWidth={3} />Waktu</p>
                                <p className="text-sm font-black text-black">{slot.start}–{slot.end}</p>
                            </div>
                            <div className="flex-1">
                                {entry ? (
                                    <div>
                                        <h3 className="font-black text-black text-base uppercase tracking-tight">{entry.subject_name}</h3>
                                        <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-0.5">{entry.teacher_name || 'Guru Belum Dipilih'}</p>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">Kosong</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Note */}
            <div className="border-4 border-black shadow-[6px_6px_0px_0px_#FFD93D] bg-neo-secondary p-5 flex gap-4 items-start">
                <Info size={20} strokeWidth={3} className="shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed">
                    Jadwal dapat berubah sewaktu-waktu sesuai kebijakan sekolah.<br />
                    Silakan hubungi bagian kurikulum atau wali kelas jika ada ketidaksesuaian.
                </p>
            </div>
        </div>
    );
}
