import React, { useState } from 'react';
import {
    Check,
    X,
    Clock,
    Search,
    Calendar,
    Save,
    Info
} from 'lucide-react';

const initialAttendance = [
    { id: 1, name: 'Ahmad Fauzi', nis: '2023001', status: 'Hadir' },
    { id: 2, name: 'Budi Santoso', nis: '2023002', status: 'Hadir' },
    { id: 3, name: 'Citra Lestari', nis: '2023003', status: 'Izin' },
    { id: 4, name: 'Diana Putri', nis: '2023004', status: 'Hadir' },
    { id: 5, name: 'Eko Prasetyo', nis: '2023005', status: 'Sakit' },
];

export default function AttendanceEntry() {
    const [attendance, setAttendance] = useState(initialAttendance);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const setStatus = (id, status) => {
        setAttendance(attendance.map(a => a.id === id ? { ...a, status } : a));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Input Absensi Harian</h1>
                    <p className="text-sm text-gray-500">Kelas: X-IPA-1 | Sesi: Pagi</p>
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
                                { label: 'Hadir', color: 'green', val: 'Hadir' },
                                { label: 'Sakit', color: 'orange', val: 'Sakit' },
                                { label: 'Izin', color: 'blue', val: 'Izin' },
                                { label: 'Alpa', color: 'red', val: 'Alpa' }
                            ].map((opt) => (
                                <button
                                    key={opt.val}
                                    onClick={() => setStatus(student.id, opt.val)}
                                    className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${student.status === opt.val
                                            ? `bg-${opt.color}-600 border-${opt.color}-600 text-white shadow-lg shadow-${opt.color}-200 scale-105`
                                            : `bg-white border-gray-50 text-gray-400 hover:border-${opt.color}-200 hover:text-${opt.color}-600`
                                        }`}
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
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">
                    Simpan Absensi
                </button>
            </div>
        </div>
    );
}
