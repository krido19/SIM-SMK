import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Hash, Users, ClipboardList, TrendingUp, ChevronRight, AlertCircle, X, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
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
        <div className="flex items-center gap-2 font-sans text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
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

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <AlertCircle size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-sans font-black text-gray-900 leading-none">Tindakan Diperlukan</h3>
                            <p className="text-xs font-sans font-medium text-gray-400 mt-1 uppercase tracking-widest">Tugas Utama Pengajar Hari Ini</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:bg-white hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                                <Clock size={24} />
                            </div>
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">Penting</span>
                        </div>
                        <h4 className="text-lg font-sans font-black text-gray-900 mb-2">Catat Kehadiran Harian</h4>
                        <p className="text-sm font-sans font-medium text-gray-500 mb-6 leading-relaxed">Pastikan seluruh siswa di kelas Anda hari ini telah tercatat status kehadirannya dalam sistem.</p>
                        <Link to="/teacher/attendance" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">
                            Buka Panel Absensi <ChevronRight size={14} />
                        </Link>
                    </div>

                    <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 hover:border-emerald-200 hover:bg-white hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                                <CheckCircle2 size={24} />
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Update</span>
                        </div>
                        <h4 className="text-lg font-sans font-black text-gray-900 mb-2">Nilai Tugas & Ujian</h4>
                        <p className="text-sm font-sans font-medium text-gray-500 mb-6 leading-relaxed">Tinjau hasil pekerjaan siswa dan berikan penilaian langsung dari dashboard evaluasi akademik.</p>
                        <Link to="/teacher/assignments" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:underline">
                            Buka Evaluasi Nilai <ChevronRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetail && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
                        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50 bg-gray-50/30">
                            <div>
                                <h3 className="text-xl font-sans font-black text-gray-900">
                                    {showDetail === 'classes' ? 'Daftar Kelas Diampu' : 'Daftar Siswa Aktif'}
                                </h3>
                                <p className="text-xs font-sans font-medium text-gray-400 mt-1 uppercase tracking-widest leading-none">
                                    {showDetail === 'classes' ? `${classDetails.length} Kelas` : `${studentDetails.length} Siswa Terdaftar`}
                                </p>
                            </div>
                            <button onClick={() => setShowDetail(null)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {showDetail === 'classes' ? (
                                <div className="space-y-4 p-2">
                                    {classDetails.length > 0 ? classDetails.map((cls, i) => (
                                        <div key={cls.id} className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-100 hover:shadow-sm transition-all group">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-sans font-black text-gray-900">{cls.name}</h4>
                                                <span className="bg-blue-50 text-blue-600 px-3 py-1 text-[10px] font-bold rounded-full uppercase">
                                                    Kelas #{i + 1}
                                                </span>
                                            </div>
                                            {cls.subjects.length > 0 && (
                                                <div className="pt-4 border-t border-gray-50">
                                                    <p className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mb-3">Mata Pelajaran Diampu:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {cls.subjects.map(subj => (
                                                            <span key={subj} className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-sans font-bold text-gray-700 flex items-center shadow-sm">
                                                                <BookOpen size={12} className="mr-2 text-blue-600" />
                                                                {subj}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                            <p className="text-gray-400 font-medium italic">Belum ada kelas yang diampu.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-2">
                                    {studentDetails.length > 0 ? (
                                        <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 text-[10px] uppercase font-sans font-bold text-gray-400 tracking-widest border-b border-gray-100">
                                                    <tr>
                                                        <th className="p-4 w-12 text-center">#</th>
                                                        <th className="p-4">NIS</th>
                                                        <th className="p-4">Nama Siswa</th>
                                                        <th className="p-4">Kelas</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {studentDetails.map((std, i) => (
                                                        <tr key={std.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                                                            <td className="p-4 text-center font-bold text-gray-300">{i + 1}</td>
                                                            <td className="p-4 font-bold text-blue-600">{std.nis}</td>
                                                            <td className="p-4 font-bold text-gray-800">{std.full_name}</td>
                                                            <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-500 uppercase">{std.className}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                            <p className="text-gray-400 font-medium italic">Belum ada siswa di kelas Anda.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowDetail(null)}
                                className="px-8 py-3 bg-blue-600 text-white font-sans font-bold rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
                            >
                                Tutup Panel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
