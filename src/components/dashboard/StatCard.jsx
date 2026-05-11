import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color, to, onClick }) => {
    const colors = {
        blue:    { bg: 'bg-neo-muted',      border: 'border-black' },
        emerald: { bg: 'bg-neo-secondary',  border: 'border-black' },
        amber:   { bg: 'bg-neo-secondary',  border: 'border-black' },
        rose:    { bg: 'bg-neo-accent',     border: 'border-black' },
        purple:  { bg: 'bg-neo-muted',      border: 'border-black' },
        gray:    { bg: 'bg-white',          border: 'border-black' },
    };

    const activeColor = colors[color] || colors.blue;

    const Content = () => (
        <div className="relative h-full flex flex-col">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 border-2 border-black ${activeColor.bg} shadow-[2px_2px_0px_0px_#000]`}>
                    <Icon size={20} strokeWidth={3} className="text-black" />
                </div>
                {trend && (
                    <div className={`px-2 py-1 border-2 border-black text-[10px] font-black uppercase tracking-wider ${trend.startsWith('+') ? 'bg-neo-secondary' : 'bg-neo-accent'} text-black`}>
                        {trend}
                    </div>
                )}
            </div>

            <div className="mt-auto">
                <h3 className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1">{title}</h3>
                <p className="text-3xl font-black text-black tracking-tight leading-none">{value}</p>
            </div>

            {(to || onClick) && (
                <div className="mt-4 pt-4 border-t-2 border-black flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Detail</span>
                    <div className="border-2 border-black p-1 group-hover:bg-black group-hover:text-white transition-colors duration-100">
                        <ArrowRight size={12} strokeWidth={3} />
                    </div>
                </div>
            )}
        </div>
    );

    const classes = "bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-5 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-200 group relative text-left w-full h-full min-h-[160px]" + (onClick ? " cursor-pointer" : "");

    if (to) {
        return (
            <Link to={to} className={classes} onClick={(e) => { if (to === "#") e.preventDefault(); if (onClick) onClick(e); }}>
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
