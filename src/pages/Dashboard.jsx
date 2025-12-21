import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    GraduationCap,
    BookOpen,
    TrendingUp,
    Clock,
    Bell,
    Calendar,
    ChevronRight,
    ArrowUpRight,
    AlertCircle,
    UserCircle,
    Award,
    ClipboardList
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-transform ${color}`} />
        <div className="flex items-start justify-between relative z-10">
            <div className={`p-4 rounded-2xl ${color.replace('bg-', 'bg-').replace('600', '50')} ${color.replace('bg-', 'text-')}`}>
                <Icon size={24} />
            </div>
            {trend && (
                <div className={`flex items-center space-x-1 text-xs font-black ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                    <span>{trend}</span>
                    <ArrowUpRight size={14} className={trend.startsWith('-') ? 'rotate-90' : ''} />
                </div>
            )}
        </div>
        <div className="mt-6 relative z-10">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</h3>
            <p className="text-4xl font-black text-gray-900 mt-1">{value}</p>
        </div>
    </div>
);

export default function Dashboard() {
    const role = localStorage.getItem('userRole') || 'admin';
    const userName = localStorage.getItem('userName') || (role === 'admin' ? 'Admin Utama' : role === 'guru' ? 'Ibu Guru Siti' : role === 'siswa' ? 'Ahmad Fauzi' : 'Orang Tua Ahmad');

    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalSubjects: 0,
        avgGrade: 84.2
    });
    const [announcements, setAnnouncements] = useState([]);
    const [nextClass, setNextClass] = useState(null);
    const [currentWeekType, setCurrentWeekType] = useState('Minggu Ganjil'); // Add state
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        fetchNextClass();
    }, []);

    const fetchNextClass = async () => {
        try {
            // 1. Get Global Settings (Week Type)
            const { data: weekData } = await supabase.from('settings').select('value').eq('key', 'current_week_type').maybeSingle();
            const weekType = weekData?.value || 'Minggu Ganjil';
            setCurrentWeekType(weekType); // Set state

            // 2. Determine Day & Time
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const today = days[new Date().getDay()];
            const now = new Date();
            const currentTime = now.toTimeString().substring(0, 5); // HH:MM

            if (today === 'Minggu') {
                // console.log("Debug: It is Sunday, but logic allowed to proceed.");
            }

            console.log("Debug Notification: Checking for", { today, currentWeekType: weekType, currentTime, role });

            let query = supabase
                .from('schedules')
                .select('*')
                .eq('day', today)
                .eq('week_type', weekType)
                .gte('end_time', currentTime) // Find classes that haven't ended yet
                .order('start_time', { ascending: true })
                .limit(1);

            if (role === 'guru') {
                let userId = localStorage.getItem('userId');
                const userNIP = localStorage.getItem('userNIP');
                console.log("Debug Notification: Guru IDs", { userId, userNIP });

                if (userId) {
                    query = query.eq('teacher_id', userId);
                } else if (userNIP) {
                    // Fallback resolve
                    const { data: t } = await supabase.from('teachers').select('id').eq('nip', userNIP).maybeSingle();
                    if (t) {
                        console.log("Debug Notification: Resolved NIP to ID", t.id);
                        query = query.eq('teacher_id', t.id);
                    }
                    else return;
                } else {
                    console.log("Debug Notification: No ID found for guru");
                    return;
                }
            } else if (role === 'siswa') {
                // For students, we need their class_id
                const userId = localStorage.getItem('userId');
                if (userId) {
                    const { data: s } = await supabase.from('students').select('class_id').eq('id', userId).maybeSingle();
                    if (s?.class_id) query = query.eq('class_id', s.class_id);
                    else return;
                } else {
                    return;
                }
            } else {
                return; // Admin/Parent doesn't need this specifically right now
            }

            const { data: schedules, error: schedError } = await query.maybeSingle();
            console.log("Debug Notification: Query Result", schedules, schedError);

            if (schedules) {
                setNextClass(schedules);
            } else {
                setNextClass(null);
            }

        } catch (error) {
            console.error("Error fetching next class", error);
        }
    };

    const fetchDashboardData = async () => {
        setIsLoading(true);

        try {
            if (role === 'admin') {
                const [std, tea, sub, ann] = await Promise.all([
                    supabase.from('students').select('*', { count: 'exact', head: true }),
                    supabase.from('teachers').select('*', { count: 'exact', head: true }),
                    supabase.from('subjects').select('*', { count: 'exact', head: true }),
                    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(4)
                ]);

                setStats({
                    totalStudents: std.count || 0,
                    totalTeachers: tea.count || 0,
                    totalSubjects: sub.count || 0,
                    avgGrade: 84.2 // Still mock for admin aggregate
                });
                setAnnouncements(ann.data || []);
            } else if (role === 'guru') {
                let userId = localStorage.getItem('userId');
                const userNIP = localStorage.getItem('userNIP');

                // Fallback 1: Try NIP (Most Reliable)
                if (!userId && userNIP) {
                    const { data: teacher } = await supabase
                        .from('teachers')
                        .select('id')
                        .eq('nip', userNIP)
                        .maybeSingle();
                    if (teacher) {
                        userId = teacher.id;
                        localStorage.setItem('userId', userId);
                    }
                }

                // Fallback 2: Try Name (Legacy / if NIP missing)
                if (!userId && userName) {
                    const { data: teacher } = await supabase
                        .from('teachers')
                        .select('id')
                        .eq('name', userName)
                        .maybeSingle();
                    if (teacher) {
                        userId = teacher.id;
                        localStorage.setItem('userId', userId);
                    }
                }

                if (userId) {
                    console.log("Debug: Found UserID:", userId);
                    console.log("Debug: UserName:", userName);

                    // Get classes taught by this teacher
                    // Debug: Check if 'schedules' has teacher_id OR teacher_name
                    // Debug: Check if 'schedules' has teacher_id OR teacher_name
                    // Fix: Quote the name because it might contain commas
                    const { data: schedules, error: schedError } = await supabase
                        .from('schedules')
                        .select('class_id, teacher_id, teacher_name')
                        .or(`teacher_id.eq.${userId},teacher_name.eq."${userName}",teacher_name.ilike."%${userName}%"`);

                    console.log("Debug: Schedules found:", schedules);
                    if (schedError) console.error("Debug: Schedule Error:", schedError);

                    // Unique classes
                    const uniqueClasses = [...new Set(schedules?.map(s => s.class_id) || [])];
                    console.log("Debug: Unique Classes:", uniqueClasses);

                    // Count students in those classes
                    let studentCount = 0;
                    let studentIds = [];
                    if (uniqueClasses.length > 0) {
                        const { data: students, count, error: countError } = await supabase
                            .from('students')
                            .select('id', { count: 'exact' })
                            .in('class_id', uniqueClasses);
                        studentCount = count || 0;
                        studentIds = students?.map(s => s.id) || [];
                        if (countError) console.error("Debug: Student Count Error:", countError);
                    }
                    console.log("Debug: Student Count:", studentCount);

                    // Calculate Attendance Percentage (Real-time)
                    let attendancePercentage = 0;
                    if (studentIds.length > 0) {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const { count: presentCount, error: attError } = await supabase
                            .from('attendance')
                            .select('*', { count: 'exact', head: true })
                            .in('student_id', studentIds)
                            .eq('date', todayStr)
                            .eq('status', 'Hadir');

                        if (!attError && studentCount > 0) {
                            attendancePercentage = Math.round((presentCount / studentCount) * 100);
                        }
                    }

                    // Get announcements
                    const { data: ann } = await supabase
                        .from('announcements')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(4);

                    setStats({
                        classesTaught: uniqueClasses.length,
                        totalStudents: studentCount,
                        pendingTasks: 0,
                        attendance: `${attendancePercentage}%`
                    });
                    setAnnouncements(ann || []);
                } else {
                    // Still no user ID found?
                    console.error("Could not identify teacher.");
                }
            } else {
                // Logic for Student / Parent
                let studentId = localStorage.getItem('userId');

                // Lookup student ID if not in localStorage (fallback to Name from Login)
                if (!studentId && userName) {
                    const { data: student } = await supabase
                        .from('students')
                        .select('id')
                        .eq('full_name', userName) // specific to current schema
                        .maybeSingle();
                    if (student) {
                        studentId = student.id;
                        localStorage.setItem('userId', studentId);
                    }
                }

                if (studentId) {
                    // 1. Calculate Average Grade
                    const { data: grades } = await supabase
                        .from('grades')
                        .select('score') // Corrected column name
                        .eq('student_id', studentId);

                    let avg = 0;
                    let subjectCount = 0;
                    if (grades && grades.length > 0) {
                        const total = grades.reduce((sum, g) => sum + (g.score || 0), 0);
                        avg = (total / grades.length).toFixed(1);
                        subjectCount = grades.length; // Approximate mapel count from grades
                    }

                    // 2. Count Subjects (better estimate if grades are incomplete, but fallback to unique grades count)
                    // If we want exact Mapel count, we need class_id -> schedules -> subjects.
                    // For now, using grades count as "Subjects Graded" or simple fixed 12 if 0.
                    if (subjectCount === 0) subjectCount = 12; // fallback

                    // 3. Calculate Attendance
                    const { count: presentCount } = await supabase
                        .from('attendance')
                        .select('*', { count: 'exact', head: true })
                        .eq('student_id', studentId)
                        .eq('status', 'Hadir');

                    const { count: totalAtt } = await supabase
                        .from('attendance')
                        .select('*', { count: 'exact', head: true })
                        .eq('student_id', studentId);

                    let attPct = 0;
                    if (totalAtt > 0) {
                        attPct = Math.round((presentCount / totalAtt) * 100);
                    }

                    setStats({
                        avgGrade: avg,
                        totalSubjects: subjectCount,
                        attendance: `${attPct}%`,
                        rank: '-' // Rank calculation is complex, keeping simple for now
                    });

                } else {
                    // Fallback defaults
                    setStats({
                        avgGrade: 0,
                        totalSubjects: 0,
                        attendance: '0%',
                        rank: '-'
                    });
                }

                const { data: ann } = await supabase
                    .from('announcements')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(4);
                setAnnouncements(ann || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }

        setIsLoading(false);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">Beranda</h1>
                    <p className="text-gray-500 font-medium mt-3">Selamat datang kembali, <span className="text-blue-600 font-bold">{userName}</span>. Berikut ringkasan Anda.</p>
                </div>
                <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-2">
                    <div className="h-10 px-4 flex items-center bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest">
                        {currentWeekType} | Semester Ganjil 2023/2024
                    </div>
                </div>
            </div>

            {/* Next Class Notification */}
            {nextClass && (
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-[2.5rem] p-8 shadow-xl shadow-blue-200 text-white relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                                    Sedang / Akan Berlangsung
                                </span>
                                <span className="flex items-center text-[10px] font-bold text-blue-100">
                                    <Clock size={12} className="mr-1" />
                                    {nextClass.start_time} - {nextClass.end_time} WIB
                                </span>
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-wide leading-none mb-1">
                                {nextClass.subject_name}
                            </h2>
                            <p className="text-blue-100 font-medium flex items-center">
                                {role === 'guru' ? (
                                    <>Mengajar di Kelas <b className="text-white ml-1">{nextClass.class_name}</b></>
                                ) : (
                                    <>Guru: <b className="text-white ml-1">{nextClass.teacher_name}</b></>
                                )}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Ruangan</p>
                            <p className="text-2xl font-black">{nextClass.class_name}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Adaptive Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {role === 'admin' ? (
                    <>
                        <StatCard title="Total Siswa" value={stats.totalStudents.toLocaleString()} icon={Users} trend="+12%" color="bg-blue-600" />
                        <StatCard title="Total Guru" value={stats.totalTeachers.toString()} icon={UserCircle} color="bg-indigo-600" />
                        <StatCard title="Mata Pelajaran" value={stats.totalSubjects.toString()} icon={BookOpen} color="bg-emerald-600" />
                        <StatCard title="Rata-rata Nilai" value={stats.avgGrade.toString()} icon={TrendingUp} trend="+2.4%" color="bg-violet-600" />
                    </>
                ) : role === 'guru' ? (
                    <>
                        <StatCard title="Kelas Diampu" value={stats.classesTaught?.toString() || "0"} icon={Hash} color="bg-blue-600" />
                        <StatCard title="Jumlah Siswa" value={stats.totalStudents?.toString() || "0"} icon={Users} color="bg-indigo-600" />
                        <StatCard title="Tugas Menunggu" value="-" icon={ClipboardList} color="bg-orange-600" />
                        <StatCard title="Kehadiran" value={stats.attendance} icon={TrendingUp} color="bg-emerald-600" />
                    </>
                ) : (
                    <>
                        <StatCard title="Rata-rata Nilai" value={stats.avgGrade?.toString() || "0"} icon={Award} trend="+5%" color="bg-blue-600" />
                        <StatCard title="Jumlah Mapel" value={stats.totalSubjects?.toString() || "0"} icon={BookOpen} color="bg-indigo-600" />
                        <StatCard title="Presensi Semester" value={stats.attendance || "0%"} icon={Calendar} color="bg-emerald-600" />
                        <StatCard title="Peringkat Kelas" value={stats.rank || "-"} icon={TrendingUp} color="bg-violet-600" />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Analytics Section */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden relative">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900">{role === 'siswa' || role === 'parent' ? 'Performa Akademik' : 'Kehadiran Mingguan'}</h3>
                            <p className="text-sm text-gray-400 font-bold mt-1">
                                {role === 'siswa' || role === 'parent' ? 'Tren nilai dalam 6 bulan terakhir' : 'Persentase kehadiran seluruh tingkatan'}
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <span className="w-3 h-3 rounded-full bg-blue-600" />
                            <span className="w-3 h-3 rounded-full bg-indigo-200" />
                        </div>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-4 mt-4">
                        {(role === 'siswa' || role === 'parent' ? [82, 85, 84, 88, 92, 88] : [75, 82, 90, 85, 95, 88]).map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer">
                                <div
                                    className="w-full bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-all relative overflow-hidden flex flex-col justify-end"
                                    style={{ height: '100%' }}
                                >
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-2xl shadow-lg shadow-blue-100 transition-all duration-1000 ease-out"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-10 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {h}{role === 'siswa' ? '' : '%'}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-widest">
                                    {role === 'siswa' || role === 'parent' ? ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'][i] : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Announcements */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black text-gray-900">Informasi</h3>
                        <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <Bell size={18} />
                        </div>
                    </div>

                    <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-2">
                        {announcements.length > 0 ? announcements.map((news, i) => (
                            <div key={news.id} className="flex items-start space-x-4 group cursor-pointer">
                                <div className={`mt-2 w-2 h-2 rounded-full ${['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500'][i % 4]} shadow-lg shadow-blue-200 shrink-0 group-hover:scale-150 transition-transform`} />
                                <div className="flex-1 pb-4 border-b border-gray-50 group-last:border-0">
                                    <h4 className="text-sm font-black text-gray-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{news.title}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{news.date}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-400 text-sm font-bold">Belum ada pengumuman.</p>
                        )}
                    </div>

                    <button className="mt-8 w-full py-4 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-2xl font-black text-sm transition-all flex items-center justify-center space-x-2 group">
                        <span>Lihat Semua</span>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Fixed import for Hash
import { Hash } from 'lucide-react';
