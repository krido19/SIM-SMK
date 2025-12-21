import React from 'react';
import { Bell, ChevronRight } from 'lucide-react';

const Announcements = ({ announcements }) => {
    return (
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-gray-900">Informasi</h3>
                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Bell size={18} />
                </div>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-2">
                {announcements.length > 0 ? announcements.map((news, i) => (
                    <div key={news.id} className="flex items-start space-x-4 group cursor-pointer">
                        <div className={`mt-2 w-2 h-2 rounded-full ${['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500'][i % 4]} shadow-lg shadow-blue-200 shrink-0 group-hover:scale-150 transition-transform`} />
                        <div className="flex-1 pb-4 border-b border-gray-50 group-last:border-0">
                            <h4 className="text-sm font-black text-gray-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{news.title}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{news.date}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-gray-400 text-sm font-bold">Belum ada pengumuman.</p>
                )}
            </div>

            <button className="mt-8 w-full py-4 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-2xl font-black text-sm transition-all flex items-center justify-center space-x-2 group">
                <span>Lihat Semua</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
};

export default Announcements;
