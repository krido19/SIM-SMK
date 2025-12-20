import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Plus,
    Calendar,
    Clock,
    Filter,
    BookOpen,
    User,
    X,
    Save,
    Trash2,
    Edit2,
    ChevronDown,
    Search,
    Info,
    Layout
} from 'lucide-react';

const Days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Configuration for sessions
const SCHOOL_START_TIME = "07:15";
const SESSION_DURATION = 45; // minutes
const BREAK1_AFTER = 4;
const BREAK1_DURATION = 15;
const BREAK2_AFTER = 6;
const BREAK2_DURATION = 45; // Ishoma

const calculateTimeSlots = (startTime) => {
    const slots = [];
    let current = new Date(`2000-01-01T${startTime}:00`);

    for (let i = 1; i <= 12; i++) {
        const start = current.toTimeString().substring(0, 5);
        current.setMinutes(current.getMinutes() + SESSION_DURATION);
        const end = current.toTimeString().substring(0, 5);

        slots.push({ id: i, start, end, type: 'lesson' });

        if (i === BREAK1_AFTER) {
            const bStart = current.toTimeString().substring(0, 5);
            current.setMinutes(current.getMinutes() + BREAK1_DURATION);
            const bEnd = current.toTimeString().substring(0, 5);
            slots.push({ id: `b1`, label: 'Istirahat 1', start: bStart, end: bEnd, type: 'break' });
        } else if (i === BREAK2_AFTER) {
            const bStart = current.toTimeString().substring(0, 5);
            current.setMinutes(current.getMinutes() + BREAK2_DURATION);
            const bEnd = current.toTimeString().substring(0, 5);
            slots.push({ id: `b2`, label: 'ISHOMA', start: bStart, end: bEnd, type: 'break' });
        }
    }
    return slots;
};

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col`}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-xl font-black text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function Schedule() {
    const [schedules, setSchedules] = useState([]);
    const [selectedDay, setSelectedDay] = useState('Senin');
    const [selectedClassId, setSelectedClassId] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEntry, setCurrentEntry] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [dbClasses, setDbClasses] = useState([]);
    const [dbSubjects, setDbSubjects] = useState([]);
    const [dbTeachers, setDbTeachers] = useState([]);

    const [formData, setFormData] = useState({
        class_id: '',
        subject_name: '',
        teacher_name: '',
        day: 'Senin',
        jam_ke: 1,
        start_time: '',
        end_time: ''
    });

    const [schoolStartTime, setSchoolStartTime] = useState(SCHOOL_START_TIME);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const userRole = localStorage.getItem('userRole') || 'admin';
    const canManage = userRole === 'admin';
    const timeSlots = useMemo(() => calculateTimeSlots(schoolStartTime), [schoolStartTime]);

    useEffect(() => {
        fetchData();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const { data } = await supabase.from('settings').select('value').eq('key', 'school_start_time').single();
        if (data?.value) setSchoolStartTime(data.value);
    };

    const handleSaveSettings = async () => {
        const { error } = await supabase.from('settings').upsert({ key: 'school_start_time', value: schoolStartTime });
        if (!error) {
            setIsSettingsOpen(false);
            fetchData();
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        const [sch, cls, sub, tea] = await Promise.all([
            supabase.from('schedules').select('*').order('jam_ke', { ascending: true }),
            supabase.from('classes').select('id, name').order('name'),
            supabase.from('subjects').select('id, name, teachers').order('name'),
            supabase.from('teachers').select('id, name').order('name')
        ]);

        if (!sch.error) setSchedules(sch.data || []);
        if (!cls.error) setDbClasses(cls.data || []);
        if (!sub.error) setDbSubjects(sub.data || []);
        if (!tea.error) setDbTeachers(tea.data || []);

        if (cls.data?.length > 0) {
            setFormData(prev => ({ ...prev, class_id: cls.data[0].id }));
        }
        setIsLoading(false);
    };

    const updateTimesFromJam = (jam) => {
        const slot = timeSlots.find(s => s.id === parseInt(jam));
        if (slot) {
            setFormData(prev => ({
                ...prev,
                jam_ke: jam,
                start_time: slot.start,
                end_time: slot.end
            }));
        }
    };

    const handleOpenAdd = () => {
        setCurrentEntry(null);
        const initialJam = 1;
        const slot = timeSlots.find(s => s.id === initialJam);
        setFormData({
            class_id: dbClasses[0]?.id || '',
            subject_name: dbSubjects[0]?.name || '',
            teacher_name: '',
            day: selectedDay,
            jam_ke: initialJam,
            start_time: slot?.start || '',
            end_time: slot?.end || ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (entry) => {
        setCurrentEntry(entry);
        setFormData({
            class_id: entry.class_id,
            subject_name: entry.subject_name,
            teacher_name: entry.teacher_name,
            day: entry.day,
            jam_ke: entry.jam_ke || 1,
            start_time: entry.start_time,
            end_time: entry.end_time
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Hapus jadwal ini?')) {
            const { error } = await supabase.from('schedules').delete().eq('id', id);
            if (!error) fetchData();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const selectedClass = dbClasses.find(c => c.id === formData.class_id);
        const payload = {
            ...formData,
            class_name: selectedClass?.name || ''
        };

        const { error } = currentEntry
            ? await supabase.from('schedules').update(payload).eq('id', currentEntry.id)
            : await supabase.from('schedules').insert([payload]);

        if (error) {
            alert('Gagal menyimpan: ' + error.message);
        } else {
            fetchData();
            setIsModalOpen(false);
        }
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 500);
    };

    const filteredSchedules = schedules.filter(s => {
        const dayMatch = s.day === selectedDay;
        const classMatch = selectedClassId === 'all' || s.class_id === selectedClassId;
        return dayMatch && classMatch;
    });

    const getTeachersForSubject = (subjectName) => {
        const sub = dbSubjects.find(s => s.name === subjectName);
        return sub?.teachers ? sub.teachers.split(', ') : [];
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Jadwal Pelajaran</h1>
                    <p className="text-sm text-gray-500 font-medium">Manajemen KBM 12 Jam Pelajaran & Istirahat Otomatis.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {canManage && (
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-3 bg-white border-2 border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
                            title="Pengaturan Waktu"
                        >
                            <Clock size={20} />
                        </button>
                    )}
                    <div className="relative inline-block">
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="bg-white border-2 border-gray-100 rounded-2xl px-10 py-3 font-bold text-gray-700 outline-none focus:border-blue-500 transition-all appearance-none pr-12 shadow-sm"
                        >
                            <option value="all">Semua Kelas</option>
                            {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    {canManage && (
                        <button
                            onClick={handleOpenAdd}
                            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-100 active:scale-95"
                        >
                            <Plus size={20} />
                            <span className="uppercase tracking-widest text-xs">Tambah Jadwal</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Day Selector */}
            <div className="flex bg-white p-1.5 rounded-[2rem] border-2 border-gray-50 shadow-sm overflow-x-auto no-scrollbar">
                {Days.map((day) => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`flex-1 min-w-[120px] py-4 px-6 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 ${selectedDay === day
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02] z-10'
                            : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                            }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Time Slots Visualization / Schedule List */}
            <div className="grid grid-cols-1 gap-4">
                {timeSlots.map((slot) => {
                    const entry = filteredSchedules.find(s => s.jam_ke === slot.id);

                    if (slot.type === 'break') {
                        return (
                            <div key={slot.id} className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2rem] p-4 flex items-center justify-center space-x-4 opacity-60 group hover:opacity-100 transition-opacity">
                                <Clock size={16} className="text-gray-400" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{slot.label}</span>
                                <span className="h-px w-20 bg-gray-200" />
                                <span className="text-[10px] font-black text-gray-500">{slot.start} - {slot.end}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={slot.id} className={`group relative bg-white rounded-[2.5rem] p-6 border-2 transition-all duration-500 ${entry ? 'border-blue-50 shadow-md hover:shadow-2xl hover:border-blue-200' : 'border-gray-50 opacity-40 hover:opacity-100'}`}>
                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                                {/* Session Badge */}
                                <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-3xl border-2 transition-colors ${entry ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Jam</span>
                                    <span className="text-3xl font-black">{slot.id}</span>
                                </div>

                                {/* Time Info */}
                                <div className="text-center md:text-left min-w-[100px]">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Waktu</p>
                                    <p className="text-lg font-black text-gray-900 leading-none">{slot.start} - {slot.end}</p>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                                    {entry ? (
                                        <>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-3">
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100">
                                                        {entry.class_name}
                                                    </span>
                                                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase group-hover:text-blue-600 transition-colors">{entry.subject_name}</h3>
                                                </div>
                                                <div className="flex items-center text-sm font-bold text-gray-500">
                                                    <User size={16} className="mr-2 text-blue-400" />
                                                    {entry.teacher_name || 'GURU BELUM DIPILIH'}
                                                </div>
                                            </div>
                                            {canManage && (
                                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button onClick={() => handleOpenEdit(entry)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(entry.id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center md:justify-start text-xs font-bold text-gray-300 uppercase tracking-widest italic italic">
                                            Kosong / Belum Ada Pelajaran
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentEntry ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
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
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Jam Ke</label>
                            <select
                                className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2 appearance-none"
                                value={formData.jam_ke}
                                onChange={(e) => updateTimesFromJam(e.target.value)}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => <option key={n} value={n}>Jam Ke-{n}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Kelas</label>
                        <select
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2 appearance-none"
                            value={formData.class_id}
                            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                        >
                            <option value="">Pilih Kelas</option>
                            {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mata Pelajaran</label>
                        <select
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2 appearance-none"
                            value={formData.subject_name}
                            onChange={(e) => setFormData({ ...formData, subject_name: e.target.value, teacher_name: '' })}
                        >
                            <option value="">Pilih Mapel</option>
                            {dbSubjects.map(s => <option key={s.id} value={s.name}>{s.name} ({s.jurusan})</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Guru Pengampu</label>
                        <select
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2 appearance-none"
                            value={formData.teacher_name}
                            onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                        >
                            <option value="">Pilih Guru</option>
                            {getTeachersForSubject(formData.subject_name).map((t, i) => (
                                <option key={i} value={t}>{t}</option>
                            ))}
                            <optgroup label="Semua Guru">
                                {dbTeachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </optgroup>
                        </select>
                        <p className="text-[9px] text-gray-400 mt-1 flex items-center">
                            <Info size={10} className="mr-1" />
                            Guru disesuaikan dengan pengampu Mapel yang dipilih.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 opacity-60">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mulai</label>
                            <input disabled type="text" className="w-full bg-gray-100 border-transparent rounded-xl px-4 py-3 font-bold text-gray-500 outline-none" value={formData.start_time} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Selesai</label>
                            <input disabled type="text" className="w-full bg-gray-100 border-transparent rounded-xl px-4 py-3 font-bold text-gray-500 outline-none" value={formData.end_time} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Save size={20} />}
                        <span className="uppercase tracking-widest text-xs">{currentEntry ? 'Simpan Perubahan' : 'Terbitkan Jadwal'}</span>
                    </button>
                </form>
            </Modal>

            {/* Settings Modal */}
            <Modal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                title="Pengaturan Waktu Sekolah"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-3 mb-4">
                        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-700 font-bold leading-relaxed tracking-tight">
                            Mengubah Jam Mulai Sekolah akan menggeser seluruh jadwal (Jam 1 - Jam 12) secara otomatis. Durasi per jam adalah 45 menit.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Jam Mulai (Jam 1)</label>
                        <input
                            type="time"
                            className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-blue-500 border-2"
                            value={schoolStartTime}
                            onChange={(e) => setSchoolStartTime(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSaveSettings}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center space-x-2 active:scale-95"
                    >
                        <Save size={20} />
                        <span className="uppercase tracking-widest text-xs">Simpan Pengaturan</span>
                    </button>
                </div>
            </Modal>
        </div>
    );
}
