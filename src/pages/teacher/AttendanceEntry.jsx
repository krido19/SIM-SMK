import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useFeedback } from '../../context/FeedbackContext';
import {
    Check,
    X,
    Clock,
    Search,
    Calendar,
    Save,
    Info,
    ChevronDown
} from 'lucide-react';

export default function AttendanceEntry() {
    const [attendance, setAttendance] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dbClasses, setDbClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useFeedback();

    // Journal State
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
    const [journalData, setJournalData] = useState({ subject: '', jam_ke: '', materi: '', catatan: '' });
    const [attendanceStats, setAttendanceStats] = useState({ s: 0, i: 0, a: 0 });
    const [isSaving, setIsSaving] = useState(false);
    
    // Time Restriction State
    const [teacherSchedules, setTeacherSchedules] = useState([]);
    const [isSaveAllowed, setIsSaveAllowed] = useState(false);
    const [activeScheduleMsg, setActiveScheduleMsg] = useState('');

    useEffect(() => {
        const fetchClasses = async () => {
            const role = localStorage.getItem('userRole');
            const userId = localStorage.getItem('userId');
            const userName = localStorage.getItem('userName');

            if (role === 'guru' && (userId || userName)) {
                // Fetch only classes this teacher teaches
                let schedules = [];

                if (userId) {
                    const { data: s1 } = await supabase
                        .from('schedules')
                        .select('*')
                        .eq('teacher_id', userId);
                    if (s1) schedules.push(...s1);
                }
                if (userName) {
                    const { data: s2 } = await supabase
                        .from('schedules')
                        .select('*')
                        .eq('teacher_name', userName);
                    if (s2) schedules.push(...s2);
                }
                
                setTeacherSchedules(schedules);

                // Deduplicate classes
                const classMap = {};
                schedules.forEach(s => {
                    if (s.class_id && !classMap[s.class_id]) {
                        classMap[s.class_id] = { id: s.class_id, name: s.class_name || 'Kelas' };
                    }
                });
                const teacherClasses = Object.values(classMap);
                setDbClasses(teacherClasses);
                if (teacherClasses.length > 0) setSelectedClassId(teacherClasses[0].id);
            } else {
                // Admin: show all
                const { data } = await supabase.from('classes').select('id, name');
                if (data) {
                    setDbClasses(data);
                    if (data.length > 0) setSelectedClassId(data[0].id);
                }
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            fetchData();
        }
    }, [selectedDate, selectedClassId]);

    const fetchData = async () => {
        setIsLoading(true);
        const { data: stdData, error: stdError } = await supabase
            .from('students')
            .select(`
                id,
                full_name,
                nis,
                attendance (
                    status,
                    date
                )
            `)
            .eq('class_id', selectedClassId);

        if (stdError) {
            console.error(stdError);
        } else {
            const transformed = stdData.map(s => {
                const att = s.attendance?.find(a => a.date === selectedDate) || { status: 'Hadir' };
                return {
                    id: s.id,
                    name: s.full_name,
                    nis: s.nis,
                    status: att.status
                };
            });
            setAttendance(transformed);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        // Evaluate if saving is allowed
        const role = localStorage.getItem('userRole');
        if (role !== 'guru') {
            setIsSaveAllowed(true); // admin can always save
            return;
        }

        const todayDate = new Date().toISOString().split('T')[0];
        if (selectedDate !== todayDate) {
            setIsSaveAllowed(false);
            setActiveScheduleMsg('Absensi hanya dapat diisi untuk hari ini.');
            return;
        }

        const Days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = Days[new Date().getDay()];
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

        const activeClassSchedules = teacherSchedules.filter(s => s.class_id === selectedClassId && s.day === todayName);
        
        if (activeClassSchedules.length === 0) {
            setIsSaveAllowed(false);
            setActiveScheduleMsg('Tidak ada jadwal mengajar untuk kelas ini hari ini.');
            return;
        }

        // Check if current time is within any schedule for this class + 15 mins buffer
        const isActive = activeClassSchedules.some(s => {
            const startTime = s.start_time;
            if (!startTime || !s.end_time) return false;
            
            const [endH, endM, endS] = s.end_time.split(':').map(Number);
            const endObj = new Date();
            endObj.setHours(endH, endM, endS || 0);
            endObj.setMinutes(endObj.getMinutes() + 15);
            
            const bufferedEndTime = `${endObj.getHours().toString().padStart(2, '0')}:${endObj.getMinutes().toString().padStart(2, '0')}:00`;
            
            return currentTime >= startTime && currentTime <= bufferedEndTime;
        });

        if (isActive) {
            setIsSaveAllowed(true);
            setActiveScheduleMsg('');
            // Pre-fill journal data if active schedule is found
            const currentActive = activeClassSchedules.find(s => {
                const startTime = s.start_time;
                if (!startTime || !s.end_time) return false;
                const [endH, endM, endS] = s.end_time.split(':').map(Number);
                const endObj = new Date();
                endObj.setHours(endH, endM, endS || 0);
                endObj.setMinutes(endObj.getMinutes() + 15);
                const bufferedEndTime = `${endObj.getHours().toString().padStart(2, '0')}:${endObj.getMinutes().toString().padStart(2, '0')}:00`;
                return currentTime >= startTime && currentTime <= bufferedEndTime;
            });
            if (currentActive) {
                setJournalData(prev => ({ ...prev, subject: currentActive.subject_name || prev.subject, jam_ke: currentActive.jam_ke?.toString() || prev.jam_ke }));
            }
        } else {
            setIsSaveAllowed(false);
            setActiveScheduleMsg('Hanya dapat diisi saat jadwal mengajar aktif (+15 menit).');
        }

        // Auto-refresh this check every minute if they stay on the page
        const interval = setInterval(() => {
            // Force re-trigger of effect if needed, but simplest is relying on manual refresh or component remount
        }, 60000);
        return () => clearInterval(interval);

    }, [selectedClassId, selectedDate, teacherSchedules]);

    const handleSave = () => {
        if (attendance.length === 0) {
            showToast('Tidak ada data siswa untuk disimpan.', 'warning');
            return;
        }
        
        const s = attendance.filter(a => a.status === 'Sakit').length;
        const i = attendance.filter(a => a.status === 'Izin').length;
        const a = attendance.filter(a => a.status === 'Alpa').length;
        
        setAttendanceStats({ s, i, a });
        setIsJournalModalOpen(true);
    };

    const submitAttendanceAndJournal = async () => {
        if (!journalData.subject || !journalData.jam_ke || !journalData.materi) {
            showToast('Mata Pelajaran, Jam Ke-, dan Materi wajib diisi.', 'warning');
            return;
        }

        setIsSaving(true);
        const attendanceToUpsert = attendance.map(a => ({
            student_id: a.id,
            date: selectedDate,
            status: a.status
        }));

        const { error: attError } = await supabase
            .from('attendance')
            .upsert(attendanceToUpsert, { onConflict: 'student_id, date' });

        if (attError) {
            showToast('Gagal menyimpan absensi: ' + attError.message, 'error');
            setIsSaving(false);
            return;
        }

        const teacherName = localStorage.getItem('userName') || 'Guru';
        const { error: journalError } = await supabase
            .from('teaching_journals')
            .insert({
                teacher_name: teacherName,
                class_id: selectedClassId,
                subject: journalData.subject,
                date: selectedDate,
                jam_ke: journalData.jam_ke,
                materi: journalData.materi,
                catatan: journalData.catatan || '',
                absent_s: attendanceStats.s,
                absent_i: attendanceStats.i,
                absent_a: attendanceStats.a
            });

        if (journalError) {
            showToast('Absensi tersimpan, tapi gagal menyimpan jurnal: ' + journalError.message, 'error');
        } else {
            showToast('Absensi & Jurnal berhasil disimpan!', 'success');
            setIsJournalModalOpen(false);
            setJournalData({ subject: '', jam_ke: '', materi: '', catatan: '' });
        }
        setIsSaving(false);
    };

    const setStatus = (id, status) => {
        setAttendance(attendance.map(a => a.id === id ? { ...a, status } : a));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="space-y-6 flex-1">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Kehadiran
                            </span>
                        </div>
                        <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight leading-none mb-2">Daftar Kehadiran</h1>
                        <p className="font-sans text-sm font-medium text-gray-500">Absensi Harian Resmi</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="relative min-w-[200px]">
                            <span className="absolute -top-2.5 left-3 bg-white px-1 text-[10px] font-sans font-black uppercase tracking-widest text-blue-600">Kelas</span>
                            <div className="relative">
                                <select
                                    className="w-full bg-gray-50 border border-transparent px-4 py-3 pr-8 rounded-xl text-sm font-sans font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer tracking-tight"
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                >
                                    {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="relative min-w-[200px]">
                            <span className="absolute -top-2.5 left-3 bg-white px-1 text-[10px] font-sans font-black uppercase tracking-widest text-blue-600">Tanggal</span>
                            <input
                                type="date"
                                className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-xl text-sm font-sans font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all tracking-tight"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto mt-6 xl:mt-0">
                    <div className="flex flex-col items-center sm:items-end w-full sm:w-auto px-4">
                         <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400 mb-1">Tingkat Kehadiran</span>
                        <p className="font-sans text-xl font-black text-gray-900 tracking-tight">
                            {attendance.filter(a => a.status === 'Hadir').length} <span className="text-sm font-bold text-gray-400">/ {attendance.length}</span>
                        </p>
                    </div>
                    <div className="flex flex-col w-full sm:w-auto">
                        <button
                            onClick={handleSave}
                            disabled={!isSaveAllowed || isLoading}
                            className={`w-full sm:w-auto flex items-center justify-center space-x-3 px-8 py-3.5 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all ${
                                isSaveAllowed
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'
                            }`}
                        >
                            <Save size={18} strokeWidth={2.5} />
                            <span>Simpan Absensi</span>
                        </button>
                        {!isSaveAllowed && activeScheduleMsg && (
                            <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider text-center mt-2 w-full max-w-[200px] leading-tight">
                                {activeScheduleMsg}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                     <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest">Memuat Data Kehadiran...</div>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 font-sans text-[10px] uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-6 py-5 w-16 text-center font-bold">No</th>
                                    <th className="px-6 py-5 font-bold">Student Record</th>
                                    <th className="px-6 py-5 text-center font-bold">Hadir</th>
                                    <th className="px-6 py-5 text-center font-bold">Sakit</th>
                                    <th className="px-6 py-5 text-center font-bold">Izin</th>
                                    <th className="px-6 py-5 text-center font-bold">Alpa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {attendance.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-5 text-center font-sans text-xs font-bold text-gray-400">{index + 1}</td>
                                        <td className="px-6 py-5">
                                            <div>
                                                <p className="font-sans font-black text-gray-900 tracking-tight">{student.name}</p>
                                                <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">ID: {student.nis}</p>
                                            </div>
                                        </td>
                                        {[
                                            { label: 'Hadir', val: 'Hadir', activeBg: 'bg-emerald-50 text-emerald-600 ring-2 ring-emerald-500/20' },
                                            { label: 'Sakit', val: 'Sakit', activeBg: 'bg-amber-50 text-amber-600 ring-2 ring-amber-500/20' },
                                            { label: 'Izin', val: 'Izin', activeBg: 'bg-blue-50 text-blue-600 ring-2 ring-blue-500/20' },
                                            { label: 'Alpa', val: 'Alpa', activeBg: 'bg-rose-50 text-rose-600 ring-2 ring-rose-500/20' }
                                        ].map((opt) => (
                                            <td key={opt.val} className="px-2 py-3 text-center w-24">
                                                <button
                                                    onClick={() => setStatus(student.id, opt.val)}
                                                    className={`w-full py-3 mx-auto rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all
                                                        ${student.status === opt.val
                                                            ? opt.activeBg
                                                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                                        }
                                                    `}
                                                >
                                                    {student.status === opt.val && <Check size={16} strokeWidth={3} className="mb-0.5" />}
                                                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest">{opt.label}</span>
                                                </button>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {attendance.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center font-sans font-medium text-gray-400">
                                            Tidak ada data siswa untuk kelas ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isJournalModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-600 px-8 py-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-sans font-black text-white tracking-tight">Jurnal Mengajar</h3>
                                <p className="text-blue-100 font-sans text-sm mt-1">Lengkapi data jurnal sebelum menyimpan absensi</p>
                            </div>
                            <button onClick={() => setIsJournalModalOpen(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Mata Pelajaran <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Matematika"
                                        className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-xl text-sm font-sans font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all tracking-tight"
                                        value={journalData.subject}
                                        onChange={e => setJournalData({ ...journalData, subject: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Jam Ke- <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 1-2"
                                        className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-xl text-sm font-sans font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all tracking-tight"
                                        value={journalData.jam_ke}
                                        onChange={e => setJournalData({ ...journalData, jam_ke: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Materi Pembelajaran <span className="text-rose-500">*</span></label>
                                <textarea
                                    rows="3"
                                    placeholder="Deskripsikan materi yang diajarkan..."
                                    className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-xl text-sm font-sans font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all tracking-tight resize-none"
                                    value={journalData.materi}
                                    onChange={e => setJournalData({ ...journalData, materi: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">Catatan (Opsional)</label>
                                <textarea
                                    rows="2"
                                    placeholder="Catatan tambahan kejadian di kelas..."
                                    className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-xl text-sm font-sans font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all tracking-tight resize-none"
                                    value={journalData.catatan}
                                    onChange={e => setJournalData({ ...journalData, catatan: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="bg-blue-50/50 p-4 rounded-2xl flex items-center justify-between">
                                <span className="text-xs font-sans font-bold text-gray-500 uppercase tracking-widest">Rekap Absensi:</span>
                                <div className="flex gap-4">
                                    <span className="text-sm font-bold text-amber-600">S: {attendanceStats.s}</span>
                                    <span className="text-sm font-bold text-blue-600">I: {attendanceStats.i}</span>
                                    <span className="text-sm font-bold text-rose-600">A: {attendanceStats.a}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsJournalModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-sans text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={submitAttendanceAndJournal}
                                disabled={isSaving}
                                className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 px-6 py-2.5 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {isSaving ? 'Menyimpan...' : (
                                    <>
                                        <Save size={16} strokeWidth={2.5} />
                                        <span>Simpan Absensi & Jurnal</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
