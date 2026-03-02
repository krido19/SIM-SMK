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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`bg-paper border-4 border-ink shadow-[12px_12px_0px_0px_#111111] w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-300`}>
                <div className="px-6 py-4 border-b-4 border-ink flex items-center justify-between bg-gray-50">
                    <h3 className="text-xl font-black text-ink uppercase tracking-widest font-serif">{title}</h3>
                    <button onClick={onClose} className="p-2 border-2 border-transparent hover:border-ink text-ink transition-all">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[80vh]">
                    {children}
                </div>
            </div>
        </div>
    );
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-ink pb-6">
                <div>
                    <h1 className="text-4xl font-black text-ink font-serif uppercase tracking-tight">MATA PELAJARAN</h1>
                    <p className="text-sm text-gray-600 font-mono uppercase tracking-widest mt-2 block">Manajemen Kurikulum, Jurusan &amp; Pengampu</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={handleDownloadTemplate} className="flex items-center space-x-2 bg-paper text-ink border-2 border-ink px-4 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                        <FileSpreadsheet size={16} />
                        <span>TEMPLATE</span>
                    </button>
                    <label className="flex items-center space-x-2 bg-paper text-ink border-2 border-ink px-4 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer">
                        <Upload size={16} />
                        <span>IMPORT</span>
                        <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
                    </label>
                    <button onClick={handleExport} className="flex items-center space-x-2 bg-paper text-ink border-2 border-ink px-4 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                        <Download size={16} />
                        <span>EXPORT</span>
                    </button>
                    <button onClick={handleOpenAdd} className="flex items-center space-x-2 bg-ink text-paper border-2 border-ink px-4 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-paper hover:text-ink">
                        <Plus size={16} strokeWidth={3} />
                        <span>TAMBAH MAPEL</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-paper p-6 border-2 border-ink shadow-[8px_8px_0px_0px_#111111]">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink pointer-events-none" size={18} />
                    <input
                        type="text"
                        placeholder="CARI MATA PELAJARAN ATAU JURUSAN..."
                        className="block w-full pl-12 pr-4 py-4 bg-paper border-2 border-ink text-ink font-mono text-sm uppercase tracking-widest outline-none focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubjects.map((subject) => (
                    <div key={subject.id} className="bg-paper border-2 border-ink shadow-[8px_8px_0px_0px_#111111] transition-transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#111111] group relative flex flex-col h-full overflow-hidden">
                        {/* Action buttons (top right) */}
                        <div className="absolute top-0 right-0 p-4 flex space-x-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleOpenEdit(subject)}
                                className="p-2 bg-paper text-ink hover:bg-ink hover:text-paper border-2 border-ink transition-colors shadow-[2px_2px_0px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDelete(subject.id)}
                                className="p-2 bg-paper text-editorial hover:bg-editorial hover:text-paper border-2 border-editorial transition-colors shadow-[2px_2px_0px_0px_#CC0000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-6 flex-1 flex flex-col">
                            {/* Icon */}
                            <div className="flex items-start mb-6">
                                <div className="h-16 w-16 bg-paper border-2 border-ink flex items-center justify-center text-ink shadow-[4px_4px_0px_0px_#111111] group-hover:scale-110 transition-transform">
                                    <BookOpen size={24} />
                                </div>
                            </div>

                            {/* Title & Badge */}
                            <div className="space-y-2 mb-6">
                                <h3 className="text-xl font-black text-ink font-serif uppercase tracking-tight">{subject.name}</h3>
                                <div className="inline-block px-2 py-1 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest border border-ink">
                                    JURUSAN: {subject.jurusan}
                                </div>
                            </div>

                            {/* Teachers List */}
                            <div className="mt-4 flex-1 space-y-3 pt-6 border-t-2 border-ink">
                                <div className="flex items-center space-x-2 text-[10px] font-mono font-bold text-ink uppercase tracking-widest">
                                    <Users size={12} />
                                    <span>GURU PENGAMPU</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {subject.teachers ? subject.teachers.split(', ').map((teacher, idx) => (
                                        <span key={idx} className="text-[10px] font-mono font-bold text-ink border-2 border-ink px-2 py-1 uppercase tracking-widest bg-gray-50">
                                            {teacher}
                                        </span>
                                    )) : <span className="text-[10px] font-mono font-bold text-gray-500 italic uppercase">BELUM ADA GURU</span>}
                                </div>
                            </div>
                        </div>

                        {/* KKM Footer Indicator */}
                        <div className="bg-editorial text-paper px-6 py-4 mt-auto border-t-2 border-ink flex items-center justify-between group-hover:bg-ink transition-colors">
                            <div className="flex items-center space-x-2">
                                <Target size={16} />
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">KKM MINIMAL</span>
                            </div>
                            <span className="text-2xl font-black font-serif">{subject.kkm}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentSubject ? 'EDIT MATA PELAJARAN' : 'TAMBAH MAPEL BARU'}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">NAMA MATA PELAJARAN</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">KKM MINIMAL</label>
                            <input
                                required
                                type="number"
                                className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                value={formData.kkm}
                                onChange={(e) => setFormData({ ...formData, kkm: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">WARNA IKON</label>
                            <div className="relative group">
                                <select
                                    className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all appearance-none cursor-pointer"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                >
                                    <option value="blue">BIRU</option>
                                    <option value="indigo">INDIGO</option>
                                    <option value="violet">UNGU</option>
                                    <option value="orange">ORANGE</option>
                                    <option value="emerald">HIJAU</option>
                                    <option value="rose">MERAH</option>
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">JURUSAN (KETIK BARU ATAU PILIH)</label>
                        <div className="relative">
                            <input
                                list="jurusan-list"
                                type="text"
                                className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                placeholder="MISAL: DKV, PPLG, ATAU JURUSAN BARU..."
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
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">GURU PENGAMPU (BISA PILIH BANYAK)</label>
                        <div className="max-h-48 overflow-y-auto bg-gray-50 border-2 border-ink focus-within:bg-paper focus-within:shadow-[4px_4px_0px_0px_#111111] transition-all p-4 space-y-2 no-scrollbar">
                            {dbTeachers.map(teacher => (
                                <button
                                    key={teacher.id}
                                    type="button"
                                    onClick={() => handleTeacherToggle(teacher.name)}
                                    className={`w-full flex items-center justify-between p-3 border-2 transition-colors font-mono font-bold text-xs uppercase tracking-widest ${formData.teachers.includes(teacher.name)
                                        ? 'bg-ink text-paper border-ink shadow-[2px_2px_0px_0px_#111111] translate-x-[1px] translate-y-[1px]'
                                        : 'bg-paper text-ink border-ink hover:bg-gray-100 hover:shadow-[2px_2px_0px_0px_#111111]'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <UserCircle size={16} />
                                        <span>{teacher.name}</span>
                                    </div>
                                    {formData.teachers.includes(teacher.name) && <CheckCircle2 size={16} />}
                                </button>
                            ))}
                            {dbTeachers.length === 0 && <p className="text-center text-xs font-mono font-bold text-gray-500 uppercase tracking-widest py-4">BELUM ADA DATA GURU</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-ink hover:bg-paper text-paper hover:text-ink font-mono font-bold py-4 border-2 border-ink transition-colors flex items-center justify-center space-x-2 shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#111111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-50 mt-6"
                    >
                        {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-paper" /> : <Save size={20} />}
                        <span className="uppercase tracking-widest text-xs">{currentSubject ? 'SIMPAN PERUBAHAN' : 'BUAT MAPEL'}</span>
                    </button>
                </form>
            </Modal>

            {/* ─── IMPORT PREVIEW MODAL ─────────────────── */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-paper border-4 border-ink shadow-[12px_12px_0px_0px_#111111] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b-4 border-ink flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="text-xl font-black text-ink uppercase tracking-widest font-serif">PREVIEW IMPORT MAPEL</h3>
                                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">{importPreview.length} MAPEL SIAP DIIMPOR</p>
                            </div>
                            <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }} className="p-2 border-2 border-transparent hover:border-ink text-ink transition-all">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="p-4 max-h-[55vh] overflow-y-auto">
                            <table className="w-full text-left border-collapse border-2 border-ink">
                                <thead>
                                    <tr className="bg-ink text-paper">
                                        {['Nama Mapel', 'KKM', 'Jurusan', 'Guru Pengampu'].map(h => (
                                            <th key={h} className="px-3 py-2 text-[9px] font-mono font-bold uppercase tracking-widest border-r border-paper/30 last:border-r-0">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink">
                                    {importPreview.map((row, i) => (
                                        <tr key={i} className={i % 2 === 0 ? 'bg-paper' : 'bg-gray-50'}>
                                            <td className="px-3 py-2 text-xs font-mono font-bold text-ink border-r border-ink uppercase">{row.name}</td>
                                            <td className="px-3 py-2 text-xs font-mono text-ink border-r border-ink font-bold">{row.kkm}</td>
                                            <td className="px-3 py-2 text-xs font-mono text-ink border-r border-ink uppercase">{row.jurusan}</td>
                                            <td className="px-3 py-2 text-xs font-mono text-gray-600">{row.teachers}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t-4 border-ink flex items-center justify-between bg-gray-50">
                            <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                <AlertTriangle size={14} className="text-yellow-600" />
                                <span>DATA AKAN DITAMBAHKAN SEBAGAI MAPEL BARU</span>
                            </div>
                            <div className="flex space-x-3">
                                <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }} className="px-6 py-3 border-2 border-ink text-ink font-mono font-bold text-xs uppercase tracking-widest hover:bg-ink hover:text-paper transition-all">
                                    BATAL
                                </button>
                                <button onClick={handleImportSubmit} disabled={isImporting} className="px-6 py-3 bg-ink text-paper border-2 border-ink font-mono font-bold text-xs uppercase tracking-widest flex items-center space-x-2 shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50">
                                    {isImporting ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-paper" /> : <Upload size={14} />}
                                    <span>{isImporting ? 'MENGIMPOR...' : `KONFIRMASI IMPORT (${importPreview.length})`}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
