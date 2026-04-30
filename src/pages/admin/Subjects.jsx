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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20`}>
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-xl font-sans font-black text-gray-900 tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
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
    const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
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
        setTeacherSearchTerm('');
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
        setTeacherSearchTerm('');
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
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                     <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Akademik
                        </span>
                    </div>
                    <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight">Data Mata Pelajaran</h1>
                    <p className="text-sm font-sans font-medium text-gray-500 mt-1">Manajemen kurikulum, jurusan & pengampu.</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    <button onClick={handleDownloadTemplate} className="flex items-center space-x-2 bg-white text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl font-sans font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-colors">
                        <FileSpreadsheet size={16} />
                        <span>Template</span>
                    </button>
                    <label className="flex items-center space-x-2 bg-white text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl font-sans font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                        <Upload size={16} />
                        <span>Import</span>
                        <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
                    </label>
                    <button onClick={handleExport} className="flex items-center space-x-2 bg-white text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl font-sans font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-colors">
                        <Download size={16} />
                        <span>Export</span>
                    </button>
                    <button onClick={handleOpenAdd} className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-sans font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all">
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Tambah Mapel</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold" size={18} />
                    <input
                        type="text"
                        placeholder="Cari mata pelajaran atau jurusan..."
                        className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-gray-900 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none placeholder-gray-400 font-sans font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubjects.map((subject) => {
                    const cMap = subjectColorMap[subject.color] || subjectColorMap.blue;
                    const jColor = getJurusanColorInfo(subject.jurusan);
                    return (
                        <div key={subject.id} className={`bg-white border hover:border-blue-200 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-300 group relative flex flex-col h-full overflow-hidden hover:-translate-y-1`}>
                            {/* Action buttons (top right) */}
                            <div className="absolute top-4 right-4 flex space-x-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenEdit(subject)}
                                    className="p-2.5 bg-white/80 backdrop-blur-md text-gray-600 hover:text-blue-600 rounded-xl border border-gray-200 shadow-sm transition-all"
                                >
                                    <Edit2 size={16} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => handleDelete(subject.id)}
                                    className="p-2.5 bg-white/80 backdrop-blur-md text-gray-600 hover:text-rose-600 rounded-xl border border-gray-200 shadow-sm transition-all"
                                >
                                    <Trash2 size={16} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className={`p-8 flex-1 flex flex-col ${cMap.bg} relative overflow-hidden`}>
                                {/* Header row: Icon and Jurusan Badge */}
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${cMap.icon} shadow-sm group-hover:scale-110 transition-transform`}>
                                        <BookOpen size={24} strokeWidth={2.5} />
                                    </div>
                                    <span className={`px-3 py-1.5 text-[10px] font-sans font-black rounded-full border ${jColor} uppercase tracking-widest`}>
                                        {subject.jurusan || 'Umum'}
                                    </span>
                                </div>

                                {/* Title */}
                                <div className="space-y-1 mb-6 relative z-10">
                                    <h3 className="text-xl font-sans font-black text-gray-900 tracking-tight leading-tight">{subject.name}</h3>
                                </div>

                                {/* Teachers List */}
                                <div className="mt-auto flex-1 space-y-3 pt-6 border-t border-gray-200/60 relative z-10">
                                    <div className="flex items-center space-x-2 text-[10px] font-sans font-black text-gray-500 uppercase tracking-widest">
                                        <Users size={14} />
                                        <span>Guru Pengampu</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {subject.teachers ? subject.teachers.split(', ').map((teacher, idx) => (
                                            <span key={idx} className="text-[10px] font-sans font-bold text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                                                {teacher}
                                            </span>
                                        )) : <span className="text-[10px] font-sans font-medium text-gray-500 italic">Belum Ada Pengampu</span>}
                                    </div>
                                </div>
                            </div>

                            {/* KKM Footer Indicator */}
                            <div className="bg-white border-t border-gray-100 px-8 py-5 flex items-center justify-between">
                                <div className="flex items-center space-x-3 text-gray-500">
                                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
                                        <Target size={16} className="text-gray-400" />
                                    </div>
                                    <span className="text-[11px] font-sans font-black uppercase tracking-widest text-gray-400">KKM Minimal</span>
                                </div>
                                <span className={`text-2xl font-sans font-black ${cMap.icon.split(' ')[1]}`}>{subject.kkm}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentSubject ? 'Edit Mata Pelajaran' : 'Tambah Mapel Baru'}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-sans font-bold text-gray-400 block uppercase tracking-widest px-1">Nama Mata Pelajaran</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-300"
                            placeholder="Misal: Pendidikan Pancasila"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-sans font-bold text-gray-400 block uppercase tracking-widest px-1">KKM Minimal</label>
                            <input
                                required
                                type="number"
                                className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
                                value={formData.kkm}
                                onChange={(e) => setFormData({ ...formData, kkm: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-sans font-bold text-gray-400 block uppercase tracking-widest px-1">Warna Ikon Identitas</label>
                            <div className="relative group">
                                <select
                                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
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
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-sans font-bold text-gray-400 block uppercase tracking-widest px-1 text-left">Target Jurusan</label>
                        <div className="relative">
                            <input
                                list="jurusan-list"
                                type="text"
                                className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-300"
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

                    <div className="space-y-2">
                        <label className="text-[11px] font-sans font-bold text-gray-400 block uppercase tracking-widest px-1">Pilih Guru Pengampu (Multi)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Cari nama guru..."
                                className="w-full bg-gray-50 border border-transparent rounded-xl pl-9 pr-4 py-2.5 font-sans font-bold text-xs text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-300"
                                value={teacherSearchTerm}
                                onChange={(e) => setTeacherSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto bg-gray-50 border border-transparent rounded-2xl p-2 space-y-1 custom-scrollbar">
                            {dbTeachers.filter(t => t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase())).map(teacher => (
                                <button
                                    key={teacher.id}
                                    type="button"
                                    onClick={() => handleTeacherToggle(teacher.name)}
                                    className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all font-sans font-bold text-xs ${formData.teachers.includes(teacher.name)
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                        : 'bg-transparent text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <UserCircle size={18} className={formData.teachers.includes(teacher.name) ? "text-blue-200" : "text-gray-400"} />
                                        <span>{teacher.name}</span>
                                    </div>
                                    {formData.teachers.includes(teacher.name) && <CheckCircle2 size={18} className="text-white" />}
                                </button>
                            ))}
                            {dbTeachers.filter(t => t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase())).length === 0 && (
                                <p className="text-center text-xs font-sans font-medium text-gray-400 py-4">
                                    {dbTeachers.length === 0 ? "Belum ada data guru" : "Guru tidak ditemukan"}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold py-4 rounded-2xl transition-all flex items-center justify-center space-x-3 shadow-lg shadow-blue-600/20 disabled:opacity-50 active:scale-[0.98] uppercase tracking-widest text-xs"
                        >
                            {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Save size={18} />}
                            <span>{currentSubject ? 'Simpan Perubahan' : 'Buat Mapel Baru'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Import Preview Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-sans font-black text-gray-900 tracking-tight">Preview Import Mapel</h3>
                                <p className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mt-1">{importPreview.length} Mapel Siap Diimpor</p>
                            </div>
                            <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="p-0 max-h-[50vh] overflow-y-auto custom-scrollbar bg-white">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] uppercase font-sans font-bold text-gray-400 tracking-widest sticky top-0 bg-white border-b border-gray-100 z-10">
                                    <tr>
                                        {['Nama Mapel', 'KKM', 'Jurusan', 'Guru Pengampu'].map(h => (
                                            <th key={h} className="p-5">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs font-sans">
                                    {importPreview.map((row, i) => (
                                        <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-5 font-black text-gray-900 truncate max-w-[200px]">{row.name}</td>
                                            <td className="p-5 font-black text-blue-600">{row.kkm}</td>
                                            <td className="p-5 font-bold text-gray-700 uppercase">{row.jurusan}</td>
                                            <td className="p-5 text-gray-500 truncate max-w-[200px]">{row.teachers}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center space-x-3 text-xs font-sans font-bold text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100">
                                <AlertTriangle size={16} />
                                <span>Data akan ditambahkan sebagai mapel baru</span>
                            </div>
                            <div className="flex w-full sm:w-auto gap-3">
                                <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }} className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-white font-sans font-bold text-xs uppercase tracking-widest bg-gray-100 shadow-sm transition-all focus:ring-4 focus:ring-gray-100">
                                    Batal
                                </button>
                                <button onClick={handleImportSubmit} disabled={isImporting} className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-3 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 active:scale-95">
                                    {isImporting ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Upload size={16} strokeWidth={2.5} />}
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
