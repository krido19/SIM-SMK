import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useFeedback } from '../../context/FeedbackContext';
import * as XLSX from 'xlsx';
import {
    Plus,
    Search,
    Users,
    UserCheck,
    Edit2,
    Trash2,
    ArrowRight,
    Hash,
    X,
    Save,
    Info,
    FileUp,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronDown
} from 'lucide-react';



const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20`}>
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-xl font-sans font-black text-gray-900 tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Daftar jurusan dengan warna khas masing-masing
const JURUSAN_LIST = [
    { name: 'TKP',    label: 'Tek. Konstruksi & Perumahan', hex: '#f97316' },
    { name: 'TKR',    label: 'Tek. Kendaraan Ringan',       hex: '#2563eb' },
    { name: 'RPL',    label: 'Rekayasa Perangkat Lunak',    hex: '#7c3aed' },
    { name: 'TKJ',    label: 'Tek. Komputer & Jaringan',    hex: '#0891b2' },
    { name: 'AKL',    label: 'Akuntansi & Keuangan',        hex: '#059669' },
    { name: 'OTKP',   label: 'Otomatisasi Tata Kelola',     hex: '#db2777' },
    { name: 'BDP',    label: 'Bisnis Daring & Pemasaran',   hex: '#d97706' },
    { name: 'LISTRIK',label: 'Teknik Ketenagalistrikan',    hex: '#ca8a04' },
    { name: 'ELE',    label: 'Teknik Elektronika',          hex: '#16a34a' },
    { name: 'TPM',    label: 'Teknik Pemesinan',            hex: '#0f766e' },
    { name: 'DPIB',   label: 'Desain Pemodelan & Inf. Bang.',hex: '#9333ea' },
    { name: 'TITL',   label: 'Tek. Instalasi Tenaga Listrik',hex: '#b45309'},
    { name: 'TAB',    label: 'Teknik Audio Video',          hex: '#0369a1' },
];

// Palet fallback untuk jurusan yang diketik manual dan belum ada di daftar
const FALLBACK_PALETTE = [
    '#dc2626','#2563eb','#7c3aed','#059669','#d97706',
    '#0891b2','#be185d','#0f766e','#9333ea','#1d4ed8',
    '#65a30d','#92400e','#1e40af','#9f1239','#15803d',
];

const hashColor = (str = '') => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return FALLBACK_PALETTE[Math.abs(h) % FALLBACK_PALETTE.length];
};

// Cari di daftar → jika tidak ada, buat warna dari hash nama
const getJurusan = (name = '') => {
    const found = JURUSAN_LIST.find(j => j.name.toUpperCase() === name.toUpperCase());
    return found ?? { name, label: name, hex: hashColor(name) };
};

export default function Classes() {
    const [classes, setClasses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const navigate = useNavigate();
    const [currentClass, setCurrentClass] = useState(null);
    const [formData, setFormData] = useState({ name: '', homeroom: '', level: '10', jurusan: 'TKP' });
    const [filterJurusan, setFilterJurusan] = useState('Semua');
    const [importedStudents, setImportedStudents] = useState([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [dbTeachers, setDbTeachers] = useState([]);
    const { showToast, showConfirm } = useFeedback();
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchClasses();
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        const { data } = await supabase.from('teachers').select('id, name').order('name');
        if (data) setDbTeachers(data);
    };

    const fetchClasses = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('classes')
            .select(`
                *,
                students(count)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching classes:', error);
        } else {
            // Petakan students[0].count ke field studentsCount
            const mapped = (data || []).map(cls => ({
                ...cls,
                studentsCount: cls.students?.[0]?.count ?? 0
            }));
            setClasses(mapped);
        }
        setIsLoading(false);
    };

    const handleOpenAdd = () => {
        setCurrentClass(null);
        setFormData({ name: '', homeroom: '', level: '10', jurusan: 'TKP' });
        setImportedStudents([]);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cls) => {
        setCurrentClass(cls);
        setFormData({ name: cls.name, homeroom: cls.homeroom, level: cls.level, jurusan: cls.jurusan || 'Lain' });
        setImportedStudents([]);
        setIsModalOpen(true);
    };

    const handleOpenDetail = (cls) => {
        setCurrentClass(cls);
        setIsDetailOpen(true);
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(
            'Hapus Kelas',
            'Apakah Anda yakin ingin menghapus kelas ini? Tindakan ini tidak dapat dibatalkan.',
            'danger'
        );

        if (confirmed) {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', id);

            if (error) {
                showToast('Gagal menghapus kelas: ' + error.message, 'error');
            } else {
                showToast('Kelas berhasil dihapus', 'success');
                setClasses(classes.filter(c => c.id !== id));
            }
        }
    };

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { NIS: '2023001', 'Nama Siswa': 'Ali Bin Abu', 'Nama Orang Tua': 'Abu Bakar', 'No WA Siswa': '08123456789', 'No WA Orang Tua': '08987654321' },
            { NIS: '2023002', 'Nama Siswa': 'Siti Aminah', 'Nama Orang Tua': 'Hasan Basri', 'No WA Siswa': '08112233445', 'No WA Orang Tua': '08556677889' }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
        XLSX.writeFile(wb, "Template_Import_Siswa.xlsx");
    };

    const handleFileUpload = (e) => {

        const file = e.target.files[0];
        if (!file) return;

        setUploadLoading(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Transform data: NIS, Nama, Orang Tua, WA
                const students = data.map((item, idx) => ({
                    id: idx + 1,
                    nis: item.NIS || item.nis || 'N/A',
                    name: item.Nama || item['Nama Siswa'] || 'Siswa ' + (idx + 1),
                    parentName: item['Orang Tua'] || item['Nama Orang Tua'] || 'N/A',
                    waStudent: item['No WA Siswa'] || item['WA Siswa'] || '-',
                    waParent: item['No WA Orang Tua'] || item['WA Orang Tua'] || '-',
                    parentLogin: 'OT' + (item.NIS || item.nis || '000')
                }));

                setImportedStudents(students);
                showToast(`${students.length} siswa terdeteksi dari Excel`, 'info');
            } catch (err) {
                showToast('Gagal membaca file Excel. Pastikan format kolom benar (NIS, Nama Siswa, Nama Orang Tua).', 'error');
            } finally {
                setUploadLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploadLoading(true);

        if (currentClass) {
            // Update
            const { data, error } = await supabase
                .from('classes')
                .update({ ...formData })
                .eq('id', currentClass.id)
                .select();

            if (error) {
                showToast('Gagal memperbarui kelas: ' + error.message, 'error');
            } else {
                showToast('Kelas berhasil diperbarui', 'success');
                setClasses(classes.map(c => c.id === currentClass.id ? { ...c, ...formData } : c));
                setIsModalOpen(false);
            }
        } else {
            // Insert
            const { data: newCls, error: clsError } = await supabase
                .from('classes')
                .insert([{
                    ...formData,
                }])
                .select()
                .single();

            if (clsError) {
                showToast('Gagal menambah kelas: ' + clsError.message, 'error');
            } else {
                // If there are imported students, insert them too
                if (importedStudents.length > 0) {
                    const studentsToInsert = importedStudents.map(s => ({
                        nis: s.nis,
                        full_name: s.name,
                        wa_student: s.waStudent,
                        wa_parent: s.waParent,
                        class_id: newCls.id,
                        status: 'Aktif'
                    }));

                    const { error: stdError } = await supabase
                        .from('students')
                        .insert(studentsToInsert);

                    if (stdError) {
                        showToast('Kelas berhasil dibuat, tetapi gagal mengimport siswa: ' + stdError.message, 'warning');
                    } else {
                        showToast(`Kelas ${formData.name} berhasil dibuat dengan ${importedStudents.length} siswa`, 'success');
                    }
                } else {
                    showToast('Kelas berhasil dibuat', 'success');
                }

                setClasses([{ ...newCls, studentsCount: importedStudents.length }, ...classes]);
                setIsModalOpen(false);
            }
        }
        setUploadLoading(false);
    };

    const filteredClasses = classes.filter(c =>
        ((c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.homeroom || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterJurusan === 'Semua' || c.jurusan === filterJurusan)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                     <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Akademik
                        </span>
                    </div>
                    <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight">Manajemen Kelas</h1>
                    <p className="text-sm font-sans font-medium text-gray-500 mt-1">Kelola daftar kelas dan wali kelas masing-masing.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-sans font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>Tambah Kelas</span>
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold" size={18} />
                    <input
                        type="text"
                        placeholder="Cari kelas atau wali kelas..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-sans font-bold text-gray-900 text-sm placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <select
                        className="appearance-none bg-gray-50 border border-transparent px-5 py-3 pr-12 rounded-xl font-sans font-bold text-gray-700 outline-none cursor-pointer text-sm focus:bg-white focus:border-blue-200 transition-all"
                        value={filterJurusan}
                        onChange={(e) => setFilterJurusan(e.target.value)}
                    >
                        <option value="Semua">Semua Jurusan</option>
                        {JURUSAN_LIST.map(j => (
                            <option key={j.name} value={j.name}>{j.name} — {j.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredClasses.map((cls) => (
                    <div key={cls.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-600/5 group hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col">
                        <div
                            className="p-8 text-white relative overflow-hidden"
                            style={{ backgroundColor: getJurusan(cls.jurusan).hex }}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                <Hash size={100} />
                            </div>
                            <div className="flex items-start justify-between relative z-10">
                                <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center text-white shadow-lg">
                                    <Hash size={24} strokeWidth={3} />
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleOpenEdit(cls)}
                                        className="p-2.5 bg-white/10 hover:bg-white text-white hover:text-gray-900 rounded-xl transition-all backdrop-blur-md border border-white/20"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cls.id)}
                                        className="p-2.5 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-all backdrop-blur-md border border-white/20"
                                        title="Hapus"
                                    >
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-4xl font-sans font-black mt-8 tracking-tight uppercase text-white relative z-10 leading-none">{cls.name}</h3>
                            <div className="flex items-center gap-3 mt-3 relative z-10">
                                <span className="bg-black/20 backdrop-blur-sm text-white text-[10px] font-sans font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                                    Tingkat {cls.level}
                                </span>
                                <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-sans font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                                    {cls.jurusan || 'Lain'}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between group-hover:bg-gray-50 p-1 rounded-2xl transition-colors">
                                    <div className="flex items-center text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl mr-3 shadow-sm border border-blue-100/50">
                                            <UserCheck size={16} strokeWidth={2.5} />
                                        </div>
                                        Wali Kelas
                                    </div>
                                    <span className="text-xs font-sans font-black text-gray-900 truncate ml-4 text-right max-w-[150px]">{cls.homeroom?.toUpperCase() || '-'}</span>
                                </div>

                                <div className="flex items-center justify-between group-hover:bg-gray-50 p-1 rounded-2xl transition-colors">
                                    <div className="flex items-center text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl mr-3 shadow-sm border border-emerald-100/50">
                                            <Users size={16} strokeWidth={2.5} />
                                        </div>
                                        Total Siswa
                                    </div>
                                    <span className="text-xs font-sans font-black text-gray-900">{cls.studentsCount || 0} Siswa</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleOpenDetail(cls)}
                                className="w-full mt-4 flex items-center justify-center space-x-2 py-4 bg-gray-900 text-white rounded-2xl font-sans font-black text-xs uppercase tracking-widest transition-all group/btn hover:bg-blue-600 shadow-lg shadow-gray-900/10 hover:shadow-blue-600/20 active:scale-[0.98]"
                            >
                                <span>Lihat Detail Kelas</span>
                                <ArrowRight size={16} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Modal (Bigger for Excel) */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentClass ? 'EDIT KELAS' : 'TAMBAH KELAS & IMPORT SISWA'}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Nama Kelas</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 px-5 py-4 font-sans font-bold text-gray-900 outline-none transition-all placeholder-gray-300"
                                    placeholder="Contoh: X RPL 1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Jurusan</label>
                                <div className="flex gap-3 items-center">
                                    <div className="relative flex-1 group">
                                        <input
                                            list="jurusan-options"
                                            required
                                            className="w-full bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 px-5 py-4 font-sans font-bold text-gray-900 outline-none transition-all placeholder-gray-300"
                                            placeholder="Pilih atau Ketik..."
                                            value={formData.jurusan}
                                            onChange={(e) => setFormData({ ...formData, jurusan: e.target.value.toUpperCase() })}
                                        />
                                        <datalist id="jurusan-options">
                                            {JURUSAN_LIST.map(j => (
                                                <option key={j.name} value={j.name}>{j.name} — {j.label}</option>
                                            ))}
                                        </datalist>
                                    </div>
                                    {/* Preview chip warna */}
                                    {formData.jurusan && (
                                        <div
                                            className="h-14 w-16 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-sans font-black uppercase rounded-2xl shadow-lg"
                                            style={{ backgroundColor: getJurusan(formData.jurusan).hex }}
                                            title={formData.jurusan}
                                        >
                                            {formData.jurusan.substring(0, 4)}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] font-sans font-medium text-gray-400 px-1 italic">
                                    Pilih dari daftar atau ketik jurusan baru
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Wali Kelas</label>
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 px-5 py-4 font-sans font-bold text-gray-900 outline-none transition-all appearance-none cursor-pointer"
                                        value={formData.homeroom}
                                        onChange={(e) => setFormData({ ...formData, homeroom: e.target.value })}
                                    >
                                        <option value="">Pilih Wali Kelas</option>
                                        {dbTeachers.map(t => (
                                            <option key={t.id} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Excel Upload Section (Only for Add) */}
                        {!currentClass && (
                            <div className="space-y-5">
                                <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Import Siswa (Excel)</label>
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className="h-44 bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-[2rem] flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-blue-50 transition-all group relative overflow-hidden"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileUpload}
                                    />
                                    {uploadLoading ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="text-blue-600 animate-spin mb-2" size={32} />
                                            <p className="text-xs font-sans font-bold text-blue-600">Memproses file...</p>
                                        </div>
                                    ) : importedStudents.length > 0 ? (
                                        <>
                                            <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <p className="text-xs font-sans font-black text-emerald-600 uppercase tracking-widest">{importedStudents.length} Siswa Terdeteksi</p>
                                            <button type="button" className="text-[10px] font-sans font-black text-gray-400 hover:text-blue-600 transition-colors uppercase">Ganti File</button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-4 bg-white text-blue-600 rounded-2xl shadow-sm group-hover:scale-110 group-hover:shadow-lg transition-all duration-500 border border-blue-50">
                                                <FileSpreadsheet size={32} strokeWidth={2.5} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-sans font-black text-gray-900 uppercase">Pilih File Excel</p>
                                                <p className="text-[10px] font-sans font-bold text-gray-400 mt-1 uppercase tracking-tight">NIS, Nama, Orang Tua, WA</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center space-x-2 text-[10px] font-sans font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors px-4 py-2"
                                    >
                                        <FileUp size={14} className="rotate-180" strokeWidth={3} />
                                        <span>Download Template Excel</span>
                                    </button>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-2xl text-[10px] text-amber-700 font-sans font-bold leading-relaxed border border-amber-100 flex gap-3 items-start">
                                    <Info size={16} className="shrink-0" />
                                    <span>Sistem akan otomatis membuat akun orang tua dengan format ID: OT + NIS.</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Student List Preview */}
                    {importedStudents.length > 0 && !currentClass && (
                        <div className="bg-gray-50 rounded-[2rem] border border-gray-100 overflow-hidden shadow-inner">
                            <div className="px-6 py-3 bg-gray-900/5 text-[10px] font-sans font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">
                                Preview 5 Siswa Pertama
                            </div>
                            <div className="max-h-40 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {importedStudents.slice(0, 5).map(s => (
                                    <div key={s.id} className="flex items-center justify-between group/row">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-sans font-black text-blue-600 border border-blue-50 shadow-sm">
                                                ID
                                            </div>
                                            <div>
                                                <p className="text-xs font-sans font-black text-gray-900 uppercase leading-none">{s.name}</p>
                                                <p className="text-[10px] font-sans font-bold text-gray-400 mt-1 whitespace-nowrap">NIS: {s.nis} • WA: {s.waStudent}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] font-sans font-black text-gray-700 block uppercase leading-none">{s.parentName}</span>
                                            <span className="text-[10px] font-sans font-bold text-gray-400 mt-1 block">Wali • {s.waParent}</span>
                                        </div>
                                    </div>
                                ))}
                                {importedStudents.length > 5 && (
                                    <div className="flex justify-center pt-2">
                                        <span className="text-[10px] bg-blue-100 text-blue-700 font-sans font-black px-4 py-1.5 rounded-full uppercase tracking-widest transition-all">
                                            +{importedStudents.length - 5} Siswa lainnya
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 font-sans font-bold rounded-2xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] bg-blue-600 text-white font-sans font-bold py-4 rounded-2xl transition-all flex items-center justify-center space-x-3 shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95"
                        >
                            <Save size={18} strokeWidth={3} />
                            <span className="uppercase tracking-widest text-xs">Simpan Kelas & Siswa</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title="Informasi Detail Kelas"
                maxWidth="max-w-md"
            >
                {currentClass && (
                    <div className="space-y-8">
                        <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex flex-col items-center text-center relative overflow-hidden shadow-sm">
                             <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Hash size={120} />
                            </div>
                            <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center text-blue-600 shadow-xl shadow-blue-600/10 border border-blue-50 mb-6 relative z-10">
                                <Hash size={36} strokeWidth={3} />
                            </div>
                            <h4 className="text-4xl font-sans font-black text-gray-900 tracking-tight relative z-10">{currentClass.name}</h4>
                            <div className="flex gap-2 mt-2 relative z-10">
                                <span className="text-[10px] font-sans font-black text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-widest">{getJurusan(currentClass.jurusan).label}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-1">
                                <p className="text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest">Total Siswa</p>
                                <p className="text-xl font-sans font-black text-gray-900">{currentClass.studentsCount || 0} Orang</p>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-1">
                                <p className="text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest">Tingkat</p>
                                <p className="text-xl font-sans font-black text-gray-900">{currentClass.level}</p>
                            </div>
                        </div>

                        <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-5 group hover:border-blue-200 transition-all">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <UserCheck size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest mb-0.5">Wali Kelas</p>
                                <p className="text-sm font-sans font-black text-gray-900 uppercase tracking-tight">{currentClass.homeroom || '-'}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setIsDetailOpen(false);
                                navigate('/admin/students', { state: { filterClass: currentClass.name } });
                            }}
                            className="w-full flex items-center justify-center space-x-3 py-4 bg-blue-600 text-white rounded-2xl font-sans font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95"
                        >
                            <Info size={18} strokeWidth={3} />
                            <span>Buka Daftar Siswa</span>
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
