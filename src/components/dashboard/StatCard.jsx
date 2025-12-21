import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color, to }) => {
    const Content = () => (
        <>
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-transform ${color}`} />
            <div className="flex items-start justify-between relative z-10">
                <div className={`p-4 rounded-2xl ${color.replace('bg-', 'bg-').replace('600', '50')} ${color.replace('bg-', 'text-')}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center space-x-1 text-xs font-black ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                        <span>{trend}</span>
                        <ArrowUpRight size={14} className={trend.startsWith('-') ? 'rotate-90' : ''} />
                    </div>
                )}
            </div>
            <div className="mt-6 relative z-10">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</h3>
                <p className="text-4xl font-black text-gray-900 mt-1">{value}</p>
            </div>
            {to && (
                <div className="mt-4 flex items-center text-[10px] font-black uppercase tracking-widest text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Lihat Detail</span>
                    <ChevronRight size={12} className="ml-1" />
                </div>
            )}
        </>
    );

    const classes = "bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative text-left w-full";

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
