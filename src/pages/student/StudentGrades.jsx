import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Award,
    BookOpen,
    TrendingUp,
    Download,
    Printer,
    ChevronRight,
    Target
} from 'lucide-react';

export default function StudentGrades() {
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    const canPrint = userRole === 'admin' || userRole === 'guru';

    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [average, setAverage] = useState(0);
    const [passedCount, setPassedCount] = useState(0);
    const [selectedSemester, setSelectedSemester] = useState(1);

    useEffect(() => {
        if (userId) {
            fetchGrades();
        }
    }, [userId, selectedSemester]);

    const fetchGrades = async () => {
        try {
            // Get all subjects first to ensure we show even those without grades (optional, but good)
            // Or just get grades joined with subjects.
            // Let's get grades with subjects.
            const { data, error } = await supabase
                .from('grades')
                .select(`
                    *,
                    subjects (
                        name,
                        kkm
                    )
                `)
                .eq('student_id', userId)
                .eq('semester', selectedSemester);

            if (error) throw error;

            console.log('Fetched grades:', data);

            if (data) {
                const processed = data.map(g => ({
                    id: g.id,
                    name: g.subjects?.name || 'Unknown Subject',
                    kkm: g.subjects?.kkm || 75,
                    tugas: g.tugas,
                    uts: g.uts,
                    uas: g.uas,
                    final: g.score,
                    status: g.score >= (g.subjects?.kkm || 75) ? 'Lulus' : 'Remedial'
                }));
                setGrades(processed);

                // Stats
                if (processed.length > 0) {
                    const total = processed.reduce((acc, curr) => acc + curr.final, 0);
                    setAverage((total / processed.length).toFixed(1));
                    setPassedCount(processed.filter(p => p.status === 'Lulus').length);
                }
            }
        } catch (err) {
            console.error('Error fetching grades:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading data nilai...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight transition-all">Rapor Digital</h1>
                    <div className="flex items-center space-x-2 mt-1">
                        <p className="text-gray-500 font-medium">Tahun Akademik 2023/2024</p>
                        <span className="text-gray-300">•</span>
                        <select
                            className="bg-transparent text-blue-600 font-bold outline-none cursor-pointer hover:text-blue-700 transition-colors"
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                        >
                            <option value={1}>Semester Ganjil</option>
                            <option value={2}>Semester Genap</option>
                        </select>
                    </div>
                </div>
                {canPrint && (
                    <div className="flex space-x-3">
                        <button className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-2xl font-bold border border-gray-100 shadow-sm transition-all active:scale-95">
                            <Download size={18} className="text-blue-500" />
                            <span>PDF</span>
                        </button>
                        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">
                            <Printer size={18} />
                            <span>Cetak Rapor</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-indigo-100 text-xs font-black uppercase tracking-widest opacity-80">Rata-rata Semester</p>
                        <h2 className="text-5xl font-black mt-2">{average}</h2>
                        <div className="mt-4 flex items-center text-xs font-bold bg-white/20 backdrop-blur-md w-fit px-3 py-1.5 rounded-full border border-white/30">
                            <TrendingUp size={12} className="mr-1" />
                            Nilai Akademik
                        </div>
                    </div>
                    <Award className="absolute -right-4 -bottom-4 text-white/10" size={140} />
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Matapel Tuntas</p>
                        <h2 className="text-3xl font-black text-gray-900 mt-2">{passedCount} / {grades.length}</h2>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full rounded-full shadow-lg shadow-emerald-100"
                            style={{ width: grades.length > 0 ? `${(passedCount / grades.length) * 100}%` : '0%' }}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Predikat Umum</p>
                        <h2 className="text-3xl font-black text-blue-600 mt-2 tracking-tight">
                            {average >= 90 ? 'Sangat Baik (A)' :
                                average >= 80 ? 'Baik (B)' :
                                    average >= 75 ? 'Cukup (C)' : 'Kurang (D)'}
                        </h2>
                    </div>
                    <p className="text-gray-400 text-[10px] font-bold mt-4 uppercase tracking-[0.2em]">Berdasarkan Rata-rata</p>
                </div>
            </div>

            {/* Grades Table */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Mata Pelajaran</th>
                                <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">KKM</th>
                                <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Tugas</th>
                                <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">UTS</th>
                                <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">UAS</th>
                                <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50/50">Nilai Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {grades.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-10 text-center text-gray-500 font-bold">
                                        Belum ada data nilai yang tersedia.
                                    </td>
                                </tr>
                            ) : (
                                grades.map((sub) => (
                                    <tr key={sub.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-3 rounded-2xl bg-gray-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100`}>
                                                    <BookOpen size={20} className="text-blue-500" />
                                                </div>
                                                <span className="text-sm font-black text-gray-900 leading-tight">{sub.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className="text-sm font-bold text-gray-400">{sub.kkm}</span>
                                        </td>
                                        <td className="px-6 py-6 text-center text-sm font-bold text-gray-600">{sub.tugas}</td>
                                        <td className="px-6 py-6 text-center text-sm font-bold text-gray-600">{sub.uts}</td>
                                        <td className="px-6 py-6 text-center text-sm font-bold text-gray-600">{sub.uas}</td>
                                        <td className="px-8 py-6 text-center bg-blue-50/20">
                                            <span className={`text-xl font-black ${sub.final < sub.kkm ? 'text-red-600' : 'text-blue-600'}`}>
                                                {sub.final}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
