import React from 'react';
import { Trash2, AlertCircle, HelpCircle } from 'lucide-react';

const ConfirmModal = ({ show, title, message, onConfirm, onCancel, type = 'danger' }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-4 border-white">
                <div className="p-10 text-center">
                    <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-2 ${type === 'danger' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'
                        }`}>
                        {type === 'danger' ? (
                            <Trash2 size={40} className="text-red-500" />
                        ) : (
                            <HelpCircle size={40} className="text-blue-500" />
                        )}
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tight">{title}</h3>
                    <p className="text-gray-500 font-bold leading-relaxed tracking-wide px-4">
                        {message}
                    </p>
                </div>
                <div className="flex border-t-2 border-gray-50 p-6 space-x-4 bg-gray-50/50">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-8 py-4 rounded-2xl font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest text-[10px]"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-8 py-4 rounded-2xl text-white font-black shadow-xl transition-all uppercase tracking-widest text-[10px] active:scale-95 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                            }`}
                    >
                        {type === 'danger' ? 'Ya, Hapus' : 'Ya, Lanjutkan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
