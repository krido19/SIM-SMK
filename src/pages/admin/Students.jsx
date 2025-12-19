import React, { useState, useMemo } from 'react';
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    X,
    Save,
    CheckCircle2,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Check,
    ChevronDown,
    Trash,
    UserCircle,
    Mail,
    Hash
} from 'lucide-react';

const initialStudents = [
    { id: 1, nis: '2023001', name: 'Ahmad Fauzi', class: 'X-IPA-1', email: 'ahmad@example.com', status: 'Aktif' },
    { id: 2, nis: '2023002', name: 'Budi Santoso', class: 'X-IPA-1', email: 'budi@example.com', status: 'Aktif' },
    { id: 3, nis: '2023003', name: 'Citra Lestari', class: 'XI-IPA-2', email: 'citra@example.com', status: 'Aktif' },
    { id: 4, nis: '2023004', name: 'Diana Putri', class: 'XII-IPA-1', email: 'diana@example.com', status: 'Izin' },
    { id: 5, nis: '2023005', name: 'Eko Prasetyo', class: 'X-IPS-1', email: 'eko@example.com', status: 'Aktif' },
    { id: 6, nis: '2023006', name: 'Fahri Hamzah', class: 'X-IPA-2', email: 'fahri@example.com', status: 'Aktif' },
    { id: 7, nis: '2023007', name: 'Gita Gutawa', class: 'XI-IPA-1', email: 'gita@example.com', status: 'Aktif' },
    { id: 8, nis: '2023008', name: 'Hani Shofia', class: 'XII-IPA-1', email: 'hani@example.com', status: 'Aktif' },
    { id: 9, nis: '2023009', name: 'Indra Herlambang', class: 'X-IPA-1', email: 'indra@example.com', status: 'Sakit' },
    { id: 10, nis: '2023010', name: 'Joko Widodo', class: 'XI-IPA-2', email: 'joko@example.com', status: 'Aktif' },
    { id: 11, nis: '2023011', name: 'Kevin Sanjaya', class: 'XII-IPA-1', email: 'kevin@example.com', status: 'Aktif' },
    { id: 12, nis: '2023012', name: 'Lesti Kejora', class: 'X-IPS-1', email: 'lesti@example.com', status: 'Aktif' },
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

export default function Students() {
    const [students, setStudents] = useState(initialStudents);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null);
    const [formData, setFormData] = useState({ name: '', nis: '', class: 'X-IPA-1', email: '', status: 'Aktif' });

    // New State for Advanced Features
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filterClass, setFilterClass] = useState('Semua');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const classes = ['Semua', 'X-IPA-1', 'X-IPA-2', 'XI-IPA-1', 'XI-IPA-2', 'XII-IPA-1', 'X-IPS-1'];
    const statuses = ['Semua', 'Aktif', 'Izin', 'Sakit', 'Alpa', 'Lulus'];

    const handleOpenAdd = () => {
        setCurrentStudent(null);
        setFormData({ name: '', nis: '', class: 'X-IPA-1', email: '', status: 'Aktif' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (student) => {
        setCurrentStudent(student);
        setFormData({
            name: student.name,
            nis: student.nis,
            class: student.class,
            email: student.email,
            status: student.status
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Hapus data siswa ini?')) {
            setStudents(students.filter(s => s.id !== id));
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        }
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Hapus ${selectedIds.length} siswa terpilih?`)) {
            setStudents(students.filter(s => !selectedIds.includes(s.id)));
            setSelectedIds([]);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(paginatedStudents.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentStudent) {
            setStudents(students.map(s => s.id === currentStudent.id ? { ...s, ...formData } : s));
        } else {
            setStudents([{ id: Date.now(), ...formData }, ...students]);
        }
        setIsModalOpen(false);
    };

    // Processing: Search -> Filter -> Sort -> Paginate
    const processedStudents = useMemo(() => {
        let result = students.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.nis.includes(searchTerm)
        );

        if (filterClass !== 'Semua') {
            result = result.filter(s => s.class === filterClass);
        }

        if (filterStatus !== 'Semua') {
            result = result.filter(s => s.status === filterStatus);
        }

        result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return result;
    }, [students, searchTerm, filterClass, filterStatus, sortConfig]);

    const totalPages = Math.ceil(processedStudents.length / pageSize);
    const paginatedStudents = processedStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const toggleSort = (key) => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Siswa</h1>
                    <p className="text-sm text-gray-500">Kelola data seluruh siswa dengan fitur sortir dan filter canggih.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
                >
                    <Plus size={18} />
                    <span>Tambah Siswa</span>
                </button>
            </div>

            {/* Advanced Filters & Search */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama atau NIS..."
                            className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl font-bold text-gray-700 outline-none transition-all border-2"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="relative group">
                            <select
                                className="appearance-none bg-gray-50 border-gray-100 px-6 py-3.5 pr-10 rounded-2xl text-sm font-black text-gray-600 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none cursor-pointer border-2"
                                value={filterClass}
                                onChange={(e) => setFilterClass(e.target.value)}
                            >
                                {classes.map(c => <option key={c} value={c}>Kelas: {c}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="relative group">
                            <select
                                className="appearance-none bg-gray-50 border-gray-100 px-6 py-3.5 pr-10 rounded-2xl text-sm font-black text-gray-600 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none cursor-pointer border-2"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                {statuses.map(s => <option key={s} value={s}>Status: {s}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Bulk Action Bar (Floating indicator style) */}
                {selectedIds.length > 0 && (
                    <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <div className="flex items-center space-x-4">
                            <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} Siswa Terpilih</span>
                            <div className="h-4 w-px bg-white/20" />
                            <button
                                onClick={() => setSelectedIds([])}
                                className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                        <button
                            onClick={handleBulkDelete}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-2 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                        >
                            <Trash size={14} />
                            <span>Hapus Terpilih</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Table with Sticky Header */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-5 w-10">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={selectedIds.length === paginatedStudents.length && paginatedStudents.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('name')}>
                                    <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <span>Siswa</span>
                                        <ArrowUpDown size={14} className={sortConfig.key === 'name' ? 'text-blue-600' : 'text-gray-300'} />
                                    </div>
                                </th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('nis')}>
                                    <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <span>NIS</span>
                                        <ArrowUpDown size={14} className={sortConfig.key === 'nis' ? 'text-blue-600' : 'text-gray-300'} />
                                    </div>
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kelas</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest uppercase tracking-widest">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedStudents.length > 0 ? (
                                paginatedStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        className={`hover:bg-blue-50/30 transition-colors group ${selectedIds.includes(student.id) ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <td className="px-6 py-5">
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={selectedIds.includes(student.id)}
                                                onChange={() => handleSelectOne(student.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gray-50 to-white flex items-center justify-center text-blue-600 font-black border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
                                                    {student.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900">{student.name}</p>
                                                    <p className="text-xs font-bold text-gray-400 mt-0.5">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-black text-gray-600">{student.nis}</td>
                                        <td className="px-6 py-5">
                                            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-100/50">
                                                {student.class}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${student.status === 'Aktif'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
                                                    : 'bg-orange-50 text-orange-700 border-orange-100/50'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => handleOpenEdit(student)}
                                                    className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student.id)}
                                                    className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                        Data tidak ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Baris per halaman:</p>
                        <select
                            className="bg-transparent text-sm font-black text-gray-700 outline-none cursor-pointer"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-all shadow-sm active:scale-90"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                            <span className="text-xs font-black text-gray-900 tracking-tighter">Halaman {currentPage} dari {totalPages || 1}</span>
                        </div>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-all shadow-sm active:scale-90"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        Menampilkan {paginatedStudents.length} dari {processedStudents.length} siswa
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nama Lengkap</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                                <UserCircle size={18} />
                            </div>
                            <input
                                required
                                type="text"
                                className="w-full bg-gray-50 border-transparent rounded-2xl pl-12 pr-4 py-4 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">NIS</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                                    <Hash size={18} />
                                </div>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-gray-50 border-transparent rounded-2xl pl-12 pr-4 py-4 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2"
                                    value={formData.nis}
                                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                                    <Mail size={18} />
                                </div>
                                <input
                                    required
                                    type="email"
                                    className="w-full bg-gray-50 border-transparent rounded-2xl pl-12 pr-4 py-4 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Kelas</label>
                            <div className="relative group">
                                <select
                                    className="w-full bg-gray-50 border-transparent rounded-2xl px-6 py-4 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2 appearance-none cursor-pointer"
                                    value={formData.class}
                                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                >
                                    {classes.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status</label>
                            <div className="relative group">
                                <select
                                    className="w-full bg-gray-50 border-transparent rounded-2xl px-6 py-4 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2 appearance-none cursor-pointer"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    {statuses.filter(s => s !== 'Semua').map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-100 transition-all flex items-center justify-center space-x-2 active:scale-95 mt-6"
                    >
                        <Save size={20} />
                        <span className="uppercase tracking-widest text-xs">Simpan Data Siswa</span>
                    </button>
                </form>
            </Modal>
        </div>
    );
}
