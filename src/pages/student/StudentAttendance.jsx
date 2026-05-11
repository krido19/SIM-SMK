import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, XCircle, AlertCircle, Clock, CalendarDays, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StudentAttendance() {
    const userId = localStorage.getItem('userId');
    const [attendance, setAttendance] = useState([]);
    const [stats, setStats] = useState({ hadir: 0, sakit: 0, izin: 0, alpa: 0, totalRate: 0 });
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('calendar');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => { if (userId) fetchAttendance(); }, [userId]);

    const fetchAttendance = async () => {
        try {
            const { data, error } = await supabase.from('attendance').select('*').eq('student_id', userId).order('date', { ascending: false });
            if (error) throw error;
            setAttendance(data || []);
            const counts = { hadir: data.filter(a => a.status === 'Hadir').length, sakit: data.filter(a => a.status === 'Sakit').length, izin: data.filter(a => a.status === 'Izin').length, alpa: data.filter(a => a.status === 'Alpa').length };
            const rate = data.length > 0 ? ((counts.hadir / data.length) * 100).toFixed(0) : 0;
            setStats({ ...counts, totalRate: rate });
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear(), month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        for (let i = 0; i < offset; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    };

    const getAtt = (date) => {
        if (!date) return null;
        const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        const dateStr = d.toISOString().split('T')[0];
        return attendance.find(a => a.date === dateStr);
    };

    const statusColors = {
        Hadir: { bg: 'bg-neo-secondary', border: 'border-black', text: 'text-black' },
        Sakit: { bg: 'bg-neo-muted', border: 'border-black', text: 'text-black' },
        Izin:  { bg: 'bg-white', border: 'border-black', text: 'text-black' },
        Alpa:  { bg: 'bg-neo-accent', border: 'border-black', text: 'text-black' },
    };

    if (loading) return (
        <div className="py-24 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-black border-t-neo-accent animate-spin" />
            <p className="font-black text-sm text-black/40 uppercase tracking-widest">Memuat Absensi...</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-4 border-black">
                <div>
                    <span className="inline-block bg-neo-secondary border-4 border-black text-[10px] font-black px-3 py-1 uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] mb-3">Akademik</span>
                    <h1 className="text-4xl font-black text-black uppercase tracking-tight leading-none">Rekap Kehadiran</h1>
                </div>
                <div className="flex border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                    {[{ mode: 'calendar', icon: CalendarDays, label: 'Kalender' }, { mode: 'list', icon: BarChart3, label: 'Daftar' }].map(({ mode, icon: Icon, label }) => (
                        <button key={mode} onClick={() => setViewMode(mode)} className={`flex items-center gap-2 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest border-r-4 border-black last:border-r-0 transition-colors ${viewMode === mode ? 'bg-neo-secondary' : 'bg-white hover:bg-neo-cream'}`}>
                            <Icon size={14} strokeWidth={3} /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Hadir', value: stats.hadir, bg: 'bg-neo-secondary' },
                    { label: 'Sakit', value: stats.sakit, bg: 'bg-neo-muted' },
                    { label: 'Izin', value: stats.izin, bg: 'bg-white' },
                    { label: 'Alpa', value: stats.alpa, bg: 'bg-neo-accent' },
                ].map(stat => (
                    <div key={stat.label} className={`border-4 border-black shadow-[6px_6px_0px_0px_#000] p-5 ${stat.bg}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/50 mb-2">{stat.label}</p>
                        <p className="text-5xl font-black text-black">{stat.value}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mt-4 border-t-2 border-black/20 pt-2">Total Hari</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {viewMode === 'calendar' ? (
                        <div className="border-4 border-black shadow-[8px_8px_0px_0px_#000] bg-white p-5">
                            <div className="flex items-center justify-between mb-5 pb-4 border-b-4 border-black">
                                <h3 className="text-lg font-black text-black uppercase">Kalender Akademik</h3>
                                <div className="flex items-center border-4 border-black shadow-[3px_3px_0px_0px_#000]">
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 border-r-4 border-black hover:bg-neo-secondary transition-colors"><ChevronLeft size={16} strokeWidth={3} /></button>
                                    <span className="text-sm font-black text-black px-4">{currentMonth.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 border-l-4 border-black hover:bg-neo-secondary transition-colors"><ChevronRight size={16} strokeWidth={3} /></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d => (
                                    <div key={d} className="text-center text-[10px] font-black text-black/40 uppercase py-1">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1.5">
                                {getDaysInMonth(currentMonth).map((date, i) => {
                                    const att = getAtt(date);
                                    const isToday = date && date.toDateString() === new Date().toDateString();
                                    if (!date) return <div key={`e${i}`} className="h-12 sm:h-16" />;
                                    const sc = att ? statusColors[att.status] || statusColors.Hadir : null;
                                    return (
                                        <div key={date.toISOString()} className={`h-12 sm:h-16 border-2 ${isToday ? 'border-neo-accent shadow-[2px_2px_0px_0px_#FF6B6B]' : sc ? 'border-black' : 'border-black/20'} ${sc ? sc.bg : 'bg-neo-cream/50'} relative p-1.5 flex flex-col justify-between cursor-default`}>
                                            <span className="text-[11px] font-black text-black">{date.getDate()}</span>
                                            {att && <span className="text-[8px] font-black uppercase text-black/60">{att.status.slice(0,3)}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 pt-4 border-t-2 border-black/10 flex flex-wrap gap-3">
                                {[['neo-secondary', 'Hadir'], ['neo-muted', 'Sakit'], ['white', 'Izin'], ['neo-accent', 'Alpa']].map(([c, l]) => (
                                    <div key={l} className={`flex items-center gap-2 border-2 border-black px-2 py-1 bg-${c}`}>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{l}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="border-4 border-black shadow-[8px_8px_0px_0px_#000] bg-white overflow-hidden">
                            <div className="bg-neo-secondary border-b-4 border-black px-5 py-3">
                                <h3 className="font-black text-black uppercase tracking-tight">Riwayat Kehadiran</h3>
                            </div>
                            {attendance.length === 0 ? (
                                <div className="py-16 text-center border-4 border-dashed border-black/20 m-4 font-black text-black/30 uppercase">Belum ada riwayat</div>
                            ) : (
                                <div className="divide-y-2 divide-black/10">
                                    {attendance.map(item => {
                                        const sc = statusColors[item.status] || statusColors.Hadir;
                                        return (
                                            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-neo-cream/50 transition-colors">
                                                <p className="font-black text-sm text-black">{new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                <span className={`border-4 border-black px-3 py-1 text-[10px] font-black uppercase ${sc.bg}`}>{item.status}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-5">
                    <div className="border-4 border-black shadow-[8px_8px_0px_0px_#000] bg-white p-6 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-4">Tingkat Kehadiran</p>
                        <div className="relative w-36 h-36 mx-auto mb-4">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.9155" className="fill-none stroke-black/10" strokeWidth="3.5" />
                                <circle cx="18" cy="18" r="15.9155" className="fill-none stroke-neo-accent transition-all duration-1000" strokeWidth="3.5" strokeDasharray={`${stats.totalRate}, 100`} strokeLinecap="butt" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-black">{stats.totalRate}</span>
                                <span className="text-[10px] font-black text-black/40 uppercase">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-4 border-black shadow-[8px_8px_0px_0px_#000] bg-black text-white p-5 relative overflow-hidden">
                        <div className="absolute inset-0 neo-halftone-white opacity-10" />
                        <div className="relative z-10">
                            <h4 className="font-black text-lg uppercase tracking-tight mb-3 text-neo-secondary">Laporkan</h4>
                            <p className="text-xs font-bold text-white/60 mb-5">Wajib melapor ke wali kelas sebelum 08:00 WIB untuk izin/sakit resmi.</p>
                            <button className="w-full border-4 border-white bg-white text-black font-black text-xs uppercase tracking-widest py-3 hover:bg-neo-secondary hover:border-neo-secondary transition-colors">Hubungi Koordinator</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
