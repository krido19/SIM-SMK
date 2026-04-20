import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useFeedback } from '../../context/FeedbackContext';
import * as XLSX from 'xlsx';
import {
    Plus,
    Search,
    BookOpen,
    Target,
    Edit2,
    Trash2,
    Layers,
    Award,
    X,
    Save,
    CheckCircle2,
    UserCircle,
    ChevronDown,
    Users,
    Download,
    Upload,
    FileSpreadsheet,
    AlertTriangle
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-white rounded-xl shadow-xl w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-200`}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[80vh] bg-gray-50/50">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const subjectColorMap = {
    blue: { bg: 'bg-blue-50/50', border: 'border-blue-100', icon: 'bg-blue-100 text-blue-600' },
    indigo: { bg: 'bg-indigo-50/50', border: 'border-indigo-100', icon: 'bg-indigo-100 text-indigo-600' },
    violet: { bg: 'bg-violet-50/50', border: 'border-violet-100', icon: 'bg-violet-100 text-violet-600' },
    orange: { bg: 'bg-orange-50/50', border: 'border-orange-100', icon: 'bg-orange-100 text-orange-600' },
    emerald: { bg: 'bg-emerald-50/50', border: 'border-emerald-100', icon: 'bg-emerald-100 text-emerald-600' },
    rose: { bg: 'bg-rose-50/50', border: 'border-rose-100', icon: 'bg-rose-100 text-rose-600' },
};

export const getJurusanColorInfo = (jurusan) => {
    const colors = [
        'bg-cyan-100 text-cyan-700 border-cyan-200',
        'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
        'bg-lime-100 text-lime-700 border-lime-200',
        'bg-amber-100 text-amber-700 border-amber-200',
        'bg-pink-100 text-pink-700 border-pink-200'
    ];
    if (!jurusan || jurusan.toLowerCase() === 'umum') return 'bg-gray-100 text-gray-600 border-gray-200';
    let hash = 0;
    for (let i = 0; i < jurusan.length; i++) hash = jurusan.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

export default function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [dbTeachers, setDbTeachers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState(null);
    const [formData, setFormData] = useState({ name: '', kkm: 75, jurusan: 'Umum', color: 'blue', teachers: [] });
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importPreview, setImportPreview] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const importFileRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast, showConfirm } = useFeedback();

    const [dynamicJurusan, setDynamicJurusan] = useState(['Umum', 'DKV', 'PPLG', 'AKL', 'MPLB', 'NA']);

    useEffect(() => {
        fetchSubjects();
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        const { data } = await supabase.from('teachers').select('id, name').order('name');
        if (data) setDbTeachers(data);
    };

    const fetchSubjects = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching subjects:', error);
        } else {
            const fetchedSubjects = data || [];
            setSubjects(fetchedSubjects);

            // Extract unique jurusan
            const uniqueJurusan = [...new Set([
                'Umum', 'DKV', 'PPLG', 'AKL', 'MPLB', 'NA',
                ...fetchedSubjects.map(s => s.jurusan).filter(Boolean)
            ])];
            setDynamicJurusan(uniqueJurusan);
        }
        setIsLoading(false);
    };

    const handleOpenAdd = () => {
        setCurrentSubject(null);
        setFormData({ name: '', kkm: 75, jurusan: 'Umum', color: 'blue', teachers: [] });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (subject) => {
        setCurrentSubject(subject);
        setFormData({
            name: subject.name,
            kkm: subject.kkm,
            jurusan: subject.jurusan || 'Umum',
            color: subject.color,
            teachers: subject.teachers ? subject.teachers.split(', ') : []
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(
            'Hapus Mata Pelajaran',
            'Apakah Anda yakin ingin menghapus mata pelajaran ini? Tindakan ini tidak dapat dibatalkan.',
            'danger'
        );

        if (confirmed) {
            const { error } = await supabase.from('subjects').delete().eq('id', id);
            if (!error) {
                showToast('Mata pelajaran berhasil dihapus', 'success');
                setSubjects(subjects.filter(s => s.id !== id));
            } else {
                showToast('Gagal menghapus: ' + error.message, 'error');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            name: formData.name,
            kkm: formData.kkm,
            jurusan: formData.jurusan,
            color: formData.color,
            teachers: formData.teachers.join(', ')
        };

        if (currentSubject) {
            const { error } = await supabase
                .from('subjects')
                .update(payload)
                .eq('id', currentSubject.id);

            if (error) {
                showToast('Gagal memperbarui mapel: ' + error.message, 'error');
            } else {
                showToast('Mata pelajaran berhasil diperbarui', 'success');
                fetchSubjects();
                setIsModalOpen(false);
            }
        } else {
            const { error } = await supabase
                .from('subjects')
                .insert([payload]);

            if (error) {
                showToast('Gagal menambah mapel: ' + error.message, 'error');
            } else {
                showToast('Mata pelajaran berhasil ditambah', 'success');
                fetchSubjects();
                setIsModalOpen(false);
            }
        }
        setIsLoading(false);
    };

    const handleTeacherToggle = (name) => {
        setFormData(prev => {
            const teachers = [...prev.teachers];
            if (teachers.includes(name)) {
                return { ...prev, teachers: teachers.filter(t => t !== name) };
            } else {
                return { ...prev, teachers: [...teachers, name] };
            }
        });
    };

    const filteredSubjects = subjects.filter(s =>
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.jurusan || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── EXPORT ──────────────────────────────────────────────
    const handleExport = () => {
        const exportData = subjects.map((s, i) => ({
            'No': i + 1,
            'Nama Mapel': s.name,
            'KKM': s.kkm,
            'Jurusan': s.jurusan || '',
            'Warna': s.color || 'blue',
            'Guru Pengampu': s.teachers || '',
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Mapel');
        XLSX.writeFile(wb, `Data_Mapel_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`);
        showToast('Data mapel berhasil diekspor ke Excel', 'success');
    };

    // ── IMPORT TEMPLATE ──────────────────────────────────────
    const handleDownloadTemplate = () => {
        const template = [{ 'Nama Mapel': 'Matematika', 'KKM': 75, 'Jurusan': 'Umum', 'Warna': 'blue', 'Guru Pengampu': 'Budi Santoso, Siti Aminah' }];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Template_Import_Mapel.xlsx');
    };

    // ── IMPORT PREVIEW ────────────────────────────────────────
    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const wb = XLSX.read(evt.target.result, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
            const mapped = rows.map(r => ({
                name: r['Nama Mapel'] || r['nama'] || '',
                kkm: parseInt(r['KKM'] || r['kkm'] || 75),
                jurusan: r['Jurusan'] || r['jurusan'] || 'Umum',
                color: r['Warna'] || r['color'] || 'blue',
                teachers: r['Guru Pengampu'] || r['guru'] || '',
            })).filter(r => r.name);
            setImportPreview(mapped);
            setIsImportModalOpen(true);
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const handleImportSubmit = async () => {
        setIsImporting(true);
        let successCount = 0; let errorCount = 0;
        for (const row of importPreview) {
            const { error } = await supabase.from('subjects').insert([row]);
            if (error) errorCount++; else successCount++;
        }
        setIsImporting(false);
        setIsImportModalOpen(false);
        setImportPreview([]);
        fetchSubjects();
        showToast(`Import selesai: ${successCount} berhasil, ${errorCount} gagal`, errorCount > 0 ? 'warning' : 'success');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Data Mata Pelajaran</h1>
                    <p className="text-sm text-gray-500 mt-1 block">Manajemen kurikulum, jurusan & pengampu</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    <button onClick={handleDownloadTemplate} className="flex items-center space-x-2 bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:bg-gray-50 transition-colors">
                        <FileSpreadsheet size={16} />
                        <span>Template</span>
                    </button>
                    <label className="flex items-center space-x-2 bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                        <Upload size={16} />
                        <span>Import</span>
                        <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
                    </label>
                    <button onClick={handleExport} className="flex items-center space-x-2 bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:bg-gray-50 transition-colors">
                        <Download size={16} />
                        <span>Export</span>
                    </button>
                    <button onClick={handleOpenAdd} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors">
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Tambah Mapel</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    <input
                        type="text"
                        placeholder="Cari mata pelajaran atau jurusan..."
                        className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-lg text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none placeholder:text-gray-400 sm:text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSubjects.map((subject) => {
                    const cMap = subjectColorMap[subject.color] || subjectColorMap.blue;
                    const jColor = getJurusanColorInfo(subject.jurusan);
                    return (
                        <div key={subject.id} className={`bg-white border hover:border-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group relative flex flex-col h-full overflow-hidden`}>
                            {/* Action buttons (top right) */}
                            <div className="absolute top-3 right-3 flex space-x-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenEdit(subject)}
                                    className="p-2 bg-white text-gray-400 hover:text-blue-600 rounded-lg border border-gray-100 shadow-sm transition-colors"
                                >
                                    <Edit2 size={14} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => handleDelete(subject.id)}
                                    className="p-2 bg-white text-gray-400 hover:text-red-600 rounded-lg border border-gray-100 shadow-sm transition-colors"
                                >
                                    <Trash2 size={14} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className={`p-5 flex-1 flex flex-col ${cMap.bg}`}>
                                {/* Header row: Icon and Jurusan Badge */}
                                <div className="flex justify-between items-start mb-5">
                                    <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${cMap.icon} shadow-sm group-hover:scale-105 transition-transform`}>
                                        <BookOpen size={20} strokeWidth={2.5} />
                                    </div>
                                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${jColor} uppercase tracking-wider`}>
                                        {subject.jurusan || 'Umum'}
                                    </span>
                                </div>

                                {/* Title */}
                                <div className="space-y-1 mb-5">
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">{subject.name}</h3>
                                </div>

                                {/* Teachers List */}
                                <div className="mt-auto flex-1 space-y-2.5 pt-4 border-t border-gray-200/60">
                                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <Users size={14} />
                                        <span>GURU PENGAMPU</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {subject.teachers ? subject.teachers.split(', ').map((teacher, idx) => (
                                            <span key={idx} className="text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-1 shadow-sm">
                                                {teacher}
                                            </span>
                                        )) : <span className="text-[11px] font-medium text-gray-400 italic">Belum Ada Pengampu</span>}
                                    </div>
                                </div>
                            </div>

                            {/* KKM Footer Indicator */}
                            <div className="bg-white border-t border-gray-100 px-5 py-3.5 flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <Target size={16} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">KKM Minimal</span>
                                </div>
                                <span className={`text-xl font-black ${cMap.icon.split(' ')[1]}`}>{subject.kkm}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentSubject ? 'EDIT MATA PELAJARAN' : 'TAMBAH MAPEL BARU'}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">Nama Mata Pelajaran</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400"
                            placeholder="Misal: Pendidikan Pancasila"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700 block">KKM Minimal</label>
                            <input
                                required
                                type="number"
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                value={formData.kkm}
                                onChange={(e) => setFormData({ ...formData, kkm: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700 block">Warna Ikon Identitas</label>
                            <div className="relative group">
                                <select
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                >
                                    <option value="blue">Biru (Umum)</option>
                                    <option value="indigo">Indigo (Sains)</option>
                                    <option value="violet">Ungu (Kreatif)</option>
                                    <option value="orange">Orange (Sosial)</option>
                                    <option value="emerald">Hijau (Alam/Agama)</option>
                                    <option value="rose">Merah (OlahRaga/Seni)</option>
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block text-left">Target Jurusan</label>
                        <div className="relative">
                            <input
                                list="jurusan-list"
                                type="text"
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400"
                                placeholder="Ketik atau pilih dari list... (Misal: Umum, DKV)"
                                value={formData.jurusan}
                                onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                            />
                            <datalist id="jurusan-list">
                                {dynamicJurusan.map(opt => (
                                    <option key={opt} value={opt} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">Pilih Guru Pengampu (Multi)</label>
                        <div className="max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg p-2 space-y-1 no-scrollbar">
                            {dbTeachers.map(teacher => (
                                <button
                                    key={teacher.id}
                                    type="button"
                                    onClick={() => handleTeacherToggle(teacher.name)}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-md transition-colors font-medium text-sm ${formData.teachers.includes(teacher.name)
                                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <UserCircle size={18} className={formData.teachers.includes(teacher.name) ? "text-blue-500" : "text-gray-400"} />
                                        <span>{teacher.name}</span>
                                    </div>
                                    {formData.teachers.includes(teacher.name) && <CheckCircle2 size={18} className="text-blue-600" />}
                                </button>
                            ))}
                            {dbTeachers.length === 0 && <p className="text-center text-sm font-medium text-gray-500 py-4">Belum ada data guru</p>}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm shadow-blue-200 disabled:opacity-50"
                        >
                            {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Save size={18} />}
                            <span>{currentSubject ? 'Simpan Perubahan' : 'Buat Mapel Baru'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ─── IMPORT PREVIEW MODAL ─────────────────── */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Preview Import Mapel</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">{importPreview.length} mapel siap diimpor</p>
                            </div>
                            <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }} className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 max-h-[55vh] overflow-y-auto bg-gray-50/50">
                            <table className="w-full text-left bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-600">
                                        {['Nama Mapel', 'KKM', 'Jurusan', 'Guru Pengampu'].map(h => (
                                            <th key={h} className="px-4 py-2 text-xs font-bold border-b border-gray-200">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {importPreview.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-2 text-sm font-semibold text-gray-900 border-r border-gray-100/50">{row.name}</td>
                                            <td className="px-4 py-2 text-sm font-medium text-gray-700 border-r border-gray-100/50">{row.kkm}</td>
                                            <td className="px-4 py-2 text-xs font-bold text-gray-600 border-r border-gray-100/50">{row.jurusan}</td>
                                            <td className="px-4 py-2 text-xs font-medium text-gray-500">{row.teachers}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center space-x-2 text-xs font-medium text-amber-600/90 bg-amber-50 px-3 py-1.5 rounded-md">
                                <AlertTriangle size={14} />
                                <span>Data akan ditambahkan sebagai mapel baru</span>
                            </div>
                            <div className="flex space-x-3">
                                <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                                    Batal
                                </button>
                                <button onClick={handleImportSubmit} disabled={isImporting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold text-sm flex items-center space-x-2 transition-colors disabled:opacity-50">
                                    {isImporting ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Upload size={16} />}
                                    <span>{isImporting ? 'Mengimpor...' : `Konfirmasi (${importPreview.length})`}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
