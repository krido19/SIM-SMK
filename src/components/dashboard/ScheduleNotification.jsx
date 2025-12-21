import React from 'react';
import { Clock } from 'lucide-react';

const ScheduleNotification = ({ nextClass, role }) => {
    if (!nextClass) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-[2.5rem] p-8 shadow-xl shadow-blue-200 text-white relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                            Sedang / Akan Berlangsung
                        </span>
                        <span className="flex items-center text-[10px] font-bold text-blue-100">
                            <Clock size={12} className="mr-1" />
                            {nextClass.start_time} - {nextClass.end_time} WIB
                        </span>
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-wide leading-none mb-1">
                        {nextClass.subject_name}
                    </h2>
                    <p className="text-blue-100 font-medium flex items-center">
                        {role === 'guru' ? (
                            <>Mengajar di Kelas <b className="text-white ml-1">{nextClass.class_name}</b></>
                        ) : (
                            <>Guru: <b className="text-white ml-1">{nextClass.teacher_name}</b></>
                        )}
                    </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Ruangan</p>
                    <p className="text-2xl font-black">{nextClass.class_name}</p>
                </div>
            </div>
        </div>
    );
};

export default ScheduleNotification;
