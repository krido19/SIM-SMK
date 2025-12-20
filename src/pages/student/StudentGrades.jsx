import React from 'react';
import {
    Award,
    BookOpen,
    TrendingUp,
    Download,
    Printer,
    ChevronRight,
    Target
} from 'lucide-react';

const subjectsGrades = [
    { id: 1, name: 'Matematika', kkm: 75, tugas: 85, uts: 80, uas: 88, final: 84, status: 'Lulus' },
    { id: 2, name: 'Bahasa Indonesia', kkm: 75, tugas: 90, uts: 85, uas: 92, final: 89, status: 'Lulus' },
    { id: 3, name: 'Fisika', kkm: 70, tugas: 78, uts: 75, uas: 82, final: 78, status: 'Lulus' },
    { id: 4, name: 'Kimia', kkm: 70, tugas: 65, uts: 70, uas: 68, final: 68, status: 'Remedial' },
    { id: 5, name: 'Bahasa Inggris', kkm: 75, tugas: 88, uts: 90, uas: 85, final: 88, status: 'Lulus' },
];

export default function StudentGrades() {
    const userRole = localStorage.getItem('userRole');
    const canPrint = userRole === 'admin' || userRole === 'guru';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight transition-all">Rapor Digital</h1>
                    <p className="text-gray-500 font-medium mt-1">Semester Ganjil 2023/2024</p>
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
                        <h2 className="text-5xl font-black mt-2">85.4</h2>
                        <div className="mt-4 flex items-center text-xs font-bold bg-white/20 backdrop-blur-md w-fit px-3 py-1.5 rounded-full border border-white/30">
                            <TrendingUp size={12} className="mr-1" />
                            Naik 4.2% dari semester lalu
                        </div>
                    </div>
                    <Award className="absolute -right-4 -bottom-4 text-white/10" size={140} />
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Matapel Tuntas</p>
                        <h2 className="text-3xl font-black text-gray-900 mt-2">12 / 14</h2>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[85%] rounded-full shadow-lg shadow-emerald-100" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Predikat Umum</p>
                        <h2 className="text-3xl font-black text-blue-600 mt-2 tracking-tight">Sangat Baik (A)</h2>
                    </div>
                    <p className="text-gray-400 text-[10px] font-bold mt-4 uppercase tracking-[0.2em]">Peringkat 3 di Kelas</p>
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
                            {subjectsGrades.map((sub) => (
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
