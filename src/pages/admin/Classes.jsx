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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`bg-paper border-4 border-ink shadow-[12px_12px_0px_0px_#111111] w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-300`}>
                <div className="px-6 py-4 border-b-4 border-ink flex items-center justify-between bg-gray-50">
                    <h3 className="text-xl font-black text-ink uppercase tracking-widest font-serif">{title}</h3>
                    <button onClick={onClose} className="p-2 border-2 border-transparent hover:border-ink hover:bg-paper transition-all text-ink hover:text-editorial">
                        <X size={24} className="stroke-[3]" />
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-ink pb-6">
                <div>
                    <h1 className="text-4xl font-black text-ink font-serif uppercase tracking-tight">MANAJEMEN KELAS</h1>
                    <p className="text-ink font-mono font-bold uppercase tracking-widest mt-2 block">Kelola daftar kelas dan wali kelas masing-masing.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center space-x-2 bg-ink text-paper px-6 py-3 font-mono font-bold uppercase tracking-widest transition-all border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-paper hover:text-ink"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>TAMBAH KELAS</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink" size={20} strokeWidth={3} />
                <input
                    type="text"
                    placeholder="CARI KELAS ATAU WALI KELAS..."
                    className="w-full pl-12 pr-4 py-3 bg-paper border-2 border-ink focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] outline-none transition-all font-mono font-bold text-ink uppercase placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((cls) => (
                    <div key={cls.id} className="bg-paper border-2 border-ink shadow-[8px_8px_0px_0px_#111111] group hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#111111] transition-all duration-300">
                        <div className="p-6 bg-ink text-paper relative overflow-hidden border-b-2 border-ink">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                                <Hash size={80} />
                            </div>
                            <div className="flex items-start justify-between relative z-10">
                                <div className="h-12 w-12 bg-paper border-2 border-ink flex items-center justify-center text-ink shadow-[2px_2px_0px_0px_#111111]">
                                    <Hash size={24} strokeWidth={3} />
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleOpenEdit(cls)}
                                        className="p-2 border-2 border-transparent hover:border-paper hover:bg-paper hover:text-ink transition-all text-paper"
                                        title="EDIT"
                                    >
                                        <Edit2 size={18} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cls.id)}
                                        className="p-2 border-2 border-transparent hover:border-editorial hover:bg-editorial hover:text-paper transition-all text-paper"
                                        title="HAPUS"
                                    >
                                        <Trash2 size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-3xl font-black mt-6 tracking-tight uppercase font-serif">{cls.name}</h3>
                            <p className="text-gray-400 text-xs font-mono font-bold uppercase tracking-widest mt-1">TINGKAT {cls.level}</p>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="flex items-center justify-between p-3 bg-gray-50 border-2 border-ink group-hover:bg-paper transition-colors">
                                <div className="flex items-center text-xs font-mono font-bold text-ink uppercase tracking-widest">
                                    <UserCheck size={18} className="mr-3 text-ink" strokeWidth={2.5} />
                                    WALI KELAS
                                </div>
                                <span className="text-sm font-bold text-ink truncate ml-4 font-mono">{cls.homeroom?.toUpperCase() || '-'}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 border-2 border-ink group-hover:bg-paper transition-colors">
                                <div className="flex items-center text-xs font-mono font-bold text-ink uppercase tracking-widest">
                                    <Users size={18} className="mr-3 text-ink" strokeWidth={2.5} />
                                    SISWA
                                </div>
                                <span className="text-sm font-bold text-ink font-mono">{cls.studentsCount || 0} SISWA</span>
                            </div>

                            <button
                                onClick={() => handleOpenDetail(cls)}
                                className="w-full mt-2 flex items-center justify-center space-x-2 py-3 bg-paper text-ink border-2 border-ink font-mono font-bold text-xs uppercase tracking-widest transition-all group/btn hover:bg-ink hover:text-paper shadow-[4px_4px_0px_0px_#111111] hover:mt-[4px] hover:shadow-none"
                            >
                                <span>LIHAT DETAIL KELAS</span>
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">NAMA KELAS</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-paper border-2 border-ink focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all"
                                    placeholder="CONTOH: X-IPA-1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">TINGKAT</label>
                                <select
                                    className="w-full bg-paper border-2 border-ink focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all appearance-none"
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                >
                                    <option value="10">TINGKAT 10</option>
                                    <option value="11">TINGKAT 11</option>
                                    <option value="12">TINGKAT 12</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">WALI KELAS</label>
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full bg-paper border-2 border-ink focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all appearance-none"
                                        value={formData.homeroom}
                                        onChange={(e) => setFormData({ ...formData, homeroom: e.target.value })}
                                    >
                                        <option value="">PILIH WALI KELAS</option>
                                        {dbTeachers.map(t => (
                                            <option key={t.id} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink pointer-events-none" strokeWidth={3} />
                                </div>
                            </div>
                        </div>

                        {/* Excel Upload Section (Only for Add) */}
                        {!currentClass && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">IMPORT SISWA (EXCEL)</label>
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className="h-44 border-4 border-dashed border-ink flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-gray-50 transition-all group overflow-hidden bg-paper"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileUpload}
                                    />
                                    {uploadLoading ? (
                                        <Loader2 className="text-ink animate-spin" size={32} />
                                    ) : importedStudents.length > 0 ? (
                                        <>
                                            <div className="p-3 bg-paper border-2 border-ink text-ink shadow-[2px_2px_0px_0px_#111111]">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <p className="text-xs font-mono font-bold text-ink uppercase tracking-widest">{importedStudents.length} SISWA TERDETEKSI</p>
                                            <button type="button" className="text-[10px] font-mono font-bold text-editorial underline hover:text-ink">GANTI FILE</button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-paper border-2 border-ink text-ink shadow-[2px_2px_0px_0px_#111111] group-hover:scale-110 transition-transform">
                                                <FileSpreadsheet size={32} strokeWidth={2} />
                                            </div>
                                            <p className="text-xs font-mono font-bold text-ink uppercase">PILIH ATAU SERET FILE EXCEL</p>
                                            <p className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">(NIS, NAMA, ORANG TUA, WA)</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center space-x-2 text-[10px] font-mono font-bold text-ink uppercase tracking-widest bg-paper px-4 py-2 hover:bg-ink hover:text-paper transition-all border-2 border-ink shadow-[2px_2px_0px_0px_#111111]"
                                    >
                                        <FileUp size={14} className="rotate-180" strokeWidth={3} />
                                        <span>DOWNLOAD FORMAT EXCEL</span>
                                    </button>
                                </div>
                                <div className="bg-gray-50 p-3 border-2 border-ink text-[10px] text-ink font-mono font-bold leading-relaxed uppercase shadow-[2px_2px_0px_0px_#111111]">

                                    <Info size={14} className="inline mr-1 mb-0.5" />
                                    ID ORANG TUA OTOMATIS DI-GENERATE (OT+NIS).
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Student List Preview */}
                    {importedStudents.length > 0 && !currentClass && (
                        <div className="bg-paper border-2 border-ink overflow-hidden shadow-[4px_4px_0px_0px_#111111]">
                            <div className="px-4 py-2 bg-ink text-[10px] font-mono font-bold text-paper uppercase tracking-widest">PREVIEW 5 SISWA PERTAMA</div>
                            <div className="max-h-32 overflow-y-auto p-4 space-y-3 no-scrollbar text-ink">
                                {importedStudents.slice(0, 5).map(s => (
                                    <div key={s.id} className="flex items-center justify-between text-xs font-mono font-bold uppercase border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-gray-500">#{s.nis}</span>
                                            <div>
                                                <p>{s.name}</p>
                                                <p className="text-[10px] text-gray-400">WA: {s.waStudent}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-ink block">{s.parentName}</span>
                                            <span className="text-[10px] text-gray-400">WA: {s.waParent}</span>
                                        </div>
                                    </div>
                                ))}
                                {importedStudents.length > 5 && (
                                    <p className="text-[10px] text-gray-500 text-center font-mono font-bold uppercase pt-2">...DAN {importedStudents.length - 5} SISWA LAINNYA</p>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-ink hover:bg-paper text-paper hover:text-ink font-mono font-bold py-4 border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:mt-[4px] hover:shadow-none transition-all flex items-center justify-center space-x-2"
                    >
                        <Save size={20} className="stroke-[3]" />
                        <span className="uppercase tracking-widest text-xs">SIMPAN KELAS & IMPORT</span>
                    </button>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title="INFORMASI DETAIL KELAS"
            >
                {currentClass && (
                    <div className="space-y-6">
                        <div className="p-6 bg-paper border-2 border-ink flex flex-col items-center text-center shadow-[4px_4px_0px_0px_#111111]">
                            <div className="h-16 w-16 bg-paper border-2 border-ink flex items-center justify-center text-ink shadow-[2px_2px_0px_0px_#111111] mb-4">
                                <Hash size={32} strokeWidth={3} />
                            </div>
                            <h4 className="text-3xl font-black text-ink font-serif uppercase tracking-tight">{currentClass.name}</h4>
                            <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mt-1">LOKAL KELAS</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 border-2 border-ink shadow-[2px_2px_0px_0px_#111111]">
                                <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-1">TOTAL SISWA</p>
                                <p className="text-lg font-mono font-black text-ink uppercase">{currentClass.studentsCount || 0} ORANG</p>
                            </div>
                            <div className="p-4 bg-gray-50 border-2 border-ink shadow-[2px_2px_0px_0px_#111111]">
                                <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-1">TINGKAT</p>
                                <p className="text-lg font-mono font-black text-ink uppercase">{currentClass.level}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-2 border-ink shadow-[2px_2px_0px_0px_#111111] flex items-start space-x-4">
                            <div className="p-2 bg-paper border-2 border-ink text-ink shadow-[2px_2px_0px_0px_#111111]">
                                <UserCheck size={20} strokeWidth={3} />
                            </div>
                            <div>
                                <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-1">WALI KELAS</p>
                                <p className="text-sm font-mono font-black text-ink uppercase">{currentClass.homeroom || '-'}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setIsDetailOpen(false);
                                navigate('/admin/students', { state: { filterClass: currentClass.name } });
                            }}
                            className="w-full flex items-center justify-center space-x-2 py-4 bg-ink text-paper border-2 border-ink font-mono font-bold text-xs uppercase tracking-widest hover:bg-paper hover:text-ink transition-all shadow-[4px_4px_0px_0px_#111111] hover:mt-[2px] hover:shadow-[2px_2px_0px_0px_#111111] active:mt-[4px] active:shadow-none"
                        >
                            <Info size={16} strokeWidth={3} />
                            <span>DAFTAR SISWA KELAS INI</span>
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
