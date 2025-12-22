import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useFeedback } from '../../context/FeedbackContext';
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
    Layout,
    Grid,
    List as ListIcon,
    AlertCircle,
    CheckCircle2,
    XCircle
} from 'lucide-react';

const Days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const WeekTypes = ['Minggu Ganjil', 'Minggu Genap'];

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
            <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800 max-h-[90vh] flex flex-col`}>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
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
    const [selectedWeek, setSelectedWeek] = useState('Minggu Ganjil');
    const [selectedClassId, setSelectedClassId] = useState('all');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'matrix'
    const [classSearch, setClassSearch] = useState('');
    const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast, showConfirm } = useFeedback();
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
        week_type: 'Minggu Ganjil',
        jam_ke: 1,
        start_time: '',
        end_time: ''
    });

    const [schoolStartTime, setSchoolStartTime] = useState(SCHOOL_START_TIME);
    const [currentWeekType, setCurrentWeekType] = useState('Minggu Ganjil');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const userRole = localStorage.getItem('userRole') || 'admin';
    const canManage = userRole === 'admin';
    const timeSlots = useMemo(() => calculateTimeSlots(schoolStartTime), [schoolStartTime]);

    useEffect(() => {
        fetchData();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const { data: startTimeData } = await supabase.from('settings').select('value').eq('key', 'school_start_time').maybeSingle();
        if (startTimeData?.value) setSchoolStartTime(startTimeData.value);

        const { data: weekData } = await supabase.from('settings').select('value').eq('key', 'current_week_type').maybeSingle();
        if (weekData?.value) setCurrentWeekType(weekData.value);
    };

    const handleSaveSettings = async () => {
        const { error: err1 } = await supabase.from('settings').upsert({ key: 'school_start_time', value: schoolStartTime });
        const { error: err2 } = await supabase.from('settings').upsert({ key: 'current_week_type', value: currentWeekType });

        if (!err1 && !err2) {
            setIsSettingsOpen(false);
            showToast('Pengaturan berhasil disimpan', 'success');
            fetchData();
        } else {
            showToast('Gagal menyimpan pengaturan', 'error');
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
            week_type: selectedWeek,
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
            week_type: entry.week_type || 'Minggu Ganjil',
            jam_ke: entry.jam_ke || 1,
            start_time: entry.start_time,
            end_time: entry.end_time
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (entry) => {
        const confirmed = await showConfirm(
            'Hapus Jadwal',
            `Apakah Anda yakin ingin menghapus jadwal "${entry.subject_name}" untuk kelas ${entry.class_name}?`,
            'danger'
        );

        if (confirmed) {
            const { error } = await supabase.from('schedules').delete().eq('id', entry.id);
            if (!error) {
                showToast('Jadwal berhasil dihapus', 'success');
                fetchData();
            } else {
                showToast('Gagal menghapus: ' + error.message, 'error');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.class_id) {
            showToast('Silakan pilih kelas terlebih dahulu.', 'warning');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Check for Class Conflict
            const classConflict = schedules.find(s => {
                if (currentEntry && s.id === currentEntry.id) return false;
                const sameTime = s.day === formData.day && parseInt(s.jam_ke) === parseInt(formData.jam_ke);
                const sameClass = s.class_id === formData.class_id;
                if (sameTime && sameClass) {
                    if (s.week_type === formData.week_type) return true;
                }
                return false;
            });

            if (classConflict) {
                showToast('JADWAL SUDAH TERISI', 'error');
                setIsLoading(false);
                return;
            }

            // 2. Check for Teacher Conflict
            const teacherConflict = schedules.find(s => {
                if (currentEntry && s.id === currentEntry.id) return false;
                const sameTime = s.day === formData.day && parseInt(s.jam_ke) === parseInt(formData.jam_ke);
                const sameTeacher = s.teacher_name === formData.teacher_name;
                if (sameTime && sameTeacher && formData.teacher_name) {
                    if (s.week_type === formData.week_type) return true;
                }
                return false;
            });

            if (teacherConflict) {
                showToast('JADWAL SUDAH TERISI', 'error');
                setIsLoading(false);
                return;
            }

            const selectedClass = dbClasses.find(c => c.id === formData.class_id);
            const selectedTeacher = dbTeachers.find(t => t.name === formData.teacher_name);

            const payload = {
                ...formData,
                class_name: selectedClass?.name || '',
                teacher_id: selectedTeacher?.id || null // Important: Link by ID
            };

            const { error } = currentEntry
                ? await supabase.from('schedules').update(payload).eq('id', currentEntry.id)
                : await supabase.from('schedules').insert([payload]);

            if (error) {
                showToast('Gagal menyimpan: ' + error.message, 'error');
            } else {
                await fetchData();
                showToast(currentEntry ? 'Jadwal berhasil diperbarui' : 'Jadwal berhasil diterbitkan', 'success');
                setIsModalOpen(false);
            }
        } catch (err) {
            console.error('Submit error:', err);
            showToast('Terjadi kesalahan sistem: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSchedules = schedules.filter(s => {
        const dayMatch = s.day === selectedDay;
        const classMatch = selectedClassId === 'all' || s.class_id === selectedClassId;
        const weekMatch = s.week_type === selectedWeek;
        return dayMatch && classMatch && weekMatch;
    });

    const getTeachersForSubject = (subjectName) => {
        const sub = dbSubjects.find(s => s.name === subjectName);
        return sub?.teachers ? sub.teachers.split(', ') : [];
    };

    const filteredClasses = dbClasses.filter(c =>
        c.name.toLowerCase().includes(classSearch.toLowerCase())
    );

    const selectedClass = dbClasses.find(c => c.id === selectedClassId);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Jadwal Pelajaran</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Manajemen KBM 12 Jam Pelajaran & Istirahat Otomatis.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {canManage && (
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-3 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-100 dark:hover:border-blue-900/40 transition-all shadow-sm"
                            title="Pengaturan Waktu"
                        >
                            <Clock size={20} />
                        </button>
                    )}

                    {/* Searchable Class Filter */}
                    <div className="relative">
                        <div
                            className="bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-10 py-3 font-bold text-gray-700 dark:text-gray-200 shadow-sm cursor-pointer hover:border-blue-500 transition-all min-w-[200px]"
                            onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                        >
                            <span className="truncate block">
                                {selectedClassId === 'all' ? 'Semua Kelas' : (selectedClass?.name || 'Pilih Kelas')}
                            </span>
                        </div>
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />

                        {isClassDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 border-b border-gray-50 dark:border-gray-800">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Cari kelas..."
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-bold outline-none focus:bg-white dark:focus:bg-gray-700 transition-all text-gray-700 dark:text-gray-200"
                                            value={classSearch}
                                            onChange={(e) => setClassSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                                    <button
                                        className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedClassId === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                                        onClick={() => {
                                            setSelectedClassId('all');
                                            setIsClassDropdownOpen(false);
                                        }}
                                    >
                                        Semua Kelas
                                    </button>
                                    {filteredClasses.map(c => (
                                        <button
                                            key={c.id}
                                            className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedClassId === c.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                                            onClick={() => {
                                                setSelectedClassId(c.id);
                                                setIsClassDropdownOpen(false);
                                            }}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 px-4 rounded-xl transition-all flex items-center space-x-2 ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            <ListIcon size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Daftar</span>
                        </button>
                        <button
                            onClick={() => setViewMode('matrix')}
                            className={`p-2 px-4 rounded-xl transition-all flex items-center space-x-2 ${viewMode === 'matrix' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            <Grid size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Matrix</span>
                        </button>
                    </div>

                    {canManage && (
                        <button
                            onClick={handleOpenAdd}
                            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-100 active:scale-95"
                        >
                            <Plus size={20} />
                            <span className="uppercase tracking-widest text-xs">Tambah</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Week & Day Selectors Container */}
            <div className="space-y-4">
                {/* Week Selector */}
                <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit">
                    {WeekTypes.map((week) => (
                        <button
                            key={week}
                            onClick={() => setSelectedWeek(week)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedWeek === week
                                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            {week}
                        </button>
                    ))}
                </div>

                {/* Day Selector - Only in List Mode */}
                {viewMode === 'list' && (
                    <div className="flex bg-white dark:bg-gray-900 p-1.5 rounded-[2rem] border-2 border-gray-50 dark:border-gray-800 shadow-sm overflow-x-auto no-scrollbar">
                        {Days.map((day) => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`flex-1 min-w-[120px] py-4 px-6 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 ${selectedDay === day
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-black/20 scale-[1.02] z-10'
                                    : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content View */}
            {viewMode === 'list' ? (
                <div className="grid grid-cols-1 gap-4">
                    {timeSlots.map((slot) => {
                        const entry = filteredSchedules.find(s => s.jam_ke === slot.id);

                        if (slot.type === 'break') {
                            return (
                                <div key={slot.id} className="bg-gray-50/50 dark:bg-gray-800/30 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2rem] p-4 flex items-center justify-center space-x-4 opacity-60 group hover:opacity-100 transition-opacity">
                                    <Clock size={16} className="text-gray-400 dark:text-gray-500" />
                                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">{slot.label}</span>
                                    <span className="h-px w-20 bg-gray-200 dark:bg-gray-800" />
                                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400">{slot.start} - {slot.end}</span>
                                </div>
                            );
                        }

                        return (
                            <div key={slot.id} className={`group relative bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border-2 transition-all duration-500 ${entry ? 'border-blue-50 dark:border-blue-900/40 shadow-md hover:shadow-2xl dark:shadow-black/20 hover:border-blue-200 dark:hover:border-blue-800' : 'border-gray-50 dark:border-gray-800 opacity-40 hover:opacity-100'}`}>
                                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                                    {/* Session Badge */}
                                    <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-3xl border-2 transition-colors ${entry ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-black/40' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600'}`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Jam</span>
                                        <span className="text-3xl font-black">{slot.id}</span>
                                    </div>

                                    {/* Time Info */}
                                    <div className="text-center md:text-left min-w-[100px]">
                                        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Waktu</p>
                                        <p className="text-lg font-black text-gray-900 dark:text-gray-100 leading-none">{slot.start} - {slot.end}</p>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                                        {entry ? (
                                            <>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100 dark:border-blue-900/40">
                                                            {entry.class_name}
                                                        </span>
                                                        {entry.week_type && (
                                                            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-100 dark:border-amber-900/40">
                                                                {entry.week_type}
                                                            </span>
                                                        )}
                                                        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight uppercase group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{entry.subject_name}</h3>
                                                    </div>
                                                    <div className="flex items-center text-sm font-bold text-gray-500 dark:text-gray-400">
                                                        <User size={16} className="mr-2 text-blue-400 dark:text-blue-500" />
                                                        {entry.teacher_name || 'GURU BELUM DIPILIH'}
                                                    </div>
                                                </div>
                                                {canManage && (
                                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                        <button onClick={() => handleOpenEdit(entry)} className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100 dark:border-blue-900/40">
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(entry)} className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all border border-red-100 dark:border-red-900/40">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center md:justify-start text-xs font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest italic">
                                                Kosong / Belum Ada Pelajaran
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-gray-50 dark:border-gray-800 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                                <th className="px-6 py-4 border-b border-r border-gray-100 dark:border-gray-800 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left sticky left-0 bg-gray-50 dark:bg-gray-800 z-20">Jam</th>
                                {Days.map(day => (
                                    <th key={day} className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 text-[10px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest min-w-[200px]">
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map(slot => (
                                <tr key={slot.id} className={slot.type === 'break' ? 'bg-gray-50/30 dark:bg-gray-800/20' : 'hover:bg-blue-50/10 dark:hover:bg-blue-900/10 transition-colors'}>
                                    <td className="px-6 py-4 border-r border-gray-50 dark:border-gray-800 sticky left-0 bg-white dark:bg-gray-900 z-10">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xl font-black text-gray-900 dark:text-gray-100 leading-none">{slot.id || '-'}</span>
                                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-tighter whitespace-nowrap">{slot.start}-{slot.end}</span>
                                        </div>
                                    </td>
                                    {Days.map(day => {
                                        const entry = schedules.find(s =>
                                            s.day === day &&
                                            s.jam_ke === slot.id &&
                                            s.week_type === selectedWeek &&
                                            (selectedClassId === 'all' || s.class_id === selectedClassId)
                                        );

                                        if (slot.type === 'break') {
                                            return (
                                                <td key={day} className="px-6 py-4 text-center border-b border-gray-50 dark:border-gray-800">
                                                    <span className="text-[9px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest whitespace-nowrap">{slot.label}</span>
                                                </td>
                                            );
                                        }

                                        return (
                                            <td key={day} className="p-2 border-b border-gray-50 dark:border-gray-800 group hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                                                {entry ? (
                                                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-3 h-full relative group/entry shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex flex-col space-y-1">
                                                            <span className="text-[8px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-tighter truncate">{entry.class_name}</span>
                                                            <h4 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase truncate leading-tight group-hover/entry:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{entry.subject_name}</h4>
                                                            <div className="flex items-center text-[9px] font-bold text-gray-500 dark:text-gray-400">
                                                                <User size={10} className="mr-1 text-blue-300 dark:text-blue-500" />
                                                                <span className="truncate">{entry.teacher_name || 'No Teacher'}</span>
                                                            </div>
                                                        </div>
                                                        {canManage && (
                                                            <div className="absolute top-1 right-1 opacity-0 group-hover/entry:opacity-100 transition-all flex scale-75 origin-top-right">
                                                                <button onClick={() => handleOpenEdit(entry)} className="p-1.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white shadow-sm mr-1 border border-gray-100 dark:border-gray-700">
                                                                    <Edit2 size={12} />
                                                                </button>
                                                                <button onClick={() => handleDeleteClick(entry)} className="p-1.5 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-600 hover:text-white shadow-sm border border-gray-100 dark:border-gray-700">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    canManage && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDay(day);
                                                                updateTimesFromJam(slot.id);
                                                                const initialSlot = timeSlots.find(s => s.id === slot.id);
                                                                setFormData({
                                                                    class_id: selectedClassId === 'all' ? (dbClasses[0]?.id || '') : selectedClassId,
                                                                    subject_name: dbSubjects[0]?.name || '',
                                                                    teacher_name: '',
                                                                    day: day,
                                                                    week_type: selectedWeek,
                                                                    jam_ke: slot.id,
                                                                    start_time: initialSlot?.start || '',
                                                                    end_time: initialSlot?.end || ''
                                                                });
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="w-full h-12 border-2 border-dashed border-gray-50 dark:border-gray-800 rounded-2xl flex items-center justify-center text-gray-200 dark:text-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:text-blue-200 dark:hover:text-blue-800 transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Hari</label>
                            <select
                                className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2 appearance-none"
                                value={formData.day}
                                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                            >
                                {Days.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Jam Ke</label>
                            <select
                                className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2 appearance-none"
                                value={formData.jam_ke}
                                onChange={(e) => updateTimesFromJam(e.target.value)}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => <option key={n} value={n}>Jam Ke-{n}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Tipe Minggu</label>
                        <select
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2 appearance-none"
                            value={formData.week_type}
                            onChange={(e) => setFormData({ ...formData, week_type: e.target.value })}
                        >
                            {WeekTypes.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Kelas</label>
                        <select
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2 appearance-none"
                            value={formData.class_id}
                            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                        >
                            <option value="">Pilih Kelas</option>
                            {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Mata Pelajaran</label>
                        <select
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2 appearance-none"
                            value={formData.subject_name}
                            onChange={(e) => setFormData({ ...formData, subject_name: e.target.value, teacher_name: '' })}
                        >
                            <option value="">Pilih Mapel</option>
                            {dbSubjects.map(s => <option key={s.id} value={s.name}>{s.name} ({s.jurusan})</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Guru Pengampu</label>
                        <select
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2 appearance-none"
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
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 flex items-center">
                            <Info size={10} className="mr-1" />
                            Guru disesuaikan dengan pengampu Mapel yang dipilih.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 opacity-60">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Mulai</label>
                            <input disabled type="text" className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-500 dark:text-gray-400 outline-none" value={formData.start_time} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Selesai</label>
                            <input disabled type="text" className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-500 dark:text-gray-400 outline-none" value={formData.end_time} />
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
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-start space-x-3 mb-4">
                        <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-700 dark:text-blue-300 font-bold leading-relaxed tracking-tight">
                            Mengubah Jam Mulai Sekolah akan menggeser seluruh jadwal (Jam 1 - Jam 12) secara otomatis. Durasi per jam adalah 45 menit.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Jam Mulai (Jam 1)</label>
                        <input
                            type="time"
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2"
                            value={schoolStartTime}
                            onChange={(e) => setSchoolStartTime(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Minggu Aktif Sekarang</label>
                        <select
                            className="w-full bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 border-2 appearance-none"
                            value={currentWeekType}
                            onChange={(e) => setCurrentWeekType(e.target.value)}
                        >
                            <option value="Minggu Ganjil">Minggu Ganjil</option>
                            <option value="Minggu Genap">Minggu Genap</option>
                        </select>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 px-1 mt-1">
                            Pengaturan ini akan menentukan jadwal mana yang muncul di notifikasi siswa/guru.
                        </p>
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
