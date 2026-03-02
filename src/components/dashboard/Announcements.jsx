import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Newspaper, Calendar, X } from 'lucide-react';

const Announcements = ({ announcements }) => {
    const [viewAnnouncement, setViewAnnouncement] = useState(null);

    const getAnnouncementsLink = () => {
        const role = localStorage.getItem('userRole');
        if (role === 'admin') return '/admin/announcements';
        if (role === 'guru') return '/teacher/announcements';
        return '/student/announcements';
    };

    return (
        <div className="bg-paper p-8 border-2 border-ink shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex flex-col relative newsprint-texture">
            <div className="flex items-center justify-between mb-8 border-b-2 border-ink pb-4">
                <div className="flex items-center gap-3">
                    <Newspaper size={20} className="text-ink" strokeWidth={1.5} />
                    <h3 className="text-xl font-serif font-black text-ink uppercase tracking-tight">Pengumuman Terbaru</h3>
                </div>
                <div className="text-[10px] font-mono font-bold uppercase opacity-30">Arsip No. {announcements.length}</div>
            </div>

            <div className="space-y-8 flex-1">
                {announcements.length > 0 ? announcements.map((news) => (
                    <div
                        key={news.id}
                        onClick={() => setViewAnnouncement(news)}
                        className="group cursor-pointer border-b border-ink/10 last:border-0 pb-6"
                    >
                        {news.image_url && (
                            <div className="w-full h-40 overflow-hidden border-2 border-ink mb-4">
                                <img src={news.image_url} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-1.5 h-1.5 bg-newsprint-red" />
                            <p className="text-[9px] font-mono font-bold text-ink/40 uppercase tracking-[0.2em]">{news.date}</p>
                            {news.category && (
                                <span className="px-2 py-0.5 bg-ink text-paper text-[8px] font-mono font-bold uppercase tracking-widest">{news.category}</span>
                            )}
                        </div>
                        <h4 className="text-sm font-serif font-black text-ink group-hover:text-newsprint-red transition-colors leading-snug">
                            {news.title}
                        </h4>
                        <p className="text-[11px] font-body text-ink/60 mt-2 line-clamp-2 leading-relaxed">
                            {news.content || "Detail tersedia di catatan publikasi lengkap."}
                        </p>
                    </div>
                )) : (
                    <div className="py-12 text-center border-2 border-dashed border-ink/10">
                        <p className="text-ink/30 font-serif italic text-sm">Belum ada pengumuman terbaru.</p>
                    </div>
                )}
            </div>

            <Link
                to={getAnnouncementsLink()}
                className="mt-8 w-full py-3 border-2 border-ink font-sans font-bold text-[10px] uppercase tracking-[0.2em] bg-white hover:bg-ink hover:text-paper transition-all flex items-center justify-center space-x-2 group shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
                <span>Lihat Semua Pengumuman</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Detail Modal */}
            {viewAnnouncement && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-paper border-4 border-ink shadow-[16px_16px_0px_0px_#111111] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="relative">
                            {viewAnnouncement.image_url ? (
                                <img src={viewAnnouncement.image_url} className="w-full h-64 object-cover border-b-4 border-ink" />
                            ) : (
                                <div className="w-full h-20 bg-ink" />
                            )}
                            <button
                                onClick={() => setViewAnnouncement(null)}
                                className="absolute top-4 right-4 p-2 bg-paper border-2 border-ink text-ink hover:bg-ink hover:text-paper transition-all"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                            {viewAnnouncement.category && (
                                <div className="absolute bottom-4 left-6">
                                    <span className="px-3 py-1 bg-ink text-paper text-[9px] font-mono font-bold uppercase tracking-widest border border-paper">
                                        {viewAnnouncement.category}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="p-8 overflow-y-auto space-y-4">
                            <div className="flex items-center space-x-2 text-[9px] font-mono font-bold text-ink/50 uppercase tracking-widest">
                                <Calendar size={12} strokeWidth={2.5} />
                                <span>DIPUBLIKASIKAN: {viewAnnouncement.date}</span>
                            </div>

                            <h2 className="text-3xl font-black text-ink tracking-tight leading-tight font-serif uppercase">
                                {viewAnnouncement.title}
                            </h2>

                            <div className="border-t-2 border-ink pt-4">
                                <p className="text-ink/80 text-base font-mono leading-relaxed whitespace-pre-wrap">
                                    {viewAnnouncement.content}
                                </p>
                            </div>

                            <button
                                onClick={() => setViewAnnouncement(null)}
                                className="w-full bg-paper border-2 border-ink hover:bg-ink hover:text-paper text-ink font-mono font-bold py-4 transition-all flex items-center justify-center text-xs uppercase tracking-widest mt-4 shadow-[4px_4px_0px_0px_#111111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                            >
                                TUTUP PENGUMUMAN
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;
