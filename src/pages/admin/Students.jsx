import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { sendWhatsApp } from '../../utils/fonnte';
import { useFeedback } from '../../context/FeedbackContext';
import * as XLSX from 'xlsx';
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    X,
    Save,
    CheckCircle2,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Check,
    ChevronDown,
    Trash,
    UserCircle,
    Mail,
    Hash,
    MessageCircle,
    Download,
    Upload,
    FileSpreadsheet,
    AlertTriangle
} from 'lucide-react';

// Daftar jurusan dengan warna khas — HARUS SINKRON dengan Classes.jsx
const JURUSAN_LIST = [
    { name: 'TKP',    label: 'Tek. Konstruksi & Perumahan',  hex: '#f97316' },
    { name: 'TKR',    label: 'Tek. Kendaraan Ringan',        hex: '#2563eb' },
    { name: 'RPL',    label: 'Rekayasa Perangkat Lunak',     hex: '#7c3aed' },
    { name: 'TKJ',    label: 'Tek. Komputer & Jaringan',     hex: '#0891b2' },
    { name: 'AKL',    label: 'Akuntansi & Keuangan',         hex: '#059669' },
    { name: 'OTKP',   label: 'Otomatisasi Tata Kelola',      hex: '#db2777' },
    { name: 'BDP',    label: 'Bisnis Daring & Pemasaran',    hex: '#d97706' },
    { name: 'LISTRIK',label: 'Teknik Ketenagalistrikan',     hex: '#ca8a04' },
    { name: 'ELE',    label: 'Teknik Elektronika',           hex: '#16a34a' },
    { name: 'TPM',    label: 'Teknik Pemesinan',             hex: '#0f766e' },
    { name: 'DPIB',   label: 'Desain Pemodelan & Inf. Bang.',hex: '#9333ea' },
    { name: 'TITL',   label: 'Tek. Instalasi Tenaga Listrik',hex: '#b45309' },
    { name: 'TAB',    label: 'Teknik Audio Video',           hex: '#0369a1' },
];
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
const getJurusan = (name = '') => {
    const found = JURUSAN_LIST.find(j => j.name.toUpperCase() === (name || '').toUpperCase());
    return found ?? { name, label: name, hex: hashColor(name) };
};




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

