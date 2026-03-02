import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Hash, Users, ClipboardList, TrendingUp, ChevronRight, AlertCircle, X, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from './StatCard';

const TeacherDashboard = ({ userName }) => {
    const [stats, setStats] = useState({
        classesTaught: 0,
        totalStudents: 0,
        pendingTasks: 0,
        attendance: '0%'
    });
    const [classDetails, setClassDetails] = useState([]);
    const [studentDetails, setStudentDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetail, setShowDetail] = useState(null); // 'classes' | 'students' | null

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        let userId = localStorage.getItem('userId');
        const userNIP = localStorage.getItem('userNIP');

        try {
            // Fallback 1: Try NIP
            if (!userId && userNIP) {
                const { data: teacher } = await supabase.from('teachers').select('id').eq('nip', userNIP).maybeSingle();
                if (teacher) {
                    userId = teacher.id;
                    localStorage.setItem('userId', userId);
                }
            }

            // Fallback 2: Try Name
            if (!userId && userName) {
                const { data: teacher } = await supabase.from('teachers').select('id').eq('name', userName).maybeSingle();
                if (teacher) {
                    userId = teacher.id;
                    localStorage.setItem('userId', userId);
                }
            }

            if (userId) {
                // Get classes taught - use two queries to avoid .or() issues
                let allScheduleClassIds = [];

                // Query 1: Match by teacher_id (most reliable)
                const { data: schedById } = await supabase
                    .from('schedules')
                    .select('class_id, class_name, subject_name')
                    .eq('teacher_id', userId);
                if (schedById) allScheduleClassIds.push(...schedById);

                // Query 2: Match by teacher_name (fallback for older data)
                if (userName) {
                    const { data: schedByName } = await supabase
                        .from('schedules')
                        .select('class_id, class_name, subject_name')
                        .eq('teacher_name', userName);
                    if (schedByName) allScheduleClassIds.push(...schedByName);
                }

                // Deduplicate by class_id
                const classMap = {};
                allScheduleClassIds.filter(s => s.class_id).forEach(s => {
                    if (!classMap[s.class_id]) {
                        classMap[s.class_id] = { id: s.class_id, name: s.class_name || 'Kelas', subjects: [] };
                    }
                    if (s.subject_name && !classMap[s.class_id].subjects.includes(s.subject_name)) {
                        classMap[s.class_id].subjects.push(s.subject_name);
                    }
                });

                const uniqueClasses = Object.values(classMap);
                const uniqueClassIds = uniqueClasses.map(c => c.id);
                setClassDetails(uniqueClasses);

                // Count students & get details
                let studentCount = 0;
                let studentIds = [];
                if (uniqueClassIds.length > 0) {
                    const { data: students, count } = await supabase
                        .from('students')
                        .select('id, full_name, nis, class_id', { count: 'exact' })
                        .in('class_id', uniqueClassIds);
                    studentCount = count || 0;
                    studentIds = students?.map(s => s.id) || [];

                    // Map students with class names
                    const studentsWithClass = (students || []).map(s => ({
                        ...s,
                        className: classMap[s.class_id]?.name || '-'
                    }));
                    setStudentDetails(studentsWithClass);
                }

                // Calculate Attendance
                let attendancePercentage = 0;
                if (studentIds.length > 0) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const { count: presentCount } = await supabase
                        .from('attendance')
                        .select('*', { count: 'exact', head: true })
                        .in('student_id', studentIds)
                        .eq('date', todayStr)
                        .eq('status', 'Hadir');

                    if (studentCount > 0) {
                        attendancePercentage = Math.round((presentCount / studentCount) * 100);
                    }
                }

                // Get assignments count
                const { count: taskCount } = await supabase
                    .from('assignments')
                    .select('*', { count: 'exact', head: true })
                    .eq('teacher_id', userId);

                setStats({
                    classesTaught: uniqueClasses.length,
                    totalStudents: studentCount,
                    pendingTasks: taskCount || 0,
                    attendance: `${attendancePercentage}%`
                });
            }
        } catch (error) {
            console.error('Error fetching teacher dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="animate-pulse font-mono text-[10px] uppercase">Memuat Data...</div>;

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <button onClick={() => setShowDetail('classes')} className="text-left">
                    <StatCard title="Kelas Diampu" value={stats.classesTaught?.toString() || "0"} icon={Hash} />
                </button>
                <button onClick={() => setShowDetail('students')} className="text-left">
                    <StatCard title="Jumlah Siswa" value={stats.totalStudents?.toString() || "0"} icon={Users} />
                </button>
                <StatCard title="Tugas Diterbitkan" value={stats.pendingTasks?.toString() || "0"} icon={ClipboardList} trend={stats.pendingTasks > 0 ? "- Perlu Ditinjau" : ""} to="/teacher/assignments" />
                <StatCard title="Kehadiran Hari Ini" value={stats.attendance} icon={TrendingUp} />
            </div>

            <div className="bg-paper p-8 border-2 border-ink shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative newsprint-texture">
                <div className="flex items-center justify-between mb-8 border-b-2 border-ink pb-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={24} className="text-newsprint-red" strokeWidth={1.5} />
                        <h3 className="text-2xl font-serif font-black text-ink uppercase tracking-tight">Tindakan Diperlukan</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="border border-ink/20 p-6 hover:bg-ink hover:text-paper transition-colors group">
                        <h4 className="font-serif font-bold text-xl mb-2">Catat Kehadiran Harian</h4>
                        <p className="font-body text-sm mb-6 opacity-70">Daftar kehadiran untuk kelas aktif Anda perlu diisi untuk sesi hari ini.</p>
                        <Link to="/teacher/attendance" className="inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-widest border-b border-current pb-1 group-hover:text-newsprint-red">
                            Buka Absensi <ChevronRight size={14} className="ml-1" />
                        </Link>
                    </div>

                    <div className="border border-ink/20 p-6 hover:bg-ink hover:text-paper transition-colors group">
                        <h4 className="font-serif font-bold text-xl mb-2">Nilai Tugas Siswa</h4>
                        <p className="font-body text-sm mb-6 opacity-70">Ada tugas siswa yang menunggu peninjauan dan penilaian Anda.</p>
                        <Link to="/teacher/assignments" className="inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-widest border-b border-current pb-1 group-hover:text-newsprint-red">
                            Buka Penilaian <ChevronRight size={14} className="ml-1" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetail && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-paper border-4 border-ink shadow-[16px_16px_0px_0px_#111111] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
                        <div className="bg-ink text-paper px-6 py-4 flex justify-between items-center">
                            <h3 className="font-mono font-black uppercase tracking-widest text-sm">
                                {showDetail === 'classes' ? 'DAFTAR KELAS DIAMPU' : 'DAFTAR SISWA'}
                            </h3>
                            <button onClick={() => setShowDetail(null)} className="p-1 hover:bg-paper/10 transition-colors">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {showDetail === 'classes' ? (
                                <div className="space-y-4">
                                    {classDetails.length > 0 ? classDetails.map((cls, i) => (
                                        <div key={cls.id} className="border-2 border-ink p-5 shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#111111] transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-xl font-serif font-black text-ink uppercase tracking-tight">{cls.name}</h4>
                                                <span className="bg-ink text-paper px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-widest">
                                                    Kelas #{i + 1}
                                                </span>
                                            </div>
                                            {cls.subjects.length > 0 && (
                                                <div className="border-t-2 border-ink/10 pt-3">
                                                    <p className="text-[9px] font-mono font-bold text-ink/40 uppercase tracking-widest mb-2">Mata Pelajaran:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {cls.subjects.map(subj => (
                                                            <span key={subj} className="px-3 py-1 border-2 border-ink text-[10px] font-mono font-bold text-ink uppercase tracking-widest flex items-center">
                                                                <BookOpen size={10} className="mr-2" />
                                                                {subj}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="py-12 text-center border-2 border-dashed border-ink/20">
                                            <p className="text-ink/30 font-serif italic text-sm">Belum ada kelas yang diampu.</p>
                                            <p className="text-[10px] font-mono text-ink/20 uppercase tracking-widest mt-2">Hubungi admin untuk mengatur jadwal.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {studentDetails.length > 0 ? (
                                        <>
                                            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-ink text-paper text-[9px] font-mono font-bold uppercase tracking-widest mb-2">
                                                <span className="col-span-1">No</span>
                                                <span className="col-span-3">NIS</span>
                                                <span className="col-span-5">Nama Siswa</span>
                                                <span className="col-span-3">Kelas</span>
                                            </div>
                                            {studentDetails.map((std, i) => (
                                                <div key={std.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-ink/10 hover:bg-neutral-50 transition-colors text-sm">
                                                    <span className="col-span-1 font-mono font-bold text-ink/40">{i + 1}</span>
                                                    <span className="col-span-3 font-mono font-bold text-ink">{std.nis}</span>
                                                    <span className="col-span-5 font-serif font-bold text-ink">{std.full_name}</span>
                                                    <span className="col-span-3 font-mono text-[10px] font-bold text-ink/60 uppercase">{std.className}</span>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="py-12 text-center border-2 border-dashed border-ink/20">
                                            <p className="text-ink/30 font-serif italic text-sm">Belum ada siswa di kelas yang diampu.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="border-t-4 border-ink p-4">
                            <button
                                onClick={() => setShowDetail(null)}
                                className="w-full bg-paper border-2 border-ink hover:bg-ink hover:text-paper text-ink font-mono font-bold py-3 transition-all text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#111111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                            >
                                TUTUP
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
