import React, { useState } from 'react';
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
    CheckCircle2
} from 'lucide-react';

const initialTeachers = [
    { id: 1, nip: '198501012010011001', name: 'Budi Santoso, S.Pd', specialty: 'Matematika', email: 'budi.s@school.id', status: 'Aktif' },
    { id: 2, nip: '198812122015012002', name: 'Siti Aminah, M.Pd', specialty: 'Bahasa Indonesia', email: 'siti.a@school.id', status: 'Aktif' },
    { id: 3, nip: '199005052018011003', name: 'Hendra Wijaya, S.T', specialty: 'Fisika', email: 'hendra.w@school.id', status: 'Aktif' },
    { id: 4, nip: '198203032008012004', name: 'Ani Maryani, S.Pd', specialty: 'Biologi', email: 'ani.m@school.id', status: 'Izin' },
    { id: 5, nip: '199507072020011005', name: 'Rizky Pratama, S.Kom', specialty: 'Informatika', email: 'rizky.p@school.id', status: 'Aktif' },
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

export default function Teachers() {
    const [teachers, setTeachers] = useState(initialTeachers);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const [formData, setFormData] = useState({ name: '', nip: '', specialty: 'Matematika', email: '', status: 'Aktif' });

    const handleOpenAdd = () => {
        setCurrentTeacher(null);
        setFormData({ name: '', nip: '', specialty: 'Matematika', email: '', status: 'Aktif' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (teacher) => {
        setCurrentTeacher(teacher);
        setFormData({
            name: teacher.name,
            nip: teacher.nip,
            specialty: teacher.specialty,
            email: teacher.email,
            status: teacher.status
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
            setTeachers(teachers.filter(t => t.id !== id));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentTeacher) {
            setTeachers(teachers.map(t => t.id === currentTeacher.id ? { ...t, ...formData } : t));
        } else {
            const newTeacher = {
                id: Date.now(),
                ...formData
            };
            setTeachers([...teachers, newTeacher]);
        }
        setIsModalOpen(false);
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.nip.includes(searchTerm) ||
        t.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Guru</h1>
                    <p className="text-sm text-gray-500">Kelola data tenaga pengajar dan spesialisasi mereka.</p>
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
                    <button className="flex items-center space-x-2 border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                        <span>Spesialisasi</span>
                    </button>
                    <button className="flex items-center space-x-2 border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
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
                            type="email"
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-indigo-500 border-2"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Spesialisasi</label>
                            <select
                                className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-indigo-500 border-2 appearance-none"
                                value={formData.specialty}
                                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                            >
                                <option value="Matematika">Matematika</option>
                                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                                <option value="Fisika">Fisika</option>
                                <option value="Biologi">Biologi</option>
                                <option value="Informatika">Informatika</option>
                            </select>
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
