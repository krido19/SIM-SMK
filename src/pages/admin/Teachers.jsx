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
    Loader2
} from 'lucide-react';



const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800`}>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                        <X size={20} />
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

                const { error } = await supabase
                    .from('teachers')
                    .insert(teachersToInsert);

                if (error) {
                    showToast('Gagal mengimport guru: ' + error.message, 'error');
                } else {
                    showToast(`${importedTeachers.length} data guru berhasil diimport`, 'success');
                    fetchTeachers();
                    setIsModalOpen(false);
                }
            } else {
                const { error } = await supabase
                    .from('teachers')
                    .insert([payload]);

                if (error) {
                    showToast('Gagal menambah guru: ' + error.message, 'error');
                } else {
                    showToast('Data guru berhasil ditambah', 'success');
                    fetchTeachers();
                    setIsModalOpen(false);
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manajemen Guru</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kelola data tenaga pengajar dan mata pelajaran mereka.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
                >
                    <Plus size={18} />
                    <span>Tambah Guru</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama, NIP, atau mata pelajaran..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-100 dark:border-gray-800 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-gray-700 dark:text-gray-200 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex space-x-2">
                    <div className="relative">
                        <select
                            className="appearance-none border border-gray-100 dark:border-gray-800 px-10 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-800 outline-none cursor-pointer pr-10"
                            value={filterSpecialty}
                            onChange={(e) => setFilterSpecialty(e.target.value)}
                        >
                            <option value="Semua">Semua Mapel</option>
                            {dbSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    </div>
                    <button className="flex items-center space-x-2 border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-800">
                        <ArrowUpDown size={18} />
                        <span>Urutkan</span>
                    </button>
                </div>
            </div>

            {/* Teacher Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map((teacher) => (
                    <div key={teacher.id} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl dark:shadow-black/20 transition-all group relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-150 bg-indigo-600 dark:bg-indigo-400`} />

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border-2 border-white dark:border-gray-800 shadow-sm text-xl transition-transform group-hover:scale-110">
                                {teacher.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'TR'}
                            </div>
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => handleOpenEdit(teacher)}
                                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(teacher.id)}
                                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1 relative z-10">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{teacher.name}</h3>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">NIP: {teacher.nip}</p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 space-y-3 relative z-10">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <BookOpen size={16} className="mr-3 text-indigo-400 dark:text-indigo-500" />
                                <span className="font-medium">{teacher.specialty}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                < Mail size={16} className="mr-3 text-indigo-400 dark:text-indigo-500" />
                                <span className="truncate">{teacher.email}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <MessageCircle size={16} className="mr-3 text-green-500" />
                                <span className="font-bold text-gray-700 dark:text-gray-200">{teacher.wa_number || '-'}</span>
                                <button
                                    onClick={() => sendWhatsApp(teacher.wa_number, `Halo Bapak/Ibu ${teacher.name}, berikut adalah pesan dari Admin...`, showToast)}
                                    className="ml-auto text-xs font-black text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 px-2 py-1 rounded-lg transition-colors border border-green-100 dark:border-green-900/40"
                                >
                                    Kirim WA
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${teacher.status === 'Aktif'
                                    ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/40'
                                    : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/40'
                                    }`}>
                                    {teacher.status}
                                </span>
                                <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Lihat Detail</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentTeacher ? 'Edit Data Guru' : 'Tambah Guru & Import Excel'}
                maxWidth="max-w-4xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Form Section */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Nama Lengkap & Gelar</label>
                                <input
                                    required={importedTeachers.length === 0}
                                    type="text"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 border-2"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={importedTeachers.length > 0}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">NIP</label>
                                <input
                                    required={importedTeachers.length === 0}
                                    type="text"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 border-2"
                                    value={formData.nip}
                                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                                    disabled={importedTeachers.length > 0}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Email</label>
                                <input
                                    required={importedTeachers.length === 0}
                                    type="text"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 border-2"
                                    placeholder="email@example.com atau -"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={importedTeachers.length > 0}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Mata Pelajaran</label>
                                    <input
                                        list="mapel-list"
                                        required={importedTeachers.length === 0}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 border-2"
                                        placeholder="Mapel..."
                                        value={formData.specialty}
                                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                        disabled={importedTeachers.length > 0}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">No. WhatsApp</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 border-2"
                                        placeholder="62812... atau -"
                                        value={formData.wa_number}
                                        onChange={(e) => setFormData({ ...formData, wa_number: e.target.value })}
                                        disabled={importedTeachers.length > 0}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Status</label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 border-2"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    disabled={importedTeachers.length > 0}
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Izin">Izin</option>
                                    <option value="Cuti">Cuti</option>
                                </select>
                            </div>
                        </div>

                        {/* Excel Section (Only for Add) */}
                        {!currentTeacher && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Import Data (Excel)</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-44 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem] flex flex-col items-center justify-center space-y-3 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all group overflow-hidden"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileUpload}
                                    />
                                    {uploadLoading ? (
                                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                                    ) : importedTeachers.length > 0 ? (
                                        <>
                                            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <p className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest">{importedTeachers.length} Guru Terdeteksi</p>
                                            <button type="button" className="text-[10px] font-bold text-gray-400 dark:text-gray-500 underline hover:text-indigo-600 dark:hover:text-indigo-400">Ganti File</button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                                                <FileSpreadsheet size={32} />
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 text-center px-4">Pilih atau Seret File Excel</p>
                                            <p className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest">(NIP, Nama, Mapel, Email, WA)</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center space-x-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl transition-all hover:shadow-md border border-indigo-100 dark:border-indigo-900/40"
                                    >
                                        <FileUp size={14} className="rotate-180" />
                                        <span>Download Format Excel</span>
                                    </button>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-[10px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed">
                                    <Info size={14} className="inline mr-1 mb-0.5" />
                                    NIP akan otomatis digunakan sebagai ID & Password login default ('guru123' juga aktif).
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview Table */}
                    {importedTeachers.length > 0 && !currentTeacher && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Preview 3 Data Pertama</div>
                            <div className="max-h-32 overflow-y-auto p-4 space-y-3 no-scrollbar text-gray-700 dark:text-gray-200">
                                {importedTeachers.slice(0, 3).map(t => (
                                    <div key={t.id} className="flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-gray-300 dark:text-gray-600 font-black">#{t.nip}</span>
                                            <div>
                                                <p>{t.name}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{t.specialty}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-indigo-500 dark:text-indigo-400 block">{t.email}</span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">WA: {t.wa_number}</span>
                                        </div>
                                    </div>
                                ))}
                                {importedTeachers.length > 3 && (
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center font-bold">...dan {importedTeachers.length - 3} guru lainnya</p>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-2 active:scale-95"
                    >
                        <Save size={20} />
                        <span className="uppercase tracking-widest text-xs">
                            {importedTeachers.length > 0 ? `Simpan & Import ${importedTeachers.length} Guru` : 'Simpan Data Guru'}
                        </span>
                    </button>
                </form>
            </Modal>
        </div>
    );
}
