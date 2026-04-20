import React from 'react';
import { Trash2, HelpCircle, X } from 'lucide-react';

const ConfirmModal = ({ show, title, message, onConfirm, onCancel, type = 'danger' }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md overflow-hidden rounded-lg animate-in zoom-in-95 duration-200 relative flex flex-col">
                
                <div className="p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className={`p-4 rounded-full ${type === 'danger' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-500'}`}>
                            {type === 'danger' ? (
                                <Trash2 size={32} strokeWidth={2} />
                            ) : (
                                <HelpCircle size={32} strokeWidth={2} />
                            )}
                        </div>
                    </div>

                    <h3 className="text-2xl font-sans font-bold text-gray-900 mb-3 leading-tight">
                        {title}
                    </h3>
                    <p className="text-gray-500 font-sans text-base leading-relaxed px-2">
                        {message}
                    </p>
                </div>

                <div className="flex p-6 gap-4 bg-gray-50">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 rounded-md font-sans font-semibold text-sm transition-all bg-gray-200 text-gray-800 hover:bg-gray-300 hover:scale-105"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-6 py-3 rounded-md font-sans font-semibold text-sm transition-all hover:scale-105 ${type === 'danger'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600'
                            }`}
                    >
                        {type === 'danger' ? 'Ya, Lanjutkan' : 'Konfirmasi'}
                    </button>
                </div>

                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default ConfirmModal;
