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

    const attendanceStats = [
        { label: 'Hadir', value: stats.hadir, color: 'bg-emerald-500', text: 'text-emerald-600' },
        { label: 'Sakit', value: stats.sakit, color: 'bg-orange-500', text: 'text-orange-600' },
        { label: 'Izin', value: stats.izin, color: 'bg-blue-500', text: 'text-blue-600' },
        { label: 'Alpa', value: stats.alpa, color: 'bg-red-500', text: 'text-red-600' },
    ];

    if (loading) {
        return <div className="p-8 text-center">Loading data absensi...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Rekap Kehadiran</h1>
                <p className="text-gray-500 font-medium mt-1">Laporan kehadiran siswa semester ini.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {attendanceStats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`h-2 w-8 rounded-full ${stat.color}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${stat.text}`}>{stat.label}</span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900">{stat.value}</h2>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Hari</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attendance Percentage */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col items-center justify-center space-y-6">
                    <div className="relative h-48 w-48">
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                            <path
                                className="stroke-gray-100 fill-none"
                                strokeWidth="3"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className="stroke-emerald-500 fill-none"
                                strokeWidth="3"
                                strokeDasharray={`${stats.totalRate}, 100`}
                                strokeLinecap="round"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-gray-900 leading-none">{stats.totalRate}%</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Kehadiran</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-gray-900">
                            {stats.totalRate >= 90 ? 'Sangat Rajin!' :
                                stats.totalRate >= 75 ? 'Cukup Rajin' : 'Kurang Rajin'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 px-4">Tingkatkan terus kedisiplinan Anda dalam belajar.</p>
                    </div>
                </div>

                {/* Recent Attendance Detail */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-gray-900">Riwayat Terkini</h3>
                        <CalendarDays size={20} className="text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {attendance.length === 0 ? (
                            <p className="text-center text-gray-500 font-bold py-10">Belum ada data absensi.</p>
                        ) : (
                            attendance.map((item, i) => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all group">
                                    <div className="flex items-center space-x-4">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600' :
                                            item.status === 'Sakit' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {item.status === 'Hadir' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {item.notes ? `Ket: ${item.notes}` : 'Laporan Harian'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' :
                                        item.status === 'Sakit' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
