import React from 'react';
import { Clock, MapPin } from 'lucide-react';

const ScheduleNotification = ({ nextClass, role }) => {
    if (!nextClass) return null;

    return (
        <div className="bg-black border-4 border-black shadow-[8px_8px_0px_0px_#FF6B6B] text-white relative overflow-hidden group">
            {/* Halftone overlay */}
            <div className="absolute inset-0 neo-halftone-white opacity-10 pointer-events-none" />
            
            {/* Accent stripe */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-neo-accent" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 pl-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-neo-accent text-black text-[9px] font-black uppercase tracking-widest border-2 border-neo-accent">
                            ⚡ Sedang / Selanjutnya
                        </span>
                        <span className="flex items-center text-[10px] font-black text-white/50 uppercase tracking-widest">
                            <Clock size={10} className="mr-1.5 text-neo-accent" />
                            {nextClass.start_time} — {nextClass.end_time} WIB
                        </span>
                    </div>

                    <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-none mb-3 uppercase text-neo-secondary">
                        {nextClass.subject_name}
                    </h2>

                    <div className="flex items-center gap-3 text-white/60 text-sm font-bold">
                        <span className="h-px w-6 bg-neo-accent shrink-0" />
                        {role === 'guru' ? (
                            <p>Mengajar di Kelas: <b className="text-white">{nextClass.class_name}</b></p>
                        ) : (
                            <p>Guru Pengampu: <b className="text-white">{nextClass.teacher_name}</b></p>
                        )}
                    </div>
                </div>

                <div className="shrink-0 border-4 border-white/20 bg-white/5 p-5 min-w-[120px] text-center relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-neo-accent" />
                    <MapPin size={14} className="text-neo-accent mb-1.5 mx-auto opacity-60" />
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-40">Ruangan</p>
                    <p className="text-2xl font-black tracking-tight text-white">{nextClass.class_name}</p>
                </div>
            </div>
        </div>
    );
};

export default ScheduleNotification;
