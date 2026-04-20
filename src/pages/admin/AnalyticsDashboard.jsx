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

    if (isLoading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center">
                 <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                 <p className="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest">Menganalisis Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <div className="inline-flex items-center gap-2 mb-4 bg-indigo-50 px-3 py-1.5 rounded-full">
                        <TrendingUp size={14} className="text-indigo-600" />
                        <span className="bg-indigo-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Analisis
                        </span>
                    </div>
                    <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight leading-none mb-2">Executive Dashboard</h1>
                    <p className="font-sans text-sm text-gray-500 font-medium mt-2">Ringkasan performa akademik dan aktivitas seluruh entitas sekolah.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tren Kehadiran Siswa */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Users size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="font-sans font-black text-xl text-gray-900">Tren Kehadiran Sekolah</h3>
                            <p className="font-sans text-xs text-gray-500 font-medium">Akumulasi per bulan</p>
                        </div>
                    </div>
                    <div className="h-72 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, className: 'font-sans text-gray-500' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, className: 'font-sans text-gray-500' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }} />
                                <Area type="monotone" dataKey="Hadir" stroke="#10B981" fillOpacity={1} fill="url(#colorHadir)" strokeWidth={3} />
                                <Line type="monotone" dataKey="Alpa" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="Sakit" stroke="#F59E0B" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Performa Mata Pelajaran */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                     <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <BookOpen size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="font-sans font-black text-xl text-gray-900">Performa Mata Pelajaran</h3>
                            <p className="font-sans text-xs text-gray-500 font-medium">Rata-rata kumulatif nilai siswa</p>
                        </div>
                    </div>
                    <div className="h-72 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, className: 'font-sans text-gray-500' }} />
                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, className: 'font-sans font-bold text-gray-700' }} />
                                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="Ratarata" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                {/* Aktivitas Guru / Produktivitas */}
                 <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2">
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Activity size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="font-sans font-black text-xl text-gray-900">Aktivitas Guru (Top Leaderboard)</h3>
                                <p className="font-sans text-xs text-gray-500 font-medium">Metrik produktivitas input materi & nilai</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-80 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={teacherActivity} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, className: 'font-sans font-medium text-gray-500' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, className: 'font-sans text-gray-500' }} />
                                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="Tugas Dibuat" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
