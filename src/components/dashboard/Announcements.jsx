import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, X, Bell, ArrowRight } from 'lucide-react';

const Announcements = ({ announcements }) => {
    const [viewAnnouncement, setViewAnnouncement] = useState(null);

    const getAnnouncementsLink = () => {
        const role = localStorage.getItem('userRole');
        if (role === 'admin') return '/admin/announcements';
        if (role === 'guru') return '/teacher/announcements';
        return '/student/announcements';
    };

    return (
        <div className="flex flex-col relative h-full">
            <div className="space-y-3 flex-1">
                {announcements.length > 0 ? announcements.map((news) => (
                    <div
                        key={news.id}
                        onClick={() => setViewAnnouncement(news)}
                        className="group cursor-pointer bg-neo-cream border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] transition-all duration-150 p-4"
                    >
                        {news.image_url && (
                            <div className="w-full h-28 overflow-hidden border-2 border-black mb-3">
                                <img src={news.image_url} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-[9px] font-black text-black/40 uppercase tracking-widest">{news.date}</p>
                            {news.category && (
                                <span className="px-2 py-0.5 bg-neo-secondary border-2 border-black text-[8px] font-black uppercase tracking-widest text-black">{news.category}</span>
                            )}
                        </div>
                        <h4 className="text-[13px] font-black text-black leading-tight line-clamp-2 uppercase tracking-tight">
                            {news.title}
                        </h4>
                        <p className="text-[11px] font-bold text-black/50 mt-1.5 line-clamp-2 leading-relaxed">
                            {news.content || "Detail tersedia di catatan publikasi lengkap."}
                        </p>
                    </div>
                )) : (
                    <div className="py-12 text-center border-4 border-dashed border-black/20 bg-white">
                        <Bell size={24} className="mx-auto mb-3 text-black/20" strokeWidth={2} />
                        <p className="text-black/40 font-black text-sm uppercase tracking-widest">Belum ada pengumuman.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {viewAnnouncement && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200">
                    <div className="bg-neo-cream border-4 border-black shadow-[12px_12px_0px_0px_#000] w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-bounce-in">
                        {/* Modal Header */}
                        <div className="bg-neo-secondary border-b-4 border-black px-6 py-4 flex items-center justify-between">
                            <div>
                                {viewAnnouncement.category && (
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-black text-neo-secondary px-2 py-0.5 mr-2">
                                        {viewAnnouncement.category}
                                    </span>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest text-black/50">{viewAnnouncement.date}</span>
                            </div>
                            <button
                                onClick={() => setViewAnnouncement(null)}
                                className="border-4 border-black p-1.5 bg-white hover:bg-neo-accent shadow-[3px_3px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100"
                            >
                                <X size={16} strokeWidth={3} />
                            </button>
                        </div>

                        {viewAnnouncement.image_url && (
                            <div className="border-b-4 border-black h-56 overflow-hidden">
                                <img src={viewAnnouncement.image_url} className="w-full h-full object-cover" alt={viewAnnouncement.title} />
                            </div>
                        )}

                        <div className="p-6 overflow-y-auto space-y-4">
                            <h2 className="text-2xl font-black text-black tracking-tight leading-tight uppercase">
                                {viewAnnouncement.title}
                            </h2>

                            <div className="pt-4 border-t-4 border-black text-sm font-bold text-black/70 leading-relaxed whitespace-pre-wrap">
                                {viewAnnouncement.content}
                            </div>

                            <button
                                onClick={() => setViewAnnouncement(null)}
                                className="w-full bg-black text-white font-black text-sm uppercase tracking-widest py-4 border-4 border-black shadow-[6px_6px_0px_0px_#FF6B6B] hover:bg-neo-accent hover:text-black active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all duration-100 mt-4"
                            >
                                Tutup Pengumuman
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;
