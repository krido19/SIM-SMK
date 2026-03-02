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
        return <div className="p-8 text-center font-mono text-[10px] uppercase tracking-widest bg-paper border-2 border-ink shadow-[4px_4px_0px_0px_#111111] animate-pulse font-bold text-ink">Memuat data nilai...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-ink pb-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-ink uppercase tracking-tighter leading-none mb-1">Rapor Nilai</h1>
                    <div className="flex items-center space-x-4 mt-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">Tahun Ajaran 2023/2024</p>
                        <div className="border-2 border-ink p-1 bg-white relative">
                            <span className="absolute -top-2 left-2 bg-paper px-1 text-[8px] font-mono font-bold uppercase tracking-widest text-ink">Semester</span>
                            <select
                                className="appearance-none bg-transparent px-2 text-xs font-bold font-mono uppercase tracking-widest text-ink focus:outline-none cursor-pointer"
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                            >
                                <option value={1}>SEMESTER I (Ganjil)</option>
                                <option value={2}>SEMESTER II (Genap)</option>
                            </select>
                        </div>
                    </div>
                </div>
                {canPrint && (
                    <div className="flex space-x-3">
                        <button className="flex items-center space-x-2 border-2 border-ink bg-white hover:bg-ink hover:text-paper px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]">
                            <Download size={14} strokeWidth={2} />
                            <span>PDF</span>
                        </button>
                        <button className="flex items-center space-x-2 border-2 border-ink bg-newsprint-red text-white hover:bg-ink hover:text-paper px-6 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]">
                            <Printer size={14} strokeWidth={2} />
                            <span>Cetak Rapor</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-2 border-ink bg-ink p-6 text-paper shadow-[4px_4px_0px_0px_rgba(204,0,0,1)] relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-paper/60 font-mono text-[10px] font-black uppercase tracking-widest">Rata-Rata Nilai</p>
                        <h2 className="text-6xl font-serif font-black mt-2 tracking-tighter">{average}</h2>
                        <div className="mt-6 flex items-center font-mono text-[10px] font-bold border border-paper/20 w-fit px-3 py-1 uppercase tracking-widest">
                            <TrendingUp size={12} className="mr-2" />
                            Performa Keseluruhan
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-paper/5 transition-transform group-hover:scale-110 duration-500">
                        <svg width="180" height="180" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                    </div>
                </div>

                <div className="border-2 border-ink bg-white p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex flex-col justify-between newsprint-texture">
                    <div>
                        <p className="text-ink/60 font-mono text-[10px] font-black uppercase tracking-widest">Mapel Tuntas</p>
                        <h2 className="text-5xl font-mono font-black text-ink mt-2 tracking-tighter">{passedCount}<span className="text-2xl text-ink/40">/{grades.length}</span></h2>
                    </div>
                    <div className="w-full border-2 border-ink h-4 mt-6 p-0.5 bg-paper">
                        <div
                            className="bg-ink h-full transition-all duration-1000 ease-out"
                            style={{ width: grades.length > 0 ? `${(passedCount / grades.length) * 100}%` : '0%' }}
                        />
                    </div>
                </div>

                <div className="border-2 border-ink bg-paper p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex flex-col justify-between">
                    <div>
                        <p className="text-ink/60 font-mono text-[10px] font-black uppercase tracking-widest">Status Akademik</p>
                        <h2 className="text-4xl font-serif font-black text-ink mt-4 uppercase leading-none">
                            {average >= 90 ? 'Sangat Baik' :
                                average >= 80 ? 'Baik' :
                                    average >= 75 ? 'Cukup' : 'Perlu Perbaikan'}
                        </h2>
                    </div>
                    <p className="font-mono text-[9px] font-bold mt-6 uppercase tracking-[0.2em] border-t-2 border-ink pt-2">Berdasarkan nilai keseluruhan</p>
                </div>
            </div>

            {/* Grades Table */}
            <div className="border-2 border-ink bg-white shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-ink text-paper font-mono text-[10px] uppercase tracking-widest border-b-2 border-ink">
                                <th className="p-4 border-r border-paper/20">Mata Pelajaran</th>
                                <th className="p-4 border-r border-paper/20 text-center">KKM</th>
                                <th className="p-4 border-r border-paper/20 text-center">Tugas</th>
                                <th className="p-4 border-r border-paper/20 text-center">UTS</th>
                                <th className="p-4 border-r border-paper/20 text-center">UAS</th>
                                <th className="p-4 text-center bg-paper text-ink border-l border-ink">Nilai Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-ink">
                            {grades.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-ink/60 font-serif italic text-lg">
                                        Belum ada data nilai untuk semester ini.
                                    </td>
                                </tr>
                            ) : (
                                grades.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="p-4 border-r border-ink">
                                            <div className="flex items-center space-x-4">
                                                <div className="p-2 border-2 border-ink bg-white">
                                                    <BookOpen size={16} strokeWidth={2} />
                                                </div>
                                                <span className="font-serif font-black text-lg text-ink leading-tight">{sub.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 border-r border-ink text-center">
                                            <span className="font-mono text-sm text-ink/60">{sub.kkm}</span>
                                        </td>
                                        <td className="p-4 border-r border-ink text-center font-mono font-bold text-lg">{sub.tugas}</td>
                                        <td className="p-4 border-r border-ink text-center font-mono font-bold text-lg">{sub.uts}</td>
                                        <td className="p-4 border-r border-ink text-center font-mono font-bold text-lg">{sub.uas}</td>
                                        <td className="p-4 text-center bg-neutral-100">
                                            <span className={`font-mono text-3xl font-black ${sub.final < sub.kkm ? 'text-newsprint-red' : 'text-ink'}`}>
                                                {sub.final}
                                            </span>
                                            {sub.final < sub.kkm && (
                                                <p className="text-[8px] font-mono font-black text-newsprint-red uppercase tracking-widest mt-1">BELUM TUNTAS</p>
                                            )}
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
