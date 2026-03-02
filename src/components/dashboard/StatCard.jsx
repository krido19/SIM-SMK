import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color, to }) => {
    const Content = () => (
        <div className="relative h-full flex flex-col">
            <div className="flex items-start justify-between relative z-10 border-b border-ink/10 pb-4 mb-4">
                <div className="p-3 border-2 border-ink bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <Icon size={20} className="text-ink" strokeWidth={1.5} />
                </div>
                {trend && (
                    <div className={`p-1.5 border border-ink text-[10px] font-mono font-bold uppercase tracking-widest ${trend.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {trend}
                    </div>
                )}
            </div>

            <div className="mt-auto">
                <h3 className="text-[10px] font-mono font-bold text-ink/40 uppercase tracking-[0.2em] mb-1">{title}</h3>
                <p className="text-5xl font-serif font-black text-ink tracking-tighter leading-none">{value}</p>
            </div>

            {to && (
                <div className="mt-6 flex items-center border-t border-ink/10 pt-4 text-[10px] font-mono font-bold uppercase tracking-widest text-ink group-hover:text-newsprint-red transition-colors">
                    <span>Lihat Detail</span>
                    <ChevronRight size={12} className="ml-1" />
                </div>
            )}
        </div>
    );

    const classes = "bg-paper p-6 border-2 border-ink shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group relative text-left w-full h-full min-h-[180px]";

    if (to) {
        return (
            <Link to={to} className={classes}>
                <Content />
            </Link>
        );
    }

    return (
        <div className={classes}>
            <Content />
        </div>
    );
};

export default StatCard;
