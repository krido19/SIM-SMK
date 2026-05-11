import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Megaphone, Calendar, X, Newspaper } from 'lucide-react';

export default function StudentAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewAnnouncement, setViewAnnouncement] = useState(null);

    useEffect(() => { fetchAnnouncements(); }, []);

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        if (!error) setAnnouncements(data || []);
        setIsLoading(false);
    };

    if (isLoading) return (
        <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-black border-t-neo-accent animate-spin" />
            <p className="font-black text-sm text-black/40 uppercase tracking-widest">Memuat Pengumuman...</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-12">
            <div className="pb-4 border-b-4 border-black">
                <span className="inline-block bg-neo-muted border-4 border-black text-[10px] font-black px-3 py-1 uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] mb-3">Informasi</span>
                <h1 className="text-4xl font-black text-black uppercase tracking-tight leading-none">PENGUMUMAN</h1>
                <p className="font-bold text-black/50 text-sm mt-1">Informasi dan berita terbaru dari sekolah.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {announcements.length > 0 ? announcements.map((ann) => (
                    <div key={ann.id} onClick={() => setViewAnnouncement(ann)}
                        className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000] transition-all duration-200 group cursor-pointer flex flex-col">
                        {ann.image_url && (
                            <div className="h-44 overflow-hidden border-b-4 border-black">
                                <img src={ann.image_url} alt={ann.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                                <div className="border-4 border-black p-2 bg-neo-muted shadow-[2px_2px_0px_0px_#000]">
                                    <Megaphone size={16} strokeWidth={3} />
                                </div>
                                {ann.category && (
                                    <span className="border-2 border-black bg-neo-cream text-[9px] font-black uppercase tracking-widest px-2 py-0.5">{ann.category}</span>
                                )}
                            </div>
                            <h3 className="text-lg font-black text-black tracking-tight leading-tight line-clamp-2 uppercase mb-2">{ann.title}</h3>
                            <p className="text-black/50 text-sm font-bold flex-1 line-clamp-3 leading-relaxed">{ann.content}</p>
                            <div className="mt-4 pt-4 border-t-2 border-black/10 flex items-center gap-2 text-[10px] font-black text-black/40 uppercase tracking-widest">
                                <Calendar size={12} strokeWidth={3} />{ann.date}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-16 text-center border-4 border-dashed border-black/20 bg-white">
                        <Newspaper size={32} className="mx-auto mb-3 text-black/20" strokeWidth={2} />
                        <h3 className="font-black text-black uppercase">Belum Ada Pengumuman</h3>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {viewAnnouncement && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
                    <div className="bg-neo-cream border-4 border-black shadow-[12px_12px_0px_0px_#000] w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-bounce-in">
                        <div className="bg-neo-secondary border-b-4 border-black px-5 py-3 flex items-center justify-between">
                            <div>
                                {viewAnnouncement.category && <span className="bg-black text-neo-secondary text-[9px] font-black uppercase px-2 py-0.5 mr-2">{viewAnnouncement.category}</span>}
                                <span className="text-[10px] font-black text-black/50 uppercase">{viewAnnouncement.date}</span>
                            </div>
                            <button onClick={() => setViewAnnouncement(null)} className="border-4 border-black p-1.5 bg-white hover:bg-neo-accent shadow-[3px_3px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100">
                                <X size={14} strokeWidth={3} />
                            </button>
                        </div>
                        {viewAnnouncement.image_url && (
                            <div className="border-b-4 border-black h-52 overflow-hidden">
                                <img src={viewAnnouncement.image_url} className="w-full h-full object-cover" alt={viewAnnouncement.title} />
                            </div>
                        )}
                        <div className="p-6 overflow-y-auto">
                            <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-4">{viewAnnouncement.title}</h2>
                            <div className="border-t-4 border-black pt-4 text-sm font-bold text-black/70 leading-relaxed whitespace-pre-wrap">{viewAnnouncement.content}</div>
                            <button onClick={() => setViewAnnouncement(null)} className="mt-6 w-full bg-black text-white font-black text-sm uppercase tracking-widest py-4 border-4 border-black shadow-[6px_6px_0px_0px_#FF6B6B] hover:bg-neo-accent hover:text-black active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all duration-100">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
