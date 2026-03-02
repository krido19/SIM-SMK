import React from 'react';
import { ChevronRight, Newspaper } from 'lucide-react';

const Announcements = ({ announcements }) => {
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
                {announcements.length > 0 ? announcements.map((news, i) => (
                    <div key={news.id} className="group cursor-pointer border-b border-ink/10 last:border-0 pb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-1.5 h-1.5 bg-newsprint-red" />
                            <p className="text-[9px] font-mono font-bold text-ink/40 uppercase tracking-[0.2em]">{news.date}</p>
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

            <button className="mt-8 w-full py-3 border-2 border-ink font-sans font-bold text-[10px] uppercase tracking-[0.2em] bg-white hover:bg-ink hover:text-paper transition-all flex items-center justify-center space-x-2 group shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                <span>Lihat Semua Pengumuman</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
};

export default Announcements;
