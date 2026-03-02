import React, { useState, useEffect, useRef } from 'react';
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
    Mail,
    Phone,
    BookOpen,
    ArrowUpDown,
    X,
    Save,
    CheckCircle2,
    ChevronDown,
    MessageCircle,
    FileSpreadsheet,
    FileUp,
    Info,
    Loader2,
    Download,
    Upload,
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
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const [formData, setFormData] = useState({ name: '', nip: '', specialty: 'Matematika', email: '', status: 'Aktif', wa_number: '' });
    const [filterSpecialty, setFilterSpecialty] = useState('Semua');
    const [isLoading, setIsLoading] = useState(true);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [importedTeachers, setImportedTeachers] = useState([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importPreview, setImportPreview] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const importFileRef = useRef(null);
    const { showToast, showConfirm } = useFeedback();
    const fileInputRef = useRef(null);
    const [dbSpecialties, setDbSpecialties] = useState(['Matematika', 'Bahasa Indonesia', 'Fisika', 'Biologi', 'Informatika', 'Kimia', 'Ekonomi', 'Sejarah', 'Geografi', 'Sosiologi', 'Bahasa Inggris', 'PJOK', 'PAI', 'Seni Budaya', 'PKn']);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching teachers:', error);
        } else {
            setTeachers(data || []);
            // Extract unique specialties from existing teachers
            if (data) {
                const existing = data.map(t => t.specialty).filter(Boolean);
                setDbSpecialties(prev => {
                    const combined = [...new Set([...prev, ...existing])];
                    return combined.sort();
                });
            }
        }
        setIsLoading(false);
    };

    const handleOpenAdd = () => {
        setCurrentTeacher(null);
        setFormData({ name: '', nip: '', specialty: 'Matematika', email: '', status: 'Aktif', wa_number: '' });
        setImportedTeachers([]);
        setIsModalOpen(true);
    };

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { NIP: '198501012010011001', 'Nama Guru': 'Budi Santoso, S.Pd', 'Mata Pelajaran': 'Informatika', 'Email': 'budi@school.id', 'No WA': '628123456789' },
            { NIP: '199005052015022002', 'Nama Guru': 'Siti Maryam, M.Pd', 'Mata Pelajaran': 'Matematika', 'Email': 'siti@school.id', 'No WA': '628987654321' }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Guru");
        XLSX.writeFile(wb, "Template_Import_Guru.xlsx");
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

                // Transform data
                const teachers = data.map((item, idx) => ({
                    id: idx + 1,
                    nip: String(item.NIP || item.nip || '').trim(),
                    name: item['Nama Guru'] || item.Nama || item.name || 'Guru ' + (idx + 1),
                    specialty: item['Mata Pelajaran'] || item.specialty || 'Matematika',
                    email: item.Email || item.email || '-',
                    wa_number: String(item['No WA'] || item['WA'] || item.wa_number || '-').trim(),
                    status: 'Aktif'
                })).filter(t => t.nip !== '');

                setImportedTeachers(teachers);
                showToast(`${teachers.length} guru terdeteksi dari Excel`, 'info');
            } catch (err) {
                showToast('Gagal membaca file Excel. Pastikan format kolom benar (NIP, Nama Guru, Mata Pelajaran).', 'error');
            } finally {
                setUploadLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleOpenEdit = (teacher) => {
        setCurrentTeacher(teacher);
        setFormData({
            name: teacher.name,
            nip: teacher.nip,
            specialty: teacher.specialty,
            email: teacher.email,
            status: teacher.status,
            wa_number: teacher.wa_number || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(
            'Hapus Data Guru',
            'Apakah Anda yakin ingin menghapus data guru ini? Tindakan ini tidak dapat dibatalkan.',
            'danger'
        );

        if (confirmed) {
            const { error } = await supabase.from('teachers').delete().eq('id', id);
            if (!error) {
                showToast('Data guru berhasil dihapus', 'success');
                setTeachers(teachers.filter(t => t.id !== id));
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
            nip: formData.nip,
            email: formData.email,
            specialty: formData.specialty,
            wa_number: formData.wa_number,
            status: formData.status
        };

        if (currentTeacher) {
            const { error } = await supabase
                .from('teachers')
                .update(payload)
                .eq('id', currentTeacher.id);

            if (error) {
                showToast('Gagal memperbarui guru: ' + error.message, 'error');
            } else {
                showToast('Data guru berhasil diperbarui', 'success');
                fetchTeachers();
                setIsModalOpen(false);
            }
        } else {
            // Check for bulk import first
            if (importedTeachers.length > 0) {
                const teachersToInsert = importedTeachers.map(t => ({
                    name: t.name,
                    nip: t.nip,
                    email: t.email,
                    specialty: t.specialty,
                    wa_number: t.wa_number,
                    status: t.status
                }));

                // Deduplicate by NIP before sending
                const uniqueTeachersMap = new Map();
                for (const t of teachersToInsert) {
                    uniqueTeachersMap.set(t.nip, t);
                }
                const uniqueTeachers = Array.from(uniqueTeachersMap.values());

                try {
                    // 1. Fetch existing teachers with these NIPs to get their actual IDs
                    const { data: existing, error: fetchErr } = await supabase
                        .from('teachers')
                        .select('id, nip')
                        .in('nip', uniqueTeachers.map(t => t.nip));

                    if (fetchErr) throw fetchErr;

                    const existingMap = new Map(existing?.map(e => [e.nip, e.id]));
                    const toUpdate = [];
                    const toInsert = [];

                    for (const t of uniqueTeachers) {
                        if (existingMap.has(t.nip)) {
                            toUpdate.push({ ...t, id: existingMap.get(t.nip) });
                        } else {
                            toInsert.push(t);
                        }
                    }

                    // 2. Perform updates for existing ones (using IDs makes upsert reliable)
                    if (toUpdate.length > 0) {
                        const { error: upErr } = await supabase.from('teachers').upsert(toUpdate);
                        if (upErr) throw upErr;
                    }

                    // 3. Perform inserts for new ones
                    if (toInsert.length > 0) {
                        const { error: insErr } = await supabase.from('teachers').insert(toInsert);
                        if (insErr) throw insErr;
                    }

                    showToast(`${uniqueTeachers.length} data guru berhasil diproses (${toInsert.length} baru, ${toUpdate.length} diperbarui)`, 'success');
                    fetchTeachers();
                    setIsModalOpen(false);

                } catch (error) {
                    console.error('Teacher Import Error:', error);
                    if (error.code === '23505') {
                        showToast('Gagal: Terdapat Email atau NIP duplikat di sistem.', 'error');
                    } else {
                        showToast('Gagal memproses data: ' + (error.message || 'Terjadi kesalahan sistem'), 'error');
                    }
                }
            } else {
                try {
                    // Robust check for single insert/update
                    const { data: existing } = await supabase
                        .from('teachers')
                        .select('id')
                        .eq('nip', payload.nip)
                        .maybeSingle();

                    if (existing) {
                        const { error } = await supabase
                            .from('teachers')
                            .update(payload)
                            .eq('id', existing.id);
                        if (error) throw error;
                        showToast('Data guru berhasil diperbarui', 'success');
                    } else {
                        const { error } = await supabase
                            .from('teachers')
                            .insert([payload]);
                        if (error) throw error;
                        showToast('Data guru berhasil ditambah', 'success');
                    }
                    fetchTeachers();
                    setIsModalOpen(false);
                } catch (error) {
                    console.error('Teacher Save Error:', error);
                    if (error.code === '23505') {
                        showToast('Gagal: NIP atau Email sudah terdaftar pada guru lain.', 'error');
                    } else {
                        showToast('Gagal menyimpan guru: ' + error.message, 'error');
                    }
                }
            }
        }
        setIsLoading(false);
    };

    const filteredTeachers = teachers.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.nip.includes(searchTerm) ||
            t.specialty.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSpecialty = filterSpecialty === 'Semua' || t.specialty === filterSpecialty;
        return matchesSearch && matchesSpecialty;
    });

    // ── EXPORT ───────────────────────────────────────────────
    const handleExport = () => {
        const exportData = teachers.map((t, i) => ({
            'No': i + 1,
            'NIP': t.nip,
            'Nama Guru': t.name,
            'Mata Pelajaran': t.specialty,
            'Email': t.email || '',
            'No WA': t.wa_number || '',
            'Status': t.status || 'Aktif',
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Guru');
        XLSX.writeFile(wb, `Data_Guru_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`);
        showToast('Data guru berhasil diekspor ke Excel', 'success');
    };

    // ── IMPORT PREVIEW (STANDALONE) ────────────────────────────
    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const wb = XLSX.read(evt.target.result, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
            const mapped = rows.map(r => ({
                nip: String(r['NIP'] || r['nip'] || ''),
                name: r['Nama Guru'] || r['nama'] || '',
                specialty: r['Mata Pelajaran'] || r['mapel'] || 'Matematika',
                email: r['Email'] || r['email'] || '',
                wa_number: String(r['No WA'] || r['wa_number'] || '-'),
                status: r['Status'] || 'Aktif',
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
            const { error } = await supabase.from('teachers').upsert([row], { onConflict: 'nip' });
            if (error) errorCount++; else successCount++;
        }
        setIsImporting(false);
        setIsImportModalOpen(false);
        setImportPreview([]);
        fetchTeachers();
        showToast(`Import selesai: ${successCount} berhasil, ${errorCount} gagal`, errorCount > 0 ? 'warning' : 'success');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-ink pb-6">
                <div>
                    <h1 className="text-4xl font-black text-ink font-serif tracking-tight uppercase">DIREKTORI GURU</h1>
                    <p className="text-sm text-gray-600 font-mono uppercase tracking-widest mt-2 block">Daftar Lengkap Tenaga Pendidik &amp; Mata Pelajaran</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center space-x-2 bg-paper text-ink border-2 border-ink px-4 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    >
                        <FileSpreadsheet size={16} />
                        <span>TEMPLATE</span>
                    </button>
                    <label className="flex items-center space-x-2 bg-paper text-ink border-2 border-ink px-4 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer">
                        <Upload size={16} />
                        <span>IMPORT</span>
                        <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
                    </label>
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 bg-paper text-ink border-2 border-ink px-4 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    >
                        <Download size={16} />
                        <span>EXPORT</span>
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center space-x-2 bg-ink text-paper border-2 border-ink px-4 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-paper hover:text-ink"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span>TAMBAH GURU</span>
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-paper p-6 border-2 border-ink shadow-[8px_8px_0px_0px_#111111] flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="CARI NAMA, NIP, ATAU MATA PELAJARAN..."
                        className="block w-full pl-12 pr-4 py-4 bg-paper border-2 border-ink text-ink font-mono text-sm uppercase tracking-widest outline-none focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative min-w-[200px]">
                        <select
                            className="w-full appearance-none bg-paper border-2 border-ink px-4 py-4 pr-10 text-ink font-mono text-sm uppercase tracking-widest outline-none cursor-pointer focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                            value={filterSpecialty}
                            onChange={(e) => setFilterSpecialty(e.target.value)}
                        >
                            <option value="Semua">MAPEL: SEMUA</option>
                            {dbSpecialties.map(s => <option key={s} value={s}>MAPEL: {s.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink pointer-events-none" />
                    </div>
                    <button className="flex items-center justify-center space-x-2 bg-paper hover:bg-ink text-ink hover:text-paper border-2 border-ink px-6 py-4 font-mono font-bold uppercase tracking-widest transition-colors focus:shadow-[4px_4px_0px_0px_#111111]">
                        <ArrowUpDown size={18} />
                        <span>URUTKAN</span>
                    </button>
                </div>
            </div>

            {/* Teacher Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map((teacher) => (
                    <div key={teacher.id} className="bg-paper border-2 border-ink shadow-[8px_8px_0px_0px_#111111] transition-transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#111111] group relative">
                        {/* Top Action Bar */}
                        <div className="absolute top-0 right-0 p-4 flex space-x-2 z-10">
                            <button
                                onClick={() => handleOpenEdit(teacher)}
                                className="p-2 bg-paper text-ink hover:bg-ink hover:text-paper border-2 border-ink transition-colors shadow-[2px_2px_0px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDelete(teacher.id)}
                                className="p-2 bg-paper text-editorial hover:bg-editorial hover:text-paper border-2 border-editorial transition-colors shadow-[2px_2px_0px_0px_#CC0000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {/* Card Content */}
                        <div className="p-6">
                            <div className="flex items-start mb-6">
                                <div className="h-16 w-16 bg-paper border-2 border-ink flex items-center justify-center text-ink font-serif font-black shadow-[4px_4px_0px_0px_#111111] text-2xl">
                                    {teacher.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'TR'}
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h3 className="text-xl font-bold text-ink font-serif leading-tight">{teacher.name}</h3>
                                <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">NIP: {teacher.nip}</p>
                            </div>

                            <div className="space-y-4 pt-6 border-t-2 border-ink relative z-10">
                                <div className="flex items-center text-sm text-ink font-mono font-bold">
                                    <BookOpen size={16} className="mr-3" />
                                    <span className="uppercase">{teacher.specialty}</span>
                                </div>
                                <div className="flex items-center text-sm text-ink font-mono font-bold">
                                    <Mail size={16} className="mr-3" />
                                    <span className="truncate">{teacher.email}</span>
                                </div>
                                <div className="flex items-center text-sm text-ink font-mono font-bold justify-between">
                                    <div className="flex items-center">
                                        <MessageCircle size={16} className="mr-3 text-green-700" />
                                        <span>{teacher.wa_number || '-'}</span>
                                    </div>
                                    <button
                                        onClick={() => sendWhatsApp(teacher.wa_number, `Halo Bapak/Ibu ${teacher.name}, berikut adalah pesan dari Admin...`, showToast)}
                                        className="text-[10px] font-black text-green-700 hover:text-paper hover:bg-green-700 px-3 py-1.5 border-2 border-green-700 transition-colors uppercase tracking-widest"
                                    >
                                        HUBUNGI WA
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status Footer */}
                        <div className="bg-ink text-paper px-6 py-4 mt-auto border-t-2 border-ink flex items-center justify-between">
                            <span className={`px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-widest border-2 border-paper ${teacher.status === 'Aktif'
                                ? 'bg-paper text-ink'
                                : 'bg-transparent text-paper opacity-70'
                                }`}>
                                {teacher.status}
                            </span>
                            <button className="text-[10px] font-mono font-bold text-paper hover:underline uppercase tracking-widest">
                                LIHAT PROFIL
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentTeacher ? 'EDIT DATA GURU' : 'TAMBAH GURU & IMPORT EXCEL'}
                maxWidth="max-w-4xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Form Section */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">NAMA LENGKAP & GELAR</label>
                                <input
                                    required={importedTeachers.length === 0}
                                    type="text"
                                    className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all disabled:opacity-50 disabled:bg-gray-100"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={importedTeachers.length > 0}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">NIP (NOMOR INDUK PEGAWAI)</label>
                                <input
                                    required={importedTeachers.length === 0}
                                    type="text"
                                    className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all disabled:opacity-50 disabled:bg-gray-100"
                                    value={formData.nip}
                                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                                    disabled={importedTeachers.length > 0}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">ALAMAT EMAIL</label>
                                <input
                                    required={importedTeachers.length === 0}
                                    type="text"
                                    className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all disabled:opacity-50 disabled:bg-gray-100"
                                    placeholder="guru@domain.edu ATAU -"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={importedTeachers.length > 0}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">MATA PELAJARAN</label>
                                    <input
                                        list="mapel-list"
                                        required={importedTeachers.length === 0}
                                        className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all disabled:opacity-50 disabled:bg-gray-100"
                                        placeholder="MAPEL..."
                                        value={formData.specialty}
                                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                        disabled={importedTeachers.length > 0}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">KONTAK WHATSAPP</label>
                                    <input
                                        type="text"
                                        className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all disabled:opacity-50 disabled:bg-gray-100"
                                        placeholder="62812... ATAU -"
                                        value={formData.wa_number}
                                        onChange={(e) => setFormData({ ...formData, wa_number: e.target.value })}
                                        disabled={importedTeachers.length > 0}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">STATUS SAAT INI</label>
                                <div className="relative group">
                                    <select
                                        className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:bg-gray-100"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        disabled={importedTeachers.length > 0}
                                    >
                                        <option value="Aktif">AKTIF</option>
                                        <option value="Izin">IZIN</option>
                                        <option value="Cuti">CUTI</option>
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Excel Section (Only for Add) */}
                        {!currentTeacher && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">IMPORT DATA (EXCEL)</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-44 bg-gray-50 border-2 border-dashed border-ink flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-paper hover:shadow-[4px_4px_0px_0px_#111111] transition-all group overflow-hidden"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileUpload}
                                    />
                                    {uploadLoading ? (
                                        <Loader2 className="animate-spin text-ink" size={32} />
                                    ) : importedTeachers.length > 0 ? (
                                        <>
                                            <div className="p-3 bg-paper text-ink border-2 border-ink shadow-[2px_2px_0px_0px_#111111]">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <p className="text-xs font-mono font-bold text-ink uppercase tracking-widest">{importedTeachers.length} GURU TERDETEKSI</p>
                                            <button type="button" className="text-[10px] font-mono font-bold text-ink underline hover:text-editorial">GANTI FILE</button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-paper text-ink border-2 border-ink shadow-[2px_2px_0px_0px_#111111] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:shadow-[4px_4px_0px_0px_#111111] transition-all">
                                                <FileSpreadsheet size={32} />
                                            </div>
                                            <p className="text-xs font-mono font-bold text-ink text-center px-4 uppercase tracking-widest">PILIH ATAU SERET FILE EXCEL</p>
                                            <p className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">(NIP, NAMA, MAPEL, EMAIL, WA)</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center space-x-2 text-[10px] font-mono font-bold text-ink hover:text-paper hover:bg-ink uppercase tracking-widest bg-paper px-4 py-2 border-2 border-ink transition-colors shadow-[2px_2px_0px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                                    >
                                        <FileUp size={14} className="rotate-180" />
                                        <span>UNDUH FORMAT EXCEL</span>
                                    </button>
                                </div>
                                <div className="bg-gray-50 p-4 border-2 border-ink text-[10px] text-ink font-mono font-bold leading-relaxed shadow-[4px_4px_0px_0px_#111111]">
                                    <Info size={14} className="inline mr-2 mb-0.5 text-editorial" />
                                    NIP AKAN OTOMATIS DIGUNAKAN SEBAGAI ID & PASSWORD LOGIN DEFAULT ("guru123" JUGA AKTIF).
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview Table */}
                    {importedTeachers.length > 0 && !currentTeacher && (
                        <div className="bg-paper border-2 border-ink shadow-[4px_4px_0px_0px_#111111] overflow-hidden">
                            <div className="px-4 py-3 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest border-b-2 border-ink">PREVIEW 3 DATA PERTAMA</div>
                            <div className="max-h-32 overflow-y-auto p-4 space-y-3 no-scrollbar text-ink">
                                {importedTeachers.slice(0, 3).map(t => (
                                    <div key={t.id} className="flex items-center justify-between text-xs font-mono font-bold border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-ink font-black bg-gray-100 px-2 py-1 border border-ink">#{t.nip}</span>
                                            <div>
                                                <p className="uppercase">{t.name}</p>
                                                <p className="text-[10px] text-gray-500 uppercase">{t.specialty}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-ink block">{t.email}</span>
                                            <span className="text-[10px] text-gray-500 uppercase">WA: {t.wa_number}</span>
                                        </div>
                                    </div>
                                ))}
                                {importedTeachers.length > 3 && (
                                    <p className="text-[10px] text-gray-500 text-center font-mono font-bold uppercase tracking-widest mt-4">...DAN {importedTeachers.length - 3} GURU LAINNYA</p>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-ink hover:bg-paper text-paper hover:text-ink font-mono font-bold py-4 border-2 border-ink transition-colors flex items-center justify-center space-x-2 shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#111111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none mt-6"
                    >
                        <Save size={20} />
                        <span className="uppercase tracking-widest text-xs">
                            {importedTeachers.length > 0 ? `SIMPAN & IMPORT ${importedTeachers.length} GURU` : 'SIMPAN DATA GURU'}
                        </span>
                    </button>
                </form>
            </Modal>

            {/* ─── IMPORT PREVIEW MODAL ─────────────────── */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-paper border-4 border-ink shadow-[12px_12px_0px_0px_#111111] w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b-4 border-ink flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="text-xl font-black text-ink uppercase tracking-widest font-serif">PREVIEW IMPORT GURU</h3>
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
                                        {['NIP', 'Nama Guru', 'Mata Pelajaran', 'Email', 'Status'].map(h => (
                                            <th key={h} className="px-3 py-2 text-[9px] font-mono font-bold uppercase tracking-widest border-r border-paper/30 last:border-r-0">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink">
                                    {importPreview.map((row, i) => (
                                        <tr key={i} className={i % 2 === 0 ? 'bg-paper' : 'bg-gray-50'}>
                                            <td className="px-3 py-2 text-xs font-mono text-gray-600 border-r border-ink">{row.nip}</td>
                                            <td className="px-3 py-2 text-xs font-mono font-bold text-ink border-r border-ink uppercase">{row.name}</td>
                                            <td className="px-3 py-2 text-xs font-mono text-ink border-r border-ink">{row.specialty}</td>
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
                                <span>DATA DENGAN NIP SAMA AKAN DIPERBARUI OTOMATIS</span>
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
