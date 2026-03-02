import React from 'react';
import { Clock, MapPin } from 'lucide-react';

const ScheduleNotification = ({ nextClass, role }) => {
    if (!nextClass) return null;

    return (
        <div className="bg-ink p-8 border-2 border-ink shadow-[8px_8px_0px_0px_rgba(204,0,0,1)] text-paper relative overflow-hidden animate-in slide-in-from-top-4 duration-500 group">
            <div className="absolute top-0 right-0 w-32 h-full bg-newsprint-red skew-x-[-20deg] translate-x-16 opacity-10 group-hover:translate-x-12 transition-transform duration-700"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="px-2 py-1 bg-newsprint-red text-paper text-[9px] font-mono font-black uppercase tracking-widest">
                            Sedang / Selanjutnya
                        </span>
                        <span className="flex items-center text-[10px] font-mono font-bold text-paper/60 uppercase tracking-widest">
                            <Clock size={12} className="mr-2 text-newsprint-red" />
                            {nextClass.start_time} — {nextClass.end_time} WIB
                        </span>
                    </div>

                    <h2 className="text-4xl lg:text-5xl font-serif font-black tracking-tighter leading-none mb-3 italic">
                        {nextClass.subject_name}
                    </h2>

                    <div className="flex items-center gap-4 text-paper/70 font-body text-sm">
                        <span className="h-px w-8 bg-newsprint-red"></span>
                        {role === 'guru' ? (
                            <p>Mengajar di Kelas: <b className="text-paper font-serif italic">{nextClass.class_name}</b></p>
                        ) : (
                            <p>Guru Pengampu: <b className="text-paper font-serif italic">{nextClass.teacher_name}</b></p>
                        )}
                    </div>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center p-6 border-2 border-white/20 bg-white/5 min-w-[140px] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-newsprint-red"></div>
                    <MapPin size={16} className="text-newsprint-red mb-2 opacity-50" />
                    <p className="text-[9px] font-mono font-black uppercase tracking-widest mb-1 opacity-40">Ruangan</p>
                    <p className="text-2xl font-serif font-black italic tracking-tight">{nextClass.class_name}</p>
                </div>
            </div>
        </div>
    );
};

export default ScheduleNotification;
