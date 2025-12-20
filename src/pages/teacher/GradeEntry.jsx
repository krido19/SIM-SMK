import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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




export default function GradeEntry() {
    const [students, setStudents] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [dbClasses, setDbClasses] = useState([]);
    const [dbSubjects, setDbSubjects] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: clsData } = await supabase.from('classes').select('id, name');
            const { data: subData } = await supabase.from('subjects').select('id, name');
            if (clsData) setDbClasses(clsData);
            if (subData) setDbSubjects(subData);
            if (clsData?.length > 0) setSelectedClassId(clsData[0].id);
            if (subData?.length > 0) setSelectedSubjectId(subData[0].id);
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClassId && selectedSubjectId) {
            fetchStudentsWithGrades();
        }
    }, [selectedClassId, selectedSubjectId]);

    const fetchStudentsWithGrades = async () => {
        setIsLoading(true);
        const { data: stdData, error } = await supabase
            .from('students')
            .select(`
                id,
                full_name,
                nis,
                grades (
                    tugas,
                    uts,
                    uas,
                    subject_id,
                    semester
                )
            `)
            .eq('class_id', selectedClassId);

        if (error) {
            console.error(error);
        } else {
            const transformed = stdData.map(s => {
                const grade = s.grades?.find(g => g.subject_id === selectedSubjectId) || { tugas: 0, uts: 0, uas: 0 };
                return {
                    id: s.id,
                    name: s.full_name,
                    nis: s.nis,
                    tugas: grade.tugas,
                    uts: grade.uts,
                    uas: grade.uas
                };
            });
            setStudents(transformed);
        }
        setIsLoading(false);
    };

    const handleScoreChange = (id, field, value) => {
        const score = parseInt(value) || 0;
        setStudents(students.map(s =>
            s.id === id ? { ...s, [field]: Math.min(100, Math.max(0, score)) } : s
        ));
    };

    const calculateFinal = (s) => Math.round((s.tugas + s.uts + s.uas) / 3);

    const handleSave = async () => {
        if (!selectedSubjectId) return;
        setIsSaving(true);

        const gradesToUpsert = students.map(s => ({
            student_id: s.id,
            subject_id: selectedSubjectId,
            tugas: s.tugas,
            uts: s.uts,
            uas: s.uas,
            score: Math.round((s.tugas + s.uts + s.uas) / 3),
            semester: 1
        }));

        const { error } = await supabase
            .from('grades')
            .upsert(gradesToUpsert, { onConflict: 'student_id, subject_id, semester' });

        if (error) {
            alert('Gagal menyimpan nilai: ' + error.message);
        } else {
            setLastSaved(new Date().toLocaleTimeString());
        }
        setIsSaving(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Input Nilai Siswa</h1>
                    <div className="flex flex-wrap gap-3 mt-2">
                        <div className="relative group">
                            <select
                                className="appearance-none bg-white border border-gray-100 px-4 py-2 pr-10 rounded-xl text-xs font-black text-gray-600 focus:ring-2 focus:ring-blue-500 transition-all outline-none cursor-pointer shadow-sm"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                            >
                                {dbClasses.map(c => <option key={c.id} value={c.id}>Kelas: {c.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="relative group">
                            <select
                                className="appearance-none bg-white border border-gray-100 px-4 py-2 pr-10 rounded-xl text-xs font-black text-gray-600 focus:ring-2 focus:ring-blue-500 transition-all outline-none cursor-pointer shadow-sm"
                                value={selectedSubjectId}
                                onChange={(e) => setSelectedSubjectId(e.target.value)}
                            >
                                {dbSubjects.map(s => <option key={s.id} value={s.id}>Mapel: {s.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
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
