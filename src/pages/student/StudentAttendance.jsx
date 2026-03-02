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
        return <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-[3rem] shadow-xl animate-pulse font-black text-gray-400 dark:text-gray-500">Loading data absensi...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-ink pb-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-ink uppercase tracking-tighter leading-none mb-1">Attendance Record</h1>
                    <p className="font-mono text-[10px] uppercase tracking-widest opacity-60 mt-2">Official Monitoring Log</p>
                </div>

                <div className="flex border-2 border-ink p-1 bg-white self-start shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`flex items-center space-x-2 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors ${viewMode === 'calendar' ? 'bg-ink text-paper' : 'text-ink/60 hover:bg-neutral-100 hover:text-ink'}`}
                    >
                        <CalendarDays size={14} strokeWidth={2} />
                        <span>Calendar</span>
                    </button>
                    <div className="w-0.5 bg-ink/20 mx-1"></div>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center space-x-2 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors ${viewMode === 'list' ? 'bg-ink text-paper' : 'text-ink/60 hover:bg-neutral-100 hover:text-ink'}`}
                    >
                        <PieChart size={14} strokeWidth={2} />
                        <span>List</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Present', value: stats.hadir, bgClass: 'bg-green-100', dotClass: 'bg-green-600', textClass: 'text-green-800' },
                    { label: 'Sick', value: stats.sakit, bgClass: 'bg-amber-100', dotClass: 'bg-amber-600', textClass: 'text-amber-800' },
                    { label: 'Excused', value: stats.izin, bgClass: 'bg-blue-100', dotClass: 'bg-blue-600', textClass: 'text-blue-800' },
                    { label: 'Absent', value: stats.alpa, bgClass: 'bg-newsprint-red', dotClass: 'bg-ink', textClass: 'text-white' },
                ].map((stat) => (
                    <div key={stat.label} className={`border-2 border-ink p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex flex-col justify-between ${stat.bgClass}`}>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className={`h-2 w-2 rounded-none border border-ink ${stat.dotClass}`} />
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${stat.textClass}`}>{stat.label}</span>
                        </div>
                        <h2 className={`text-5xl font-mono font-black tracking-tighter ${stat.textClass}`}>{stat.value}</h2>
                        <p className={`text-[9px] font-mono font-bold uppercase tracking-[0.2em] mt-4 pt-2 border-t-2 border-ink/20 ${stat.textClass}`}>Days Tally</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Section */}
                <div className="lg:col-span-2 space-y-8">
                    {viewMode === 'calendar' ? (
                        <div className="bg-white p-8 border-2 border-ink shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden newsprint-texture">
                            <div className="flex items-center justify-between mb-8 border-b-2 border-ink pb-4">
                                <h3 className="text-2xl font-serif font-black text-ink uppercase tracking-tight">Academic Calendar</h3>
                                <div className="flex items-center space-x-4 border-2 border-ink p-1 bg-paper">
                                    <button onClick={prevMonth} className="px-3 py-1 hover:bg-neutral-200 transition-colors">
                                        <Clock size={16} strokeWidth={2} className="rotate-180 text-ink" />
                                    </button>
                                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-ink">
                                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <button onClick={nextMonth} className="px-3 py-1 hover:bg-neutral-200 transition-colors">
                                        <Clock size={16} strokeWidth={2} className="text-ink" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-px bg-ink mb-1 border-2 border-ink">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <div key={day} className="text-center font-mono text-[10px] bg-paper font-black text-ink uppercase tracking-widest py-3">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-px bg-ink border-2 border-ink">
                                {getDaysInMonth(currentMonth).map((date, i) => {
                                    const att = getAttendanceStatus(date);
                                    const isToday = date && date.toDateString() === new Date().toDateString();

                                    if (!date) return <div key={`empty-${i}`} className="h-20 bg-neutral-100" />;

                                    let bgClass = 'bg-white';
                                    let textClass = 'text-ink';
                                    let markerClass = '';

                                    if (att) {
                                        if (att.status === 'Hadir') { bgClass = 'bg-green-50'; textClass = 'text-green-900'; markerClass = 'bg-green-600'; }
                                        else if (att.status === 'Sakit') { bgClass = 'bg-amber-50'; textClass = 'text-amber-900'; markerClass = 'bg-amber-600'; }
                                        else if (att.status === 'Izin') { bgClass = 'bg-blue-50'; textClass = 'text-blue-900'; markerClass = 'bg-blue-600'; }
                                        else { bgClass = 'bg-newsprint-red/10'; textClass = 'text-newsprint-red'; markerClass = 'bg-newsprint-red'; }
                                    }

                                    return (
                                        <div
                                            key={date.toISOString()}
                                            className={`h-20 relative p-2 ${bgClass} ${isToday ? 'ring-inset ring-4 ring-ink z-10' : ''} group`}
                                        >
                                            <span className={`font-mono text-sm font-bold ${textClass}`}>{date.getDate()}</span>
                                            {att && (
                                                <div className="absolute top-2 right-2">
                                                    <div className={`w-2 h-2 border border-ink ${markerClass}`} />
                                                </div>
                                            )}
                                            {/* Tooltip-like Info */}
                                            {att?.notes && (
                                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none w-max max-w-xs">
                                                    <div className="bg-ink text-paper font-mono text-[9px] font-bold px-2 py-1 border border-ink shadow-[2px_2px_0px_0px_rgba(204,0,0,1)] whitespace-normal text-left uppercase tracking-wider">
                                                        Note: {att.notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 flex items-center justify-center space-x-6 border-t-2 border-ink pt-6">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 border border-ink bg-green-600" />
                                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-ink">Present</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 border border-ink bg-amber-600" />
                                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-ink">Excused/Sick</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 border border-ink bg-newsprint-red" />
                                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-ink">Absent</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 border-2 border-ink shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] overflow-hidden relative newsprint-texture">
                            <div className="flex items-center justify-between mb-8 border-b-2 border-ink pb-4">
                                <h3 className="text-2xl font-serif font-black text-ink uppercase tracking-tight">Attendance Log</h3>
                                <div className="p-2 border-2 border-ink bg-neutral-100">
                                    <BarChart3 size={16} strokeWidth={2} className="text-ink" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {attendance.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <XCircle size={48} strokeWidth={1} className="mx-auto text-ink/20 border-newsprint-red mb-4" />
                                        <p className="font-mono text-ink/60 font-bold uppercase tracking-widest text-xs">No records found</p>
                                    </div>
                                ) : (
                                    attendance.map((item) => (
                                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-paper border-2 border-ink hover:bg-neutral-50 transition-colors group shadow-[4px_4px_0px_0px_rgba(17,17,17,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                                            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                                                <div className="h-10 w-10 border-2 border-ink flex items-center justify-center bg-white group-hover:bg-ink group-hover:text-paper transition-colors">
                                                    {item.status === 'Hadir' ? <CheckCircle2 size={20} strokeWidth={2} /> : <AlertCircle size={20} strokeWidth={2} />}
                                                </div>
                                                <div>
                                                    <p className="font-serif text-lg font-black text-ink leading-tight">{new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                    <p className="font-mono text-[9px] font-bold text-ink/60 uppercase tracking-widest mt-1">
                                                        {item.notes ? `Note: ${item.notes}` : 'Daily Log'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <span className={`px-4 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest border-2 border-ink shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] ${item.status === 'Hadir' ? 'bg-green-100 text-green-800' :
                                                        item.status === 'Sakit' ? 'bg-amber-100 text-amber-800' :
                                                            item.status === 'Izin' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-newsprint-red text-white border-transparent shadow-[2px_2px_0px_0px_rgba(17,17,17,0.5)]'
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
                    <div className="bg-white p-8 border-2 border-ink shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="text-center relative z-10 w-full mb-6">
                            <h3 className="text-3xl font-serif font-black text-ink tracking-tight uppercase">
                                Metric Details
                            </h3>
                            <p className="font-mono text-[9px] font-bold text-ink/60 mt-1 uppercase tracking-widest border-b-2 border-ink pb-4">
                                Cumulative Record
                            </p>
                        </div>

                        <div className="relative h-40 w-40 my-4">
                            <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                                <circle
                                    cx="18" cy="18" r="15.9155"
                                    className="stroke-neutral-200 fill-none"
                                    strokeWidth="2"
                                />
                                <circle
                                    cx="18" cy="18" r="15.9155"
                                    className="stroke-ink fill-none transition-all duration-1000"
                                    strokeWidth="4"
                                    strokeDasharray={`${stats.totalRate}, 100`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white m-3 rounded-full border-2 border-ink">
                                <span className="text-4xl font-serif font-black text-ink tracking-tighter leading-none">{stats.totalRate}<span className="text-xl">%</span></span>
                                <span className="font-mono text-[8px] font-black text-ink/60 uppercase tracking-[0.2em] mt-1">Active</span>
                            </div>
                        </div>

                        <div className="w-full pt-6 border-t-2 border-ink grid grid-cols-2 mt-4 relative">
                            <div className="text-center border-r-2 border-ink">
                                <span className="text-3xl font-mono font-black text-ink">{attendance.length}</span>
                                <p className="font-mono text-[9px] font-bold text-ink/60 uppercase tracking-widest mt-1">Logged Days</p>
                            </div>
                            <div className="text-center bg-ink text-paper -m-8 ml-0 -mt-0 py-6 pr-6 pl-4 flex flex-col justify-center items-center">
                                <span className="text-3xl font-mono font-black">{stats.hadir}</span>
                                <p className="font-mono text-[9px] font-bold uppercase tracking-widest mt-1 opacity-80">Present</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-newsprint-red p-8 border-2 border-ink shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] text-white relative">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between border-b-2 border-ink/30 pb-4 mb-6">
                                <h4 className="font-serif text-2xl font-black uppercase tracking-tight">Report Absence</h4>
                                <div className="border-2 border-ink bg-white p-2">
                                    <Clock size={16} strokeWidth={2} className="text-ink" />
                                </div>
                            </div>
                            <p className="font-mono text-xs font-bold leading-relaxed mb-8 opacity-90 border-l-2 border-white pl-4 uppercase tracking-widest">
                                Must notify coordinator prior to 8:00 AM for valid excuse status.
                            </p>
                            <button className="w-full border-2 border-ink bg-white text-ink hover:bg-ink hover:text-white font-mono font-black py-4 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:shadow-none active:translate-y-[4px] active:translate-x-[4px] transition-all uppercase tracking-widest text-[10px]">
                                Contact Coordinator
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

