import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Hash, Users, ClipboardList, TrendingUp, X, BookOpen, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
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
    const [showDetail, setShowDetail] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        let userId = localStorage.getItem('userId');
        const userNIP = localStorage.getItem('userNIP');

        try {
            if (!userId && userNIP) {
                const { data: teacher } = await supabase.from('teachers').select('id').eq('nip', userNIP).maybeSingle();
                if (teacher) {
                    userId = teacher.id;
                    localStorage.setItem('userId', userId);
                }
            }

            if (!userId && userName) {
                const { data: teacher } = await supabase.from('teachers').select('id').eq('name', userName).maybeSingle();
                if (teacher) {
                    userId = teacher.id;
                    localStorage.setItem('userId', userId);
                }
            }

            if (userId) {
                let allScheduleClassIds = [];

                const { data: schedById } = await supabase
                    .from('schedules')
                    .select('class_id, class_name, subject_name')
                    .eq('teacher_id', userId);
                if (schedById) allScheduleClassIds.push(...schedById);

                if (userName) {
                    const { data: schedByName } = await supabase
                        .from('schedules')
                        .select('class_id, class_name, subject_name')
                        .eq('teacher_name', userName);
                    if (schedByName) allScheduleClassIds.push(...schedByName);
                }

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

                let studentCount = 0;
                let studentIds = [];
                if (uniqueClassIds.length > 0) {
                    const { data: students, count } = await supabase
                        .from('students')
                        .select('id, full_name, nis, class_id', { count: 'exact' })
                        .in('class_id', uniqueClassIds);
                    studentCount = count || 0;
                    studentIds = students?.map(s => s.id) || [];

                    const studentsWithClass = (students || []).map(s => ({
                        ...s,
                        className: classMap[s.class_id]?.name || '-'
                    }));
                    setStudentDetails(studentsWithClass);
                }

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

    if (isLoading) return (
        <div className="flex items-center gap-2 text-xs font-black text-black/40 uppercase tracking-widest">
            <div className="w-4 h-4 border-2 border-black border-t-neo-accent animate-spin"></div>
            Memuat Dashboard...
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Kelas Diampu" value={stats.classesTaught?.toString() || "0"} icon={Hash} color="blue" onClick={() => setShowDetail('classes')} />
                <StatCard title="Jumlah Siswa" value={stats.totalStudents?.toString() || "0"} icon={Users} color="emerald" onClick={() => setShowDetail('students')} />
                <StatCard title="Tugas Diterbitkan" value={stats.pendingTasks?.toString() || "0"} icon={ClipboardList} color="purple" to="/teacher/assignments" />
                <StatCard title="Kehadiran Hari Ini" value={stats.attendance} icon={TrendingUp} color="amber" />
            </div>

            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-black">
                    <div>
                        <h3 className="text-lg font-black text-black uppercase tracking-tight">Tindakan Diperlukan</h3>
                        <p className="text-[10px] font-black text-black/40 mt-0.5 uppercase tracking-widest">Tugas Utama Pengajar Hari Ini</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] transition-all duration-200 p-5 bg-neo-cream group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="border-4 border-black p-2.5 bg-neo-muted shadow-[2px_2px_0px_0px_#000]">
                                <Clock size={20} strokeWidth={3} />
                            </div>
                            <span className="px-2 py-0.5 bg-neo-secondary border-2 border-black text-[9px] font-black uppercase">Penting</span>
                        </div>
                        <h4 className="text-base font-black text-black uppercase mb-2">Catat Kehadiran Harian</h4>
                        <p className="text-xs font-bold text-black/50 mb-4 leading-relaxed">Pastikan seluruh siswa tercatat status kehadirannya dalam sistem.</p>
                        <Link to="/teacher/attendance" className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-black border-b-2 border-black hover:border-neo-accent hover:text-neo-accent transition-colors">
                            Buka Absensi <ArrowRight size={12} strokeWidth={3} />
                        </Link>
                    </div>

                    <div className="border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] transition-all duration-200 p-5 bg-neo-cream group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="border-4 border-black p-2.5 bg-neo-secondary shadow-[2px_2px_0px_0px_#000]">
                                <CheckCircle2 size={20} strokeWidth={3} />
                            </div>
                            <span className="px-2 py-0.5 bg-neo-muted border-2 border-black text-[9px] font-black uppercase">Update</span>
                        </div>
                        <h4 className="text-base font-black text-black uppercase mb-2">Nilai Tugas & Ujian</h4>
                        <p className="text-xs font-bold text-black/50 mb-4 leading-relaxed">Tinjau hasil pekerjaan siswa dan berikan penilaian langsung.</p>
                        <Link to="/teacher/assignments" className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-black border-b-2 border-black hover:border-neo-accent hover:text-neo-accent transition-colors">
                            Buka Evaluasi <ArrowRight size={12} strokeWidth={3} />
                        </Link>
                    </div>
                </div>
            </div>

            {showDetail && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200">
                    <div className="bg-neo-cream border-4 border-black shadow-[12px_12px_0px_0px_#000] w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col animate-bounce-in">
                        <div className="px-6 py-4 flex justify-between items-center border-b-4 border-black bg-neo-secondary">
                            <div>
                                <h3 className="text-lg font-black text-black uppercase tracking-tight">
                                    {showDetail === 'classes' ? 'Daftar Kelas Diampu' : 'Daftar Siswa Aktif'}
                                </h3>
                                <p className="text-[10px] font-black text-black/50 mt-0.5 uppercase tracking-widest">
                                    {showDetail === 'classes' ? `${classDetails.length} Kelas` : `${studentDetails.length} Siswa`}
                                </p>
                            </div>
                            <button onClick={() => setShowDetail(null)} className="border-4 border-black p-1.5 bg-white hover:bg-neo-accent shadow-[3px_3px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100">
                                <X size={16} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto">
                            {showDetail === 'classes' ? (
                                <div className="space-y-3">
                                    {classDetails.length > 0 ? classDetails.map((cls, i) => (
                                        <div key={cls.id} className="border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-base font-black text-black uppercase">{cls.name}</h4>
                                                <span className="bg-neo-secondary border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase">#{i + 1}</span>
                                            </div>
                                            {cls.subjects.length > 0 && (
                                                <div className="pt-3 border-t-2 border-black/10">
                                                    <div className="flex flex-wrap gap-2">
                                                        {cls.subjects.map(subj => (
                                                            <span key={subj} className="px-2 py-1 border-2 border-black bg-neo-cream text-[10px] font-black uppercase">{subj}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )) : <p className="text-center font-black text-black/30 uppercase py-12">Belum ada kelas diampu.</p>}
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-neo-cream text-[9px] uppercase font-black text-black/50 tracking-widest border-b-4 border-black">
                                        <tr>
                                            <th className="p-3">#</th><th className="p-3">NIS</th>
                                            <th className="p-3">Nama</th><th className="p-3">Kelas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentDetails.map((std, i) => (
                                            <tr key={std.id} className="border-b-2 border-black/10 hover:bg-neo-muted/20">
                                                <td className="p-3 font-black text-black/30">{i+1}</td>
                                                <td className="p-3 font-black text-neo-accent">{std.nis}</td>
                                                <td className="p-3 font-black text-black">{std.full_name}</td>
                                                <td className="p-3"><span className="border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase bg-neo-cream">{std.className}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t-4 border-black bg-neo-cream flex justify-end">
                            <button onClick={() => setShowDetail(null)} className="px-6 py-3 bg-black text-white font-black text-xs uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_#FF6B6B] hover:bg-neo-accent hover:text-black active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
