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

    useEffect(() => {
        const fetchClasses = async () => {
            const { data } = await supabase.from('classes').select('id, name');
            if (data) {
                setDbClasses(data);
                if (data.length > 0) setSelectedClassId(data[0].id);
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

    const handleSave = async () => {
        const attendanceToUpsert = attendance.map(a => ({
            student_id: a.id,
            date: selectedDate,
            status: a.status
        }));

        const { error } = await supabase
            .from('attendance')
            .upsert(attendanceToUpsert, { onConflict: 'student_id, date' });

        if (error) {
            showToast('Gagal menyimpan absensi: ' + error.message, 'error');
        } else {
            showToast('Absensi berhasil disimpan!', 'success');
        }
    };

    const setStatus = (id, status) => {
        setAttendance(attendance.map(a => a.id === id ? { ...a, status } : a));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Input Absensi Harian</h1>
                    <div className="flex items-center space-x-3 mt-2">
                        <div className="relative group">
                            <select
                                className="appearance-none bg-white border border-gray-100 px-4 py-2 pr-10 rounded-xl text-xs font-black text-gray-600 focus:ring-2 focus:ring-blue-500 transition-all outline-none cursor-pointer shadow-sm"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                            >
                                {dbClasses.map(c => <option key={c.id} value={c.id}>Kelas: {c.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">Sesi: Pagi</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <Calendar size={18} className="ml-2 text-blue-500" />
                    <input
                        type="date"
                        className="border-none focus:ring-0 text-sm font-bold text-gray-700 bg-transparent"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attendance.map((student) => (
                    <div key={student.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 font-bold border-2 border-white shadow-sm overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} alt="avatar" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{student.name}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{student.nis}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {[
                                {
                                    label: 'Hadir', val: 'Hadir',
                                    active: 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200 scale-105',
                                    inactive: 'bg-white border-gray-50 text-gray-400 hover:border-green-200 hover:text-green-600'
                                },
                                {
                                    label: 'Sakit', val: 'Sakit',
                                    active: 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200 scale-105',
                                    inactive: 'bg-white border-gray-50 text-gray-400 hover:border-orange-200 hover:text-orange-600'
                                },
                                {
                                    label: 'Izin', val: 'Izin',
                                    active: 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105',
                                    inactive: 'bg-white border-gray-50 text-gray-400 hover:border-blue-200 hover:text-blue-600'
                                },
                                {
                                    label: 'Alpa', val: 'Alpa',
                                    active: 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-200 scale-105',
                                    inactive: 'bg-white border-gray-50 text-gray-400 hover:border-red-200 hover:text-red-600'
                                }
                            ].map((opt) => (
                                <button
                                    key={opt.val}
                                    onClick={() => setStatus(student.id, opt.val)}
                                    className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${student.status === opt.val ? opt.active : opt.inactive}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="sticky bottom-6 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border border-gray-100 shadow-2xl rounded-3xl flex items-center justify-between mx-auto max-w-2xl">
                <div className="flex items-center space-x-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-green-500 flex items-center justify-center">
                                <Check size={14} className="text-white" />
                            </div>
                        ))}
                    </div>
                    <p className="text-sm font-bold text-gray-800">Semua Data Sudah Diisi</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    Simpan Absensi
                </button>
            </div>
        </div>
    );
}
