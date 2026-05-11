/**
 * Shared Neo-Brutalism UI Helper Components
 * Used across all pages for consistent styling
 */
import React from 'react';
import { X } from 'lucide-react';

// Page Header
export const NeoBadge = ({ children, color = 'secondary' }) => {
    const colors = {
        secondary: 'bg-neo-secondary',
        accent:    'bg-neo-accent',
        muted:     'bg-neo-muted',
        black:     'bg-black text-white',
    };
    return (
        <span className={`inline-block ${colors[color]} border-4 border-black text-[10px] font-black px-3 py-1 uppercase tracking-widest shadow-[3px_3px_0px_0px_#000]`}>
            {children}
        </span>
    );
};

export const NeoPageHeader = ({ badge, title, subtitle, action, color = 'secondary' }) => (
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b-4 border-black">
        <div>
            {badge && <NeoBadge color={color}>{badge}</NeoBadge>}
            <h1 className="text-4xl font-black text-black uppercase tracking-tight leading-none mt-3 mb-1">{title}</h1>
            {subtitle && <p className="font-bold text-black/50 text-sm">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
);

// Button
export const NeoButton = ({ children, onClick, disabled, variant = 'primary', size = 'md', className = '', type = 'button' }) => {
    const variants = {
        primary:   'bg-black text-white hover:bg-neo-accent hover:text-black shadow-[4px_4px_0px_0px_#FF6B6B]',
        secondary: 'bg-neo-secondary text-black hover:bg-neo-secondary/80 shadow-[4px_4px_0px_0px_#000]',
        muted:     'bg-neo-muted text-black hover:bg-neo-muted/80 shadow-[4px_4px_0px_0px_#000]',
        danger:    'bg-neo-accent text-black hover:bg-neo-accent/80 shadow-[4px_4px_0px_0px_#000]',
        ghost:     'bg-white text-black hover:bg-neo-cream shadow-[4px_4px_0px_0px_#000]',
    };
    const sizes = {
        sm: 'px-3 py-2 text-[10px]',
        md: 'px-5 py-3 text-xs',
        lg: 'px-7 py-4 text-sm',
    };
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`border-4 border-black font-black uppercase tracking-widest active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {children}
        </button>
    );
};

// Input
export const NeoInput = ({ label, id, className = '', ...props }) => (
    <div className="space-y-1.5">
        {label && <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-widest text-black">{label}</label>}
        <input
            id={id}
            className={`w-full px-4 py-3 bg-neo-cream border-4 border-black font-bold text-black placeholder:text-black/30 focus:bg-neo-secondary focus:shadow-[4px_4px_0px_0px_#000] transition-all duration-100 ${className}`}
            {...props}
        />
    </div>
);

// Select
export const NeoSelect = ({ label, id, children, className = '', ...props }) => (
    <div className="space-y-1.5">
        {label && <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-widest text-black">{label}</label>}
        <div className="relative">
            <select
                id={id}
                className={`w-full px-4 py-3 bg-neo-cream border-4 border-black font-bold text-black focus:bg-neo-secondary focus:shadow-[4px_4px_0px_0px_#000] transition-all duration-100 pr-10 ${className}`}
                {...props}
            >
                {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>
    </div>
);

// Card
export const NeoCard = ({ children, className = '', lift = false }) => (
    <div className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] ${lift ? 'hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-200' : ''} ${className}`}>
        {children}
    </div>
);

// Card Header
export const NeoCardHeader = ({ title, subtitle, icon: Icon, children, color = 'secondary' }) => {
    const colors = { secondary: 'bg-neo-secondary', accent: 'bg-neo-accent', muted: 'bg-neo-muted', black: 'bg-black' };
    return (
        <div className={`${colors[color]} border-b-4 border-black px-5 py-3 flex items-center justify-between`}>
            <div>
                <h3 className={`font-black uppercase tracking-tight ${color === 'black' ? 'text-neo-secondary' : 'text-black'}`}>
                    {Icon && <Icon size={16} strokeWidth={3} className="inline mr-2 mb-0.5" />}{title}
                </h3>
                {subtitle && <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${color === 'black' ? 'text-white/50' : 'text-black/50'}`}>{subtitle}</p>}
            </div>
            {children}
        </div>
    );
};

// Table
export const NeoTable = ({ headers, children, emptyMsg = 'Belum ada data.' }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead>
                <tr className="bg-neo-secondary border-b-4 border-black text-[9px] uppercase tracking-widest font-black text-black">
                    {headers.map((h, i) => (
                        <th key={i} className={`px-4 py-3 ${h.center ? 'text-center' : ''}`}>{h.label || h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    </div>
);

export const NeoTr = ({ children, className = '' }) => (
    <tr className={`border-b-2 border-black/10 hover:bg-neo-muted/20 transition-colors ${className}`}>
        {children}
    </tr>
);

export const NeoTd = ({ children, className = '', center = false }) => (
    <td className={`px-4 py-3.5 text-sm font-bold text-black/70 ${center ? 'text-center' : ''} ${className}`}>
        {children}
    </td>
);

// Modal
export const NeoModal = ({ isOpen, onClose, title, color = 'secondary', children, footer }) => {
    if (!isOpen) return null;
    const colors = { secondary: 'bg-neo-secondary', accent: 'bg-neo-accent', muted: 'bg-neo-muted', black: 'bg-black' };
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
            <div className="bg-neo-cream border-4 border-black shadow-[12px_12px_0px_0px_#000] w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col animate-bounce-in">
                <div className={`${colors[color]} border-b-4 border-black px-5 py-3 flex items-center justify-between shrink-0`}>
                    <h3 className={`font-black uppercase tracking-tight ${color === 'black' ? 'text-neo-secondary' : 'text-black'}`}>{title}</h3>
                    <button onClick={onClose} className="border-4 border-black p-1 bg-white hover:bg-neo-accent shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100">
                        <X size={14} strokeWidth={3} />
                    </button>
                </div>
                <div className="p-5 overflow-y-auto">{children}</div>
                {footer && <div className="px-5 py-4 border-t-4 border-black bg-neo-cream shrink-0">{footer}</div>}
            </div>
        </div>
    );
};

// Loading State
export const NeoLoading = ({ text = 'Memuat...' }) => (
    <div className="py-16 flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-black border-t-neo-accent animate-spin" />
        <p className="font-black text-sm text-black/40 uppercase tracking-widest">{text}</p>
    </div>
);

// Empty State
export const NeoEmpty = ({ message = 'Belum ada data.', icon: Icon }) => (
    <div className="py-12 text-center border-4 border-dashed border-black/20 bg-white">
        {Icon && <Icon size={24} className="mx-auto mb-3 text-black/20" strokeWidth={2} />}
        <p className="font-black text-sm text-black/30 uppercase tracking-widest">{message}</p>
    </div>
);

// Status Badge
export const NeoStatus = ({ status }) => {
    const map = {
        'Aktif':   'bg-neo-secondary',
        'Hadir':   'bg-neo-secondary',
        'Sakit':   'bg-neo-muted',
        'Izin':    'bg-white',
        'Alpa':    'bg-neo-accent',
        'Pending': 'bg-neo-muted',
        'Selesai': 'bg-neo-secondary',
        'Telat':   'bg-neo-accent',
    };
    return (
        <span className={`${map[status] || 'bg-white'} border-2 border-black text-[9px] font-black uppercase px-2 py-0.5`}>
            {status}
        </span>
    );
};
