import React, { useEffect, useState } from 'react';
import { AlertCircle, Info, X, CheckCircle, AlertTriangle } from 'lucide-react';

const TYPES = {
    success: {
        bg: 'bg-neo-secondary',
        border: 'border-black',
        shadow: 'shadow-[6px_6px_0px_0px_#000]',
        icon: CheckCircle,
        label: 'BERHASIL',
    },
    error: {
        bg: 'bg-neo-accent',
        border: 'border-black',
        shadow: 'shadow-[6px_6px_0px_0px_#000]',
        icon: AlertCircle,
        label: 'ERROR',
    },
    warning: {
        bg: 'bg-[#FFD93D]',
        border: 'border-black',
        shadow: 'shadow-[6px_6px_0px_0px_#000]',
        icon: AlertTriangle,
        label: 'PERINGATAN',
    },
    info: {
        bg: 'bg-neo-muted',
        border: 'border-black',
        shadow: 'shadow-[6px_6px_0px_0px_#000]',
        icon: Info,
        label: 'INFO',
    },
};

const Toast = ({ show, message, type = 'info', onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
        } else {
            const t = setTimeout(() => setVisible(false), 300);
            return () => clearTimeout(t);
        }
    }, [show]);

    if (!visible) return null;

    const cfg = TYPES[type] || TYPES.info;
    const Icon = cfg.icon;

    return (
        <div className={`fixed bottom-6 right-6 z-[10000] transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className={`flex items-start gap-3 ${cfg.bg} border-4 ${cfg.border} ${cfg.shadow} p-4 min-w-[280px] max-w-sm`}>
                {/* Icon block */}
                <div className="border-4 border-black bg-white p-1.5 shadow-[2px_2px_0px_0px_#000] shrink-0">
                    <Icon size={16} strokeWidth={3} className="text-black" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/60 mb-0.5">{cfg.label}</p>
                    <p className="font-black text-sm text-black leading-snug">{message}</p>
                </div>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="border-4 border-black bg-white p-1 shadow-[2px_2px_0px_0px_#000] hover:bg-neo-accent active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 shrink-0"
                >
                    <X size={12} strokeWidth={3} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-black/20 border-x-4 border-b-4 border-black overflow-hidden">
                <div
                    className="h-full bg-black"
                    style={{ animation: 'width-shrink 4s linear forwards', width: '100%' }}
                />
            </div>
        </div>
    );
};

export default Toast;
