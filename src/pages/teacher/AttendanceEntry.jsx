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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-ink pb-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-ink uppercase tracking-tighter leading-none mb-1">Daftar Kehadiran</h1>
                    <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">Absensi Harian Resmi</p>

                    <div className="flex items-center space-x-4 mt-6">
                        <div className="border-2 border-ink p-1 bg-white relative">
                            <span className="absolute -top-2 left-2 bg-paper px-1 text-[8px] font-mono font-bold uppercase tracking-widest text-ink">Section</span>
                            <select
                                className="appearance-none bg-transparent px-4 py-1 pr-8 text-xs font-bold font-mono uppercase tracking-widest text-ink focus:outline-none cursor-pointer"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                            >
                                {dbClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink pointer-events-none" strokeWidth={3} />
                        </div>
                        <div className="border-2 border-ink p-1 bg-white relative">
                            <span className="absolute -top-2 left-2 bg-paper px-1 text-[8px] font-mono font-bold uppercase tracking-widest text-ink">Date</span>
                            <input
                                type="date"
                                className="bg-transparent border-none focus:outline-none px-2 py-1 text-xs font-bold font-mono uppercase tracking-widest text-ink"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-widest">{attendance.filter(a => a.status === 'Hadir').length}/{attendance.length} PRESENT</p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 border-2 border-ink bg-ink text-paper hover:bg-newsprint-red hover:border-newsprint-red hover:text-white px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors shadow-[4px_4px_0px_0px_rgba(204,0,0,0.2)] hover:shadow-none active:translate-y-[2px] active:translate-x-[2px]"
                    >
                        <Save size={16} strokeWidth={2} />
                        <span>Simpan Absensi</span>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 text-center font-mono text-[10px] uppercase tracking-widest">Memuat Data Kehadiran...</div>
            ) : (
                <div className="border-2 border-ink bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative newsprint-texture">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-ink text-paper font-mono text-[10px] uppercase tracking-widest border-b-2 border-ink">
                                    <th className="p-3 border-r border-paper/20 w-16 text-center">No</th>
                                    <th className="p-3 border-r border-paper/20">Student Record</th>
                                    <th className="p-0 border-r border-paper/20 text-center" colSpan="4">
                                        <div className="border-b border-paper/20 py-1">Daily Status</div>
                                        <div className="grid grid-cols-4 divide-x divide-paper/20">
                                            <div className="py-1">Present</div>
                                            <div className="py-1">Sick</div>
                                            <div className="py-1">Excused</div>
                                            <div className="py-1">Absent</div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-ink">
                                {attendance.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="p-3 border-r border-ink text-center font-mono text-xs text-ink/60">{index + 1}</td>
                                        <td className="p-3 border-r border-ink">
                                            <div>
                                                <p className="font-serif font-black text-ink">{student.name}</p>
                                                <p className="font-mono text-[9px] uppercase tracking-widest text-ink/60">ID: {student.nis}</p>
                                            </div>
                                        </td>
                                        <td className="p-0" colSpan="4">
                                            <div className="grid grid-cols-4 h-full divide-x-2 divide-ink/20">
                                                {[
                                                    { label: 'Hadir', val: 'Hadir', activeClass: 'bg-green-100 text-green-800 border-b-2 border-green-800' },
                                                    { label: 'Sakit', val: 'Sakit', activeClass: 'bg-amber-100 text-amber-800 border-b-2 border-amber-800' },
                                                    { label: 'Izin', val: 'Izin', activeClass: 'bg-blue-100 text-blue-800 border-b-2 border-blue-800' },
                                                    { label: 'Alpa', val: 'Alpa', activeClass: 'bg-newsprint-red text-white border-b-2 border-newsprint-red' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.val}
                                                        onClick={() => setStatus(student.id, opt.val)}
                                                        className={`h-full w-full py-4 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors
                                                            ${student.status === opt.val
                                                                ? opt.activeClass
                                                                : 'text-ink/40 hover:bg-neutral-100 hover:text-ink border-b-2 border-transparent'
                                                            }
                                                        `}
                                                    >
                                                        {student.status === opt.val && <Check size={12} className="inline-block mr-1" strokeWidth={3} />}
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {attendance.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center font-serif italic text-ink/60">
                                            No student records found in this section.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
