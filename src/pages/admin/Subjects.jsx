import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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
    CheckCircle2,
    UserCircle,
    ChevronDown,
    Users
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
                <div className="p-6 overflow-y-auto max-h-[80vh]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [dbTeachers, setDbTeachers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState(null);
    const [formData, setFormData] = useState({ name: '', kkm: 75, jurusan: 'Umum', color: 'blue', teachers: [] });
    const [isLoading, setIsLoading] = useState(true);

    const [dynamicJurusan, setDynamicJurusan] = useState(['Umum', 'DKV', 'PPLG', 'AKL', 'MPLB', 'NA']);

    useEffect(() => {
        fetchSubjects();
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        const { data } = await supabase.from('teachers').select('id, name').order('name');
        if (data) setDbTeachers(data);
    };

    const fetchSubjects = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching subjects:', error);
        } else {
            const fetchedSubjects = data || [];
            setSubjects(fetchedSubjects);

            // Extract unique jurusan
            const uniqueJurusan = [...new Set([
                'Umum', 'DKV', 'PPLG', 'AKL', 'MPLB', 'NA',
                ...fetchedSubjects.map(s => s.jurusan).filter(Boolean)
            ])];
            setDynamicJurusan(uniqueJurusan);
        }
        setIsLoading(false);
    };

    const handleOpenAdd = () => {
        setCurrentSubject(null);
        setFormData({ name: '', kkm: 75, jurusan: 'Umum', color: 'blue', teachers: [] });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (subject) => {
        setCurrentSubject(subject);
        setFormData({
            name: subject.name,
            kkm: subject.kkm,
            jurusan: subject.jurusan || 'Umum',
            color: subject.color,
            teachers: subject.teachers ? subject.teachers.split(', ') : []
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) {
            const { error } = await supabase.from('subjects').delete().eq('id', id);
            if (!error) {
                setSubjects(subjects.filter(s => s.id !== id));
            } else {
                alert('Gagal menghapus: ' + error.message);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            name: formData.name,
            kkm: formData.kkm,
            jurusan: formData.jurusan,
            color: formData.color,
            teachers: formData.teachers.join(', ')
        };

        if (currentSubject) {
            const { error } = await supabase
                .from('subjects')
                .update(payload)
                .eq('id', currentSubject.id);

            if (error) {
                alert('Gagal memperbarui mapel: ' + error.message);
            } else {
                fetchSubjects();
                setIsModalOpen(false);
            }
        } else {
            const { error } = await supabase
                .from('subjects')
                .insert([payload]);

            if (error) {
                alert('Gagal menambah mapel: ' + error.message);
            } else {
                fetchSubjects();
                setIsModalOpen(false);
            }
        }
        setIsLoading(false);
    };

    const handleTeacherToggle = (name) => {
        setFormData(prev => {
            const teachers = [...prev.teachers];
            if (teachers.includes(name)) {
                return { ...prev, teachers: teachers.filter(t => t !== name) };
            } else {
                return { ...prev, teachers: [...teachers, name] };
            }
        });
    };

    const filteredSubjects = subjects.filter(s =>
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.jurusan || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mata Pelajaran</h1>
                    <p className="text-sm text-gray-500">Manajemen kurikulum, Jurusan, dan Pengampu Mata Pelajaran.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
                >
                    <Plus size={18} />
                    <span>Tambah Mapel</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Cari mata pelajaran atau jurusan..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubjects.map((subject) => (
                    <div key={subject.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative flex flex-col h-full">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 bg-${subject.color}-600 group-hover:scale-150 transition-transform`} />

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className={`p-4 rounded-2xl bg-${subject.color}-50 text-${subject.color}-600 transition-transform group-hover:scale-110 shadow-sm`}>
                                <BookOpen size={24} />
                            </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

                        <div className="relative z-10 flex-1 flex flex-col">
                            <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{subject.name}</h3>

                            <div className="flex items-center space-x-2 mt-1">
                                <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-gray-200">
                                    {subject.jurusan}
                                </span>
                            </div>

                            <div className="mt-4 flex-1 space-y-2">
                                <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <Users size={12} />
                                    <span>Guru Pengampu</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {subject.teachers ? subject.teachers.split(', ').map((teacher, idx) => (
                                        <span key={idx} className="text-[11px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                            {teacher}
                                        </span>
                                    )) : <span className="text-[11px] text-gray-400 italic">Belum ada guru</span>}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Target size={16} className="text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">KKM minimal</span>
                                </div>
                                <span className="text-2xl font-black text-emerald-600">{subject.kkm}</span>
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
                maxWidth="max-w-md"
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
                            <div className="relative">
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
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Jurusan (Ketik Baru atau Pilih)</label>
                        <div className="relative">
                            <input
                                list="jurusan-list"
                                type="text"
                                className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-emerald-500 border-2"
                                placeholder="Misal: DKV, PPLG, atau Jurusan Baru..."
                                value={formData.jurusan}
                                onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                            />
                            <datalist id="jurusan-list">
                                {dynamicJurusan.map(opt => (
                                    <option key={opt} value={opt} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Guru Pengampu (Bisa Pilih Banyak)</label>
                        <div className="max-h-48 overflow-y-auto bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus-within:bg-white focus-within:border-emerald-500 transition-all space-y-2 no-scrollbar">
                            {dbTeachers.map(teacher => (
                                <button
                                    key={teacher.id}
                                    type="button"
                                    onClick={() => handleTeacherToggle(teacher.name)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-xs ${formData.teachers.includes(teacher.name)
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-[1.02]'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <UserCircle size={16} className={formData.teachers.includes(teacher.name) ? 'text-emerald-200' : 'text-gray-300'} />
                                        <span>{teacher.name}</span>
                                    </div>
                                    {formData.teachers.includes(teacher.name) && <CheckCircle2 size={16} />}
                                </button>
                            ))}
                            {dbTeachers.length === 0 && <p className="text-center text-xs text-gray-400 italic py-4">Belum ada data guru</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Save size={20} />}
                        <span className="uppercase tracking-widest text-xs">{currentSubject ? 'Simpan Perubahan' : 'Buat Mapel'}</span>
                    </button>
                </form>
            </Modal>
        </div>
    );
}
