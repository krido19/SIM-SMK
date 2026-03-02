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




const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-paper border-4 border-ink shadow-[12px_12px_0px_0px_#111111] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-6 py-4 border-b-4 border-ink flex items-center justify-between bg-gray-50">
                    <h3 className="text-xl font-black text-ink uppercase tracking-widest font-serif">{title}</h3>
                    <button onClick={onClose} className="p-2 border-2 border-transparent hover:border-ink text-ink transition-all">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>
                <div className="p-6">
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
                    homeroom
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
                    waStudent: s.wa_student,
                    waParent: s.wa_parent
                };
            });
            setStudents(transformedData);
        }
        setIsLoading(false);
    };

    const fetchDbClasses = async () => {
        const { data, error } = await supabase.from('classes').select('id, name');
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
            setSelectedIds(paginatedStudents.map(s => s.id));
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
                full_name: r['Nama Lengkap'] || r['nama'] || r['name'] || '',
                nis: String(r['NIS'] || r['nis'] || ''),
                class_name: r['Kelas'] || r['kelas'] || '',
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
            const cls = dbClasses.find(c => c.name.toLowerCase() === row.class_name.toLowerCase());
            const payload = {
                full_name: row.full_name,
                nis: row.nis,
                class_id: cls?.id || null,
                email: row.email,
                wa_student: row.wa_student,
                wa_parent: row.wa_parent,
                status: row.status,
            };
            const { error } = await supabase.from('students').insert([payload]);
            if (error) errorCount++;
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
        const template = [{ 'Nama Lengkap': 'Contoh Siswa', 'NIS': '12345', 'Kelas': 'X DKV', 'Email': 'siswa@email.com', 'WA Siswa': '08123456789', 'WA Orang Tua': '08198765432', 'Status': 'Aktif' }];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-ink pb-6">
                <div>
                    <h1 className="text-4xl font-black text-ink font-serif tracking-tight uppercase">DIREKTORI SISWA</h1>
                    <p className="text-sm text-gray-600 font-mono uppercase tracking-widest mt-2 block">Registrasi Lengkap Siswa Terdaftar</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* Download Template */}
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center space-x-2 bg-paper text-ink border-2 border-ink px-4 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                        title="Download Template Excel"
                    >
                        <FileSpreadsheet size={16} />
                        <span>TEMPLATE</span>
                    </button>
                    {/* Import */}
                    <label className="flex items-center space-x-2 bg-paper text-ink border-2 border-ink px-4 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer">
                        <Upload size={16} />
                        <span>IMPORT</span>
                        <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
                    </label>
                    {/* Export */}
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 bg-paper text-ink border-2 border-ink px-4 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    >
                        <Download size={16} />
                        <span>EXPORT</span>
                    </button>
                    {/* Tambah */}
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center space-x-2 bg-ink text-paper border-2 border-ink px-4 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-paper hover:text-ink"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span>TAMBAH SISWA</span>
                    </button>
                </div>
            </div>

            {/* Advanced Filters & Search */}
            <div className="bg-paper p-6 border-2 border-ink shadow-[8px_8px_0px_0px_#111111] space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="CARI SISWA BERDASARKAN NAMA ATAU NIS..."
                            className="block w-full pl-12 pr-4 py-4 bg-paper border-2 border-ink text-ink font-mono text-sm uppercase tracking-widest outline-none focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative group min-w-[200px]">
                            <select
                                className="w-full appearance-none bg-paper border-2 border-ink px-4 py-4 pr-10 text-ink font-mono text-sm uppercase tracking-widest outline-none cursor-pointer focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                value={filterClass}
                                onChange={(e) => setFilterClass(e.target.value)}
                            >
                                <option value="Semua">KELAS: SEMUA</option>
                                {dbClasses.map(c => <option key={c.id} value={c.name}>KELAS: {c.name}</option>)}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink pointer-events-none" />
                        </div>
                        <div className="relative group min-w-[200px]">
                            <select
                                className="w-full appearance-none bg-paper border-2 border-ink px-4 py-4 pr-10 text-ink font-mono text-sm uppercase tracking-widest outline-none cursor-pointer focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                {statuses.map(s => <option key={s} value={s}>STATUS: {s.toUpperCase()}</option>)}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Bulk Action Bar (Floating indicator style) */}
                {selectedIds.length > 0 && (
                    <div className="bg-ink text-paper px-6 py-4 border-2 border-ink flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <div className="flex items-center space-x-4">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest">{selectedIds.length} SISWA DIPILIH</span>
                            <div className="h-4 w-[2px] bg-paper/20" />
                            <button
                                onClick={() => setSelectedIds([])}
                                className="text-xs font-mono font-bold text-gray-400 hover:text-paper transition-colors"
                            >
                                BATAL
                            </button>
                        </div>
                        <button
                            onClick={handleBulkDelete}
                            className="bg-editorial hover:bg-red-800 text-paper px-6 py-2 text-xs font-mono font-bold flex items-center space-x-2 transition-colors border-2 border-paper"
                        >
                            <Trash size={14} />
                            <span>HAPUS TERPILIH</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Table with Sticky Header */}
            <div className="bg-paper border-2 border-ink shadow-[8px_8px_0px_0px_#111111] overflow-hidden flex flex-col transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-ink text-paper border-b-4 border-ink">
                                <th className="px-6 py-4 w-10 border-r-2 border-paper/20">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 border-2 border-paper bg-transparent text-ink focus:ring-0 cursor-pointer appearance-none checked:bg-paper checked:relative checked:before:content-['✓'] checked:before:absolute checked:before:text-ink checked:before:font-black checked:before:text-sm checked:before:left-1/2 checked:before:top-1/2 checked:before:-translate-x-1/2 checked:before:-translate-y-1/2"
                                        checked={selectedIds.length === paginatedStudents.length && paginatedStudents.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 border-r-2 border-paper/20 cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => toggleSort('name')}>
                                    <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-widest">
                                        <span>NAMA SISWA</span>
                                        <ArrowUpDown size={14} className={sortConfig.key === 'name' ? 'text-paper' : 'text-gray-500'} />
                                    </div>
                                </th>
                                <th className="px-6 py-4 border-r-2 border-paper/20 cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => toggleSort('nis')}>
                                    <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-widest">
                                        <span>ID (NIS)</span>
                                        <ArrowUpDown size={14} className={sortConfig.key === 'nis' ? 'text-paper' : 'text-gray-500'} />
                                    </div>
                                </th>
                                <th className="px-6 py-4 border-r-2 border-paper/20 text-xs font-mono font-bold uppercase tracking-widest">KELAS</th>
                                <th className="px-6 py-4 border-r-2 border-paper/20 cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => toggleSort('homeroom')}>
                                    <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-widest">
                                        <span>WALI KELAS</span>
                                        <ArrowUpDown size={14} className={sortConfig.key === 'homeroom' ? 'text-paper' : 'text-gray-500'} />
                                    </div>
                                </th>
                                <th className="px-6 py-4 border-r-2 border-paper/20 text-xs font-mono font-bold uppercase tracking-widest text-center">KONTAK</th>
                                <th className="px-6 py-4 border-r-2 border-paper/20 text-xs font-mono font-bold uppercase tracking-widest">STATUS</th>
                                <th className="px-6 py-4 text-center text-xs font-mono font-bold uppercase tracking-widest">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-ink">
                            {paginatedStudents.length > 0 ? (
                                paginatedStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        className={`hover:bg-gray-100 transition-colors group ${selectedIds.includes(student.id) ? 'bg-gray-200' : ''}`}
                                    >
                                        <td className="px-6 py-4 border-r-2 border-ink">
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 border-2 border-ink bg-transparent text-ink focus:ring-0 cursor-pointer appearance-none checked:bg-ink checked:relative checked:before:content-['✓'] checked:before:absolute checked:before:text-paper checked:before:font-black checked:before:text-sm checked:before:left-1/2 checked:before:top-1/2 checked:before:-translate-x-1/2 checked:before:-translate-y-1/2"
                                                checked={selectedIds.includes(student.id)}
                                                onChange={() => handleSelectOne(student.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 border-r-2 border-ink">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-10 w-10 bg-paper border-2 border-ink flex items-center justify-center text-ink font-serif font-black shadow-[2px_2px_0px_0px_#111111]">
                                                    {student.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-ink font-serif uppercase">{student.name}</p>
                                                    <p className="text-[10px] font-mono font-bold text-gray-500 mt-0.5">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r-2 border-ink text-sm font-mono font-bold text-ink">{student.nis}</td>
                                        <td className="px-6 py-4 border-r-2 border-ink">
                                            <span className="px-2 py-1 bg-paper text-ink text-[10px] font-mono font-bold uppercase tracking-wider border-2 border-ink shadow-[2px_2px_0px_0px_#111111]">
                                                {student.class}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 border-r-2 border-ink">
                                            <span className="text-xs font-mono font-bold text-ink uppercase">
                                                {student.homeroom}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 border-r-2 border-ink">
                                            <div className="flex flex-col space-y-2">
                                                <div className="flex items-center justify-between min-w-[120px]">
                                                    <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">SISWA:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-[10px] font-mono font-bold text-ink">{student.waStudent || '-'}</span>
                                                        {student.waStudent && student.waStudent !== '-' && (
                                                            <button
                                                                onClick={() => sendWhatsApp(student.waStudent, `Halo ${student.name}, ada pesan dari sekolah...`, showToast)}
                                                                className="text-ink hover:text-blue-600 transition-colors"
                                                                title="Hubungi Siswa"
                                                            >
                                                                <MessageCircle size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between min-w-[120px]">
                                                    <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">ORTU:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-[10px] font-mono font-bold text-ink">{student.waParent || '-'}</span>
                                                        {student.waParent && student.waParent !== '-' && (
                                                            <button
                                                                onClick={() => sendWhatsApp(student.waParent, `Halo Orang Tua dari ${student.name}, ada pengumuman penting...`, showToast)}
                                                                className="text-ink hover:text-blue-600 transition-colors"
                                                                title="Hubungi Orang Tua"
                                                            >
                                                                <MessageCircle size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r-2 border-ink text-center">
                                            <span className={`px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-widest border-2 border-ink ${student.status === 'Aktif'
                                                ? 'bg-paper text-ink shadow-[2px_2px_0px_0px_#111111]'
                                                : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => handleOpenEdit(student)}
                                                    className="p-2 bg-paper text-ink hover:bg-ink hover:text-paper border-2 border-ink transition-colors shadow-[2px_2px_0px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student.id)}
                                                    className="p-2 bg-paper text-editorial hover:bg-editorial hover:text-paper border-2 border-editorial transition-colors shadow-[2px_2px_0px_0px_#CC0000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-20 text-center text-ink font-mono font-bold uppercase tracking-widest text-xs border-r-2 border-ink">
                                        TIDAK ADA DATA DITEMUKAN
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-6 bg-paper border-t-4 border-ink flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <p className="text-xs font-mono font-bold text-ink uppercase tracking-widest">BARIS PER HALAMAN:</p>
                        <select
                            className="bg-transparent border-2 border-ink text-sm text-ink font-mono font-bold outline-none cursor-pointer py-1 px-2"
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
                            className="p-2 bg-paper border-2 border-ink text-ink hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-paper disabled:hover:text-ink transition-colors shadow-[2px_2px_0px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center px-4 py-2 bg-paper border-2 border-ink">
                            <span className="text-xs font-mono font-bold text-ink uppercase tracking-widest">HALAMAN {currentPage} DARI {totalPages || 1}</span>
                        </div>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 bg-paper border-2 border-ink text-ink hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-paper disabled:hover:text-ink transition-colors shadow-[2px_2px_0px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">
                        MENAMPILKAN {paginatedStudents.length} DARI {processedStudents.length} SISWA
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentStudent ? 'EDIT DATA SISWA' : 'DAFTARKAN SISWA BARU'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">NAMA LENGKAP</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink">
                                <UserCircle size={18} />
                            </div>
                            <input
                                required
                                type="text"
                                className="w-full bg-paper border-2 border-ink pl-12 pr-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">NIS</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink">
                                    <Hash size={18} />
                                </div>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-paper border-2 border-ink pl-12 pr-4 py-4 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                    value={formData.nis}
                                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">ALAMAT EMAIL</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink">
                                    <Mail size={18} />
                                </div>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-paper border-2 border-ink pl-12 pr-4 py-4 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                    placeholder="siswa@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">WA SISWA</label>
                            <input
                                type="text"
                                className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                placeholder="62812... ATAU -"
                                value={formData.waStudent}
                                onChange={(e) => setFormData({ ...formData, waStudent: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">WA ORANG TUA</label>
                            <input
                                type="text"
                                className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                placeholder="62812... ATAU -"
                                value={formData.waParent}
                                onChange={(e) => setFormData({ ...formData, waParent: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">KELAS</label>
                            <div className="relative group">
                                <select
                                    className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all appearance-none cursor-pointer"
                                    value={formData.class_id}
                                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                >
                                    {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">STATUS</label>
                            <div className="relative group">
                                <select
                                    className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all appearance-none cursor-pointer"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    {statuses.filter(s => s !== 'Semua').map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-ink hover:bg-paper text-paper hover:text-ink font-mono font-bold py-4 border-2 border-ink transition-colors flex items-center justify-center space-x-2 shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#111111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none mt-6"
                    >
                        <Save size={20} />
                        <span className="uppercase tracking-widest text-xs">SIMPAN DATA SISWA</span>
                    </button>
                </form>
            </Modal>

            {/* ─── IMPORT PREVIEW MODAL ─────────────────── */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-paper border-4 border-ink shadow-[12px_12px_0px_0px_#111111] w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b-4 border-ink flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="text-xl font-black text-ink uppercase tracking-widest font-serif">PREVIEW IMPORT SISWA</h3>
                                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">{importPreview.length} BARIS SIAP DIIMPOR</p>
                            </div>
                            <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }} className="p-2 border-2 border-transparent hover:border-ink text-ink transition-all">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="p-4 max-h-[55vh] overflow-y-auto">
                            <table className="w-full text-left border-collapse border-2 border-ink">
                                <thead>
                                    <tr className="bg-ink text-paper">
                                        {['Nama Lengkap', 'NIS', 'Kelas', 'Email', 'Status'].map(h => (
                                            <th key={h} className="px-3 py-2 text-[9px] font-mono font-bold uppercase tracking-widest border-r border-paper/30 last:border-r-0">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink">
                                    {importPreview.map((row, i) => (
                                        <tr key={i} className={i % 2 === 0 ? 'bg-paper' : 'bg-gray-50'}>
                                            <td className="px-3 py-2 text-xs font-mono font-bold text-ink border-r border-ink uppercase">{row.full_name}</td>
                                            <td className="px-3 py-2 text-xs font-mono text-ink border-r border-ink">{row.nis}</td>
                                            <td className="px-3 py-2 text-xs font-mono text-ink border-r border-ink uppercase">{row.class_name}</td>
                                            <td className="px-3 py-2 text-xs font-mono text-gray-600 border-r border-ink">{row.email}</td>
                                            <td className="px-3 py-2 text-xs font-mono text-ink uppercase">{row.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t-4 border-ink flex items-center justify-between bg-gray-50">
                            <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                <AlertTriangle size={14} className="text-yellow-600" />
                                <span>PASTIKAN NAMA KELAS PERSIS SAMA DENGAN DATA DI SISTEM</span>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }}
                                    className="px-6 py-3 border-2 border-ink text-ink font-mono font-bold text-xs uppercase tracking-widest hover:bg-ink hover:text-paper transition-all"
                                >
                                    BATAL
                                </button>
                                <button
                                    onClick={handleImportSubmit}
                                    disabled={isImporting}
                                    className="px-6 py-3 bg-ink text-paper border-2 border-ink font-mono font-bold text-xs uppercase tracking-widest flex items-center space-x-2 shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                                >
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
