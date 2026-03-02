import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, UserCircle, BookOpen, TrendingUp, X, Filter } from 'lucide-react';
import StatCard from './StatCard';
import AnalyticsChart from './AnalyticsChart';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalSubjects: 0,
        avgGrade: 84.2
    });

    // Store full lists for modal
    const [studentsList, setStudentsList] = useState([]);
    const [teachersList, setTeachersList] = useState([]);
    const [subjectsList, setSubjectsList] = useState([]);
    const [gradesList, setGradesList] = useState([]);

    const [attendanceData, setAttendanceData] = useState([0, 0, 0, 0, 0, 0]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetail, setShowDetail] = useState(null); // 'students' | 'teachers' | 'subjects' | 'grades' | null

    useEffect(() => {
        fetchData();
        fetchAttendanceData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch basic lists and counts
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

            // Calculate exact average grade if grades exist
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

    if (isLoading) return <div className="animate-pulse font-mono text-[10px] uppercase">Memuat Statistik...</div>;

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <button onClick={() => setShowDetail('students')} className="text-left w-full h-full block">
                    <StatCard title="Total Siswa" value={stats.totalStudents.toLocaleString()} icon={Users} trend="+12%" />
                </button>
                <button onClick={() => setShowDetail('teachers')} className="text-left w-full h-full block">
                    <StatCard title="Guru Aktif" value={stats.totalTeachers.toString()} icon={UserCircle} />
                </button>
                <button onClick={() => setShowDetail('subjects')} className="text-left w-full h-full block">
                    <StatCard title="Mata Pelajaran" value={stats.totalSubjects.toString()} icon={BookOpen} />
                </button>
                <button onClick={() => setShowDetail('grades')} className="text-left w-full h-full block">
                    <StatCard title="Rata-Rata Nilai" value={stats.avgGrade.toString()} icon={TrendingUp} trend="+2.4%" />
                </button>
            </div>

            <AnalyticsChart
                title="Kehadiran Seluruh Sistem"
                subtitle="Persentase kehadiran harian aktif dari semua kelas"
                data={attendanceData}
                labels={['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']}
            />

            {/* Detail Modal */}
            {showDetail && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-paper border-4 border-ink shadow-[16px_16px_0px_0px_#111111] w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">

                        {/* Header */}
                        <div className="bg-ink text-paper px-6 py-4 flex justify-between items-center shrink-0">
                            <h3 className="font-mono font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                {showDetail === 'students' && <><Users size={16} /> DAFTAR SELURUH SISWA</>}
                                {showDetail === 'teachers' && <><UserCircle size={16} /> DAFTAR GURU AKTIF</>}
                                {showDetail === 'subjects' && <><BookOpen size={16} /> DATA MATA PELAJARAN</>}
                                {showDetail === 'grades' && <><TrendingUp size={16} /> REKAPITULASI NILAI TERBARU</>}
                            </h3>
                            <button onClick={() => setShowDetail(null)} className="p-1 hover:bg-paper/10 transition-colors">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-0 overflow-y-auto flex-1 bg-white">

                            {/* STUDENTS */}
                            {showDetail === 'students' && (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-neutral-100 font-mono text-[10px] uppercase tracking-widest text-ink/60 sticky top-0 z-10 border-b-2 border-ink">
                                        <tr>
                                            <th className="p-4 w-16 border-r border-ink/10">No</th>
                                            <th className="p-4 border-r border-ink/10">NIS</th>
                                            <th className="p-4 border-r border-ink/10">Nama Siswa</th>
                                            <th className="p-4 border-r border-ink/10">Kelas</th>
                                            <th className="p-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-body text-sm">
                                        {studentsList.length > 0 ? studentsList.map((s, i) => (
                                            <tr key={s.id} className="border-b border-ink/10 hover:bg-neutral-50 transition-colors">
                                                <td className="p-4 font-mono font-bold text-ink/40 border-r border-ink/10">{i + 1}</td>
                                                <td className="p-4 font-mono text-ink border-r border-ink/10">{s.nis}</td>
                                                <td className="p-4 font-serif font-bold text-ink border-r border-ink/10">{s.full_name}</td>
                                                <td className="p-4 font-mono text-xs border-r border-ink/10 uppercase">{s.classes?.name || '-'}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-mono font-bold uppercase tracking-widest">Aktif</span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" className="p-8 text-center font-serif italic text-ink/40">Belum ada data siswa.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {/* TEACHERS */}
                            {showDetail === 'teachers' && (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-neutral-100 font-mono text-[10px] uppercase tracking-widest text-ink/60 sticky top-0 z-10 border-b-2 border-ink">
                                        <tr>
                                            <th className="p-4 w-16 border-r border-ink/10">No</th>
                                            <th className="p-4 border-r border-ink/10">NIP</th>
                                            <th className="p-4 border-r border-ink/10">Nama Guru</th>
                                            <th className="p-4 border-r border-ink/10">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-body text-sm">
                                        {teachersList.length > 0 ? teachersList.map((t, i) => (
                                            <tr key={t.id} className="border-b border-ink/10 hover:bg-neutral-50 transition-colors">
                                                <td className="p-4 font-mono font-bold text-ink/40 border-r border-ink/10">{i + 1}</td>
                                                <td className="p-4 font-mono text-ink border-r border-ink/10">{t.nip}</td>
                                                <td className="p-4 font-serif font-bold text-ink border-r border-ink/10">{t.name}</td>
                                                <td className="p-4 font-mono text-xs border-r border-ink/10">{t.email || '-'}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className="p-8 text-center font-serif italic text-ink/40">Belum ada data guru.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {/* SUBJECTS */}
                            {showDetail === 'subjects' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-paper">
                                    {subjectsList.length > 0 ? subjectsList.map((sub, i) => (
                                        <div key={sub.id} className="border-2 border-ink p-4 shadow-[4px_4px_0px_0px_#111111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white">
                                            <div className="flex items-start justify-between mb-2">
                                                <BookOpen size={16} className="text-ink" strokeWidth={2} />
                                                <span className="font-mono text-[10px] font-bold text-ink/40">KODE: SUB-{i + 1}</span>
                                            </div>
                                            <h4 className="font-serif font-black text-lg uppercase tracking-tight text-ink mt-2 mb-2 line-clamp-1" title={sub.name}>{sub.name}</h4>
                                            <div className="pt-3 border-t border-ink/10">
                                                <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                                                    Dimasukkan ke sistem sim-smk
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-full py-12 text-center font-serif italic text-ink/40 border-2 border-dashed border-ink/20">Belum ada data mata pelajaran.</div>
                                    )}
                                </div>
                            )}

                            {/* GRADES */}
                            {showDetail === 'grades' && (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-neutral-100 font-mono text-[10px] uppercase tracking-widest text-ink/60 sticky top-0 z-10 border-b-2 border-ink">
                                        <tr>
                                            <th className="p-4 border-r border-ink/10">Siswa</th>
                                            <th className="p-4 border-r border-ink/10">Mapel</th>
                                            <th className="p-4 border-r border-ink/10 text-center">Semester</th>
                                            <th className="p-4 border-r border-ink/10 text-center">Tugas</th>
                                            <th className="p-4 border-r border-ink/10 text-center">UTS</th>
                                            <th className="p-4 border-r border-ink/10 text-center">UAS</th>
                                            <th className="p-4 text-center">Akhir</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-body text-sm">
                                        {gradesList.length > 0 ? gradesList.map((g, i) => {
                                            const final = Math.round(((g.tugas || 0) * 0.3) + ((g.uts || 0) * 0.3) + ((g.uas || 0) * 0.4));
                                            return (
                                                <tr key={g.id} className="border-b border-ink/10 hover:bg-neutral-50 transition-colors">
                                                    <td className="p-4 border-r border-ink/10">
                                                        <div className="font-serif font-bold text-ink">{g.students?.full_name || '-'}</div>
                                                        <div className="font-mono text-[10px] text-ink/50 uppercase mt-0.5">{g.students?.classes?.name || '-'}</div>
                                                    </td>
                                                    <td className="p-4 font-serif font-bold border-r border-ink/10 uppercase text-xs">{g.subjects?.name || '-'}</td>
                                                    <td className="p-4 font-mono font-bold text-center border-r border-ink/10">{g.semester}</td>
                                                    <td className="p-4 font-mono text-center border-r border-ink/10">{g.tugas || '-'}</td>
                                                    <td className="p-4 font-mono text-center border-r border-ink/10">{g.uts || '-'}</td>
                                                    <td className="p-4 font-mono text-center border-r border-ink/10">{g.uas || '-'}</td>
                                                    <td className="p-4 font-mono font-black text-center text-lg">{final}</td>
                                                </tr>
                                            )
                                        }) : (
                                            <tr><td colSpan="7" className="p-8 text-center font-serif italic text-ink/40">Belum ada data nilai yang masuk.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="border-t-4 border-ink p-4 shrink-0 bg-paper">
                            <button
                                onClick={() => setShowDetail(null)}
                                className="w-full bg-paper border-2 border-ink hover:bg-ink hover:text-paper text-ink font-mono font-bold py-3 transition-all text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#111111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                            >
                                TUTUP PANEL DATA
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
