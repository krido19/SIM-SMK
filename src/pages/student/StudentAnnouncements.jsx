import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Megaphone,
    Calendar,
    X,
    Newspaper
} from 'lucide-react';

export default function StudentAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewAnnouncement, setViewAnnouncement] = useState(null);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error) {
            setAnnouncements(data || []);
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="py-24 text-center">
                 <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="font-sans text-sm font-bold text-gray-500 uppercase tracking-widest">Memuat pengumuman...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="border-b border-gray-100 pb-6 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 mb-4 bg-indigo-50 px-3 py-1.5 rounded-full">
                    <span className="bg-indigo-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Informasi
                    </span>
                 </div>
                <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight leading-none mb-2">PENGUMUMAN</h1>
                <p className="font-sans text-sm font-medium text-gray-500 mt-2">Informasi dan berita terbaru dari sekolah.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.length > 0 ? announcements.map((ann) => (
                    <div
                        key={ann.id}
                        onClick={() => setViewAnnouncement(ann)}
                        className="bg-white border flex flex-col border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden cursor-pointer"
                    >
                        {ann.image_url && (
                            <div className="w-full h-48 overflow-hidden relative border-b border-gray-100 bg-gray-50 flex-shrink-0">
                                <img src={ann.image_url} alt={ann.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                        )}
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Megaphone size={18} strokeWidth={2.5} />
                                </div>
                            </div>

                            <div className="space-y-3 flex-1 flex flex-col">
                                <div>
                                    <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-sans font-bold uppercase tracking-widest border border-gray-200 shadow-sm w-max">
                                        {ann.category}
                                    </span>
                                    <h3 className="text-xl font-black text-gray-900 mt-4 tracking-tight font-sans leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">{ann.title}</h3>
                                </div>
                                <p className="text-gray-500 text-sm font-sans flex-1 line-clamp-3 leading-relaxed mt-2">{ann.content}</p>
                                <div className="pt-4 mt-auto border-t border-gray-100 flex items-center text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest bg-gray-50 rounded-lg px-3 py-2 w-max">
                                    <Calendar size={14} className="mr-2 text-gray-500" strokeWidth={2.5} />
                                    {ann.date}
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                             <Newspaper size={32} className="text-gray-300" strokeWidth={2} />
                        </div>
                        <h3 className="text-xl font-sans font-black text-gray-900 tracking-tight">Belum Ada Pengumuman</h3>
                        <p className="text-sm font-sans font-medium text-gray-500 mt-2 max-w-md">Pengumuman dari sekolah akan ditampilkan di sini saat tersedia.</p>
                    </div>
                )}
            </div>

            {/* View Detail Modal */}
            {viewAnnouncement && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl border border-white/20 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="relative shrink-0">
                            {viewAnnouncement.image_url ? (
                                <img src={viewAnnouncement.image_url} className="w-full h-80 object-cover" />
                            ) : (
                                <div className="w-full h-24 bg-gradient-to-r from-indigo-500 to-blue-600" />
                            )}
                            <button
                                onClick={() => setViewAnnouncement(null)}
                                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm border border-white/40 text-white hover:bg-white hover:text-gray-900 rounded-xl transition-all shadow-sm"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                            <div className="absolute -bottom-4 left-8">
                                <span className="px-4 py-2 bg-indigo-600 text-white shadow-lg text-[10px] font-sans font-bold uppercase tracking-widest rounded-xl border-4 border-white">
                                    {viewAnnouncement.category}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 pt-10 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                            <div className="flex items-center space-x-2 text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl w-max">
                                <Calendar size={14} strokeWidth={2.5} className="text-gray-400" />
                                <span>Dipublikasikan: {viewAnnouncement.date}</span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight font-sans">
                                {viewAnnouncement.title}
                            </h2>

                            <div className="border-t border-gray-100 pt-6">
                                <p className="text-gray-600 text-base font-sans leading-relaxed whitespace-pre-wrap">
                                    {viewAnnouncement.content}
                                </p>
                            </div>

                            <div className="pt-8 mt-auto">
                                <button
                                    onClick={() => setViewAnnouncement(null)}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-sans font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-widest"
                                >
                                    Tutup Pengumuman
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
