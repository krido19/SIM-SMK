import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Award,
    BookOpen,
    TrendingUp,
    Download,
    Printer,
    ChevronRight,
    Target,
    Calendar
} from 'lucide-react';

// Generate daftar tahun ajaran dari 2020/2021 sampai tahun depan
function generateAcademicYears() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= 2020; y--) {
        years.push(`${y}/${y + 1}`);
    }
    return years;
}

export default function StudentGrades() {
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    const canPrint = userRole === 'admin' || userRole === 'guru';

    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [average, setAverage] = useState(0);
    const [passedCount, setPassedCount] = useState(0);
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [selectedYear, setSelectedYear] = useState('');
    const [availableYears, setAvailableYears] = useState([]);

    // Load daftar tahun ajaran yang punya data untuk siswa ini
    useEffect(() => {
        if (userId) {
            loadAvailableYears();
        }
    }, [userId]);

    useEffect(() => {
        if (userId && selectedYear) {
            fetchGrades();
        }
    }, [userId, selectedSemester, selectedYear]);

    const loadAvailableYears = async () => {
        // Ambil semua tahun ajaran unik dari data nilai siswa ini
        const { data } = await supabase
            .from('grades')
            .select('academic_year')
            .eq('student_id', userId);

        let years = [];
        if (data && data.length > 0) {
            const unique = [...new Set(data.map(g => g.academic_year).filter(Boolean))];
            // Urutkan dari terbaru ke terlama
            years = unique.sort((a, b) => b.localeCompare(a));
        }

        // Jika tidak ada data, fallback ke tahun ajaran saat ini dari settings
        if (years.length === 0) {
            const { data: setting } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'current_academic_year')
                .maybeSingle();
            const currentYear = setting?.value || '2023/2024';
            years = [currentYear];
        }

        setAvailableYears(years);
        setSelectedYear(years[0]); // Default ke tahun terbaru
    };

    const fetchGrades = async () => {
        setLoading(true);
        try {
            let query = supabase
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

            // Filter tahun ajaran jika tersedia
            if (selectedYear) {
                query = query.eq('academic_year', selectedYear);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                const processed = data.map(g => ({
                    id: g.id,
                    name: g.subjects?.name || 'Unknown Subject',
                    kkm: g.subjects?.kkm || 75,
                    penilaian_harian: g.penilaian_harian,
                    tugas: g.tugas,
                    uts: g.uts,
                    uas: g.uas,
                    final: g.score,
                    status: g.score >= (g.subjects?.kkm || 75) ? 'Lulus' : 'Remedial'
                }));
                setGrades(processed);

                // Stats
                if (processed.length > 0) {
                    const total = processed.reduce((acc, curr) => acc + (curr.final || 0), 0);
                    setAverage((total / processed.length).toFixed(1));
                    setPassedCount(processed.filter(p => p.status === 'Lulus').length);
                } else {
                    setAverage(0);
                    setPassedCount(0);
                }
            }
        } catch (err) {
            console.error('Error fetching grades:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="py-24 text-center">
                 <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest">Memuat data nilai...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="space-y-6 flex-1">
                    <div>
                         <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Akademik
                            </span>
                        </div>
                        <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight leading-none mb-2">Rapor Nilai</h1>
                        <p className="font-sans text-sm font-medium text-gray-500">Hasil evaluasi pembelajaran siswa</p>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center gap-4 mt-6">
                        {/* Pilih Tahun Ajaran */}
                        <div className="relative min-w-[160px]">
                            <span className="absolute -top-2.5 left-3 bg-gray-50 px-1 text-[10px] font-sans font-black uppercase tracking-widest text-blue-600 z-10 w-max">Tahun Ajaran</span>
                            <div className="relative">
                                <select
                                    className="w-full bg-gray-50 border border-transparent px-4 py-3 pr-8 rounded-xl text-sm font-sans font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer tracking-tight"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                >
                                    {availableYears.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                    {generateAcademicYears()
                                        .filter(y => !availableYears.includes(y))
                                        .map(y => (
                                            <option key={y} value={y}>{y} (kosong)</option>
                                        ))
                                    }
                                </select>
                                <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* Pilih Semester */}
                         <div className="relative min-w-[200px]">
                            <span className="absolute -top-2.5 left-3 bg-gray-50 px-1 text-[10px] font-sans font-black uppercase tracking-widest text-blue-600 z-10">Semester</span>
                            <div className="relative">
                                <select
                                    className="w-full bg-gray-50 border border-transparent px-4 py-3 pr-8 rounded-xl text-sm font-sans font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer tracking-tight"
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                                >
                                    <option value={1}>Semester I (Ganjil)</option>
                                    <option value={2}>Semester II (Genap)</option>
                                </select>
                                <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>
                </div>
                {canPrint && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <button className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 px-5 py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all w-full sm:w-auto">
                            <Download size={16} strokeWidth={2.5} />
                            <span>PDF</span>
                        </button>
                        <button className="flex items-center justify-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 w-full sm:w-auto">
                            <Printer size={16} strokeWidth={2.5} />
                            <span>Cetak Rapor</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-lg shadow-blue-600/20 relative overflow-hidden group hover:-translate-y-1 transition-all">
                    <div className="relative z-10">
                        <p className="text-blue-100 font-sans text-xs font-bold uppercase tracking-widest">Rata-Rata Nilai</p>
                        <h2 className="text-6xl font-sans font-black mt-2 tracking-tight">{average}</h2>
                        <div className="mt-6 flex items-center font-sans text-[10px] font-bold bg-white/10 rounded-xl w-fit px-4 py-2 uppercase tracking-widest">
                            <TrendingUp size={14} className="mr-2" strokeWidth={2.5} />
                            Performa Keseluruhan
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-white/5 transition-transform group-hover:scale-110 duration-500">
                        <svg width="180" height="180" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col justify-between group hover:-translate-y-1 hover:shadow-md transition-all">
                    <div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                            <Target size={24} strokeWidth={2.5} />
                        </div>
                        <p className="text-gray-400 font-sans text-xs font-bold uppercase tracking-widest mb-1">Mapel Tuntas</p>
                        <h2 className="text-4xl font-sans font-black text-gray-900 tracking-tight">{passedCount}<span className="text-2xl text-gray-300 ml-1">/ {grades.length}</span></h2>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 mt-8 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: grades.length > 0 ? `${(passedCount / grades.length) * 100}%` : '0%' }}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col justify-between group hover:-translate-y-1 hover:shadow-md transition-all">
                    <div>
                         <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                            <Award size={24} strokeWidth={2.5} />
                        </div>
                        <p className="text-gray-400 font-sans text-xs font-bold uppercase tracking-widest mb-1">Status Akademik</p>
                        <h2 className="text-3xl font-sans font-black text-gray-900 tracking-tight leading-none mt-2">
                            {average >= 90 ? 'Sangat Baik' :
                                average >= 80 ? 'Baik' :
                                    average >= 75 ? 'Cukup' : 'Perlu Perbaikan'}
                        </h2>
                    </div>
                    <div>
                        <p className="font-sans text-[10px] font-bold text-gray-400 mt-6 uppercase tracking-widest bg-gray-50 rounded-xl px-4 py-2 w-max text-center">
                            {selectedYear} • Smt {selectedSemester}
                        </p>
                    </div>
                </div>
            </div>

            {/* Grades Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 font-sans text-[10px] uppercase tracking-widest border-b border-gray-100">
                                <th className="px-6 py-5 font-bold">Mata Pelajaran</th>
                                <th className="px-6 py-5 text-center font-bold">KKM</th>
                                <th className="px-6 py-5 text-center font-bold">PENILAIAN HARIAN</th>
                                <th className="px-6 py-5 text-center font-bold">TUGAS</th>
                                <th className="px-6 py-5 text-center font-bold">ASTS</th>
                                <th className="px-6 py-5 text-center font-bold">ASAS</th>
                                <th className="px-6 py-5 text-center bg-blue-50/50 text-blue-800 font-black">NILAI AKHIR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {grades.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-24 text-center bg-gray-50/50">
                                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                                                <Calendar size={32} className="text-gray-300" strokeWidth={2} />
                                            </div>
                                            <p className="text-gray-900 font-sans font-black text-xl tracking-tight mb-2">
                                                Belum ada nilai
                                            </p>
                                            <p className="text-gray-500 font-sans text-sm">
                                                Nilai untuk tahun ajaran {selectedYear} semester {selectedSemester} belum tersedia.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                grades.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-white group-hover:text-blue-600 transition-colors border border-gray-100 group-hover:shadow-sm">
                                                    <BookOpen size={18} strokeWidth={2.5} />
                                                </div>
                                                <span className="font-sans font-black text-base text-gray-900 tracking-tight">{sub.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="font-sans text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">{sub.kkm}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center font-sans font-black text-gray-700">{sub.penilaian_harian ?? '-'}</td>
                                        <td className="px-6 py-5 text-center font-sans font-black text-gray-700">{sub.tugas ?? '-'}</td>
                                        <td className="px-6 py-5 text-center font-sans font-black text-gray-700">{sub.uts ?? '-'}</td>
                                        <td className="px-6 py-5 text-center font-sans font-black text-gray-700">{sub.uas ?? '-'}</td>
                                        <td className="px-6 py-5 text-center bg-blue-50/20 group-hover:bg-blue-50/50 transition-colors">
                                            <span className={`font-sans text-2xl tracking-tight font-black ${sub.final < sub.kkm ? 'text-rose-600' : 'text-gray-900'}`}>
                                                {sub.final}
                                            </span>
                                            {sub.final < sub.kkm && (
                                                <p className="text-[10px] font-sans font-black text-rose-500 uppercase tracking-widest mt-1">Belum Tuntas</p>
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
