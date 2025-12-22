import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useFeedback } from '../../context/FeedbackContext';
import {
    Plus,
    Bell,
    Trash2,
    Edit2,
    Calendar,
    X,
    Save,
    Megaphone,
    CheckCircle2,
    Upload,
    ImageIcon,
    Loader2
} from 'lucide-react';



const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800">
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

export default function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
    const [viewAnnouncement, setViewAnnouncement] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', category: 'Umum', image_url: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const { showToast, showConfirm } = useFeedback();
    const userRole = localStorage.getItem('userRole') || 'admin';
    const canManage = userRole === 'admin';

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching announcements:', error);
        } else {
            setAnnouncements(data || []);
        }
        setIsLoading(false);
    };

    const handleOpenAdd = () => {
        setCurrentAnnouncement(null);
        setFormData({ title: '', content: '', category: 'Umum', image_url: '' });
        setImagePreview(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (ann) => {
        setCurrentAnnouncement(ann);
        setFormData({ title: ann.title, content: ann.content, category: ann.category, image_url: ann.image_url || '' });
        setImagePreview(ann.image_url || null);
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);

        setIsUploading(true);
        try {
            const fileName = `${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage
                .from('announcements')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('announcements')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
        } catch (err) {
            console.error('Upload error:', err);
            showToast('Gagal mengupload gambar. Pastikan bucket "announcements" sudah dibuat di Supabase Storage.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(
            'Hapus Pengumuman',
            'Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.',
            'danger'
        );

        if (confirmed) {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (!error) {
                showToast('Pengumuman berhasil dihapus', 'success');
                setAnnouncements(announcements.filter(a => a.id !== id));
            } else {
                showToast('Gagal menghapus: ' + error.message, 'error');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const payload = { ...formData, date };

        if (currentAnnouncement) {
            const { error } = await supabase
                .from('announcements')
                .update(payload)
                .eq('id', currentAnnouncement.id);

            if (error) {
                showToast('Gagal memperbarui: ' + error.message, 'error');
            } else {
                showToast('Pengumuman berhasil diperbarui', 'success');
                fetchAnnouncements();
                setIsModalOpen(false);
            }
        } else {
            const { error } = await supabase
                .from('announcements')
                .insert([payload]);

            if (error) {
                showToast('Gagal menambah: ' + error.message, 'error');
            } else {
                showToast('Pengumuman berhasil diterbitkan', 'success');
                fetchAnnouncements();
                setIsModalOpen(false);
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pengumuman</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kelola berita dan informasi penting untuk seluruh civitas sekolah.</p>
                </div>
                {canManage && (
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-100 active:scale-95"
                    >
                        <Plus size={20} />
                        <span className="uppercase tracking-widest text-xs tracking-tight">Buat Pengumuman</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.map((ann) => (
                    <div
                        key={ann.id}
                        onClick={() => setViewAnnouncement(ann)}
                        className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl dark:shadow-black/20 transition-all group relative overflow-hidden flex flex-col cursor-pointer active:scale-[0.98]"
                    >
                        {ann.image_url && (
                            <div className="w-full h-48 overflow-hidden relative">
                                <img src={ann.image_url} alt={ann.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>
                        )}
                        <div className="p-8 flex-1">
                            {!ann.image_url && (
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-rose-50 dark:bg-rose-900/10 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-150 transition-transform duration-700`} />
                            )}

                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 shadow-sm">
                                    <Megaphone size={24} />
                                </div>
                                {canManage && (
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleOpenEdit(ann)}
                                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ann.id)}
                                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10 space-y-4">
                                <div>
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-gray-100 dark:border-gray-700">
                                        {ann.category}
                                    </span>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-3 tracking-tight">{ann.title}</h3>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">{ann.content}</p>
                                <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                    <Calendar size={14} className="mr-2" />
                                    Diposting: {ann.date}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentAnnouncement ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Judul Pengumuman</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-700 focus:border-rose-500 border-2"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Kategori</label>
                        <select
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-700 focus:border-rose-500 border-2 appearance-none"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Umum">Umum</option>
                            <option value="Akademik">Akademik</option>
                            <option value="Event">Event / Acara</option>
                            <option value="Penting">Sangat Penting</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Isi Pengumuman</label>
                        <textarea
                            required
                            rows="4"
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-700 focus:border-rose-500 border-2 resize-none"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Foto Pengumuman (Opsional)</label>
                        <div className="relative group">
                            {imagePreview ? (
                                <div className="relative w-full h-40 rounded-2xl overflow-hidden border-2 border-dashed border-rose-200 dark:border-rose-900/40">
                                    <img src={imagePreview} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setImagePreview(null); setFormData({ ...formData, image_url: '' }) }}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-lg"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:border-rose-500 transition-all cursor-pointer group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                            {isUploading ? <Loader2 className="animate-spin text-rose-600" size={20} /> : <ImageIcon className="text-gray-400 group-hover:text-rose-600" size={20} />}
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                            {isUploading ? 'Sedang Mengunggah...' : 'Klik untuk Unggah Foto'}
                                        </p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                </label>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-100 transition-all flex items-center justify-center space-x-2 active:scale-95 mt-4"
                    >
                        <Save size={20} />
                        <span className="uppercase tracking-widest text-xs">Publikasikan</span>
                    </button>
                </form>
            </Modal>

            {/* View Detail Modal */}
            {viewAnnouncement && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-800">
                        <div className="relative">
                            {viewAnnouncement.image_url ? (
                                <img src={viewAnnouncement.image_url} className="w-full h-64 object-cover" />
                            ) : (
                                <div className="w-full h-32 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20" />
                            )}
                            <button
                                onClick={() => setViewAnnouncement(null)}
                                className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-2xl transition-all"
                            >
                                <X size={24} />
                            </button>
                            <div className="absolute bottom-6 left-8">
                                <span className="px-4 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                                    {viewAnnouncement.category}
                                </span>
                            </div>
                        </div>

                        <div className="p-10 overflow-y-auto space-y-6">
                            <div className="flex items-center space-x-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                <Calendar size={14} className="text-rose-500 dark:text-rose-600" />
                                <span>Dipublikasikan pada {viewAnnouncement.date}</span>
                            </div>

                            <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                                {viewAnnouncement.title}
                            </h2>

                            <div className="prose prose-rose dark:prose-invert max-w-none">
                                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed whitespace-pre-wrap">
                                    {viewAnnouncement.content}
                                </p>
                            </div>

                            <button
                                onClick={() => setViewAnnouncement(null)}
                                className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-black py-5 rounded-[1.5rem] transition-all flex items-center justify-center space-x-2 active:scale-95 text-xs uppercase tracking-widest mt-8 border border-gray-200 dark:border-gray-700"
                            >
                                Tutup Pengumuman
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
