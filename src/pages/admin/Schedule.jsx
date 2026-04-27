import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useFeedback } from '../../context/FeedbackContext';
import * as XLSX from 'xlsx';
import PDFScheduleImporter from '../../components/schedule/PDFScheduleImporter';
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
    Download,
    Upload,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader2,
    FileText,
    History,
    RotateCcw
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`bg-paper border-4 border-ink shadow-[12px_12px_0px_0px_#111111] w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col`}>
                <div className="px-6 py-4 border-b-4 border-ink flex items-center justify-between bg-gray-50">
                    <h3 className="text-xl font-black text-ink uppercase tracking-widest font-serif">{title}</h3>
                    <button onClick={onClose} className="p-2 border-2 border-transparent hover:border-ink hover:text-editorial transition-all text-ink">
                        <X size={24} strokeWidth={3} />
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
    const [isPdfImporterOpen, setIsPdfImporterOpen] = useState(false);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
    const [backupList, setBackupList] = useState(() => {
        try { return JSON.parse(localStorage.getItem('schedule_backups') || '[]'); }
        catch { return []; }
    });

    const userRole = localStorage.getItem('userRole') || 'admin';
    const canManage = userRole === 'admin';
    const timeSlots = useMemo(() => calculateTimeSlots(schoolStartTime), [schoolStartTime]);
    const fileInputRef = useRef(null);

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

    // ── Backup System ────────────────────────────────────────
    const BACKUP_KEY = 'schedule_backups';
    const MAX_BACKUPS = 5; // simpan max 5 backup terakhir

    const saveBackup = (label = 'Import') => {
        if (!schedules || schedules.length === 0) return;
        try {
            const existing = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
            const newBackup = {
                id: Date.now(),
                label,
                created_at: new Date().toISOString(),
                count: schedules.length,
                data: schedules,
            };
            // Simpan max 5, buang yang paling tua
            const updated = [newBackup, ...existing].slice(0, MAX_BACKUPS);
            localStorage.setItem(BACKUP_KEY, JSON.stringify(updated));
            setBackupList(updated);
            return newBackup.id;
        } catch (err) {
            console.warn('Backup gagal (mungkin storage penuh):', err);
        }
    };

    const deleteBackup = (id) => {
        try {
            const updated = backupList.filter(b => b.id !== id);
            localStorage.setItem(BACKUP_KEY, JSON.stringify(updated));
            setBackupList(updated);
            showToast('Backup dihapus', 'success');
        } catch { /* ignore */ }
    };

    const restoreBackup = async (backup) => {
        const confirmed = await showConfirm(
            'Pulihkan Backup',
            `Ini akan MENGHAPUS semua jadwal saat ini (${schedules.length} entri) dan menggantinya dengan backup "${backup.label}" (${backup.count} entri). Lanjutkan?`,
            'danger'
        );
        if (!confirmed) return;

        setIsLoading(true);
        try {
            // Hapus semua jadwal yang ada
            const { error: delErr } = await supabase.from('schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (delErr) throw delErr;

            // Insert dari backup (hapus kolom id agar auto-generated)
            const toInsert = backup.data.map(({ id, created_at, ...rest }) => rest);
            if (toInsert.length > 0) {
                const { error: insErr } = await supabase.from('schedules').insert(toInsert);
                if (insErr) throw insErr;
            }

            await fetchData();
            setIsBackupModalOpen(false);
            showToast(`✓ Backup "${backup.label}" berhasil dipulihkan (${backup.count} entri)`, 'success');
        } catch (err) {
            showToast('Gagal memulihkan backup: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadBackupAsExcel = (backup) => {
        const sheetData = backup.data.map(s => ({
            'Hari': s.day,
            'Jam Ke': s.jam_ke,
            'Waktu Mulai': s.start_time,
            'Waktu Selesai': s.end_time,
            'Kelas': s.class_name,
            'Mata Pelajaran': s.subject_name,
            'Guru': s.teacher_name,
            'Minggu': s.week_type,
        }));
        const ws = XLSX.utils.json_to_sheet(sheetData);
        ws['!cols'] = [{ wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Backup Jadwal');
        const dateStr = new Date(backup.created_at).toLocaleString('id-ID').replace(/[/:,\s]/g, '-');
        XLSX.writeFile(wb, `Backup_Jadwal_${dateStr}.xlsx`);
    };
    // ─────────────────────────────────────────────────────────

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

    const handleDeleteAll = async () => {
        if (schedules.length === 0) {
            showToast('Tidak ada jadwal untuk dihapus', 'warning');
            return;
        }
        const confirmed = await showConfirm(
            'HAPUS SEMUA JADWAL',
            `Tindakan ini akan PERMANEN menghapus SEMUA ${schedules.length} jadwal dari database. Backup otomatis akan dibuat terlebih dahulu. Apakah Anda yakin?`,
            'danger'
        );
        if (!confirmed) return;

        // Auto backup sebelum hapus semua
        saveBackup(`Sebelum hapus semua (${schedules.length} entri)`);

        setIsLoading(true);
        try {
            const { error } = await supabase.from('schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
            showToast(`✓ Semua jadwal (${schedules.length} entri) berhasil dihapus`, 'success');
            await fetchData();
        } catch (err) {
            showToast('Gagal menghapus semua jadwal: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
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

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                'Hari': 'Senin',
                'Jam Ke': 1,
                'Waktu Mulai': '07:00',
                'Waktu Selesai': '07:45',
                'Kelas': dbClasses[0]?.name || 'X RPL 1',
                'Mata Pelajaran': dbSubjects[0]?.name || 'Matematika',
                'Guru': dbTeachers[0]?.name || 'Budi Santoso',
                'Minggu': 'Minggu Ganjil'
            },
            {
                'Hari': 'Senin',
                'Jam Ke': 2,
                'Waktu Mulai': '07:45',
                'Waktu Selesai': '08:30',
                'Kelas': dbClasses[0]?.name || 'X RPL 1',
                'Mata Pelajaran': dbSubjects[0]?.name || 'Matematika',
                'Guru': dbTeachers[0]?.name || 'Budi Santoso',
                'Minggu': 'Minggu Ganjil'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        ws['!cols'] = [
            { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 15 },
            { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Jadwal");
        XLSX.writeFile(wb, "Template_Jadwal_SIM_SMK.xlsx");
    };

    // Helper: Konversi nilai waktu Excel (desimal/Date/string) ke format "HH:MM"
    const excelTimeToString = (val) => {
        if (!val && val !== 0) return '';
        // Jika sudah string dengan format HH:MM atau H:MM, langsung kembalikan
        if (typeof val === 'string') {
            const trimmed = val.trim();
            if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed.padStart(5, '0').substring(0, 5);
            // Format "HH:MM:SS"
            if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed.substring(0, 5).padStart(5, '0');
            return trimmed;
        }
        // Jika Date object (dari cellDates: true)
        if (val instanceof Date) {
            const h = String(val.getUTCHours()).padStart(2, '0');
            const m = String(val.getUTCMinutes()).padStart(2, '0');
            return `${h}:${m}`;
        }
        // Jika angka desimal Excel (0..1 = 00:00..23:59)
        if (typeof val === 'number') {
            const totalMinutes = Math.round(val * 24 * 60);
            const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
            const m = String(totalMinutes % 60).padStart(2, '0');
            return `${h}:${m}`;
        }
        return String(val);
    };

    const handleImportSubmit = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // ── AUTO BACKUP sebelum import ──
        saveBackup(`Sebelum import Excel: ${file.name}`);

        setIsLoading(true);
        try {
            const data = await file.arrayBuffer();
            // cellDates: true agar kolom waktu ter-parse sebagai Date object
            // raw: false agar angka/waktu tetap terformat
            const workbook = XLSX.read(data, { cellDates: true, cellNF: false, cellText: false });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // raw: false untuk memastikan nilai waktu tidak ter-parse ulang sebagai angka
            const json = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

            if (json.length === 0) {
                showToast('File Excel kosong', 'error');
                return;
            }

            let successCount = 0;
            let errorCount = 0;
            const newSchedules = [];
            const errors = [];

            for (const row of json) {
                const kelasRaw = String(row['Kelas'] || '').trim();
                const guruRaw = String(row['Guru'] || '').trim();
                const subjectName = String(row['Mata Pelajaran'] || '').trim();
                const hariRaw = String(row['Hari'] || '').trim();
                const minggRaw = String(row['Minggu'] || '').trim();

                const normalizedDbClass = (name) => name ? name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
                const matchedClass = dbClasses.find(c => normalizedDbClass(c.name) === normalizedDbClass(kelasRaw));
                const matchedTeacher = dbTeachers.find(t => normalizedDbClass(t.name) === normalizedDbClass(guruRaw));

                if (!matchedClass) {
                    errorCount++;
                    errors.push(`Kelas "${kelasRaw}" tidak ditemukan`);
                    continue;
                }
                if (!subjectName) {
                    errorCount++;
                    errors.push(`Mata pelajaran kosong di baris dengan kelas "${kelasRaw}"`);
                    continue;
                }

                // Parse waktu — handle angka desimal Excel, Date, atau string
                const waktuMulai = excelTimeToString(row['Waktu Mulai']);
                const waktuSelesai = excelTimeToString(row['Waktu Selesai']);

                newSchedules.push({
                    class_id: matchedClass.id,
                    class_name: matchedClass.name,
                    subject_name: subjectName,
                    teacher_id: matchedTeacher ? matchedTeacher.id : null,
                    teacher_name: matchedTeacher ? matchedTeacher.name : guruRaw,
                    day: hariRaw || 'Senin',
                    week_type: minggRaw || currentWeekType,
                    jam_ke: parseInt(row['Jam Ke']) || 1,
                    start_time: waktuMulai,
                    end_time: waktuSelesai
                });
            }

            if (newSchedules.length > 0) {
                const { error } = await supabase.from('schedules').insert(newSchedules);
                if (error) throw error;
                successCount = newSchedules.length;
            }

            if (errors.length > 0) console.warn('Import errors:', errors);
            showToast(
                `Import Selesai: ${successCount} berhasil, ${errorCount} gagal/dilewati.`,
                successCount > 0 ? 'success' : 'error'
            );
            fetchData();
        } catch (error) {
            console.error('Import error:', error);
            showToast('Gagal memproses file Excel: ' + error.message, 'error');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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

    // ── Handler PDF Import ────────────────────────────────────
    const handlePdfImport = async (scheduleList) => {
        if (!scheduleList || scheduleList.length === 0) {
            showToast('Tidak ada data untuk diimport', 'warning');
            return;
        }
        // ── AUTO BACKUP sebelum import ──
        saveBackup(`Sebelum import PDF (${scheduleList.length} entri baru)`);

        try {
            const { error } = await supabase.from('schedules').insert(scheduleList);
            if (error) throw error;
            showToast(`✓ ${scheduleList.length} jadwal dari PDF berhasil diimport!`, 'success');
            await fetchData();
        } catch (err) {
            showToast('Gagal import dari PDF: ' + err.message, 'error');
            throw err;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-ink pb-6">
                <div>
                    <h1 className="text-4xl font-black text-ink font-serif uppercase tracking-tight">JADWAL PELAJARAN</h1>
                    <p className="text-ink font-mono font-bold uppercase tracking-widest mt-2">Manajemen KBM 12 Jam Pelajaran & Istirahat Otomatis.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {canManage && (
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-3 bg-paper border-2 border-ink text-ink hover:bg-ink hover:text-paper transition-all shadow-[2px_2px_0px_0px_#111111]"
                            title="PENGATURAN WAKTU"
                        >
                            <Clock size={20} strokeWidth={2.5} />
                        </button>
                    )}

                    {/* Searchable Class Filter */}
                    <div className="relative">
                        <div
                            className="bg-paper border-2 border-ink px-10 py-3 font-mono font-bold text-ink cursor-pointer hover:shadow-[4px_4px_0px_0px_#111111] transition-all min-w-[200px] uppercase tracking-widest text-sm"
                            onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                        >
                            <span className="truncate block">
                                {selectedClassId === 'all' ? 'SEMUA KELAS' : (selectedClass?.name?.toUpperCase() || 'PILIH KELAS')}
                            </span>
                        </div>
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-ink" size={18} strokeWidth={2.5} />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-ink" size={18} strokeWidth={2.5} />

                        {isClassDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-paper border-2 border-ink shadow-[8px_8px_0px_0px_#111111] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 border-b-2 border-ink">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink" size={14} strokeWidth={2.5} />
                                        <input
                                            type="text"
                                            placeholder="CARI KELAS..."
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-ink text-sm font-mono font-bold text-ink uppercase outline-none focus:bg-paper"
                                            value={classSearch}
                                            onChange={(e) => setClassSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                                    <button
                                        className={`w-full text-left px-4 py-2 text-sm font-mono font-bold uppercase tracking-wide transition-colors ${selectedClassId === 'all' ? 'bg-ink text-paper' : 'hover:bg-gray-50 text-ink'}`}
                                        onClick={() => { setSelectedClassId('all'); setIsClassDropdownOpen(false); }}
                                    >
                                        SEMUA KELAS
                                    </button>
                                    {filteredClasses.map(c => (
                                        <button
                                            key={c.id}
                                            className={`w-full text-left px-4 py-2 text-sm font-mono font-bold uppercase tracking-wide transition-colors ${selectedClassId === c.id ? 'bg-ink text-paper' : 'hover:bg-gray-50 text-ink'}`}
                                            onClick={() => { setSelectedClassId(c.id); setIsClassDropdownOpen(false); }}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex border-2 border-ink shadow-[2px_2px_0px_0px_#111111]">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 px-4 transition-all flex items-center space-x-2 ${viewMode === 'list' ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-gray-50'}`}
                        >
                            <ListIcon size={18} strokeWidth={2.5} />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden md:inline">DAFTAR</span>
                        </button>
                        <div className="w-[2px] bg-ink" />
                        <button
                            onClick={() => setViewMode('matrix')}
                            className={`p-2 px-4 transition-all flex items-center space-x-2 ${viewMode === 'matrix' ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-gray-50'}`}
                        >
                            <Grid size={18} strokeWidth={2.5} />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden md:inline">MATRIX</span>
                        </button>
                    </div>

                    {canManage && (
                        <div className="flex gap-2">
                            {/* Tombol Download Template Excel */}
                            <button
                                onClick={handleDownloadTemplate}
                                className="p-3 bg-paper border-2 border-ink text-ink hover:bg-ink hover:text-paper transition-all shadow-[2px_2px_0px_0px_#111111]"
                                title="DOWNLOAD TEMPLATE EXCEL"
                            >
                                <Download size={20} strokeWidth={2.5} />
                            </button>
                            {/* Tombol Import via Excel */}
                            <div className="relative group flex">
                                <button
                                    type="button"
                                    className="p-3 bg-paper border-2 border-ink text-ink group-hover:bg-ink group-hover:text-paper transition-all shadow-[2px_2px_0px_0px_#111111]"
                                    title="IMPORT VIA EXCEL"
                                >
                                    {isLoading && fileInputRef.current?.value ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} strokeWidth={2.5} />}
                                </button>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleImportSubmit}
                                    ref={fileInputRef}
                                    disabled={isLoading}
                                    title="IMPORT EXCEL"
                                />
                            </div>
                            {/* Tombol Import via PDF */}
                            <button
                                onClick={() => setIsPdfImporterOpen(true)}
                                className="p-3 bg-paper border-2 border-ink text-ink hover:bg-ink hover:text-paper transition-all shadow-[2px_2px_0px_0px_#111111]"
                                title="IMPORT JADWAL DARI PDF (aSc Timetables)"
                            >
                                <FileText size={20} strokeWidth={2.5} />
                            </button>
                            {/* Tombol Hapus Semua */}
                            <button
                                onClick={handleDeleteAll}
                                disabled={isLoading || schedules.length === 0}
                                className="flex items-center justify-center space-x-2 bg-paper text-editorial px-4 py-3 font-mono font-bold uppercase tracking-widest transition-all border-2 border-editorial shadow-[4px_4px_0px_0px_#CC0000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-editorial hover:text-paper disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                                title={`HAPUS SEMUA JADWAL (${schedules.length} entri)`}
                            >
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} strokeWidth={2.5} />}
                                <span className="text-xs hidden md:inline">HAPUS SEMUA</span>
                            </button>
                            {/* Tombol Tambah Manual */}
                            <button
                                onClick={handleOpenAdd}
                                className="flex items-center justify-center space-x-2 bg-ink text-paper px-6 py-3 font-mono font-bold uppercase tracking-widest transition-all border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-paper hover:text-ink ml-2"
                            >
                                <Plus size={20} strokeWidth={3} />
                                <span className="text-xs hidden md:inline">TAMBAH</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Week & Day Selectors Container */}
            <div className="space-y-4">
                {/* Week Selector */}
                <div className="flex space-x-0 border-2 border-ink w-fit shadow-[4px_4px_0px_0px_#111111]">
                    {WeekTypes.map((week, idx) => (
                        <button
                            key={week}
                            onClick={() => setSelectedWeek(week)}
                            className={`px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${selectedWeek === week
                                ? 'bg-ink text-paper'
                                : 'bg-paper text-ink hover:bg-gray-50'
                                } ${idx > 0 ? 'border-l-2 border-ink' : ''}`}
                        >
                            {week}
                        </button>
                    ))}
                </div>

                {/* Day Selector - Only in List Mode */}
                {viewMode === 'list' && (
                    <div className="flex border-2 border-ink shadow-[4px_4px_0px_0px_#111111] overflow-x-auto no-scrollbar">
                        {Days.map((day, idx) => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`flex-1 min-w-[100px] py-4 px-4 font-mono font-bold text-xs uppercase tracking-widest transition-all duration-300 ${selectedDay === day
                                    ? 'bg-ink text-paper'
                                    : 'bg-paper text-ink hover:bg-gray-50'
                                    } ${idx > 0 ? 'border-l-2 border-ink' : ''}`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content View */}
            {viewMode === 'list' ? (
                <div className="grid grid-cols-1 gap-3">
                    {timeSlots.map((slot) => {
                        const entry = filteredSchedules.find(s => s.jam_ke === slot.id);

                        if (slot.type === 'break') {
                            return (
                                <div key={slot.id} className="bg-gray-50 border-2 border-dashed border-gray-400 p-4 flex items-center justify-center space-x-4">
                                    <Clock size={16} className="text-gray-500" strokeWidth={2.5} />
                                    <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">{slot.label}</span>
                                    <span className="h-px w-20 bg-gray-400" />
                                    <span className="text-[10px] font-mono font-bold text-gray-500">{slot.start} - {slot.end}</span>
                                </div>
                            );
                        }

                        return (
                            <div key={slot.id} className={`group relative bg-paper border-2 p-6 transition-all duration-300 ${entry ? 'border-ink shadow-[4px_4px_0px_0px_#111111] hover:shadow-[8px_8px_0px_0px_#111111] hover:-translate-y-0.5' : 'border-gray-300 opacity-50 hover:opacity-100 hover:border-gray-500'}`}>
                                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                                    {/* Session Badge */}
                                    <div className={`flex flex-col items-center justify-center w-20 h-20 border-2 transition-colors font-mono ${entry ? 'bg-ink border-ink text-paper' : 'bg-gray-50 border-gray-300 text-gray-400'}`}>
                                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest leading-none mb-1">JAM</span>
                                        <span className="text-3xl font-black">{slot.id}</span>
                                    </div>

                                    {/* Time Info */}
                                    <div className="text-center md:text-left min-w-[110px]">
                                        <p className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-1">WAKTU</p>
                                        <p className="text-lg font-mono font-black text-ink leading-none">{slot.start} - {slot.end}</p>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                                        {entry ? (
                                            <>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                                                        <span className="px-3 py-1 bg-ink text-paper text-[9px] font-mono font-bold uppercase tracking-widest border-2 border-ink">
                                                            {entry.class_name}
                                                        </span>
                                                        {entry.week_type && (
                                                            <span className="px-3 py-1 bg-gray-100 text-ink text-[9px] font-mono font-bold uppercase tracking-widest border-2 border-ink">
                                                                {entry.week_type}
                                                            </span>
                                                        )}
                                                        <h3 className="text-xl font-black text-ink tracking-tight uppercase font-serif">{entry.subject_name}</h3>
                                                    </div>
                                                    <div className="flex items-center text-sm font-mono font-bold text-gray-600 uppercase">
                                                        <User size={16} className="mr-2 text-ink" strokeWidth={2.5} />
                                                        {entry.teacher_name || 'GURU BELUM DIPILIH'}
                                                    </div>
                                                </div>
                                                {canManage && (
                                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                        <button onClick={() => handleOpenEdit(entry)} className="p-3 bg-paper text-ink border-2 border-ink hover:bg-ink hover:text-paper transition-all shadow-[2px_2px_0px_0px_#111111]">
                                                            <Edit2 size={18} strokeWidth={2.5} />
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(entry)} className="p-3 bg-paper text-editorial border-2 border-editorial hover:bg-editorial hover:text-paper transition-all shadow-[2px_2px_0px_0px_#CC0000]">
                                                            <Trash2 size={18} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center md:justify-start text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">
                                                KOSONG / BELUM ADA PELAJARAN
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-paper border-2 border-ink shadow-[4px_4px_0px_0px_#111111] overflow-hidden overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-ink">
                                <th className="px-6 py-4 border-b-2 border-r-2 border-paper text-[10px] font-mono font-bold text-paper uppercase tracking-widest text-left sticky left-0 bg-ink z-20">JAM</th>
                                {Days.map(day => (
                                    <th key={day} className="px-6 py-4 border-b-2 border-paper text-[10px] font-mono font-bold text-paper uppercase tracking-widest min-w-[180px] border-r-2 last:border-r-0">
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map(slot => (
                                <tr key={slot.id} className={slot.type === 'break' ? 'bg-gray-50' : 'hover:bg-gray-50 transition-colors border-b-2 border-ink'}>
                                    <td className={`px-6 py-4 border-r-2 border-ink sticky left-0 bg-paper z-10 ${slot.type === 'break' ? 'border-b border-gray-300' : 'border-b-2 border-ink'}`}>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xl font-mono font-black text-ink leading-none">{slot.id || '-'}</span>
                                            <span className="text-[9px] font-mono font-bold text-gray-500 mt-1 uppercase tracking-tighter whitespace-nowrap">{slot.start}-{slot.end}</span>
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
                                                <td key={day} className="px-6 py-4 text-center border-b border-gray-300 border-r border-gray-300">
                                                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{slot.label}</span>
                                                </td>
                                            );
                                        }

                                        return (
                                            <td key={day} className="p-2 border-b-2 border-r-2 border-ink last:border-r-0 group">
                                                {entry ? (
                                                    <div className="bg-ink border-2 border-ink p-3 h-full relative group/entry">
                                                        <div className="flex flex-col space-y-1">
                                                            <span className="text-[8px] font-mono font-bold text-gray-400 uppercase tracking-tighter truncate">{entry.class_name}</span>
                                                            <h4 className="text-xs font-mono font-black text-paper uppercase truncate leading-tight">{entry.subject_name}</h4>
                                                            <div className="flex items-center text-[9px] font-mono font-bold text-gray-300">
                                                                <User size={10} className="mr-1" strokeWidth={2} />
                                                                <span className="truncate">{entry.teacher_name || 'NO TEACHER'}</span>
                                                            </div>
                                                        </div>
                                                        {canManage && (
                                                            <div className="absolute top-1 right-1 opacity-0 group-hover/entry:opacity-100 transition-all flex scale-75 origin-top-right">
                                                                <button onClick={() => handleOpenEdit(entry)} className="p-1.5 bg-paper text-ink border border-ink hover:bg-ink hover:text-paper mr-1">
                                                                    <Edit2 size={12} strokeWidth={2.5} />
                                                                </button>
                                                                <button onClick={() => handleDeleteClick(entry)} className="p-1.5 bg-paper text-editorial border border-editorial hover:bg-editorial hover:text-paper">
                                                                    <Trash2 size={12} strokeWidth={2.5} />
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
                                                            className="w-full h-12 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-300 hover:border-ink hover:text-ink transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Plus size={16} strokeWidth={3} />
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
                title={currentEntry ? 'EDIT JADWAL' : 'TAMBAH JADWAL BARU'}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">HARI</label>
                            <select
                                className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all focus:shadow-[4px_4px_0px_0px_#111111] appearance-none"
                                value={formData.day}
                                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                            >
                                {Days.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">JAM KE</label>
                            <select
                                className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all focus:shadow-[4px_4px_0px_0px_#111111] appearance-none"
                                value={formData.jam_ke}
                                onChange={(e) => updateTimesFromJam(e.target.value)}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => <option key={n} value={n}>JAM KE-{n}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">TIPE MINGGU</label>
                        <select
                            className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all focus:shadow-[4px_4px_0px_0px_#111111] appearance-none"
                            value={formData.week_type}
                            onChange={(e) => setFormData({ ...formData, week_type: e.target.value })}
                        >
                            {WeekTypes.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">KELAS</label>
                        <select
                            className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all focus:shadow-[4px_4px_0px_0px_#111111] appearance-none"
                            value={formData.class_id}
                            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                        >
                            <option value="">PILIH KELAS</option>
                            {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">MATA PELAJARAN</label>
                        <select
                            className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all focus:shadow-[4px_4px_0px_0px_#111111] appearance-none"
                            value={formData.subject_name}
                            onChange={(e) => setFormData({ ...formData, subject_name: e.target.value, teacher_name: '' })}
                        >
                            <option value="">PILIH MAPEL</option>
                            {dbSubjects.map(s => <option key={s.id} value={s.name}>{s.name} ({s.jurusan})</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">GURU PENGAMPU</label>
                        <select
                            className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all focus:shadow-[4px_4px_0px_0px_#111111] appearance-none"
                            value={formData.teacher_name}
                            onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                        >
                            <option value="">PILIH GURU</option>
                            {getTeachersForSubject(formData.subject_name).map((t, i) => (
                                <option key={i} value={t}>{t}</option>
                            ))}
                            <optgroup label="SEMUA GURU">
                                {dbTeachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </optgroup>
                        </select>
                        <p className="text-[9px] text-gray-500 mt-1 flex items-center font-mono uppercase tracking-wide">
                            <Info size={10} className="mr-1" />
                            GURU DISESUAIKAN DENGAN PENGAMPU MAPEL YANG DIPILIH.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 opacity-60">
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">MULAI</label>
                            <input disabled type="text" className="w-full bg-gray-100 border-2 border-gray-300 px-4 py-3 font-mono font-bold text-gray-500 outline-none" value={formData.start_time} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">SELESAI</label>
                            <input disabled type="text" className="w-full bg-gray-100 border-2 border-gray-300 px-4 py-3 font-mono font-bold text-gray-500 outline-none" value={formData.end_time} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-ink hover:bg-paper text-paper hover:text-ink font-mono font-bold py-4 border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:mt-[4px] hover:shadow-none transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" /> : <Save size={20} strokeWidth={3} />}
                        <span className="uppercase tracking-widest text-xs">{currentEntry ? 'SIMPAN PERUBAHAN' : 'TERBITKAN JADWAL'}</span>
                    </button>
                </form>
            </Modal>

            {/* Settings Modal */}
            <Modal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                title="PENGATURAN WAKTU SEKOLAH"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border-2 border-ink shadow-[2px_2px_0px_0px_#111111] flex items-start space-x-3 mb-4">
                        <Info size={18} className="text-ink shrink-0 mt-0.5" strokeWidth={2.5} />
                        <p className="text-[11px] text-ink font-mono font-bold leading-relaxed tracking-tight uppercase">
                            Mengubah Jam Mulai Sekolah akan menggeser seluruh jadwal (Jam 1 - Jam 12) secara otomatis. Durasi per jam adalah 45 menit.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">JAM MULAI (JAM 1)</label>
                        <input
                            type="time"
                            className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink outline-none transition-all focus:shadow-[4px_4px_0px_0px_#111111]"
                            value={schoolStartTime}
                            onChange={(e) => setSchoolStartTime(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">MINGGU AKTIF SEKARANG</label>
                        <select
                            className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all focus:shadow-[4px_4px_0px_0px_#111111] appearance-none"
                            value={currentWeekType}
                            onChange={(e) => setCurrentWeekType(e.target.value)}
                        >
                            <option value="Minggu Ganjil">MINGGU GANJIL</option>
                            <option value="Minggu Genap">MINGGU GENAP</option>
                        </select>
                        <p className="text-[9px] text-gray-500 px-1 mt-1 font-mono uppercase tracking-wide">
                            Pengaturan ini menentukan jadwal yang muncul di notifikasi siswa/guru.
                        </p>
                    </div>

                    <button
                        onClick={handleSaveSettings}
                        className="w-full bg-ink hover:bg-paper text-paper hover:text-ink font-mono font-bold py-4 border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:mt-[4px] hover:shadow-none transition-all flex items-center justify-center space-x-2"
                    >
                        <Save size={20} strokeWidth={3} />
                        <span className="uppercase tracking-widest text-xs">SIMPAN PENGATURAN</span>
                    </button>
                </div>
            </Modal>

            {/* PDF Schedule Importer Modal */}
            {isPdfImporterOpen && (
                <PDFScheduleImporter
                    dbClasses={dbClasses}
                    dbTeachers={dbTeachers}
                    dbSubjects={dbSubjects}
                    currentWeekType={currentWeekType}
                    onImport={handlePdfImport}
                    onClose={() => setIsPdfImporterOpen(false)}
                />
            )}
        </div>
    );
}
