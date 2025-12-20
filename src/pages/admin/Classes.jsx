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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-300`}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-xl font-black text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400">
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

export default function Classes() {
    const [classes, setClasses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const navigate = useNavigate();
    const [currentClass, setCurrentClass] = useState(null);
    const [formData, setFormData] = useState({ name: '', homeroom: '', level: '10' });
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
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching classes:', error);
        } else {
            setClasses(data || []);
        }
        setIsLoading(false);
    };

    const handleOpenAdd = () => {
        setCurrentClass(null);
        setFormData({ name: '', homeroom: '', level: '10' });
        setImportedStudents([]);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cls) => {
        setCurrentClass(cls);
        setFormData({ name: cls.name, homeroom: cls.homeroom, level: cls.level });
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
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.homeroom || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Kelas</h1>
                    <p className="text-sm text-gray-500">Kelola daftar kelas dan wali kelas masing-masing.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center space-x-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
                >
                    <Plus size={18} />
                    <span>Tambah Kelas</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Cari kelas atau wali kelas..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((cls) => (
                    <div key={cls.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                        <div className="p-6 bg-gradient-to-br from-violet-600 to-indigo-700 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                                <Hash size={80} />
                            </div>
                            <div className="flex items-start justify-between relative z-10">
                                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                                    <Hash size={24} />
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleOpenEdit(cls)}
                                        className="p-2.5 bg-white/10 hover:bg-white/30 rounded-xl transition-all border border-white/20"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cls.id)}
                                        className="p-2.5 bg-red-500/20 hover:bg-red-500/40 rounded-xl transition-all border border-white/10"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-3xl font-black mt-6 tracking-tight">{cls.name}</h3>
                            <p className="text-white/70 text-xs font-black uppercase tracking-widest mt-1">Tingkat {cls.level}</p>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                                <div className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
                                    <UserCheck size={16} className="mr-3 text-violet-500" />
                                    Wali Kelas
                                </div>
                                <span className="text-sm font-bold text-gray-900 truncate ml-4">{cls.homeroom}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                                <div className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
                                    <Users size={16} className="mr-3 text-violet-500" />
                                    Siswa
                                </div>
                                <span className="text-sm font-bold text-gray-900">{cls.studentsCount} Siswa</span>
                            </div>

                            <button
                                onClick={() => handleOpenDetail(cls)}
                                className="w-full mt-2 flex items-center justify-center space-x-2 py-3.5 bg-violet-50 hover:bg-violet-600 text-violet-600 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all group/btn shadow-sm hover:shadow-lg hover:shadow-violet-200"
                            >
                                <span>Lihat Detail Kelas</span>
                                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Modal (Bigger for Excel) */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentClass ? 'Edit Kelas' : 'Tambah Kelas & Import Siswa'}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Nama Kelas</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all border-2"
                                    placeholder="Contoh: X-IPA-1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Tingkat</label>
                                <select
                                    className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all border-2 appearance-none"
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                >
                                    <option value="10">Tingkat 10</option>
                                    <option value="11">Tingkat 11</option>
                                    <option value="12">Tingkat 12</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Wali Kelas</label>
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all border-2 appearance-none"
                                        value={formData.homeroom}
                                        onChange={(e) => setFormData({ ...formData, homeroom: e.target.value })}
                                    >
                                        <option value="">Pilih Wali Kelas</option>
                                        {dbTeachers.map(t => (
                                            <option key={t.id} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Excel Upload Section (Only for Add) */}
                        {!currentClass && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Import Siswa (Excel)</label>
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className="h-44 border-4 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center space-y-3 cursor-pointer hover:border-violet-200 hover:bg-violet-50 transition-all group overflow-hidden"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileUpload}
                                    />
                                    {uploadLoading ? (
                                        <Loader2 className="text-violet-500 animate-spin" size={32} />
                                    ) : importedStudents.length > 0 ? (
                                        <>
                                            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <p className="text-xs font-black text-green-700 uppercase tracking-widest">{importedStudents.length} Siswa Terdeteksi</p>
                                            <button type="button" className="text-[10px] font-bold text-gray-400 underline hover:text-violet-600">Ganti File</button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl group-hover:scale-110 transition-transform">
                                                <FileSpreadsheet size={32} />
                                            </div>
                                            <p className="text-xs font-bold text-gray-400">Pilih atau Seret File Excel</p>
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">(NIS, Nama, Orang Tua, WA)</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center space-x-2 text-[10px] font-black text-violet-600 hover:text-violet-700 uppercase tracking-widest bg-violet-50 px-4 py-2 rounded-xl transition-all hover:shadow-md"
                                    >
                                        <FileUp size={14} className="rotate-180" />
                                        <span>Download Format Excel</span>
                                    </button>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 text-[10px] text-blue-600 font-bold leading-relaxed">

                                    <Info size={14} className="inline mr-1 mb-0.5" />
                                    ID Orang Tua otomatis di-generate (OT+NIS).
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Student List Preview */}
                    {importedStudents.length > 0 && !currentClass && (
                        <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="px-4 py-2 bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">Preview 5 Siswa Pertama</div>
                            <div className="max-h-32 overflow-y-auto p-4 space-y-3 no-scrollbar">
                                {importedStudents.slice(0, 5).map(s => (
                                    <div key={s.id} className="flex items-center justify-between text-xs font-bold text-gray-600">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-gray-300 font-black">#{s.nis}</span>
                                            <div>
                                                <p>{s.name}</p>
                                                <p className="text-[10px] text-gray-400">WA: {s.waStudent}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-violet-500 block">{s.parentName}</span>
                                            <span className="text-[10px] text-gray-400">WA: {s.waParent}</span>
                                        </div>
                                    </div>
                                ))}
                                {importedStudents.length > 5 && (
                                    <p className="text-[10px] text-gray-400 text-center font-bold">...dan {importedStudents.length - 5} siswa lainnya</p>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-violet-100 transition-all flex items-center justify-center space-x-2 active:scale-95"
                    >
                        <Save size={20} />
                        <span className="uppercase tracking-widest text-xs">Simpan Kelas & Import</span>
                    </button>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title="Informasi Detail Kelas"
            >
                {currentClass && (
                    <div className="space-y-6">
                        <div className="p-6 bg-violet-50 rounded-3xl border border-violet-100 flex flex-col items-center text-center">
                            <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-violet-200 flex items-center justify-center text-violet-600 mb-4">
                                <Hash size={32} />
                            </div>
                            <h4 className="text-3xl font-black text-gray-900">{currentClass.name}</h4>
                            <p className="text-xs font-black text-violet-500 uppercase tracking-[0.2em] mt-1">Lokal Kelas</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Siswa</p>
                                <p className="text-lg font-black text-gray-900">{currentClass.studentsCount} Orang</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tingkat</p>
                                <p className="text-lg font-black text-gray-900">{currentClass.level}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-4">
                            <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm">
                                <UserCheck size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Wali Kelas</p>
                                <p className="text-sm font-bold text-gray-900">{currentClass.homeroom}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setIsDetailOpen(false);
                                navigate('/admin/students', { state: { filterClass: currentClass.name } });
                            }}
                            className="w-full flex items-center justify-center space-x-2 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                        >
                            <Info size={16} />
                            <span>Daftar Siswa Kelas Ini</span>
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
