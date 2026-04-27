import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useFeedback } from '../../context/FeedbackContext';
import * as XLSX from 'xlsx';
import {
    Save,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    Download,
    Upload,
    X,
    FileSpreadsheet,
    Loader2
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`bg-white rounded-3xl shadow-2xl border border-white/20 w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300`}>
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
                    <h3 className="text-xl font-sans font-black text-gray-900 tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};




export default function GradeEntry() {
    const [students, setStudents] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [dbClasses, setDbClasses] = useState([]);
    const [dbSubjects, setDbSubjects] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024/2025');
    const { showToast } = useFeedback();

    // Import Matrix States
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [importHeaders, setImportHeaders] = useState([]);
    const [importData, setImportData] = useState([]);
    const [columnMap, setColumnMap] = useState({});
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            // Ambil tahun ajaran aktif dari settings
            const { data: setting } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'current_academic_year')
                .maybeSingle();
            if (setting?.value) setSelectedAcademicYear(setting.value);

            const role = localStorage.getItem('userRole');
            const userId = localStorage.getItem('userId');
            const userName = localStorage.getItem('userName');

            if (role === 'guru' && (userId || userName)) {
                // Fetch only classes/subjects this teacher is assigned to
                let schedules = [];

                if (userId) {
                    const { data: s1 } = await supabase
                        .from('schedules')
                        .select('class_id, class_name, subject_name')
                        .eq('teacher_id', userId);
                    if (s1) schedules.push(...s1);
                }
                if (userName) {
                    const { data: s2 } = await supabase
                        .from('schedules')
                        .select('class_id, class_name, subject_name')
                        .eq('teacher_name', userName);
                    if (s2) schedules.push(...s2);
                }

                // Deduplicate classes
                const classMap = {};
                schedules.forEach(s => {
                    if (s.class_id && !classMap[s.class_id]) {
                        classMap[s.class_id] = { id: s.class_id, name: s.class_name || 'Kelas' };
                    }
                });
                const teacherClasses = Object.values(classMap);

                // Get unique subject names, then find their IDs
                const subjectNames = [...new Set(schedules.map(s => s.subject_name).filter(Boolean))];
                let teacherSubjects = [];
                if (subjectNames.length > 0) {
                    const { data: subData } = await supabase
                        .from('subjects')
                        .select('id, name')
                        .in('name', subjectNames);
                    teacherSubjects = subData || [];
                }

                setDbClasses(teacherClasses);
                setDbSubjects(teacherSubjects);
                if (teacherClasses.length > 0) setSelectedClassId(teacherClasses[0].id);
                if (teacherSubjects.length > 0) setSelectedSubjectId(teacherSubjects[0].id);

                if (teacherClasses.length === 0 || teacherSubjects.length === 0) {
                    setIsLoading(false);
                }
            } else {
                // Admin: show all
                const { data: clsData } = await supabase.from('classes').select('id, name');
                const { data: subData } = await supabase.from('subjects').select('id, name');
                if (clsData) setDbClasses(clsData);
                if (subData) setDbSubjects(subData);
                if (clsData?.length > 0) setSelectedClassId(clsData[0].id);
                if (subData?.length > 0) setSelectedSubjectId(subData[0].id);

                if (!clsData || clsData.length === 0 || !subData || subData.length === 0) {
                    setIsLoading(false);
                }
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClassId && selectedSubjectId) {
            fetchStudentsWithGrades();
        }
    }, [selectedClassId, selectedSubjectId, selectedSemester, selectedAcademicYear]);

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
                    semester,
                    academic_year
                )
            `)
            .eq('class_id', selectedClassId);

        if (error) {
            console.error(error);
        } else {
            const transformed = stdData.map(s => {
                const grade = s.grades?.find(g =>
                    g.subject_id === selectedSubjectId &&
                    g.semester === selectedSemester &&
                    (g.academic_year === selectedAcademicYear || !g.academic_year)
                ) || { tugas: 0, uts: 0, uas: 0 };
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
            semester: selectedSemester,
            academic_year: selectedAcademicYear
        }));

        const { error } = await supabase
            .from('grades')
            .upsert(gradesToUpsert, { onConflict: 'student_id, subject_id, semester, academic_year' });

        if (error) {
            showToast('Gagal menyimpan nilai: ' + error.message, 'error');
        } else {
            showToast('Nilai berhasil disimpan', 'success');
            setLastSaved(new Date().toLocaleTimeString());
        }
        setIsSaving(false);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImportLoading(true);
        setIsImportModalOpen(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];

                const data = XLSX.utils.sheet_to_json(ws);
                if (data.length === 0) throw new Error("File kosong");

                const headers = Object.keys(data[0]);
                setImportHeaders(headers);
                setImportData(data);

                // Auto-match for Tugas, UTS, UAS
                const initMap = { tugas: '', uts: '', uas: '' };
                const tugasCol = headers.find(h => h.toLowerCase().includes('tugas'));
                const utsCol = headers.find(h => h.toLowerCase().includes('uts') || h.toLowerCase().includes('tengah'));
                const uasCol = headers.find(h => h.toLowerCase().includes('uas') || h.toLowerCase().includes('akhir'));

                if (tugasCol) initMap.tugas = tugasCol;
                if (utsCol) initMap.uts = utsCol;
                if (uasCol) initMap.uas = uasCol;

                setColumnMap(initMap);
            } catch (error) {
                showToast('Gagal membaca Excel: ' + error.message, 'error');
                setIsImportModalOpen(false);
            } finally {
                setImportLoading(false);
                e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleExecuteImport = async () => {
        if (!selectedSubjectId) {
            showToast('Pilih mata pelajaran terlebih dahulu', 'warning');
            return;
        }

        setIsSaving(true);
        let upsertPayloads = [];

        // Fetch all students to map NIS reliably globally
        const { data: allStudents } = await supabase.from('students').select('id, nis');
        const nisToId = {};
        allStudents?.forEach(s => nisToId[s.nis] = s.id);

        for (const row of importData) {
            // Flexible NIS matching
            const nisRaw = row['NIS'] || row['nis'] || row['Nis'] || row['Nomor Induk'] || '';
            const nis = String(nisRaw).trim();
            const stdId = nisToId[nis];
            if (!stdId) continue;

            const tugasScore = columnMap.tugas ? parseFloat(row[columnMap.tugas]) : 0;
            const utsScore = columnMap.uts ? parseFloat(row[columnMap.uts]) : 0;
            const uasScore = columnMap.uas ? parseFloat(row[columnMap.uas]) : 0;

            const t = isNaN(tugasScore) ? 0 : Math.round(tugasScore);
            const ut = isNaN(utsScore) ? 0 : Math.round(utsScore);
            const ua = isNaN(uasScore) ? 0 : Math.round(uasScore);

            const score = Math.round((t + ut + ua) / 3);

            upsertPayloads.push({
                student_id: stdId,
                subject_id: selectedSubjectId,
                semester: selectedSemester,
                academic_year: selectedAcademicYear,
                tugas: t,
                uts: ut,
                uas: ua,
                score: score
            });
        }

        if (upsertPayloads.length > 0) {
            for (let i = 0; i < upsertPayloads.length; i += 300) {
                const batch = upsertPayloads.slice(i, i + 300);
                const { error } = await supabase.from('grades').upsert(batch, { onConflict: 'student_id, subject_id, semester, academic_year' });
                if (error) console.error(error);
            }
            showToast(`${upsertPayloads.length} nilai berhasil diimpor`, 'success');
            fetchStudentsWithGrades();
            setIsImportModalOpen(false);
        } else {
            showToast('Tidak ada data nilai yang valid', 'warning');
        }
        setIsSaving(false);
    };

    const handleDownloadTemplate = () => {
        if (students.length === 0) {
            showToast('Pilih Kelas/Section yang memiliki siswa terlebih dahulu untuk men-generate template.', 'warning');
            return;
        }

        const templateData = students.map((s, idx) => {
            return {
                'No': idx + 1,
                'NIS': s.nis,
                'Nama Lengkap': s.name,
                'TUGAS': '',
                'UTS': '',
                'UAS': ''
            };
        });

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template Nilai');

        // Auto-size columns loosely
        const colWidths = [{ wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, `Template_Nilai_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="space-y-6 flex-1">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Akademik
                            </span>
                        </div>
                        <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight leading-none mb-2">Buku Nilai</h1>
                        <p className="font-sans text-sm font-medium text-gray-500">Entri Data Nilai Resmi</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="relative min-w-[160px]">
                            <span className="absolute -top-2.5 left-3 bg-white px-1 text-[10px] font-sans font-black uppercase tracking-widest text-blue-600">Section</span>
                            <div className="relative">
                                <select
                                    className="w-full bg-gray-50 border border-transparent px-4 py-3 pr-8 rounded-xl text-sm font-sans font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer tracking-tight"
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                >
                                    {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="relative min-w-[200px]">
                            <span className="absolute -top-2.5 left-3 bg-white px-1 text-[10px] font-sans font-black uppercase tracking-widest text-blue-600">Subject</span>
                            <div className="relative">
                                <select
                                    className="w-full bg-gray-50 border border-transparent px-4 py-3 pr-8 rounded-xl text-sm font-sans font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer tracking-tight"
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                >
                                    {dbSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="relative min-w-[140px]">
                            <span className="absolute -top-2.5 left-3 bg-white px-1 text-[10px] font-sans font-black uppercase tracking-widest text-blue-600">Term</span>
                            <div className="relative">
                                <select
                                    className="w-full bg-gray-50 border border-transparent px-4 py-3 pr-8 rounded-xl text-sm font-sans font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer tracking-tight"
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                                >
                                    <option value={1}>Term I</option>
                                    <option value={2}>Term II</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="relative min-w-[140px]">
                            <span className="absolute -top-2.5 left-3 bg-white px-1 text-[10px] font-sans font-black uppercase tracking-widest text-blue-600">Tahun Ajaran</span>
                            <div className="relative">
                                <select
                                    className="w-full bg-gray-50 border border-transparent px-4 py-3 pr-8 rounded-xl text-sm font-sans font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer tracking-tight"
                                    value={selectedAcademicYear}
                                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                                >
                                    {[2025, 2024, 2023, 2022, 2021].map(y => (
                                        <option key={y} value={`${y}/${y + 1}`}>{y}/{y + 1}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end gap-3 w-full xl:w-auto">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center justify-center space-x-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-5 py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all w-full sm:w-auto"
                    >
                        <FileSpreadsheet size={16} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Unduh Template</span>
                    </button>
                    <label className="flex items-center justify-center space-x-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-5 py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all cursor-pointer w-full sm:w-auto">
                        <Upload size={16} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Import Excel</span>
                        <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                    </label>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center justify-center space-x-3 bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 w-full sm:w-auto"
                    >
                        {isSaving ? (
                            <span className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Menyimpan...</span>
                            </span>
                        ) : (
                            <span className="flex items-center space-x-2">
                                <Save size={16} strokeWidth={2.5} />
                                <span>Simpan Nilai</span>
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {lastSaved && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 font-sans text-xs uppercase tracking-widest px-5 py-3 font-bold flex items-center rounded-2xl shadow-sm">
                    <CheckCircle2 size={16} className="mr-3" strokeWidth={2.5} />
                    Nilai berhasil disimpan pada {lastSaved}
                </div>
            )}

            {/* Ledger Table */}
            {isLoading ? (
                <div className="py-24 text-center">
                    <Loader2 size={32} className="mx-auto animate-spin text-blue-600 mb-4" />
                    <p className="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest">Memuat Data Nilai...</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 font-sans text-[10px] uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-6 py-4 w-16 text-center font-bold">No</th>
                                    <th className="px-6 py-4 font-bold">Student Name</th>
                                    <th className="px-6 py-4 w-32 text-center text-blue-600 font-black">Tugas</th>
                                    <th className="px-6 py-4 w-32 text-center text-blue-600 font-black">UTS</th>
                                    <th className="px-6 py-4 w-32 text-center text-blue-600 font-black">UAS</th>
                                    <th className="px-6 py-4 w-32 text-center bg-blue-50/50 text-blue-800 font-black">Final</th>
                                    <th className="px-6 py-4 w-40 text-center font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {students.map((student, index) => {
                                    const final = calculateFinal(student);
                                    return (
                                        <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4 text-center font-sans text-xs font-bold text-gray-400">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-sans font-black text-gray-900 tracking-tight">{student.name}</p>
                                                    <p className="font-sans mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">ID: {student.nis}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 rounded-xl outline-none py-2 text-center font-sans font-black text-lg text-gray-900 transition-all placeholder:text-gray-300"
                                                    value={student.tugas}
                                                    onChange={(e) => handleScoreChange(student.id, 'tugas', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 rounded-xl outline-none py-2 text-center font-sans font-black text-lg text-gray-900 transition-all placeholder:text-gray-300"
                                                    value={student.uts}
                                                    onChange={(e) => handleScoreChange(student.id, 'uts', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 rounded-xl outline-none py-2 text-center font-sans font-black text-lg text-gray-900 transition-all placeholder:text-gray-300"
                                                    value={student.uas}
                                                    onChange={(e) => handleScoreChange(student.id, 'uas', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center bg-blue-50/20 group-hover:bg-blue-50/50 transition-colors">
                                                <span className={`font-sans text-2xl tracking-tight font-black ${final < 75 ? 'text-rose-600' : 'text-gray-900'}`}>
                                                    {final}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {final < 75 ? (
                                                    <span className="inline-flex items-center px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-sans font-black uppercase tracking-widest rounded-lg">
                                                        FAIL
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-sans font-black uppercase tracking-widest rounded-lg">
                                                        PASS
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="p-12 text-center font-sans font-medium text-gray-400">
                                            Tidak ada siswa di kelas ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Peta Data Excel -> Komponen Nilai"
                maxWidth="max-w-2xl"
            >
                {importLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center">
                        <Loader2 size={48} className="animate-spin text-blue-600 mb-6" strokeWidth={2.5} />
                        <p className="font-sans text-xs font-bold text-gray-500 uppercase tracking-widest">Membaca Data Excel...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex items-start space-x-3">
                            <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                            <p className="text-xs font-sans text-blue-800 font-medium leading-relaxed">
                                Sila pastikan kolom Excel yang memuat angka sesuai dengan komponen nilai untuk <strong className="font-black underline mx-1">{dbSubjects.find(s => s.id === selectedSubjectId)?.name || 'Mata Pelajaran ini'}</strong>.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {['tugas', 'uts', 'uas'].map((part) => (
                                <div key={part} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <label className="text-sm font-sans font-black uppercase tracking-widest text-gray-900 w-full sm:w-1/3 text-left">
                                        NILAI <span className="text-blue-600 ml-1">{part}</span>
                                    </label>
                                    <div className="relative w-full sm:w-2/3">
                                        <select
                                            className="w-full bg-white border border-transparent focus:border-blue-200 focus:ring-4 focus:ring-blue-50 rounded-xl px-4 py-3 text-xs font-sans font-bold text-gray-900 uppercase transition-all appearance-none cursor-pointer shadow-sm"
                                            value={columnMap[part] || ''}
                                            onChange={(e) => setColumnMap({ ...columnMap, [part]: e.target.value })}
                                        >
                                            <option value="" className="text-gray-400">--- KOSONGKAN (JADI 0) ---</option>
                                            {importHeaders.map(h => (
                                                <option key={h} value={h}>KOLOM: {h}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={2.5} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3">
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="px-6 py-3 w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-500 font-sans text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleExecuteImport}
                                disabled={isSaving}
                                className="px-6 py-3 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2.5} />}
                                <span>EKSEKUSI DATA ({importData.length} BARIS)</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
