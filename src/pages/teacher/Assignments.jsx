
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-paper border-4 border-ink shadow-[12px_12px_0px_0px_#111111] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-ink text-paper px-6 py-4 flex justify-between items-center border-b-4 border-ink">
                    <h3 className="font-mono font-black uppercase tracking-widest text-sm">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-paper/10 transition-colors">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
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
        const { data: classes } = await supabase.from('classes').select('id, name');
        setDbClasses(classes || []);

        const { data: subjects } = await supabase.from('subjects').select('id, name').order('name');
        setDbSubjects(subjects || []);

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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-ink pb-6">
                <div>
                    <h1 className="text-4xl font-black text-ink font-serif uppercase tracking-tight">MANAJEMEN TUGAS</h1>
                    <p className="text-ink font-mono font-bold uppercase tracking-widest mt-2 block">Buat dan kelola tugas untuk siswa Anda.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center space-x-2 bg-ink text-paper px-6 py-3 font-mono font-bold uppercase tracking-widest transition-all border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-paper hover:text-ink"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>BUAT TUGAS BARU</span>
                </button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="py-20 text-center font-mono text-[10px] uppercase tracking-widest">Memuat Data Tugas...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.length > 0 ? assignments.map((asg) => (
                        <div key={asg.id} className="bg-paper border-2 border-ink shadow-[8px_8px_0px_0px_#111111] group hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#111111] transition-all duration-300">
                            <div className="p-6 bg-ink text-paper relative overflow-hidden border-b-2 border-ink">
                                <div className="flex items-start justify-between relative z-10">
                                    <span className="px-2 py-1 bg-paper text-ink text-[10px] font-mono font-black uppercase tracking-widest border-2 border-ink">
                                        {asg.classes?.name || 'Kelas Tidak Diketahui'}
                                    </span>
                                    <button onClick={() => handleDelete(asg.id)} className="p-2 border-2 border-transparent hover:border-editorial hover:bg-editorial transition-all text-paper">
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                                <h3 className="text-2xl font-serif font-black mt-4 tracking-tight uppercase leading-tight line-clamp-2">{asg.title}</h3>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center space-x-2 text-[10px] font-mono font-bold text-ink uppercase tracking-widest">
                                    <BookOpen size={14} />
                                    <span>{asg.subject_name}</span>
                                </div>

                                <p className="text-sm text-ink/70 font-body line-clamp-3 leading-relaxed border-l-2 border-ink/20 pl-4">
                                    {asg.description || 'Tidak ada deskripsi.'}
                                </p>

                                {asg.file_url && (
                                    <a
                                        href={asg.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-2 text-[10px] font-mono font-bold text-ink uppercase tracking-widest border-2 border-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors"
                                    >
                                        <Download size={14} />
                                        <span>Unduh Lampiran</span>
                                    </a>
                                )}

                                <div className="pt-4 border-t-2 border-ink/10 flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-[10px] font-mono font-bold text-newsprint-red uppercase tracking-widest">
                                        <Clock size={14} />
                                        <span>Tenggat: {new Date(asg.due_date).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-ink/20 bg-paper">
                            <FileText size={48} className="mx-auto text-ink/20 mb-4" strokeWidth={1} />
                            <h3 className="text-lg font-serif font-black text-ink/40 uppercase">Belum Ada Tugas</h3>
                            <p className="text-sm font-mono text-ink/30 uppercase tracking-widest mt-2">Mulai buat tugas baru untuk siswa Anda.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Tugas Baru">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">KELAS TARGET</label>
                        <div className="relative group">
                            <select
                                required
                                className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all appearance-none cursor-pointer"
                                value={formData.class_id}
                                onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                            >
                                <option value="">Pilih Kelas</option>
                                {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">MATA PELAJARAN</label>
                        <div className="relative group">
                            <select
                                required
                                className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all appearance-none cursor-pointer"
                                value={formData.subject_name}
                                onChange={e => setFormData({ ...formData, subject_name: e.target.value })}
                            >
                                <option value="">Pilih Mapel</option>
                                {dbSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">JUDUL TUGAS</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                            placeholder="Contoh: Latihan Soal Bab 1"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">DESKRIPSI / INSTRUKSI</label>
                        <textarea
                            className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all h-24 resize-none"
                            placeholder="Jelaskan detail tugas di sini..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">BATAS PENGUMPULAN</label>
                        <input
                            required
                            type="datetime-local"
                            className="w-full bg-paper border-2 border-ink px-4 py-4 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                            value={formData.due_date}
                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">LAMPIRAN FILE (OPSIONAL)</label>
                        <div className="relative">
                            <input
                                type="file"
                                className="hidden"
                                id="file-upload"
                                onChange={e => setSelectedFile(e.target.files[0])}
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex items-center justify-center space-x-2 w-full bg-paper border-2 border-dashed border-ink px-4 py-4 font-mono font-bold text-ink cursor-pointer hover:bg-neutral-50 hover:shadow-[4px_4px_0px_0px_#111111] transition-all uppercase tracking-widest text-[10px]"
                            >
                                <Upload size={20} className={selectedFile ? 'text-newsprint-red' : ''} />
                                <span className={selectedFile ? 'text-newsprint-red' : ''}>
                                    {selectedFile ? selectedFile.name : 'Pilih File (PDF, Gambar, dll)'}
                                </span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading}
                        className={`w-full bg-ink hover:bg-paper text-paper hover:text-ink font-mono font-bold py-4 border-2 border-ink transition-colors flex items-center justify-center space-x-2 shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#111111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none mt-6 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isUploading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin"></div>
                                <span className="uppercase tracking-widest text-xs">Mengunggah...</span>
                            </div>
                        ) : (
                            <>
                                <Save size={20} />
                                <span className="uppercase tracking-widest text-xs">TERBITKAN TUGAS</span>
                            </>
                        )}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
