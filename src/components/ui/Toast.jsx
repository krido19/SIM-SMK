import React from 'react';
import { AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ show, message, type, onClose }) => {
    if (!show) return null;

    const typeStyles = {
        success: 'border-ink bg-white text-ink',
        error: 'border-newsprint-red bg-newsprint-red text-white',
        warning: 'border-ink bg-neutral-100 text-ink',
        info: 'border-ink bg-ink text-white'
    };

    const headerText = {
        success: 'BERHASIL',
        error: 'PEMBERITAHUAN PENTING',
        warning: 'PERINGATAN',
        info: 'INFORMASI SISTEM'
    };

    return (
        <div className="fixed bottom-6 right-6 z-[10000] flex justify-end p-4 animate-in slide-in-from-bottom-5 duration-300 pointer-events-none">
            <div className={`pointer-events-auto flex flex-col border-2 shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] ${typeStyles[type] || typeStyles.info} max-w-sm w-full animate-in fade-in zoom-in-95`}>

                {/* Header Strip */}
                <div className={`flex items-center justify-between px-3 py-1.5 border-b-2 ${type === 'error' ? 'border-white/20' : 'border-ink/20'} ${type === 'info' ? 'border-white/20' : ''}`}>
                    <div className="flex items-center space-x-2">
                        {type === 'error' && <div className="w-1.5 h-1.5 bg-white animate-pulse" />}
                        {type !== 'error' && <div className={`w-1.5 h-1.5 ${type === 'info' ? 'bg-white' : 'bg-ink'} animate-pulse`} />}
                        <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em]">
                            {headerText[type] || headerText.info}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-0.5 hover:bg-black/10 transition-colors`}
                    >
                        <X size={14} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex p-4 gap-4 items-start relative overflow-hidden">
                    <div className={`shrink-0 p-2 border-2 ${type === 'error' ? 'border-white/20 bg-black/10' : 'border-ink/10 bg-black/5'} ${type === 'info' ? 'border-white/20 bg-white/10' : ''}`}>
                        {type === 'error' || type === 'warning' ? (
                            <AlertCircle size={24} strokeWidth={2} />
                        ) : (
                            <Info size={24} strokeWidth={2} />
                        )}
                    </div>

                    <div className="flex flex-col flex-1 pr-2 relative z-10">
                        <span className="font-serif font-black text-lg leading-tight uppercase tracking-tight">{message}</span>
                        <span className="font-mono text-[8px] font-bold uppercase tracking-widest mt-2 pt-2 border-t border-current opacity-60">
                            ID: {Math.random().toString(36).substring(2, 8).toUpperCase()} - {new Date().toLocaleTimeString('id-ID', { hour12: false })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Toast;
