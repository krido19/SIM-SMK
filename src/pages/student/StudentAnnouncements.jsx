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
            <div className="p-8 text-center font-mono text-[10px] uppercase tracking-widest bg-paper border-2 border-ink shadow-[4px_4px_0px_0px_#111111] animate-pulse font-bold text-ink">
                Memuat pengumuman...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="border-b-4 border-ink pb-6">
                <h1 className="text-4xl font-serif font-black text-ink uppercase tracking-tighter leading-none mb-1">PENGUMUMAN</h1>
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-60 mt-2">Informasi dan berita terbaru dari sekolah.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.length > 0 ? announcements.map((ann) => (
                    <div
                        key={ann.id}
                        onClick={() => setViewAnnouncement(ann)}
                        className="bg-paper border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:shadow-[8px_8px_0px_0px_#111111] hover:-translate-y-0.5 transition-all group relative overflow-hidden flex flex-col cursor-pointer"
                    >
                        {ann.image_url && (
                            <div className="w-full h-48 overflow-hidden relative border-b-2 border-ink">
                                <img src={ann.image_url} alt={ann.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                        )}
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-ink text-paper border-2 border-ink">
                                    <Megaphone size={20} strokeWidth={2.5} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="px-2 py-1 bg-ink text-paper text-[9px] font-mono font-bold uppercase tracking-widest border border-ink">
                                        {ann.category}
                                    </span>
                                    <h3 className="text-xl font-black text-ink mt-2 tracking-tight font-serif uppercase">{ann.title}</h3>
                                </div>
                                <p className="text-ink/70 text-sm font-mono leading-relaxed line-clamp-3">{ann.content}</p>
                                <div className="pt-3 border-t-2 border-ink flex items-center text-[9px] font-mono font-bold text-ink/50 uppercase tracking-widest">
                                    <Calendar size={12} className="mr-2" strokeWidth={2.5} />
                                    DIPOSTING: {ann.date}
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-ink/20 bg-paper">
                        <Newspaper size={48} className="mx-auto text-ink/20 mb-4" strokeWidth={1} />
                        <h3 className="text-lg font-serif font-black text-ink/40 uppercase">Belum Ada Pengumuman</h3>
                        <p className="text-sm font-mono text-ink/30 uppercase tracking-widest mt-2">Pengumuman dari sekolah akan ditampilkan di sini.</p>
                    </div>
                )}
            </div>

            {/* View Detail Modal */}
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
                            <div className="absolute bottom-4 left-6">
                                <span className="px-3 py-1 bg-ink text-paper text-[9px] font-mono font-bold uppercase tracking-widest border border-paper">
                                    {viewAnnouncement.category}
                                </span>
                            </div>
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
                                className="w-full bg-paper border-2 border-ink hover:bg-ink hover:text-paper text-ink font-mono font-bold py-4 transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-widest mt-4 shadow-[4px_4px_0px_0px_#111111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                            >
                                TUTUP PENGUMUMAN
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
