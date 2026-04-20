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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`bg-paper border-4 border-ink shadow-[12px_12px_0px_0px_#111111] w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300`}>
                <div className="px-6 py-4 border-b-4 border-ink flex items-center justify-between bg-gray-50 flex-shrink-0">
                    <h3 className="text-xl font-black text-ink uppercase tracking-widest font-serif">{title}</h3>
                    <button onClick={onClose} className="p-2 border-2 border-transparent hover:border-ink text-ink transition-all">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
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
            } else {
                // Admin: show all
                const { data: clsData } = await supabase.from('classes').select('id, name');
                const { data: subData } = await supabase.from('subjects').select('id, name');
                if (clsData) setDbClasses(clsData);
                if (subData) setDbSubjects(subData);
                if (clsData?.length > 0) setSelectedClassId(clsData[0].id);
                if (subData?.length > 0) setSelectedSubjectId(subData[0].id);
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-ink pb-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-ink uppercase tracking-tighter leading-none mb-1">Buku Nilai</h1>
                    <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">Entri Data Nilai Resmi</p>

                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="border-2 border-ink p-1 bg-white relative">
                            <span className="absolute -top-2 left-2 bg-paper px-1 text-[8px] font-mono font-bold uppercase tracking-widest text-ink">Section</span>
                            <select
                                className="appearance-none bg-transparent px-4 py-1 pr-8 text-xs font-bold font-mono uppercase tracking-widest text-ink focus:outline-none cursor-pointer"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                            >
                                {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink pointer-events-none" strokeWidth={3} />
                        </div>
                        <div className="border-2 border-ink p-1 bg-white relative">
                            <span className="absolute -top-2 left-2 bg-paper px-1 text-[8px] font-mono font-bold uppercase tracking-widest text-ink">Subject</span>
                            <select
                                className="appearance-none bg-transparent px-4 py-1 pr-8 text-xs font-bold font-mono uppercase tracking-widest text-ink focus:outline-none cursor-pointer"
                                value={selectedSubjectId}
                                onChange={(e) => setSelectedSubjectId(e.target.value)}
                            >
                                {dbSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink pointer-events-none" strokeWidth={3} />
                        </div>
                        <div className="border-2 border-ink p-1 bg-white relative">
                            <span className="absolute -top-2 left-2 bg-paper px-1 text-[8px] font-mono font-bold uppercase tracking-widest text-ink">Term</span>
                            <select
                                className="appearance-none bg-transparent px-4 py-1 pr-8 text-xs font-bold font-mono uppercase tracking-widest text-ink focus:outline-none cursor-pointer"
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                            >
                                <option value={1}>TERM I</option>
                                <option value={2}>TERM II</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink pointer-events-none" strokeWidth={3} />
                        </div>
                        <div className="border-2 border-ink p-1 bg-white relative">
                            <span className="absolute -top-2 left-2 bg-paper px-1 text-[8px] font-mono font-bold uppercase tracking-widest text-ink">Tahun Ajaran</span>
                            <select
                                className="appearance-none bg-transparent px-4 py-1 pr-8 text-xs font-bold font-mono uppercase tracking-widest text-ink focus:outline-none cursor-pointer"
                                value={selectedAcademicYear}
                                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                            >
                                {[2025,2024,2023,2022,2021].map(y => (
                                    <option key={y} value={`${y}/${y+1}`}>{y}/{y+1}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink pointer-events-none" strokeWidth={3} />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-end space-y-3 md:space-y-0 md:space-x-3 mt-4 md:mt-0">
                    <button 
                        onClick={handleDownloadTemplate}
                        className="flex items-center justify-center space-x-2 border-2 border-ink bg-paper text-ink hover:bg-ink hover:text-paper px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] w-full md:w-auto"
                    >
                        <FileSpreadsheet size={14} strokeWidth={2} />
                        <span className="hidden sm:inline">Unduh Template</span>
                    </button>
                    <label className="flex items-center justify-center space-x-2 border-2 border-ink bg-white hover:bg-ink hover:text-paper px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] cursor-pointer w-full md:w-auto">
                        <Upload size={14} strokeWidth={2} />
                        <span className="hidden sm:inline">Import Excel</span>
                        <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                    </label>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center space-x-2 border-2 border-ink bg-newsprint-red text-white hover:bg-ink hover:text-paper px-6 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <span className="flex items-center space-x-2">
                                <div className="w-3 h-3 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                                <span>Commit Tally...</span>
                            </span>
                        ) : (
                            <span className="flex items-center space-x-2">
                                <Save size={14} strokeWidth={2} />
                                <span>Simpan Nilai</span>
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {lastSaved && (
                <div className="border-2 border-ink bg-white font-mono text-[10px] uppercase tracking-widest px-4 py-2 font-bold flex items-center shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                    <CheckCircle2 size={14} className="mr-2 text-newsprint-red" />
                    Nilai berhasil disimpan pada {lastSaved}
                </div>
            )}

            {/* Ledger Table */}
            {isLoading ? (
                <div className="py-20 text-center font-mono text-[10px] uppercase tracking-widest">Memuat Data Nilai...</div>
            ) : (
                <div className="border-2 border-ink bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative newsprint-texture">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-ink text-paper font-mono text-[10px] uppercase tracking-widest border-b-2 border-ink">
                                    <th className="p-3 border-r border-paper/20 w-16 text-center">No</th>
                                    <th className="p-3 border-r border-paper/20">Student Name</th>
                                    <th className="p-3 border-r border-paper/20 w-32 text-center text-newsprint-red">Tugas</th>
                                    <th className="p-3 border-r border-paper/20 w-32 text-center text-newsprint-red">UTS</th>
                                    <th className="p-3 border-r border-paper/20 w-32 text-center text-newsprint-red">UAS</th>
                                    <th className="p-3 border-r border-paper/20 w-32 text-center bg-paper text-ink">Final</th>
                                    <th className="p-3 w-40 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-ink">
                                {students.map((student, index) => {
                                    const final = calculateFinal(student);
                                    return (
                                        <tr key={student.id} className="hover:bg-neutral-100 transition-colors">
                                            <td className="p-3 border-r border-ink text-center font-mono text-xs text-ink/60">{index + 1}</td>
                                            <td className="p-3 border-r border-ink">
                                                <div>
                                                    <p className="font-serif font-black text-ink">{student.name}</p>
                                                    <p className="font-mono text-[9px] uppercase tracking-widest text-ink/60">ID: {student.nis}</p>
                                                </div>
                                            </td>
                                            <td className="p-2 border-r border-ink bg-neutral-50/50">
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent border-b-2 border-dashed border-ink/30 focus:border-solid focus:border-newsprint-red outline-none py-2 text-center font-mono font-bold text-lg text-ink transition-all"
                                                    value={student.tugas}
                                                    onChange={(e) => handleScoreChange(student.id, 'tugas', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2 border-r border-ink bg-neutral-50/50">
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent border-b-2 border-dashed border-ink/30 focus:border-solid focus:border-newsprint-red outline-none py-2 text-center font-mono font-bold text-lg text-ink transition-all"
                                                    value={student.uts}
                                                    onChange={(e) => handleScoreChange(student.id, 'uts', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2 border-r border-ink bg-neutral-50/50">
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent border-b-2 border-dashed border-ink/30 focus:border-solid focus:border-newsprint-red outline-none py-2 text-center font-mono font-bold text-lg text-ink transition-all"
                                                    value={student.uas}
                                                    onChange={(e) => handleScoreChange(student.id, 'uas', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-3 border-r border-ink text-center bg-neutral-100">
                                                <span className={`font-mono text-2xl font-black ${final < 75 ? 'text-newsprint-red' : 'text-ink'}`}>
                                                    {final}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                {final < 75 ? (
                                                    <span className="inline-flex items-center px-2 py-1 bg-newsprint-red text-white text-[9px] font-mono font-bold uppercase tracking-widest border border-ink">
                                                        <AlertCircle size={10} className="mr-1" strokeWidth={3} />
                                                        FAIL
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 bg-white text-ink text-[9px] font-mono font-bold uppercase tracking-widest border border-ink">
                                                        PASS
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center font-serif italic text-ink/60">
                                            No student records found in this section.
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
                    <div className="py-20 flex flex-col items-center justify-center">
                        <Loader2 size={48} className="animate-spin mb-4 text-ink" />
                        <p className="font-mono text-xs font-bold uppercase tracking-widest">Membaca Data Excel...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-gray-50 border-2 border-ink p-4 shadow-[4px_4px_0px_0px_#111111]">
                            <p className="text-xs font-mono text-ink tracking-widest font-bold uppercase leading-relaxed">
                                Sila pastikan kolom Excel yang memuat angka sesuai dengan komponen nilai untuk <span className="text-newsprint-red underline">{dbSubjects.find(s => s.id === selectedSubjectId)?.name || 'Mata Pelajaran ini'}</span>.
                            </p>
                        </div>
                        
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 pb-4">
                            {['tugas', 'uts', 'uas'].map((part) => (
                                <div key={part} className="border-2 border-ink bg-white p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] transition-transform hover:-translate-y-1">
                                    <label className="text-sm font-black uppercase tracking-widest text-ink w-1/3">
                                        NILAI <span className="text-newsprint-red">{part}</span>
                                    </label>
                                    <div className="relative w-2/3">
                                        <select
                                            className="w-full bg-gray-50 border-2 border-ink px-3 py-2 text-xs font-mono font-bold text-ink uppercase focus:outline-none focus:border-newsprint-red appearance-none cursor-pointer"
                                            value={columnMap[part] || ''}
                                            onChange={(e) => setColumnMap({...columnMap, [part]: e.target.value})}
                                        >
                                            <option value="" className="text-gray-400">-- KOSONGKAN (JADI 0) --</option>
                                            {importHeaders.map(h => (
                                                <option key={h} value={h}>KOLOM: {h}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink pointer-events-none" strokeWidth={3} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t-4 border-ink flex justify-end space-x-4">
                            <button 
                                onClick={() => setIsImportModalOpen(false)}
                                className="px-6 py-3 border-2 border-ink bg-white hover:bg-gray-100 font-mono text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:shadow-none active:translate-y-[4px] active:translate-x-[4px] transition-all"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleExecuteImport}
                                disabled={isSaving}
                                className="px-6 py-3 bg-ink text-paper border-2 border-ink hover:bg-neutral-800 font-mono text-xs font-bold uppercase tracking-widest flex items-center space-x-2 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:shadow-none active:translate-y-[4px] active:translate-x-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                <span>EKSEKUSI IMPORT ({importData.length} BARIS)</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
