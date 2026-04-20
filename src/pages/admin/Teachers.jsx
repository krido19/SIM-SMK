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

// Palet warna mapel — deterministik berdasarkan hash nama mapel
const SUBJECT_PALETTE = [
    '#1d4ed8', // biru tua
    '#7c3aed', // ungu
    '#be185d', // pink tua
    '#b45309', // coklat amber
    '#0f766e', // teal
    '#0369a1', // biru langit
    '#15803d', // hijau tua
    '#9333ea', // violet
    '#dc2626', // merah
    '#d97706', // kuning tua
    '#0891b2', // cyan
    '#7e22ce', // deep purple
    '#065f46', // emerald
    '#1e40af', // indigo
    '#9f1239', // rose
    '#92400e', // amber tua
];

const getSubjectColor = (specialty = '') => {
    if (!specialty) return SUBJECT_PALETTE[0];
    let hash = 0;
    for (let i = 0; i < specialty.length; i++) {
        hash = specialty.charCodeAt(i) + ((hash << 5) - hash);
    }
    return SUBJECT_PALETTE[Math.abs(hash) % SUBJECT_PALETTE.length];
};

export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const [formData, setFormData] = useState({ name: '', nip: '', specialty: 'Matematika', pangkat: '', email: '', status: 'Aktif', wa_number: '' });
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
        setFormData({ name: '', nip: '', specialty: 'Matematika', pangkat: '', email: '', status: 'Aktif', wa_number: '' });
        setImportedTeachers([]);
        setIsModalOpen(true);
    };

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { NIP: '198501012010011001', 'Nama Guru': 'Budi Santoso, S.Pd', 'Pangkat': 'Penata Muda III/a', 'Mata Pelajaran': 'Informatika', 'Email': 'budi@school.id', 'No WA': '628123456789' },
            { NIP: '199005052015022002', 'Nama Guru': 'Siti Maryam, M.Pd', 'Pangkat': 'Penata III/c', 'Mata Pelajaran': 'Matematika', 'Email': 'siti@school.id', 'No WA': '628987654321' }
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
                    pangkat: item['Pangkat'] || item.pangkat || '',
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
            pangkat: teacher.pangkat || '',
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
            pangkat: formData.pangkat,
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
                    pangkat: t.pangkat || '',
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
            'Pangkat': t.pangkat || '',
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
                pangkat: r['Pangkat'] || r['pangkat'] || '',
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
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Manajemen SDM
                        </span>
                    </div>
                    <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight">Direktori Guru</h1>
                    <p className="text-sm font-sans font-medium text-gray-500 mt-1">Kelola data tenaga pendidik, spesialisasi mata pelajaran, dan informasi kontak.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-sans font-bold text-xs hover:bg-gray-50 transition-all shadow-sm"
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
                        <span>Tambah Guru</span>
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama, NIP, atau mata pelajaran..."
                        className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-sans text-sm outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative min-w-[200px]">
                        <select
                            className="w-full appearance-none bg-gray-50 border border-transparent px-4 py-3 pr-10 rounded-xl text-gray-900 font-sans font-bold text-xs uppercase tracking-wider outline-none cursor-pointer focus:bg-white focus:border-blue-200 transition-all"
                            value={filterSpecialty}
                            onChange={(e) => setFilterSpecialty(e.target.value)}
                        >
                            <option value="Semua">Semua Mapel</option>
                            {dbSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Teacher Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTeachers.map((teacher) => {
                    const subjectColor = getSubjectColor(teacher.specialty);
                    return (
                        <div key={teacher.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative flex flex-col overflow-hidden">
                            {/* Accent Bar */}
                            <div
                                className="h-2 w-full"
                                style={{ backgroundColor: subjectColor }}
                            />

                            {/* Card Header & Profile */}
                            <div className="px-6 py-6 border-b border-gray-50 bg-gray-50/30">
                                <div className="flex justify-between items-start mb-6">
                                    <div
                                        className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-sans font-black text-xl shadow-lg ring-4 ring-white"
                                        style={{ backgroundColor: subjectColor }}
                                    >
                                        {teacher.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => handleOpenEdit(teacher)}
                                            className="p-2 bg-white text-gray-400 hover:text-blue-600 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                            title="Edit Guru"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(teacher.id)}
                                            className="p-2 bg-white text-gray-400 hover:text-rose-600 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                            title="Hapus Guru"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-lg font-sans font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{teacher.name}</h3>
                                    <p className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest">{teacher.nip}</p>
                                    {teacher.pangkat && (
                                        <div className="inline-flex items-center gap-1.5 mt-2 bg-white border border-gray-100 px-2.5 py-1 rounded-lg shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subjectColor }} />
                                            <span className="text-[9px] font-sans font-bold text-gray-600 uppercase tracking-wider">{teacher.pangkat}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 space-y-4 flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <BookOpen size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Mata Pelajaran</p>
                                        <p className="font-sans font-bold text-gray-800 text-xs uppercase">{teacher.specialty}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gray-50 text-gray-400">
                                        <Mail size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Email Sekolah</p>
                                        <p className="font-sans font-medium text-gray-700 text-xs truncate max-w-[150px]">{teacher.email || '-'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                            <MessageCircle size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">WhatsApp</p>
                                            <p className="font-sans font-bold text-gray-800 text-xs">{teacher.wa_number || '-'}</p>
                                        </div>
                                    </div>
                                    {teacher.wa_number && teacher.wa_number !== '-' && (
                                        <button
                                            onClick={() => sendWhatsApp(teacher.wa_number, `Halo Bapak/Ibu ${teacher.name}, berikut adalah pesan dari Admin...`, showToast)}
                                            className="p-1 px-3 bg-emerald-600 text-white text-[10px] rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
                                        >
                                            Chating
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${teacher.status === 'Aktif' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                    <span className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest">{teacher.status}</span>
                                </div>
                                <button className="text-[10px] font-sans font-bold text-blue-600 hover:underline uppercase tracking-widest">
                                    Profil Lengkap
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentTeacher ? 'Edit Data Guru' : 'Tambah Guru & Import Excel'}
                maxWidth="max-w-4xl"
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Form Section */}
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Nama Lengkap & Gelar</label>
                                <input
                                    required={importedTeachers.length === 0}
                                    type="text"
                                    placeholder="Contoh: Dr. Budi Santoso, M.Pd"
                                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3.5 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all disabled:opacity-50"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={importedTeachers.length > 0}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">NIP (Nomor Induk Pegawai)</label>
                                <input
                                    required={importedTeachers.length === 0}
                                    type="text"
                                    placeholder="Nomor NIP 18 digit"
                                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3.5 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all disabled:opacity-50"
                                    value={formData.nip}
                                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                                    disabled={importedTeachers.length > 0}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Alamat Email Sekolah</label>
                                <input
                                    required={importedTeachers.length === 0}
                                    type="email"
                                    placeholder="guru@smkhafidz.sch.id"
                                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3.5 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all disabled:opacity-50"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={importedTeachers.length > 0}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Mata Pelajaran</label>
                                    <input
                                        list="mapel-list"
                                        required={importedTeachers.length === 0}
                                        placeholder="Pilih Mapel..."
                                        className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3.5 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all disabled:opacity-50"
                                        value={formData.specialty}
                                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                        disabled={importedTeachers.length > 0}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">WhatsApp</label>
                                    <input
                                        type="text"
                                        placeholder="628..."
                                        className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3.5 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all disabled:opacity-50"
                                        value={formData.wa_number}
                                        onChange={(e) => setFormData({ ...formData, wa_number: e.target.value })}
                                        disabled={importedTeachers.length > 0}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Pangkat / Golongan</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: III/a"
                                        className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3.5 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all disabled:opacity-50"
                                        value={formData.pangkat}
                                        onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
                                        disabled={importedTeachers.length > 0}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Status Mengajar</label>
                                    <div className="relative group">
                                        <select
                                            className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3.5 font-sans font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer disabled:opacity-50"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            disabled={importedTeachers.length > 0}
                                        >
                                            <option value="Aktif">Aktif Mengajar</option>
                                            <option value="Izin">Izin / Sakit</option>
                                            <option value="Cuti">Cuti Akademik</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Excel Section (Only for Add) */}
                        {!currentTeacher && (
                            <div className="space-y-6">
                                <label className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-widest px-1">Bulk Import (Excel)</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-56 bg-blue-50/30 border-2 border-dashed border-blue-200 rounded-3xl flex flex-col items-center justify-center space-y-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all group relative overflow-hidden"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileUpload}
                                    />
                                    {uploadLoading ? (
                                        <Loader2 className="animate-spin text-blue-600" size={32} />
                                    ) : importedTeachers.length > 0 ? (
                                        <>
                                            <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 animate-in zoom-in-90">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-sans font-black text-gray-900">{importedTeachers.length} Guru Terdeteksi</p>
                                                <button type="button" className="text-[10px] font-sans font-bold text-blue-600 underline mt-1">Ganti File</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-4 bg-white text-blue-600 rounded-2xl shadow-sm border border-blue-100 group-hover:-translate-y-2 transition-transform duration-500">
                                                <FileSpreadsheet size={32} />
                                            </div>
                                            <div className="text-center px-6">
                                                <p className="text-sm font-sans font-black text-gray-900">Seret File Excel ke Sini</p>
                                                <p className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mt-1">Format: NIP, Nama, Mapel, Email, WA</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center space-x-2 text-[10px] font-sans font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <FileUp size={14} className="rotate-180" />
                                        <span>UNDUH TEMPLATE EXCEL</span>
                                    </button>
                                </div>
                                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100/50 flex gap-4">
                                    <div className="p-2 bg-white rounded-lg h-fit text-amber-600 shadow-sm">
                                        <Info size={16} />
                                    </div>
                                    <p className="text-[11px] text-amber-800 font-sans font-medium leading-relaxed">
                                        <span className="font-bold block mb-0.5">Penting!</span>
                                        NIP akan digunakan sebagai ID & password default sistem. Pastikan data NIP sudah benar sebelum diimport.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview Area */}
                    {importedTeachers.length > 0 && !currentTeacher && (
                        <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-50/30">
                            <div className="px-5 py-3 bg-white border-b border-gray-100 text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest">
                                Preview 3 Data Teratas
                            </div>
                            <div className="p-4 space-y-3">
                                {importedTeachers.slice(0, 3).map(t => (
                                    <div key={t.nip} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-sans font-black text-xs">
                                                {t.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-sans font-black text-gray-900">{t.name}</p>
                                                <p className="text-[10px] font-sans font-bold text-gray-400">{t.nip}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-sans font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{t.specialty}</span>
                                        </div>
                                    </div>
                                ))}
                                {importedTeachers.length > 3 && (
                                    <p className="text-[10px] text-gray-400 text-center font-sans font-bold uppercase tracking-widest pt-2">+ {importedTeachers.length - 3} Data Lainnya</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
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
                            <span className="uppercase tracking-widest text-xs">
                                {importedTeachers.length > 0 ? `Simpan & Import ${importedTeachers.length} Guru` : 'Simpan Data Guru'}
                            </span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Import Preview Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50 bg-gray-50/30 font-sans">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 leading-none">Konfirmasi Import Data</h3>
                                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{importPreview.length} Baris Data Ditemukan</p>
                            </div>
                            <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="p-0 max-h-[50vh] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-[10px] uppercase font-sans font-bold text-gray-400 tracking-widest border-b border-gray-100 sticky top-0 z-10">
                                    <tr>
                                        {['NIP', 'Nama Guru', 'Pangkat', 'Mata Pelajaran', 'Email', 'Status'].map(h => (
                                            <th key={h} className="p-5">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-sans">
                                    {importPreview.map((row, i) => (
                                        <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                                            <td className="p-5 font-bold text-blue-600">{row.nip}</td>
                                            <td className="p-5 font-bold text-gray-900 uppercase">{row.name}</td>
                                            <td className="p-5 text-gray-500">{row.pangkat || '-'}</td>
                                            <td className="p-5"><span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-bold">{row.specialty}</span></td>
                                            <td className="p-5 text-gray-500">{row.email}</td>
                                            <td className="p-5 uppercase font-bold text-emerald-600">{row.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 text-xs font-sans font-bold text-amber-600">
                                <AlertTriangle size={18} />
                                <span>Note: Data dengan NIP sama akan diperbarui otomatis.</span>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }} className="flex-1 md:flex-none px-6 py-3 bg-white border border-gray-100 rounded-xl font-sans font-bold text-xs uppercase tracking-widest hover:bg-gray-50 text-gray-500 transition-all shadow-sm">
                                    Batalkan
                                </button>
                                <button onClick={handleImportSubmit} disabled={isImporting} className="flex-1 md:flex-none px-8 py-3 bg-blue-600 text-white rounded-xl font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50">
                                    {isImporting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
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
