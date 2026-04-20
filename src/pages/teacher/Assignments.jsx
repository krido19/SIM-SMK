
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useFeedback } from '../../context/FeedbackContext';
import {
    Plus,
    Save,
    Trash2,
    FileText,
    Clock,
    X,
    ChevronDown,
    BookOpen,
    Upload,
    Download
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-white/20 w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh]">
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
                    <h3 className="text-xl font-sans font-black text-gray-900 tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">{children}</div>
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
        const role = localStorage.getItem('userRole');
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');

        if (role === 'guru' && (userId || userName)) {
            // Fetch only classes/subjects this teacher teaches
            let schedules = [];
            if (userId) {
                const { data: s1 } = await supabase.from('schedules').select('class_id, class_name, subject_name').eq('teacher_id', userId);
                if (s1) schedules.push(...s1);
            }
            if (userName) {
                const { data: s2 } = await supabase.from('schedules').select('class_id, class_name, subject_name').eq('teacher_name', userName);
                if (s2) schedules.push(...s2);
            }

            const classMap = {};
            schedules.forEach(s => {
                if (s.class_id && !classMap[s.class_id]) classMap[s.class_id] = { id: s.class_id, name: s.class_name || 'Kelas' };
            });
            setDbClasses(Object.values(classMap));

            const subjectNames = [...new Set(schedules.map(s => s.subject_name).filter(Boolean))];
            if (subjectNames.length > 0) {
                const { data: subData } = await supabase.from('subjects').select('id, name').in('name', subjectNames);
                setDbSubjects(subData || []);
            }
        } else {
            const { data: classes } = await supabase.from('classes').select('id, name');
            setDbClasses(classes || []);
            const { data: subjects } = await supabase.from('subjects').select('id, name').order('name');
            setDbSubjects(subjects || []);
        }

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
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                     <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Akademik
                        </span>
                    </div>
                    <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight leading-none mb-2">Manajemen Tugas</h1>
                    <p className="font-sans text-sm font-medium text-gray-500">Buat dan kelola tugas untuk siswa Anda.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>Buat Tugas Baru</span>
                </button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="py-24 text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest">Memuat Data Tugas...</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.length > 0 ? assignments.map((asg) => (
                        <div key={asg.id} className="bg-white border flex flex-col border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
                            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
                                <div className="flex items-start justify-between">
                                    <span className="px-3 py-1 bg-white text-gray-600 rounded-lg text-[10px] font-sans font-black uppercase tracking-widest border border-gray-200 shadow-sm">
                                        {asg.classes?.name || 'Kelas Tidak Diketahui'}
                                    </span>
                                    <button onClick={() => handleDelete(asg.id)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-xl transition-all shadow-sm">
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                                <h3 className="text-xl font-sans font-black text-gray-900 mt-4 tracking-tight leading-tight line-clamp-2">{asg.title}</h3>
                            </div>

                            <div className="p-6 space-y-4 flex-1 flex flex-col">
                                <div className="flex items-center space-x-2 text-[10px] font-sans font-bold text-blue-600 uppercase tracking-widest bg-blue-50/50 w-max px-3 py-1.5 rounded-lg border border-blue-100">
                                    <BookOpen size={14} />
                                    <span>{asg.subject_name}</span>
                                </div>

                                <p className="text-sm text-gray-600 font-sans line-clamp-3 leading-relaxed flex-1">
                                    {asg.description || <span className="italic text-gray-400">Tidak ada deskripsi.</span>}
                                </p>

                                {asg.file_url && (
                                    <a
                                        href={asg.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center w-max space-x-2 text-[10px] font-sans font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 hover:bg-indigo-100 transition-colors"
                                    >
                                        <Download size={14} strokeWidth={2.5} />
                                        <span>Unduh Lampiran</span>
                                    </a>
                                )}

                                <div className="pt-5 border-t border-gray-100 mt-auto">
                                    <div className="flex items-center space-x-2 text-[10px] font-sans font-bold text-rose-500 uppercase tracking-widest bg-rose-50 rounded-lg px-3 py-2 w-max border border-rose-100">
                                        <Clock size={14} strokeWidth={2.5} />
                                        <span>Tenggat: {new Date(asg.due_date).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                                 <FileText size={32} className="text-gray-300" strokeWidth={2} />
                            </div>
                            <h3 className="text-xl font-sans font-black text-gray-900 tracking-tight">Belum Ada Tugas</h3>
                            <p className="text-sm font-sans font-medium text-gray-500 mt-2 max-w-sm">Mulai buat tugas baru untuk siswa Anda untuk mulai mengelola nilai.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Tugas Baru">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-sans font-bold text-gray-700">Kelas Target</label>
                        <div className="relative group">
                            <select
                                required
                                className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 font-sans text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer tracking-tight"
                                value={formData.class_id}
                                onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                            >
                                <option value="" className="text-gray-400">Pilih Kelas</option>
                                {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-sans font-bold text-gray-700">Mata Pelajaran</label>
                        <div className="relative group">
                            <select
                                required
                                className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 font-sans text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer tracking-tight"
                                value={formData.subject_name}
                                onChange={e => setFormData({ ...formData, subject_name: e.target.value })}
                            >
                                <option value="" className="text-gray-400">Pilih Mapel</option>
                                {dbSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-sans font-bold text-gray-700">Judul Tugas</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 font-sans text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-400"
                            placeholder="Contoh: Latihan Soal Bab 1"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-sans font-bold text-gray-700">Deskripsi / Instruksi</label>
                        <textarea
                            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 font-sans text-sm text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all h-32 resize-none placeholder:text-gray-400 custom-scrollbar"
                            placeholder="Jelaskan detail tugas di sini..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-sans font-bold text-gray-700">Batas Pengumpulan</label>
                        <input
                            required
                            type="datetime-local"
                            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 font-sans text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
                            value={formData.due_date}
                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5 pt-2">
                         <span className="text-xs font-sans font-bold text-gray-700">Lampiran File (Opsional)</span>
                        <div className="relative mt-1">
                            <input
                                type="file"
                                className="hidden"
                                id="file-upload"
                                onChange={e => setSelectedFile(e.target.files[0])}
                            />
                            <label
                                htmlFor="file-upload"
                                className={`flex items-center justify-center space-x-3 w-full border-2 border-dashed rounded-2xl px-4 py-6 font-sans font-bold cursor-pointer transition-all uppercase tracking-widest text-xs
                                    ${selectedFile ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'}
                                `}
                            >
                                <Upload size={20} strokeWidth={2.5} />
                                <span>
                                    {selectedFile ? selectedFile.name : 'PILIH FILE ATAU DRAG DI SINI'}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 mt-6">
                        <button
                            type="submit"
                            disabled={isUploading}
                            className={`w-full bg-blue-600 text-white hover:bg-blue-700 font-sans text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-3 py-4 shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>MENGUNGGAH...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} strokeWidth={2.5} />
                                    <span>TERBITKAN TUGAS</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
