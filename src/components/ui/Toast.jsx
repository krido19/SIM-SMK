import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ show, message, type, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-top-8 duration-500">
            <div className={`flex items-center space-x-4 px-8 py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-2 backdrop-blur-2xl ${type === 'success' ? 'bg-white/90 border-green-100 text-green-800' :
                    type === 'error' ? 'bg-white/90 border-red-100 text-red-800' :
                        type === 'warning' ? 'bg-white/90 border-amber-100 text-amber-800' :
                            'bg-white/90 border-blue-100 text-blue-800'
                }`}>
                <div className={`p-2 rounded-2xl ${type === 'success' ? 'bg-green-100 text-green-600' :
                        type === 'error' ? 'bg-red-100 text-red-600' :
                            type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                'bg-blue-100 text-blue-600'
                    }`}>
                    {type === 'success' && <CheckCircle2 size={24} />}
                    {type === 'error' && <XCircle size={24} />}
                    {type === 'warning' && <AlertCircle size={24} />}
                    {type === 'info' && <Info size={24} />}
                </div>

                <div className="flex flex-col pr-12">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none opacity-40 mb-1.5">
                        {type === 'success' ? 'Berhasil' :
                            type === 'error' ? 'Gagal' :
                                type === 'warning' ? 'Peringatan' : 'Informasi'}
                    </span>
                    <span className="text-base font-black tracking-tight">{message}</span>
                </div>

                <button
                    onClick={onClose}
                    className="absolute right-6 p-2 hover:bg-black/5 rounded-xl transition-all active:scale-90"
                >
                    <X size={18} className="text-gray-400" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
