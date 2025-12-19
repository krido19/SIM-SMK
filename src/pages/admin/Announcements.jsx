import React, { useState } from 'react';
import {
    Plus,
    Bell,
    Trash2,
    Edit2,
    Calendar,
    X,
    Save,
    Megaphone,
    CheckCircle2
} from 'lucide-react';

const initialAnnouncements = [
    { id: 1, title: 'Ujian Akhir Semester (UAS)', content: 'UAS akan dilaksanakan pada tanggal 20-30 Desember 2023. Harap persiapkan diri Anda.', date: '15 Des 2023', category: 'Akademik' },
    { id: 2, title: 'Libur Hari Raya', content: 'Sekolah akan diliburkan mulai tanggal 25 Desember 2023 hingga 2 Januari 2024.', date: '10 Des 2023', category: 'Umum' },
];

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
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

export default function Announcements() {
    const [announcements, setAnnouncements] = useState(initialAnnouncements);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', category: 'Umum' });

    const handleOpenAdd = () => {
        setCurrentAnnouncement(null);
        setFormData({ title: '', content: '', category: 'Umum' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (ann) => {
        setCurrentAnnouncement(ann);
        setFormData({ title: ann.title, content: ann.content, category: ann.category });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Hapus pengumuman ini?')) {
            setAnnouncements(announcements.filter(a => a.id !== id));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        if (currentAnnouncement) {
            setAnnouncements(announcements.map(a => a.id === currentAnnouncement.id ? { ...a, ...formData, date } : a));
        } else {
            setAnnouncements([{ id: Date.now(), ...formData, date }, ...announcements]);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pengumuman</h1>
                    <p className="text-sm text-gray-500">Kelola berita dan informasi penting untuk seluruh civitas sekolah.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
                >
                    <Plus size={18} />
                    <span>Buat Pengumuman</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.map((ann) => (
                    <div key={ann.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-150 transition-transform duration-700`} />

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 shadow-sm">
                                <Megaphone size={24} />
                            </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenEdit(ann)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(ann.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                                    {ann.category}
                                </span>
                                <h3 className="text-2xl font-black text-gray-900 mt-3 tracking-tight">{ann.title}</h3>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{ann.content}</p>
                            <div className="pt-4 border-t border-gray-50 flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <Calendar size={14} className="mr-2" />
                                Diposting: {ann.date}
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
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Judul Pengumuman</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-rose-500 border-2"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Kategori</label>
                        <select
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-rose-500 border-2 appearance-none"
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
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Isi Pengumuman</label>
                        <textarea
                            required
                            rows="4"
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-rose-500 border-2 resize-none"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        ></textarea>
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
        </div>
    );
}
