import React from 'react';
import { Trash2, HelpCircle, AlertTriangle, X } from 'lucide-react';

const TYPES = {
    danger: {
        headerBg: 'bg-neo-accent',
        icon: Trash2,
        confirmLabel: 'YA, HAPUS',
        confirmBg: 'bg-black text-white hover:bg-neo-accent hover:text-black shadow-[4px_4px_0px_0px_#FF6B6B]',
    },
    warning: {
        headerBg: 'bg-[#FFD93D]',
        icon: AlertTriangle,
        confirmLabel: 'YA, LANJUTKAN',
        confirmBg: 'bg-black text-white hover:bg-[#FFD93D] hover:text-black shadow-[4px_4px_0px_0px_#FFD93D]',
    },
    info: {
        headerBg: 'bg-neo-muted',
        icon: HelpCircle,
        confirmLabel: 'KONFIRMASI',
        confirmBg: 'bg-black text-white hover:bg-neo-muted hover:text-black shadow-[4px_4px_0px_0px_#C4B5FD]',
    },
};

const ConfirmModal = ({ show, title, message, onConfirm, onCancel, type = 'danger' }) => {
    if (!show) return null;

    const cfg = TYPES[type] || TYPES.danger;
    const Icon = cfg.icon;

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/70">
            <div className="bg-neo-cream border-4 border-black shadow-[12px_12px_0px_0px_#000] w-full max-w-md overflow-hidden animate-bounce-in">

                {/* Header */}
                <div className={`${cfg.headerBg} border-b-4 border-black px-5 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className="border-4 border-black bg-white p-1.5 shadow-[2px_2px_0px_0px_#000]">
                            <Icon size={16} strokeWidth={3} />
                        </div>
                        <h3 className="font-black uppercase tracking-tight text-black">{title}</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="border-4 border-black bg-white p-1 shadow-[2px_2px_0px_0px_#000] hover:bg-neo-accent active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100"
                    >
                        <X size={14} strokeWidth={3} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 border-b-4 border-black">
                    <p className="font-bold text-black/70 text-sm leading-relaxed">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-5 bg-white">
                    <button
                        onClick={onCancel}
                        className="flex-1 border-4 border-black bg-neo-cream font-black text-xs uppercase tracking-widest py-3 shadow-[4px_4px_0px_0px_#000] hover:bg-white active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
                    >
                        BATAL
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 border-4 border-black font-black text-xs uppercase tracking-widest py-3 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 ${cfg.confirmBg}`}
                    >
                        {cfg.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
