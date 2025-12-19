import React, { useState } from 'react';
import {
    Save,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    Download,
    Upload
} from 'lucide-react';

const initialStudents = [
    { id: 1, name: 'Ahmad Fauzi', nis: '2023001', tugas: 85, uts: 80, uas: 88 },
    { id: 2, name: 'Budi Santoso', nis: '2023002', tugas: 78, uts: 75, uas: 82 },
    { id: 3, name: 'Citra Lestari', nis: '2023003', tugas: 92, uts: 88, uas: 90 },
    { id: 4, name: 'Diana Putri', nis: '2023004', tugas: 65, uts: 70, uas: 68 },
    { id: 5, name: 'Eko Prasetyo', nis: '2023005', tugas: 80, uts: 82, uas: 85 },
];

export default function GradeEntry() {
    const [students, setStudents] = useState(initialStudents);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    const handleScoreChange = (id, field, value) => {
        const score = parseInt(value) || 0;
        setStudents(students.map(s =>
            s.id === id ? { ...s, [field]: Math.min(100, Math.max(0, score)) } : s
        ));
    };

    const calculateFinal = (s) => Math.round((s.tugas + s.uts + s.uas) / 3);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setLastSaved(new Date().toLocaleTimeString());
        }, 1000);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Input Nilai Siswa</h1>
                    <p className="text-sm text-gray-500">Kelas: X-IPA-1 | Mata Pelajaran: Matematika</p>
                </div>
                <div className="flex space-x-2">
                    <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-bold transition-all">
                        <Upload size={18} />
                        <span className="hidden sm:inline">Import</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <span className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Menyimpan...</span>
                            </span>
                        ) : (
                            <span className="flex items-center space-x-2">
                                <Save size={18} />
                                <span>Simpan Nilai</span>
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {lastSaved && (
                <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center shadow-sm animate-in slide-in-from-top-2">
                    <CheckCircle2 size={14} className="mr-2" />
                    Perubahan terakhir disimpan pada {lastSaved}
                </div>
            )}

            {/* Excel-like Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em]">
                                <th className="px-6 py-4 w-16 text-center">No</th>
                                <th className="px-6 py-4">Nama Siswa</th>
                                <th className="px-6 py-4 w-32 text-center">Tugas</th>
                                <th className="px-6 py-4 w-32 text-center">UTS</th>
                                <th className="px-6 py-4 w-32 text-center">UAS</th>
                                <th className="px-6 py-4 w-32 text-center bg-blue-50/50 text-blue-600">Akhir</th>
                                <th className="px-6 py-4 w-40 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {students.map((student, index) => {
                                const final = calculateFinal(student);
                                return (
                                    <tr key={student.id} className="hover:bg-blue-50/20 transition-colors group">
                                        <td className="px-6 py-4 text-center text-sm font-bold text-gray-400">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{student.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{student.nis}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-lg py-2 text-center font-bold text-gray-700 transition-all outline-none"
                                                value={student.tugas}
                                                onChange={(e) => handleScoreChange(student.id, 'tugas', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-lg py-2 text-center font-bold text-gray-700 transition-all outline-none"
                                                value={student.uts}
                                                onChange={(e) => handleScoreChange(student.id, 'uts', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-lg py-2 text-center font-bold text-gray-700 transition-all outline-none"
                                                value={student.uas}
                                                onChange={(e) => handleScoreChange(student.id, 'uas', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center bg-blue-50/30">
                                            <span className={`text-lg font-black ${final < 75 ? 'text-red-600' : 'text-blue-600'}`}>
                                                {final}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {final < 75 ? (
                                                <span className="inline-flex items-center px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded">
                                                    <AlertCircle size={12} className="mr-1" />
                                                    Remedial
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded">
                                                    Lulus
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
