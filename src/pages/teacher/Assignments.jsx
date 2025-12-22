
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useFeedback } from '../../context/FeedbackContext';
import {
    Plus,
    Search,
    Calendar,
    Save,
    Trash2,
    FileText,
    Clock,
    X,
    ChevronDown,
    BookOpen,
    Users,
    Upload,
    Download
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-lg shadow-2xl p-6 transform transition-all scale-100 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors font-bold text-gray-400">
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default function Assignments() {
    const [assignments, setAssignments] = useState([]);
    const [dbClasses, setDbClasses] = useState([]);
    const [dbSubjects, setDbSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useFeedback();

    const [selectedFile, setSelectedFile] = useState(null);

    const [formData, setFormData] = useState({
        class_id: '',
        subject_name: '',
        title: '',
        description: '',
        due_date: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        // Fetch Classes
        const { data: classes } = await supabase.from('classes').select('id, name');
        setDbClasses(classes || []);

        // Fetch Subjects
        const { data: subjects } = await supabase.from('subjects').select('id, name').order('name');
        setDbSubjects(subjects || []);

        // Fetch My Assignments
        const userId = localStorage.getItem('userId');
        if (userId) {
            const { data: asgs } = await supabase
                .from('assignments')
                .select(`
                    *,
                    classes (name)
                `)
                .eq('teacher_id', userId)
                .order('created_at', { ascending: false });
            setAssignments(asgs || []);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem('userId');
        if (!userId) {
            showToast('Sesi Guru tidak valid', 'error');
            return;
        }

        setIsUploading(true);
        let fileUrl = null;

        if (selectedFile) {
            try {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${userId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('assignments')
                    .upload(filePath, selectedFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('assignments')
                    .getPublicUrl(filePath);

                fileUrl = publicUrl;
            } catch (err) {
                showToast('Gagal upload file: ' + err.message, 'error');
                setIsUploading(false);
                return;
            }
        }

        const { error } = await supabase.from('assignments').insert({
            teacher_id: userId,
            class_id: formData.class_id,
            subject_name: formData.subject_name,
            title: formData.title,
            description: formData.description,
            due_date: formData.due_date,
            file_url: fileUrl
        });

        setIsUploading(false);

        if (error) {
            showToast('Gagal membuat tugas: ' + error.message, 'error');
        } else {
            showToast('Tugas berhasil diterbitkan!', 'success');
            setIsModalOpen(false);
            setFormData({
                class_id: '',
                subject_name: '',
                title: '',
                description: '',
                due_date: ''
            });
            setSelectedFile(null);
            fetchInitialData();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus tugas ini?')) return;
        const { error } = await supabase.from('assignments').delete().eq('id', id);
        if (error) {
            showToast('Gagal menghapus', 'error');
        } else {
            showToast('Tugas dihapus', 'success');
            fetchInitialData();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Manajemen Tugas</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Buat dan kelola tugas untuk siswa Anda.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-100 active:scale-95"
                >
                    <Plus size={20} />
                    <span className="uppercase tracking-widest text-xs">Buat Tugas Baru</span>
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.length > 0 ? assignments.map((asg) => (
                    <div key={asg.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl dark:shadow-black/20 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100/50 dark:border-blue-900/40">
                                    {asg.classes?.name || 'Unknown Class'}
                                </span>
                                <div className="flex space-x-1">
                                    <button onClick={() => handleDelete(asg.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {asg.title}
                            </h3>

                            <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-wide">
                                <BookOpen size={14} className="text-blue-300 dark:text-blue-700" />
                                <span>{asg.subject_name}</span>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-6 leading-relaxed">
                                {asg.description || 'Tidak ada deskripsi.'}
                            </p>

                            {asg.file_url && (
                                <div className="mb-4">
                                    <a
                                        href={asg.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-xl border border-blue-100/50 dark:border-blue-900/40 transition-colors"
                                    >
                                        <Download size={14} />
                                        <span>Download Lampiran</span>
                                    </a>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-xs font-bold text-orange-500 dark:text-orange-600">
                                    <Clock size={14} />
                                    <span>Due: {new Date(asg.due_date).toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-800/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                        <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                        <h3 className="text-lg font-black text-gray-400 dark:text-gray-500">Belum ada tugas</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Mulai buat tugas baru untuk siswa Anda.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Tugas Baru">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Kelas Target</label>
                        <select
                            required
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2 transition-all"
                            value={formData.class_id}
                            onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                        >
                            <option value="">Pilih Kelas</option>
                            {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Mata Pelajaran</label>
                        <select
                            required
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2 transition-all"
                            value={formData.subject_name}
                            onChange={e => setFormData({ ...formData, subject_name: e.target.value })}
                        >
                            <option value="">Pilih Mapel</option>
                            {dbSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Judul Tugas</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2 transition-all"
                            placeholder="Contoh: Latihan Soal Bab 1"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Deskripsi / Instruksi</label>
                        <textarea
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2 transition-all h-24 resize-none"
                            placeholder="Jelaskan detail tugas di sini..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Batas Pengumpulan (Deadline)</label>
                        <input
                            required
                            type="datetime-local"
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2 transition-all"
                            value={formData.due_date}
                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Lampiran File (Opsional)</label>
                        <div className="relative">
                            <input
                                type="file"
                                className="hidden"
                                id="file-upload"
                                onChange={e => setSelectedFile(e.target.files[0])}
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex items-center justify-center space-x-2 w-full bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 font-bold text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-white dark:hover:bg-gray-700 hover:border-blue-500 transition-all"
                            >
                                <Upload size={20} className={selectedFile ? 'text-blue-600' : ''} />
                                <span className={selectedFile ? 'text-blue-600' : ''}>
                                    {selectedFile ? selectedFile.name : 'Pilih File (PDF, Gambar, dll)'}
                                </span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 dark:shadow-black/20 transition-all flex items-center justify-center space-x-2 active:scale-95 mt-4 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isUploading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="uppercase tracking-widest text-xs">Mengunggah...</span>
                            </div>
                        ) : (
                            <>
                                <Save size={20} />
                                <span className="uppercase tracking-widest text-xs">Terbitkan Tugas</span>
                            </>
                        )}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
