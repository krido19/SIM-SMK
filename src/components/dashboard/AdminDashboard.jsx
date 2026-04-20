import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, UserCircle, BookOpen, TrendingUp, X, Filter, Search, ChevronRight } from 'lucide-react';
import StatCard from './StatCard';
import AnalyticsChart from './AnalyticsChart';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalSubjects: 0,
        avgGrade: 84.2
    });

    const [studentsList, setStudentsList] = useState([]);
    const [teachersList, setTeachersList] = useState([]);
    const [subjectsList, setSubjectsList] = useState([]);
    const [gradesList, setGradesList] = useState([]);

    const [attendanceData, setAttendanceData] = useState([0, 0, 0, 0, 0, 0]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetail, setShowDetail] = useState(null);

    useEffect(() => {
        fetchData();
        fetchAttendanceData();
    }, []);

    const fetchData = async () => {
        try {
            const [std, tea, sub, grades] = await Promise.all([
                supabase.from('students').select('*, classes(name)'),
                supabase.from('teachers').select('*'),
                supabase.from('subjects').select('*'),
                supabase.from('grades').select('*, students(full_name, classes(name)), subjects(name)')
            ]);

            setStudentsList(std.data || []);
            setTeachersList(tea.data || []);
            setSubjectsList(sub.data || []);
            setGradesList(grades.data || []);

            let exactAvgGrade = 84.2;
            if (grades.data && grades.data.length > 0) {
                let total = 0;
                let count = 0;
                grades.data.forEach(g => {
                    const final = Math.round(((g.tugas || 0) * 0.3) + ((g.uts || 0) * 0.3) + ((g.uas || 0) * 0.4));
                    total += final;
                    count++;
                });
                if (count > 0) exactAvgGrade = (total / count).toFixed(1);
            }

            setStats({
                totalStudents: std.data?.length || 0,
                totalTeachers: tea.data?.length || 0,
                totalSubjects: sub.data?.length || 0,
                avgGrade: exactAvgGrade
            });
        } catch (error) {
            console.error('Error fetching admin dashboard data:', error);
        }
    };

    const fetchAttendanceData = async () => {
        try {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

            const dates = [];
            for (let i = 0; i < 6; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + diffToMonday + i);
                dates.push(date.toISOString().split('T')[0]);
            }

            const { data, error } = await supabase
                .from('attendance')
                .select('status, date')
                .in('date', dates);

            if (error) throw error;

            const weeklyStats = dates.map(date => {
                const dayRecords = data.filter(r => r.date === date);
                if (dayRecords.length === 0) return 0;

                const present = dayRecords.filter(r => r.status === 'Hadir').length;
                return Math.round((present / dayRecords.length) * 100);
            });

            setAttendanceData(weeklyStats);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <div className="flex items-center gap-2 font-sans text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
            Memuat Statistik...
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Siswa" value={stats.totalStudents.toLocaleString()} icon={Users} trend="+12%" color="blue" to="#" onClick={() => setShowDetail('students')} />
                <StatCard title="Guru Aktif" value={stats.totalTeachers.toString()} icon={UserCircle} color="emerald" to="#" onClick={() => setShowDetail('teachers')} />
                <StatCard title="Mata Pelajaran" value={stats.totalSubjects.toString()} icon={BookOpen} color="purple" to="#" onClick={() => setShowDetail('subjects')} />
                <StatCard title="Rata-Rata Nilai" value={stats.avgGrade.toString()} icon={TrendingUp} trend="+2.4%" color="amber" to="#" onClick={() => setShowDetail('grades')} />
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <AnalyticsChart
                    title="Kehadiran Seluruh Sistem"
                    subtitle="Persentase kehadiran harian aktif dari semua kelas"
                    data={attendanceData}
                    labels={['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']}
                />
            </div>

            {/* Detail Modal */}
            {showDetail && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col border border-white/20">

                        {/* Header */}
                        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50 bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-sans font-black text-gray-900 flex items-center gap-3">
                                    {showDetail === 'students' && <><Users className="text-blue-600" /> Daftar Siswa</>}
                                    {showDetail === 'teachers' && <><UserCircle className="text-emerald-600" /> Daftar Guru</>}
                                    {showDetail === 'subjects' && <><BookOpen className="text-purple-600" /> Mata Pelajaran</>}
                                    {showDetail === 'grades' && <><TrendingUp className="text-amber-600" /> Rekap Nilai</>}
                                </h3>
                                <p className="text-xs font-sans font-medium text-gray-400 mt-1 uppercase tracking-widest">
                                    Total {showDetail === 'students' ? studentsList.length : showDetail === 'teachers' ? teachersList.length : showDetail === 'subjects' ? subjectsList.length : gradesList.length} Entri Ditemukan
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowDetail(null)} 
                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="overflow-y-auto flex-1 bg-white custom-scrollbar">

                            {/* STUDENTS TABLE */}
                            {showDetail === 'students' && (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50 text-[10px] uppercase font-sans font-bold text-gray-400 tracking-widest sticky top-0 z-10 border-b border-gray-100">
                                        <tr>
                                            <th className="p-5 w-16">No</th>
                                            <th className="p-5">ID (NIS)</th>
                                            <th className="p-5">Nama Siswa</th>
                                            <th className="p-5">Kelas</th>
                                            <th className="p-5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-sans">
                                        {studentsList.length > 0 ? studentsList.map((s, i) => (
                                            <tr key={s.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                                                <td className="p-5 font-bold text-gray-300">{i + 1}</td>
                                                <td className="p-5 font-bold text-blue-600">{s.nis}</td>
                                                <td className="p-5 font-bold text-gray-800">{s.full_name}</td>
                                                <td className="p-5 text-gray-500 font-medium">{s.classes?.name || '-'}</td>
                                                <td className="p-5">
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-full">Aktif</span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" className="p-12 text-center text-gray-400 font-medium italic">Belum ada data siswa.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {/* TEACHERS TABLE */}
                            {showDetail === 'teachers' && (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50 text-[10px] uppercase font-sans font-bold text-gray-400 tracking-widest sticky top-0 z-10 border-b border-gray-100">
                                        <tr>
                                            <th className="p-5 w-16">No</th>
                                            <th className="p-5">ID (NIP)</th>
                                            <th className="p-5">Nama Guru</th>
                                            <th className="p-5">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-sans">
                                        {teachersList.length > 0 ? teachersList.map((t, i) => (
                                            <tr key={t.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                                                <td className="p-5 font-bold text-gray-300">{i + 1}</td>
                                                <td className="p-5 font-bold text-emerald-600">{t.nip}</td>
                                                <td className="p-5 font-bold text-gray-800">{t.name}</td>
                                                <td className="p-5 text-gray-500 font-medium">{t.email || '-'}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className="p-12 text-center text-gray-400 font-medium italic">Belum ada data guru.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {/* SUBJECTS GRID */}
                            {showDetail === 'subjects' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                                    {subjectsList.length > 0 ? subjectsList.map((sub, i) => (
                                        <div key={sub.id} className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-purple-200 hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                                                    <BookOpen size={18} />
                                                </div>
                                                <span className="text-[10px] font-sans font-bold text-gray-300 uppercase tracking-widest">MAPEL {i + 1}</span>
                                            </div>
                                            <h4 className="text-lg font-sans font-black text-gray-900 tracking-tight group-hover:text-purple-600 transition-colors">{sub.name}</h4>
                                            <p className="text-[11px] font-medium text-gray-400 mt-2 uppercase tracking-wider">Terdaftar di SIM SMK</p>
                                        </div>
                                    )) : (
                                        <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                            <p className="text-gray-400 font-medium italic">Belum ada data mata pelajaran.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* GRADES TABLE */}
                            {showDetail === 'grades' && (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50 text-[10px] uppercase font-sans font-bold text-gray-400 tracking-widest sticky top-0 z-10 border-b border-gray-100">
                                        <tr>
                                            <th className="p-5">Siswa</th>
                                            <th className="p-5">Mata Pelajaran</th>
                                            <th className="p-5 text-center">Smstr</th>
                                            <th className="p-5 text-center">Tgs</th>
                                            <th className="p-5 text-center">UTS</th>
                                            <th className="p-5 text-center">UAS</th>
                                            <th className="p-5 text-center">Nilai Akhir</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-sans">
                                        {gradesList.length > 0 ? gradesList.map((g) => {
                                            const final = Math.round(((g.tugas || 0) * 0.3) + ((g.uts || 0) * 0.3) + ((g.uas || 0) * 0.4));
                                            return (
                                                <tr key={g.id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                                                    <td className="p-5">
                                                        <div className="font-bold text-gray-800">{g.students?.full_name || '-'}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{g.students?.classes?.name || '-'}</div>
                                                    </td>
                                                    <td className="p-5 font-bold text-gray-600 uppercase text-xs">{g.subjects?.name || '-'}</td>
                                                    <td className="p-5 text-center font-bold text-gray-400">{g.semester}</td>
                                                    <td className="p-5 text-center font-medium">{g.tugas || '-'}</td>
                                                    <td className="p-5 text-center font-medium">{g.uts || '-'}</td>
                                                    <td className="p-5 text-center font-medium">{g.uas || '-'}</td>
                                                    <td className="p-5 text-center font-black text-amber-600 text-lg">{final}</td>
                                                </tr>
                                            )
                                        }) : (
                                            <tr><td colSpan="7" className="p-12 text-center text-gray-400 font-medium italic">Belum ada data nilai tercatat.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowDetail(null)}
                                className="px-8 py-3 bg-gray-900 text-white font-sans font-bold rounded-2xl shadow-lg shadow-gray-900/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
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

export default AdminDashboard;
