import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { sendWhatsApp } from '../../utils/fonnte';
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Mail,
    Phone,
    BookOpen,
    ArrowUpDown,
    X,
    Save,
    CheckCircle2,
    ChevronDown,
    MessageCircle
} from 'lucide-react';



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

export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const [formData, setFormData] = useState({ name: '', nip: '', specialty: 'Matematika', email: '', status: 'Aktif', wa_number: '' });
    const [filterSpecialty, setFilterSpecialty] = useState('Semua');
    const [isLoading, setIsLoading] = useState(true);
    const [dbSpecialties, setDbSpecialties] = useState(['Matematika', 'Bahasa Indonesia', 'Fisika', 'Biologi', 'Informatika', 'Kimia', 'Ekonomi', 'Sejarah', 'Geografi', 'Sosiologi', 'Bahasa Inggris', 'PJOK', 'PAI', 'Seni Budaya', 'PKn']);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching teachers:', error);
        } else {
            setTeachers(data || []);
            // Extract unique specialties from existing teachers
            if (data) {
                const existing = data.map(t => t.specialty).filter(Boolean);
                setDbSpecialties(prev => {
                    const combined = [...new Set([...prev, ...existing])];
                    return combined.sort();
                });
            }
        }
        setIsLoading(false);
    };

    const handleOpenAdd = () => {
        setCurrentTeacher(null);
        setFormData({ name: '', nip: '', specialty: 'Matematika', email: '', status: 'Aktif', wa_number: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (teacher) => {
        setCurrentTeacher(teacher);
        setFormData({
            name: teacher.name,
            nip: teacher.nip,
            specialty: teacher.specialty,
            email: teacher.email,
            status: teacher.status,
            wa_number: teacher.wa_number || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
            const { error } = await supabase.from('teachers').delete().eq('id', id);
            if (!error) {
                setTeachers(teachers.filter(t => t.id !== id));
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
            nip: formData.nip,
            email: formData.email,
            specialty: formData.specialty,
            wa_number: formData.wa_number,
            status: formData.status
        };

        if (currentTeacher) {
            const { error } = await supabase
                .from('teachers')
                .update(payload)
                .eq('id', currentTeacher.id);

            if (error) {
                alert('Gagal memperbarui guru: ' + error.message);
            } else {
                fetchTeachers();
                setIsModalOpen(false);
            }
        } else {
            const { error } = await supabase
                .from('teachers')
                .insert([payload]);

            if (error) {
                alert('Gagal menambah guru: ' + error.message);
            } else {
                fetchTeachers();
                setIsModalOpen(false);
            }
        }
        setIsLoading(false);
    };

    const filteredTeachers = teachers.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.nip.includes(searchTerm) ||
            t.specialty.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSpecialty = filterSpecialty === 'Semua' || t.specialty === filterSpecialty;
        return matchesSearch && matchesSpecialty;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Guru</h1>
                    <p className="text-sm text-gray-500">Kelola data tenaga pengajar dan mata pelajaran mereka.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
                >
                    <Plus size={18} />
                    <span>Tambah Guru</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama, NIP, atau mata pelajaran..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-100 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex space-x-2">
                    <div className="relative">
                        <select
                            className="appearance-none border border-gray-100 px-10 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors bg-white outline-none cursor-pointer pr-10"
                            value={filterSpecialty}
                            onChange={(e) => setFilterSpecialty(e.target.value)}
                        >
                            <option value="Semua">Semua Mapel</option>
                            {dbSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <button className="flex items-center space-x-2 border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors bg-white">
                        <ArrowUpDown size={18} />
                        <span>Urutkan</span>
                    </button>
                </div>
            </div>

            {/* Teacher Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map((teacher) => (
                    <div key={teacher.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-150 bg-indigo-600`} />

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm text-xl transition-transform group-hover:scale-110">
                                {teacher.name.split(' ')[0][0]}{teacher.name.split(' ')[1][0]}
                            </div>
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => handleOpenEdit(teacher)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(teacher.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1 relative z-10">
                            <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{teacher.name}</h3>
                            <p className="text-xs font-medium text-gray-500 tracking-wider">NIP: {teacher.nip}</p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-50 space-y-3 relative z-10">
                            <div className="flex items-center text-sm text-gray-600">
                                <BookOpen size={16} className="mr-3 text-indigo-400" />
                                <span className="font-medium">{teacher.specialty}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                < Mail size={16} className="mr-3 text-indigo-400" />
                                <span className="truncate">{teacher.email}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <MessageCircle size={16} className="mr-3 text-green-500" />
                                <span className="font-bold">{teacher.wa_number || '-'}</span>
                                <button
                                    onClick={() => sendWhatsApp(teacher.wa_number, `Halo Bapak/Ibu ${teacher.name}, berikut adalah pesan dari Admin...`)}
                                    className="ml-auto text-xs font-black text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors border border-green-100"
                                >
                                    Kirim WA
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${teacher.status === 'Aktif' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                    }`}>
                                    {teacher.status}
                                </span>
                                <button className="text-xs font-bold text-indigo-600 hover:underline">Lihat Detail</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nama Lengkap & Gelar</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-indigo-500 border-2"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">NIP</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-indigo-500 border-2"
                            value={formData.nip}
                            onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-indigo-500 border-2"
                            placeholder="email@example.com atau -"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">No. WhatsApp</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-indigo-500 border-2"
                            placeholder="62812... atau -"
                            value={formData.wa_number}
                            onChange={(e) => setFormData({ ...formData, wa_number: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mata Pelajaran</label>
                            <div className="relative">
                                <input
                                    list="mapel-list"
                                    required
                                    className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-indigo-500 border-2"
                                    placeholder="Ketik atau pilih mapel..."
                                    value={formData.specialty}
                                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                />
                                <datalist id="mapel-list">
                                    {dbSpecialties.map(s => (
                                        <option key={s} value={s} />
                                    ))}
                                </datalist>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status</label>
                            <select
                                className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-indigo-500 border-2 appearance-none"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Aktif">Aktif</option>
                                <option value="Izin">Izin</option>
                                <option value="Cuti">Cuti</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-2 active:scale-95"
                    >
                        <Save size={20} />
                        <span className="uppercase tracking-widest text-xs">Simpan Perubahan</span>
                    </button>
                </form>
            </Modal>
        </div>
    );
}
