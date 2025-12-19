import React, { useState } from 'react';
import {
    Plus,
    Search,
    BookOpen,
    Target,
    Edit2,
    Trash2,
    Layers,
    Award,
    X,
    Save,
    CheckCircle2
} from 'lucide-react';

const initialSubjects = [
    { id: 1, name: 'Matematika', kkm: 75, category: 'Wajib', color: 'blue' },
    { id: 2, name: 'Bahasa Indonesia', kkm: 75, category: 'Wajib', color: 'indigo' },
    { id: 3, name: 'Bahasa Inggris', kkm: 75, category: 'Wajib', color: 'violet' },
    { id: 4, name: 'Fisika', kkm: 70, category: 'Peminatan IPA', color: 'orange' },
    { id: 5, name: 'Kimia', kkm: 70, category: 'Peminatan IPA', color: 'emerald' },
    { id: 6, name: 'Ekonomi', kkm: 70, category: 'Peminatan IPS', color: 'rose' },
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

export default function Subjects() {
    const [subjects, setSubjects] = useState(initialSubjects);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState(null);
    const [formData, setFormData] = useState({ name: '', kkm: 75, category: 'Wajib', color: 'blue' });

    const handleOpenAdd = () => {
        setCurrentSubject(null);
        setFormData({ name: '', kkm: 75, category: 'Wajib', color: 'blue' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (subject) => {
        setCurrentSubject(subject);
        setFormData({
            name: subject.name,
            kkm: subject.kkm,
            category: subject.category,
            color: subject.color
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) {
            setSubjects(subjects.filter(s => s.id !== id));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentSubject) {
            setSubjects(subjects.map(s => s.id === currentSubject.id ? { ...s, ...formData } : s));
        } else {
            const newSubject = {
                id: Date.now(),
                ...formData
            };
            setSubjects([...subjects, newSubject]);
        }
        setIsModalOpen(false);
    };

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mata Pelajaran</h1>
                    <p className="text-sm text-gray-500">Manajemen kurikulum dan Standar Kriteria Ketuntasan Minimal (KKM).</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
                >
                    <Plus size={18} />
                    <span>Tambah Mapel</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubjects.map((subject) => (
                    <div key={subject.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 bg-${subject.color}-600 group-hover:scale-150 transition-transform`} />

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className={`p-4 rounded-2xl bg-${subject.color}-50 text-${subject.color}-600 transition-transform group-hover:scale-110 shadow-sm`}>
                                <BookOpen size={24} />
                            </div>
                            <div className="flex space-x-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenEdit(subject)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(subject.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{subject.name}</h3>
                            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{subject.category}</p>

                            <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Target size={16} className="text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">KKM</span>
                                </div>
                                <span className="text-2xl font-black text-emerald-600">{subject.kkm}</span>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <Layers size={14} className="mr-2" />
                                    Kurikulum 2013
                                </div>
                                <Award size={18} className="text-yellow-400" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentSubject ? 'Edit Mata Pelajaran' : 'Tambah Mapel Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nama Mata Pelajaran</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-emerald-500 border-2"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">KKM</label>
                            <input
                                required
                                type="number"
                                className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-emerald-500 border-2"
                                value={formData.kkm}
                                onChange={(e) => setFormData({ ...formData, kkm: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Warna Ikon</label>
                            <select
                                className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-emerald-500 border-2 appearance-none"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            >
                                <option value="blue">Biru</option>
                                <option value="indigo">Indigo</option>
                                <option value="violet">Ungu</option>
                                <option value="orange">Orange</option>
                                <option value="emerald">Hijau</option>
                                <option value="rose">Merah</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Kategori</label>
                        <select
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-emerald-500 border-2 appearance-none"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Wajib">Wajib Dasar</option>
                            <option value="Peminatan IPA">Peminatan IPA</option>
                            <option value="Peminatan IPS">Peminatan IPS</option>
                            <option value="Muatan Lokal">Muatan Lokal</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center space-x-2 active:scale-95"
                    >
                        <Save size={20} />
                        <span className="uppercase tracking-widest text-xs">Simpan Perubahan</span>
                    </button>
                </form>
            </Modal>
        </div>
    );
}
