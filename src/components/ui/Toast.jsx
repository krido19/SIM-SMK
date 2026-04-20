import React from 'react';
import { AlertCircle, Info, X, CheckCircle } from 'lucide-react';

const Toast = ({ show, message, type, onClose }) => {
    if (!show) return null;

    const typeStyles = {
        success: 'bg-emerald-500 text-white',
        error: 'bg-blue-600 text-white',
        warning: 'bg-amber-500 text-white',
        info: 'bg-gray-900 text-white'
    };

    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertCircle,
        info: Info
    };

    const Icon = icons[type] || icons.info;

    return (
        <div className="fixed bottom-6 right-6 z-[10000] flex justify-end p-4 animate-in slide-in-from-bottom-5 duration-300 pointer-events-none">
            <div className={`pointer-events-auto flex flex-col rounded-lg shadow-none ${typeStyles[type] || typeStyles.info} max-w-sm w-full transition-all`}>
                
                <div className="flex items-center justify-between p-4 pb-2">
                    <div className="flex items-center space-x-2">
                        <Icon size={20} strokeWidth={2.5} />
                        <span className="font-sans font-bold uppercase tracking-wider text-sm">
                            {type === 'error' ? 'Pemberitahuan' : type === 'success' ? 'Berhasil' : type === 'warning' ? 'Peringatan' : 'Informasi'}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-md transition-colors"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="px-4 pb-4 pt-1">
                    <p className="font-sans text-base leading-snug">{message}</p>
                </div>
            </div>
        </div>
    );
};

export default Toast;
