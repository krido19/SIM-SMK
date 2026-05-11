import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, Activity, BookOpen, Clock } from 'lucide-react';

export default function AnalyticsDashboard() {
    const [attendanceData, setAttendanceData] = useState([]);
    const [subjectData, setSubjectData] = useState([]);
    const [teacherActivity, setTeacherActivity] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            setIsLoading(true);
            
            // Fetch Attendance Data for Line Chart (Grouped by Date)
            const { data: rawAttendance, error: attError } = await supabase
                .from('attendance')
                .select('date, status')
                .order('date', { ascending: true });

            if (!attError && rawAttendance) {
                // Group by month
                const monthlyData = {};
                rawAttendance.forEach(record => {
                    if (!record.date) return;
                    const dateObj = new Date(record.date);
                    const monthKey = `${dateObj.toLocaleString('id-ID', { month: 'short' })} ${dateObj.getFullYear()}`;
                    
                    if (!monthlyData[monthKey]) {
                        monthlyData[monthKey] = { name: monthKey, Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
                    }
                    if (monthlyData[monthKey][record.status] !== undefined) {
                        monthlyData[monthKey][record.status]++;
                    }
                });
                setAttendanceData(Object.values(monthlyData));
            }

            // Fetch Grades Data to compute average performance per subject
            const { data: gradesData, error: gradesError } = await supabase
                .from('grades')
                .select(`
                    id, score,
                    subject:subjects(name)
                `);

            if (!gradesError && gradesData) {
                 const subjectAvgs = {};
                 gradesData.forEach(g => {
                     const subName = g.subject?.name;
                     if (subName) {
                         if (!subjectAvgs[subName]) subjectAvgs[subName] = { total: 0, count: 0, name: subName };
                         subjectAvgs[subName].total += g.score || 0;
                         subjectAvgs[subName].count++;
                     }
                 });
                 const processedSubjects = Object.values(subjectAvgs).map(s => ({
                     name: s.name,
                     Ratarata: Math.round(s.total / s.count)
                 }));
                 setSubjectData(processedSubjects);
            }

            // Fetch Teacher Activity (Proxy by Assignments created & Attendance taken)
            // Just count assignments grouped by teacher
            const { data: teacherAsgData, error: taError } = await supabase
                .from('assignments')
                .select('teacher_id, teachers(name)');

            if (!taError && teacherAsgData) {
                 const tActivities = {};
                 teacherAsgData.forEach(t => {
                     const name = t.teachers?.name;
                     if(name) {
                         if (!tActivities[name]) tActivities[name] = { name: name, "Tugas Dibuat": 0 };
                         tActivities[name]["Tugas Dibuat"]++;
                     }
                 });
                 // We can also fetch another metric and merge, but keeping it targeted for now
                 setTeacherActivity(Object.values(tActivities).sort((a,b) => b["Tugas Dibuat"] - a["Tugas Dibuat"]).slice(0,10));
            }

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-black border-t-neo-accent animate-spin" />
            <p className="font-black text-sm text-black/40 uppercase tracking-widest">Menganalisis Data...</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-12 max-w-7xl mx-auto">
            <div className="pb-4 border-b-4 border-black">
                <span className="inline-block bg-neo-accent border-4 border-black text-[10px] font-black px-3 py-1 uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] mb-3">Analisis</span>
                <h1 className="text-4xl font-black text-black uppercase tracking-tight leading-none">Executive Dashboard</h1>
                <p className="font-bold text-black/50 text-sm mt-1">Ringkasan performa akademik dan aktivitas seluruh entitas sekolah.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tren Kehadiran Siswa */}
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-5 flex flex-col">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b-4 border-black">
                        <div className="border-4 border-black p-2 bg-neo-secondary shadow-[2px_2px_0px_0px_#000]">
                            <Users size={20} strokeWidth={3} />
                        </div>
                        <div>
                            <h3 className="font-black text-black uppercase tracking-tight">Tren Kehadiran Sekolah</h3>
                            <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Akumulasi per bulan</p>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fontFamily: 'Space Grotesk' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fontFamily: 'Space Grotesk' }} />
                                <Tooltip contentStyle={{ border: '4px solid #000', borderRadius: 0, boxShadow: '4px 4px 0px #000', fontFamily: 'Space Grotesk', fontWeight: 900 }} />
                                <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '10px', fontFamily: 'Space Grotesk', fontWeight: 900, textTransform: 'uppercase' }} />
                                <Area type="monotone" dataKey="Hadir" stroke="#000" fillOpacity={1} fill="url(#colorHadir)" strokeWidth={3} />
                                <Line type="monotone" dataKey="Alpa" stroke="#FF6B6B" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="Sakit" stroke="#FFD93D" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Performa Mata Pelajaran */}
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-5 flex flex-col">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b-4 border-black">
                        <div className="border-4 border-black p-2 bg-neo-muted shadow-[2px_2px_0px_0px_#000]">
                            <BookOpen size={20} strokeWidth={3} />
                        </div>
                        <div>
                            <h3 className="font-black text-black uppercase tracking-tight">Performa Mata Pelajaran</h3>
                            <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Rata-rata kumulatif nilai siswa</p>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="0" horizontal={false} stroke="rgba(0,0,0,0.1)" />
                                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fontFamily: 'Space Grotesk' }} />
                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fontFamily: 'Space Grotesk' }} />
                                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ border: '4px solid #000', borderRadius: 0, boxShadow: '4px 4px 0px #000', fontFamily: 'Space Grotesk', fontWeight: 900 }} />
                                <Bar dataKey="Ratarata" fill="#000" radius={0} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                {/* Aktivitas Guru */}
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-5 flex flex-col lg:col-span-2">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b-4 border-black">
                        <div className="border-4 border-black p-2 bg-neo-accent shadow-[2px_2px_0px_0px_#000]">
                            <Activity size={20} strokeWidth={3} />
                        </div>
                        <div>
                            <h3 className="font-black text-black uppercase tracking-tight">Aktivitas Guru (Top Leaderboard)</h3>
                            <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Metrik produktivitas input materi & nilai</p>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={teacherActivity} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fontFamily: 'Space Grotesk' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fontFamily: 'Space Grotesk' }} />
                                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ border: '4px solid #000', borderRadius: 0, boxShadow: '4px 4px 0px #000', fontFamily: 'Space Grotesk', fontWeight: 900 }} />
                                <Bar dataKey="Tugas Dibuat" fill="#FFD93D" radius={0} barSize={36} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