export default function Students() {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null);
    const [formData, setFormData] = useState({ name: '', nis: '', class_id: '', email: '', waStudent: '', waParent: '', status: 'Aktif' });
    const [isLoading, setIsLoading] = useState(true);
    const { showToast, showConfirm } = useFeedback();
    const [dbClasses, setDbClasses] = useState([]);

    // New State for Advanced Features
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filterClass, setFilterClass] = useState('Semua');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importPreview, setImportPreview] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const importFileRef = useRef(null);
    const statuses = ['Semua', 'Aktif', 'Izin', 'Sakit', 'Alpa', 'Lulus'];
    const location = useLocation();

    useEffect(() => {
        fetchStudents();
        fetchDbClasses();
    }, []);

    useEffect(() => {
        if (location.state && location.state.filterClass) {
            setFilterClass(location.state.filterClass);
            setCurrentPage(1);
        }
    }, [location]);

    const fetchStudents = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                classes (
                    name,
                    homeroom,
                    jurusan
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching students:', error);
        } else {
            const transformedData = data.map(s => {
                const classObj = s.classes;
                return {
                    ...s,
                    name: s.full_name,
                    class: classObj?.name || 'Unassigned',
                    homeroom: classObj?.homeroom || '-',
                    jurusan: classObj?.jurusan || 'Lain',
                    waStudent: s.wa_student,
                    waParent: s.wa_parent
                };
            });
            setStudents(transformedData);
        }
        setIsLoading(false);
    };

    const fetchDbClasses = async () => {
        const { data, error } = await supabase.from('classes').select('id, name, jurusan');
        if (!error) {
            setDbClasses(data || []);
        }
    };

    const handleOpenAdd = () => {
        setCurrentStudent(null);
        setFormData({ name: '', nis: '', class_id: dbClasses[0]?.id || '', email: '', waStudent: '', waParent: '', status: 'Aktif' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (student) => {
        setCurrentStudent(student);
        setFormData({
            name: student.name,
            nis: student.nis,
            class_id: student.class_id || '',
            email: student.email,
            waStudent: student.waStudent || '',
            waParent: student.waParent || '',
            status: student.status
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(
            'Hapus Siswa',
            'Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan.',
            'danger'
        );

        if (confirmed) {
            const { error } = await supabase.from('students').delete().eq('id', id);
            if (!error) {
                showToast('Data siswa berhasil dihapus', 'success');
                setStudents(students.filter(s => s.id !== id));
                setSelectedIds(selectedIds.filter(sid => sid !== id));
            } else {
                showToast('Gagal menghapus: ' + error.message, 'error');
            }
        }
    };

    const handleBulkDelete = async () => {
        const confirmed = await showConfirm(
            'Hapus Banyak Siswa',
            `Apakah Anda yakin ingin menghapus ${selectedIds.length} siswa terpilih? Tindakan ini tidak dapat dibatalkan.`,
            'danger'
        );

        if (confirmed) {
            const { error } = await supabase.from('students').delete().in('id', selectedIds);
            if (!error) {
                showToast(`${selectedIds.length} siswa berhasil dihapus`, 'success');
                setStudents(students.filter(s => !selectedIds.includes(s.id)));
                setSelectedIds([]);
            } else {
                showToast('Gagal menghapus bulk: ' + error.message, 'error');
            }
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(processedStudents.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            nis: formData.nis,
            full_name: formData.name,
            email: formData.email,
            class_id: formData.class_id,
            wa_student: formData.waStudent || '-',
            wa_parent: formData.waParent || '-',
            status: formData.status
        };

        if (currentStudent) {
            const { error } = await supabase
                .from('students')
                .update(payload)
                .eq('id', currentStudent.id);

            if (error) {
                showToast('Gagal memperbarui siswa: ' + error.message, 'error');
            } else {
                showToast('Data siswa berhasil diperbarui', 'success');
                fetchStudents();
                setIsModalOpen(false);
            }
        } else {
            const { error } = await supabase
                .from('students')
                .insert([payload]);

            if (error) {
                showToast('Gagal menambah siswa: ' + error.message, 'error');
            } else {
                showToast('Siswa baru berhasil didaftarkan', 'success');
                fetchStudents();
                setIsModalOpen(false);
            }
        }
        setIsLoading(false);
    };

    // Processing: Search -> Filter -> Sort -> Paginate
    const processedStudents = useMemo(() => {
        let result = students.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.nis.includes(searchTerm) ||
            (s.homeroom && s.homeroom.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (filterClass !== 'Semua') {
            result = result.filter(s => s.class === filterClass);
        }

        if (filterStatus !== 'Semua') {
            result = result.filter(s => s.status === filterStatus);
        }

        result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return result;
    }, [students, searchTerm, filterClass, filterStatus, sortConfig]);

    const totalPages = Math.ceil(processedStudents.length / pageSize);
    const paginatedStudents = processedStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const toggleSort = (key) => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
        });
    };

    // ── EXPORT ──────────────────────────────────────────────
    const handleExport = () => {
        const exportData = students.map((s, i) => ({
            'No': i + 1,
            'Nama Lengkap': s.name,
            'NIS': s.nis,
            'Kelas': s.class || '',
            'Email': s.email || '',
            'WA Siswa': s.waStudent || '',
            'WA Orang Tua': s.waParent || '',
            'Status': s.status || 'Aktif',
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
        XLSX.writeFile(wb, `Data_Siswa_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`);
        showToast('Data siswa berhasil diekspor ke Excel', 'success');
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
                full_name: r['Nama Lengkap'] || r['Nama'] || r['nama'] || r['name'] || '',
                nis: String(r['NIS'] || r['nis'] || ''),
                class_name: String(r['Kelas'] || r['kelas'] || '').trim(),
                email: r['Email'] || r['email'] || '',
                wa_student: String(r['WA Siswa'] || r['wa_siswa'] || '-'),
                wa_parent: String(r['WA Orang Tua'] || r['wa_ortu'] || '-'),
                status: r['Status'] || r['status'] || 'Aktif',
            })).filter(r => r.full_name);
            setImportPreview(mapped);
            setIsImportModalOpen(true);
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    // ── IMPORT SUBMIT ─────────────────────────────────────────
    const handleImportSubmit = async () => {
        setIsImporting(true);
        let successCount = 0;
        let errorCount = 0;
        for (const row of importPreview) {
            // resolve class_id from class_name
            const cleanClassName = (row.class_name || '').replace(/\s+/g, '').toLowerCase();
            const cls = dbClasses.find(c => c.name.replace(/\s+/g, '').toLowerCase() === cleanClassName);
            
            const payload = {
                full_name: row.full_name,
                nis: row.nis,
                class_id: cls?.id || null,
                email: row.email,
                wa_student: row.wa_student,
                wa_parent: row.wa_parent,
                status: row.status,
            };
            const { error } = await supabase.from('students').upsert([payload], { onConflict: 'nis' });
            if (error) {
                console.error("Import error details:", error);
                errorCount++;
            }
            else successCount++;
        }
        setIsImporting(false);
        setIsImportModalOpen(false);
        setImportPreview([]);
        fetchStudents();
        showToast(`Import selesai: ${successCount} berhasil, ${errorCount} gagal`, errorCount > 0 ? 'warning' : 'success');
    };

    // ── DOWNLOAD TEMPLATE ──────────────────────────────────────
    const handleDownloadTemplate = () => {
        const template = [{ 'Nama Lengkap': 'Contoh Siswa', 'NIS': '12345', 'Kelas': 'X RPL 1', 'Wali Kelas': 'Budi Santoso', 'Email': 'siswa@email.com', 'WA Siswa': '08123456789', 'WA Orang Tua': '08198765432', 'Status': 'Aktif' }];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
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
                    <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight">Direktori Siswa</h1>
                    <p className="text-sm font-sans font-medium text-gray-500 mt-1">Registrasi Lengkap Siswa Terdaftar</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-sans font-bold text-xs hover:bg-gray-50 transition-all shadow-sm"
                        title="Download Template Excel"
                    >
                        <FileSpreadsheet size={16} className="text-emerald-600" />
                        <span>Template</span>
                    </button>
                    <label className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-sans font-bold text-xs hover:bg-gray-50 transition-all shadow-sm cursor-pointer">
                        <Upload size={16} className="text-blue-600" />
                        <span>Import</span>
                        <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
                    </label>
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-sans font-bold text-xs hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Download size={16} className="text-gray-600" />
                        <span>Export</span>
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-sans font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>Tambah Siswa</span>
                    </button>
                </div>
            </div>

            {/* Advanced Filters & Search */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari siswa berdasarkan Nama atau NIS..."
                            className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-sans text-sm outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative min-w-[200px]">
                            <select
                                className="w-full appearance-none bg-gray-50 border border-transparent px-4 py-3 pr-10 rounded-xl text-gray-900 font-sans font-bold text-xs uppercase tracking-wider outline-none cursor-pointer focus:bg-white focus:border-blue-200 transition-all"
                                value={filterClass}
                                onChange={(e) => setFilterClass(e.target.value)}
                            >
                                <option value="Semua">Semua Kelas</option>
                                {dbClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="relative min-w-[200px]">
                            <select
                                className="w-full appearance-none bg-gray-50 border border-transparent px-4 py-3 pr-10 rounded-xl text-gray-900 font-sans font-bold text-xs uppercase tracking-wider outline-none cursor-pointer focus:bg-white focus:border-blue-200 transition-all"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="bg-blue-600 text-white px-6 py-4 rounded-xl border border-blue-500 flex items-center justify-between animate-in slide-in-from-bottom-2 shadow-lg shadow-blue-600/20">
                        <div className="flex items-center space-x-4">
                            <span className="text-xs font-sans font-black uppercase tracking-widest">{selectedIds.length} Siswa Terpilih</span>
                            <div className="h-4 w-[1px] bg-white/20" />
                            <button
                                onClick={() => setSelectedIds([])}
                                className="text-xs font-sans font-bold text-blue-100 hover:text-white transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                        <button
                            onClick={handleBulkDelete}
                            className="bg-white text-rose-600 px-6 py-2 rounded-lg text-xs font-sans font-black flex items-center space-x-2 transition-all hover:bg-rose-50 active:scale-95 shadow-sm"
                        >
                            <Trash size={14} />
                            <span>Hapus Terpilih</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Table with Sticky Header */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] uppercase font-sans font-black text-gray-400 tracking-widest border-b border-gray-100">
                                <th className="px-6 py-5 w-10">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={selectedIds.length === processedStudents.length && processedStudents.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </div>
                                </th>
                                <th className="px-6 py-5 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => toggleSort('name')}>
                                    <div className="flex items-center space-x-2">
                                        <span>Nama Siswa</span>
                                        <ArrowUpDown size={14} className={sortConfig.key === 'name' ? 'text-blue-600' : 'text-gray-300'} />
                                    </div>
                                </th>
                                <th className="px-6 py-5 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => toggleSort('nis')}>
                                    <div className="flex items-center space-x-2">
                                        <span>ID (NIS)</span>
                                        <ArrowUpDown size={14} className={sortConfig.key === 'nis' ? 'text-blue-600' : 'text-gray-300'} />
                                    </div>
                                </th>
                                <th className="px-6 py-5">Kelas</th>
                                <th className="px-6 py-5 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => toggleSort('homeroom')}>
                                    <div className="flex items-center space-x-2">
                                        <span>Wali Kelas</span>
                                        <ArrowUpDown size={14} className={sortConfig.key === 'homeroom' ? 'text-blue-600' : 'text-gray-300'} />
                                    </div>
                                </th>
                                <th className="px-6 py-5 text-center">Kontak</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedStudents.length > 0 ? (
                                paginatedStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        className={`hover:bg-blue-50/30 transition-colors group ${selectedIds.includes(student.id) ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={selectedIds.includes(student.id)}
                                                onChange={() => handleSelectOne(student.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-sans font-black text-xs shadow-sm">
                                                    {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-sans font-black text-gray-900 leading-none">{student.name}</p>
                                                    <p className="text-[10px] font-sans font-bold text-gray-400 mt-1">{student.email || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-sans font-black text-blue-600">{student.nis}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[9px] font-sans font-black uppercase rounded-md">
                                                    {student.class}
                                                </span>
                                                <span
                                                    className="px-2 py-0.5 text-white text-[9px] font-sans font-black uppercase rounded-md shadow-sm"
                                                    style={{ backgroundColor: getJurusan(student.jurusan).hex }}
                                                >
                                                    {student.jurusan || 'Lain'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-sans font-bold text-gray-700">
                                                {student.homeroom}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col space-y-2">
                                                <div className="flex items-center justify-between min-w-[120px]">
                                                    <span className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-wider">SISWA:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-[10px] font-sans font-black text-gray-700">{student.waStudent || '-'}</span>
                                                        {student.waStudent && student.waStudent !== '-' && (
                                                            <button
                                                                onClick={() => sendWhatsApp(student.waStudent, `Halo ${student.name}, ada pesan dari sekolah...`, showToast)}
                                                                className="text-emerald-500 hover:text-emerald-600 transition-colors p-1 bg-emerald-50 rounded-md"
                                                                title="Hubungi Siswa"
                                                            >
                                                                <MessageCircle size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between min-w-[120px]">
                                                    <span className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-wider">ORTU:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-[10px] font-sans font-black text-gray-700">{student.waParent || '-'}</span>
                                                        {student.waParent && student.waParent !== '-' && (
                                                            <button
                                                                onClick={() => sendWhatsApp(student.waParent, `Halo Orang Tua dari ${student.name}, ada pengumuman penting...`, showToast)}
                                                                className="text-blue-500 hover:text-blue-600 transition-colors p-1 bg-blue-50 rounded-md"
                                                                title="Hubungi Orang Tua"
                                                            >
                                                                <MessageCircle size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[9px] font-sans font-black uppercase rounded-full shadow-sm ${student.status === 'Aktif'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => handleOpenEdit(student)}
                                                    className="p-2 bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm border border-gray-50"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student.id)}
                                                    className="p-2 bg-white text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-gray-50"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-4 bg-gray-50 rounded-full text-gray-300">
                                                <Search size={32} />
                                            </div>
                                            <p className="text-xs font-sans font-black text-gray-400 uppercase tracking-widest">Tidak ada data ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <p className="text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest">Rows per page:</p>
                        <select
                            className="bg-white border border-gray-200 rounded-lg text-xs font-sans font-black text-gray-700 py-1.5 px-3 outline-none cursor-pointer focus:border-blue-200 transition-all shadow-sm"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition-all shadow-sm active:scale-90"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center px-6 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <span className="text-[10px] font-sans font-black text-gray-900 uppercase tracking-widest">Halaman {currentPage} <span className="text-gray-300 mx-2">/</span> {totalPages || 1}</span>
                        </div>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition-all shadow-sm active:scale-90"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                        Total {processedStudents.length} Siswa
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentStudent ? 'Edit Data Siswa' : 'Daftarkan Siswa Baru'}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Nama Lengkap Siswa</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-blue-600 transition-colors">
                                <UserCircle size={18} />
                            </div>
                            <input
                                required
                                type="text"
                                placeholder="Masukkan nama lengkap"
                                className="w-full bg-gray-50 border border-transparent rounded-2xl pl-12 pr-4 py-4 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">NIS</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                                    <Hash size={18} />
                                </div>
                                <input
                                    required
                                    type="text"
                                    placeholder="Nomor Induk Siswa"
                                    className="w-full bg-gray-50 border border-transparent rounded-2xl pl-12 pr-4 py-4 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
                                    value={formData.nis}
                                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Alamat Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                                    <Mail size={18} />
                                </div>
                                <input
                                    required
                                    type="email"
                                    placeholder="siswa@domain.com"
                                    className="w-full bg-gray-50 border border-transparent rounded-2xl pl-12 pr-4 py-4 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">WhatsApp Siswa</label>
                            <input
                                type="text"
                                placeholder="628..."
                                className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
                                value={formData.waStudent}
                                onChange={(e) => setFormData({ ...formData, waStudent: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">WhatsApp Orang Tua</label>
                            <input
                                type="text"
                                placeholder="628..."
                                className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
                                value={formData.waParent}
                                onChange={(e) => setFormData({ ...formData, waParent: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Pilih Kelas</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
                                    value={formData.class_id}
                                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                >
                                    {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Status</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    {statuses.filter(s => s !== 'Semua').map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 font-sans font-bold rounded-2xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] bg-blue-600 text-white font-sans font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Save size={18} />
                            <span className="uppercase tracking-widest text-xs">Simpan Data Siswa</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Import Preview Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100 bg-gray-50/30">
                            <div>
                                <h3 className="text-xl font-sans font-black text-gray-900">Preview Import Siswa</h3>
                                <p className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mt-1">{importPreview.length} Baris Data Ditemukan</p>
                            </div>
                            <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="p-0 max-h-[50vh] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-[10px] uppercase font-sans font-bold text-gray-400 tracking-widest sticky top-0 bg-white border-b border-gray-100 z-10">
                                    <tr>
                                        {['Nama Lengkap', 'NIS', 'Kelas', 'Email', 'Status'].map(h => (
                                            <th key={h} className="p-5">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs font-sans">
                                    {importPreview.map((row, i) => (
                                        <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-5 font-black text-gray-900 uppercase">{row.full_name}</td>
                                            <td className="p-5 font-black text-blue-600">{row.nis}</td>
                                            <td className="p-5 font-bold text-gray-700 uppercase">{row.class_name}</td>
                                            <td className="p-5 text-gray-400">{row.email}</td>
                                            <td className="p-5">
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase tracking-wider">{row.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 text-xs font-sans font-bold text-blue-600">
                                <AlertTriangle size={18} />
                                <span>Note: NIK duplikat akan diperbarui secara otomatis.</span>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }}
                                    className="flex-1 md:flex-none px-8 py-3 bg-white border border-gray-100 rounded-xl font-sans font-bold text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleImportSubmit}
                                    disabled={isImporting}
                                    className="flex-1 md:flex-none px-8 py-3 bg-blue-600 text-white rounded-xl font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {isImporting ? <span className="animate-spin" /> : <Upload size={16} />}
                                    <span>{isImporting ? 'Memproses...' : `Konfirmasi Import`}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
