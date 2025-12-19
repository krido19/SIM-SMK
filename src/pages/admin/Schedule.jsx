import React, { useState } from 'react';
import {
    Plus,
    Calendar,
    Clock,
    Filter,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    User,
    Hash,
    X,
    Save,
    Trash2,
    Edit2
} from 'lucide-react';

const initialSchedule = [
    { id: 1, class: 'X-IPA-1', subject: 'Matematika', teacher: 'Budi Santoso, S.Pd', day: 'Senin', start: '07:30', end: '09:00' },
    { id: 2, class: 'X-IPA-1', subject: 'Bahasa Indonesia', teacher: 'Siti Aminah, M.Pd', day: 'Senin', start: '09:15', end: '10:45' },
    { id: 3, class: 'XI-IPA-2', subject: 'Fisika', teacher: 'Hendra Wijaya, S.T', day: 'Selasa', start: '08:00', end: '10:00' },
    { id: 4, class: 'XII-IPA-1', subject: 'Kimia', teacher: 'Ani Maryani, S.Pd', day: 'Rabu', start: '10:15', end: '12:15' },
];

const Days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

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

export default function Schedule() {
    const [schedule, setSchedule] = useState(initialSchedule);
    const [selectedDay, setSelectedDay] = useState('Senin');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEntry, setCurrentEntry] = useState(null);
    const [formData, setFormData] = useState({ class: 'X-IPA-1', subject: 'Matematika', teacher: '', day: 'Senin', start: '07:30', end: '09:00' });

    const handleOpenAdd = () => {
        setCurrentEntry(null);
        setFormData({ class: 'X-IPA-1', subject: 'Matematika', teacher: '', day: selectedDay, start: '07:30', end: '09:00' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setCurrentEntry(item);
        setFormData({ ...item });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Hapus jadwal ini?')) {
            setSchedule(schedule.filter(s => s.id !== id));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentEntry) {
            setSchedule(schedule.map(s => s.id === currentEntry.id ? { ...s, ...formData } : s));
        } else {
            setSchedule([...schedule, { id: Date.now(), ...formData }]);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Jadwal Pelajaran</h1>
                    <p className="text-sm text-gray-500">Atur dan pantau jadwal kegiatan belajar mengajar.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
                >
                    <Plus size={18} />
                    <span>Tambah Jadwal</span>
                </button>
            </div>

            {/* Day Selector */}
            <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
                {Days.map((day) => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`flex-1 min-w-[100px] py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all ${selectedDay === day
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105 z-10'
                                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                            }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Schedule List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {schedule.filter(s => s.day === selectedDay).length > 0 ? (
                    schedule.filter(s => s.day === selectedDay).map((item) => (
                        <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center space-x-8 hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-150 transition-transform duration-700" />

                            <div className="flex flex-col items-center justify-center space-y-2 p-5 bg-gray-50 rounded-3xl border border-gray-100 min-w-[110px] group-hover:bg-white transition-colors relative z-10">
                                <Clock size={24} className="text-blue-600 mb-1" />
                                <span className="text-lg font-black text-gray-900 tracking-tight">{item.start}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">WIB</span>
                            </div>

                            <div className="flex-1 space-y-4 relative z-10">
                                <div className="flex items-center justify-between">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                                        {item.class}
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleOpenEdit(item)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight uppercase">{item.subject}</h3>
                                    <div className="flex items-center mt-2 text-sm text-gray-500 font-bold">
                                        <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center mr-3 text-[10px] text-gray-600 font-black">
                                            {item.teacher.substring(0, 2).toUpperCase()}
                                        </div>
                                        {item.teacher}
                                    </div>
                                </div>
                                <div className="pt-2 flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                    Durasi: {item.start} - {item.end}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 bg-white rounded-[3rem] border-4 border-dashed border-gray-50 animate-pulse">
                        <Calendar size={64} className="mb-6 opacity-10" />
                        <p className="font-black uppercase tracking-[0.2em] text-sm">Belum Ada Jadwal</p>
                        <p className="text-xs font-bold mt-2">Klik tombol 'Tambah' untuk membuat jadwal baru.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentEntry ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hari</label>
                            <select
                                className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2 appearance-none"
                                value={formData.day}
                                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                            >
                                {Days.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Kelas</label>
                            <select
                                className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2 appearance-none"
                                value={formData.class}
                                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                            >
                                <option value="X-IPA-1">X-IPA-1</option>
                                <option value="X-IPA-2">X-IPA-2</option>
                                <option value="XI-IPA-1">XI-IPA-1</option>
                                <option value="XII-IPA-1">XII-IPA-1</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mata Pelajaran</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Guru Pengajar</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2"
                            value={formData.teacher}
                            onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Waktu Mulai</label>
                            <input
                                required
                                type="time"
                                className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2"
                                value={formData.start}
                                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Waktu Selesai</label>
                            <input
                                required
                                type="time"
                                className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2"
                                value={formData.end}
                                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center space-x-2 active:scale-95 mt-4"
                    >
                        <Save size={20} />
                        <span className="uppercase tracking-widest text-xs">Simpan Jadwal</span>
                    </button>
                </form>
            </Modal>
        </div>
    );
}
