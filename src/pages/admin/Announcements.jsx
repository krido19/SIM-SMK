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
    const canManage = userRole === 'admin' || userRole === 'guru';

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-ink pb-6">
                <div>
                    <h1 className="text-4xl font-black text-ink font-serif uppercase tracking-tight">PENGUMUMAN</h1>
                    <p className="text-ink font-mono font-bold uppercase tracking-widest mt-2">Kelola berita dan informasi penting untuk seluruh civitas sekolah.</p>
                </div>
                {canManage && (
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center justify-center space-x-2 bg-ink text-paper px-6 py-3 font-mono font-bold uppercase tracking-widest transition-all border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-paper hover:text-ink"
                    >
                        <Plus size={20} strokeWidth={3} />
                        <span className="text-xs">BUAT PENGUMUMAN</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.map((ann) => (
                    <div
                        key={ann.id}
                        onClick={() => setViewAnnouncement(ann)}
                        className="bg-paper border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:shadow-[8px_8px_0px_0px_#111111] hover:-translate-y-0.5 transition-all group relative overflow-hidden flex flex-col cursor-pointer"
                    >
                        {ann.image_url && (
                            <div className="w-full h-48 overflow-hidden relative border-b-2 border-ink">
                                <img src={ann.image_url} alt={ann.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                        )}
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-ink text-paper border-2 border-ink">
                                    <Megaphone size={20} strokeWidth={2.5} />
                                </div>
                                {canManage && (
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => handleOpenEdit(ann)} className="p-2 text-ink border-2 border-ink hover:bg-ink hover:text-paper transition-all shadow-[2px_2px_0px_0px_#111111]">
                                            <Edit2 size={16} strokeWidth={2.5} />
                                        </button>
                                        <button onClick={() => handleDelete(ann.id)} className="p-2 text-editorial border-2 border-editorial hover:bg-editorial hover:text-paper transition-all shadow-[2px_2px_0px_0px_#CC0000]">
                                            <Trash2 size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="px-2 py-1 bg-ink text-paper text-[9px] font-mono font-bold uppercase tracking-widest border border-ink">
                                        {ann.category}
                                    </span>
                                    <h3 className="text-xl font-black text-ink mt-2 tracking-tight font-serif uppercase">{ann.title}</h3>
                                </div>
                                <p className="text-gray-600 text-sm font-mono leading-relaxed line-clamp-3">{ann.content}</p>
                                <div className="pt-3 border-t-2 border-ink flex items-center text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">
                                    <Calendar size={12} className="mr-2" strokeWidth={2.5} />
                                    DIPOSTING: {ann.date}
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
                title={currentAnnouncement ? 'EDIT PENGUMUMAN' : 'BUAT PENGUMUMAN BARU'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">JUDUL PENGUMUMAN</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">KATEGORI</label>
                        <select
                            className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all appearance-none"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Umum">UMUM</option>
                            <option value="Akademik">AKADEMIK</option>
                            <option value="Event">EVENT / ACARA</option>
                            <option value="Penting">SANGAT PENTING</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">ISI PENGUMUMAN</label>
                        <textarea
                            required
                            rows="4"
                            className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all resize-none"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">FOTO PENGUMUMAN (OPSIONAL)</label>
                        <div className="relative group">
                            {imagePreview ? (
                                <div className="relative w-full h-40 overflow-hidden border-2 border-ink">
                                    <img src={imagePreview} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setImagePreview(null); setFormData({ ...formData, image_url: '' }) }}
                                        className="absolute top-2 right-2 p-1.5 bg-editorial text-paper border border-editorial hover:bg-paper hover:text-editorial"
                                    >
                                        <X size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-400 bg-gray-50 hover:bg-paper hover:border-ink transition-all cursor-pointer">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <div className="p-3 border-2 border-ink mb-3">
                                            {isUploading ? <Loader2 className="animate-spin text-ink" size={20} /> : <ImageIcon className="text-ink" size={20} />}
                                        </div>
                                        <p className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest">
                                            {isUploading ? 'MENGUNGGAH...' : 'KLIK UNTUK UNGGAH FOTO'}
                                        </p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                </label>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-ink hover:bg-paper text-paper hover:text-ink font-mono font-bold py-4 border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center space-x-2 mt-4"
                    >
                        <Save size={20} strokeWidth={3} />
                        <span className="uppercase tracking-widest text-xs">PUBLIKASIKAN</span>
                    </button>
                </form>
            </Modal>

            {/* View Detail Modal */}
            {viewAnnouncement && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-paper border-4 border-ink shadow-[16px_16px_0px_0px_#111111] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="relative">
                            {viewAnnouncement.image_url ? (
                                <img src={viewAnnouncement.image_url} className="w-full h-64 object-cover border-b-4 border-ink" />
                            ) : (
                                <div className="w-full h-20 bg-ink" />
                            )}
                            <button
                                onClick={() => setViewAnnouncement(null)}
                                className="absolute top-4 right-4 p-2 bg-paper border-2 border-ink text-ink hover:bg-ink hover:text-paper transition-all"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                            <div className="absolute bottom-4 left-6">
                                <span className="px-3 py-1 bg-ink text-paper text-[9px] font-mono font-bold uppercase tracking-widest border border-paper">
                                    {viewAnnouncement.category}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-4">
                            <div className="flex items-center space-x-2 text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">
                                <Calendar size={12} strokeWidth={2.5} />
                                <span>DIPUBLIKASIKAN: {viewAnnouncement.date}</span>
                            </div>

                            <h2 className="text-3xl font-black text-ink tracking-tight leading-tight font-serif uppercase">
                                {viewAnnouncement.title}
                            </h2>

                            <div className="border-t-2 border-ink pt-4">
                                <p className="text-gray-700 text-base font-mono leading-relaxed whitespace-pre-wrap">
                                    {viewAnnouncement.content}
                                </p>
                            </div>

                            <button
                                onClick={() => setViewAnnouncement(null)}
                                className="w-full bg-paper border-2 border-ink hover:bg-ink hover:text-paper text-ink font-mono font-bold py-4 transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-widest mt-4 shadow-[4px_4px_0px_0px_#111111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                            >
                                TUTUP PENGUMUMAN
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
