import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color, to, onClick }) => {
    // Definisi warna yang lebih lembut/modern
    const colors = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
        rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
        gray: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' }
    };

    const activeColor = colors[color] || colors.blue;

    const Content = () => (
        <div className="relative h-full flex flex-col">
            <div className="flex items-start justify-between relative z-10 mb-4">
                <div className={`p-3 rounded-xl ${activeColor.bg} ${activeColor.text}`}>
                    <Icon size={22} strokeWidth={2} />
                </div>
                {trend && (
                    <div className={`px-2 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {trend}
                    </div>
                )}
            </div>

            <div className="mt-2">
                <h3 className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</h3>
                <p className="text-3xl font-sans font-black text-gray-900 tracking-tight leading-none">{value}</p>
            </div>

            {(to || onClick) && (
                <div className="mt-auto pt-6 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:gap-1 transition-all duration-300">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">Detail</span>
                    <div className="p-1.5 rounded-lg bg-blue-50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ChevronRight size={14} />
                    </div>
                </div>
            )}
        </div>
    );

    const classes = "bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative text-left w-full h-full min-h-[170px]" + (onClick ? " cursor-pointer" : "");

    if (to) {
        return (
            <Link to={to} className={classes} onClick={(e) => { if(to === "#") e.preventDefault(); if(onClick) onClick(e); }}>
                <Content />
            </Link>
        );
    }

    if (onClick) {
        return (
            <button onClick={onClick} className={classes + " block"}>
                <Content />
            </button>
        );
    }

    return (
        <div className={classes}>
            <Content />
        </div>
    );
};

export default StatCard;
