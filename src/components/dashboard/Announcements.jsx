import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Newspaper, Calendar, X, Bell } from 'lucide-react';

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
            <div className="space-y-4 flex-1">
                {announcements.length > 0 ? announcements.map((news) => (
                    <div
                        key={news.id}
                        onClick={() => setViewAnnouncement(news)}
                        className="group cursor-pointer bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300"
                    >
                        {news.image_url && (
                            <div className="w-full h-32 overflow-hidden rounded-lg mb-4">
                                <img src={news.image_url} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest">{news.date}</p>
                            {news.category && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-sans font-bold uppercase tracking-widest rounded-full">{news.category}</span>
                            )}
                        </div>
                        <h4 className="text-[13px] font-sans font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2">
                            {news.title}
                        </h4>
                        <p className="text-[11px] font-sans font-medium text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                            {news.content || "Detail tersedia di catatan publikasi lengkap."}
                        </p>
                    </div>
                )) : (
                    <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                        <p className="text-gray-400 font-sans font-medium text-sm">Belum ada pengumuman terbaru.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {viewAnnouncement && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="relative">
                            {viewAnnouncement.image_url ? (
                                <img src={viewAnnouncement.image_url} className="w-full h-72 object-cover" />
                            ) : (
                                <div className="w-full h-24 bg-blue-600 flex items-center justify-center">
                                    <Bell size={40} className="text-white opacity-20" />
                                </div>
                            )}
                            <button
                                onClick={() => setViewAnnouncement(null)}
                                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full transition-all"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                            {viewAnnouncement.category && (
                                <div className="absolute bottom-4 left-6">
                                    <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-sans font-bold uppercase tracking-widest rounded-full shadow-lg shadow-blue-600/20">
                                        {viewAnnouncement.category}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="p-8 overflow-y-auto space-y-4">
                            <div className="flex items-center space-x-2 text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest leading-none">
                                <Calendar size={14} className="text-blue-500" />
                                <span>Dipublikasikan: {news.date}</span>
                            </div>

                            <h2 className="text-2xl font-sans font-black text-gray-900 tracking-tight leading-tight">
                                {viewAnnouncement.title}
                            </h2>

                            <div className="pt-4 border-t border-gray-100 text-[15px] font-sans font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {viewAnnouncement.content}
                            </div>

                            <button
                                onClick={() => setViewAnnouncement(null)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-4"
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
